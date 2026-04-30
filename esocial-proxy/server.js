const express = require('express');
const cors = require('cors');
const https = require('https');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const forge = require('node-forge');
const { SignedXml } = require('xml-crypto');
const { DOMParser } = require('xmldom');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

let supabase;
try {
  supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
} catch(e) {}

const URL_ENVIO = 'https://webservices.envio.esocial.gov.br/servicos/empregador/enviarloteeventos/WsEnviarLoteEventos.svc';
const URL_CONSULTA = 'https://webservices.consulta.esocial.gov.br/servicos/empregador/consultarloteeventos/WsConsultarLoteEventos.svc';

app.post('/esocial', async (req, res) => {
  try {
    const { action, eventType, eventData, regularizationId, protocolo } = req.body;

    const { data: credentials } = await supabase.from('esocial_credentials').select('*').eq('regularization_id', regularizationId).single();
    if (!credentials) throw new Error('Certificado não encontrado.');

    const pfxPath = credentials.certificate_url.split('esocial_files/')[1];
    const { data: pfxBlob } = await supabase.storage.from('esocial_files').download(pfxPath);
    const pfxBuffer = Buffer.from(await pfxBlob.arrayBuffer());

    const httpsAgent = new https.Agent({ pfx: pfxBuffer, passphrase: credentials.certificate_password, rejectUnauthorized: false, minVersion: 'TLSv1.2' });

    if (action === 'CONSULT') {
      // Tentativa com HTTPS no SOAPAction e XML super limpo
      const soapRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://www.esocial.gov.br/servicos/empregador/loteeventos/WsConsultarLoteEventos"><soapenv:Body><ws:ConsultarLoteEventos><ws:consulta><protocolo xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0">${protocolo}</protocolo></ws:consulta></ws:ConsultarLoteEventos></soapenv:Body></soapenv:Envelope>`;
      
      try {
        // Tentamos primeiro com o padrão oficial
        const response = await axios.post(URL_CONSULTA, soapRequest, {
          headers: { 
            'Content-Type': 'text/xml; charset=utf-8', 
            'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/loteeventos/WsConsultarLoteEventos/ConsultarLoteEventos"' 
          },
          httpsAgent
        });
        
        const result = response.data;
        const reciboMatch = result.match(/<nrRecibo>(.*?)<\/nrRecibo>/);
        const isSuccess = result.includes('sucesso') || result.includes('201') || result.includes('202');
        
        return res.json({ 
          success: true, 
          status: isSuccess ? 'SUCESSO' : 'PROCESSANDO', 
          recibo: reciboMatch ? reciboMatch[1] : null 
        });
      } catch (err) {
        // Se falhar o oficial, tentamos com HTTPS no Action (Truque de mestre para alguns servidores IIS)
        try {
          const response2 = await axios.post(URL_CONSULTA, soapRequest, {
            headers: { 
              'Content-Type': 'text/xml; charset=utf-8', 
              'SOAPAction': '"https://www.esocial.gov.br/servicos/empregador/loteeventos/WsConsultarLoteEventos/ConsultarLoteEventos"' 
            },
            httpsAgent
          });
          const result2 = response2.data;
          const reciboMatch2 = result2.match(/<nrRecibo>(.*?)<\/nrRecibo>/);
          const isSuccess2 = result2.includes('sucesso') || result2.includes('201') || result2.includes('202');
          return res.json({ success: true, status: isSuccess2 ? 'SUCESSO' : 'PROCESSANDO', recibo: reciboMatch2 ? reciboMatch2[1] : null });
        } catch (err2) {
          const errorDetail = err2.response?.data ? err2.response.data.toString().replace(/<[^>]*>/g, ' ').substring(0, 300) : err2.message;
          return res.json({ success: false, error: `eSocial rejeitou consulta: ${errorDetail}` });
        }
      }
    }

    // TRANSMISSÃO (O que já está funcionando!)
    const empCpfCnpj = (eventData.proprietarioCpfCnpj || eventData.cpf_cnpj || "").replace(/\D/g, '');
    const workerCpf = (eventData.workerCpf || eventData.cpf || "").replace(/\D/g, '');
    const workerNome = eventData.workerNome || eventData.nome || "";

    const tpInscEmpregador = empCpfCnpj.length === 11 ? '2' : '1';
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    const eventId = `ID${tpInscEmpregador}${empCpfCnpj.padEnd(14, '0')}${timestamp}${Math.floor(Math.random()*10000).toString().padStart(5, '0')}`;
    let eventXml = `<evtTSVInicio xmlns="http://www.esocial.gov.br/schema/evt/evtTSVInicio/v_S_01_02_00" Id="${eventId}"><ideEvento><indRetif>1</indRetif><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>AevumPro1.0</verProc></ideEvento><ideEmpregador><tpInsc>${tpInscEmpregador}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><trabalhador><cpfTrab>${workerCpf}</cpfTrab><nmTrab>${workerNome}</nmTrab></trabalhador></evtTSVInicio>`;

    let privateKeyPem, certificatePem;
    const pfxAsn1 = forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer).getBytes());
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, credentials.certificate_password);
    pfx.safeContents.forEach(sc => (sc.safeEntries || []).forEach(e => {
        if (e.key) privateKeyPem = forge.pki.privateKeyToPem(e.key);
        if (e.cert) certificatePem = forge.pki.certificateToPem(e.cert);
    }));

    const signedXml = signXML(eventXml, privateKeyPem, certificatePem, eventId);
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://www.esocial.gov.br/servicos/empregador/loteeventos/WsEnviarLoteEventos"><soapenv:Header/><soapenv:Body><ws:EnviarLoteEventos><ws:loteEventos><eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/v1_1_1"><envioLoteEventos><ideEmpregador><tpInsc>${tpInscEmpregador}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><ideTransmissor><tpInsc>${tpInscEmpregador}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideTransmissor><eventos><evento Id="${eventId}">${signedXml}</evento></eventos></envioLoteEventos></eSocial></ws:loteEventos></ws:EnviarLoteEventos></soapenv:Body></soapenv:Envelope>`;

    const response = await axios.post(URL_ENVIO, soapRequest, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/loteeventos/WsEnviarLoteEventos/EnviarLoteEventos"' },
      httpsAgent
    });
    
    const protocoloMatch = response.data.match(/<protocolo>(.*?)<\/protocolo>/);
    if (!protocoloMatch) throw new Error('eSocial erro: ' + response.data.substring(0, 300));
    res.json({ success: true, protocolo: protocoloMatch[1] });

  } catch (error) {
    const errorMsg = error.response?.data ? error.response.data.toString().replace(/<[^>]*>/g, ' ').substring(0, 300) : error.message;
    res.status(200).json({ success: false, error: errorMsg });
  }
});

function signXML(xml, privateKeyPem, certificatePem, eventId) {
  const sig = new SignedXml();
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const rootTag = doc.documentElement.localName;
  sig.addReference(`//*[local-name(.)='${rootTag}']`, ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"], "http://www.w3.org/2001/04/xmlenc#sha256");
  const cleanCert = certificatePem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n|\r/g, '');
  sig.keyInfoProvider = { getKeyInfo: () => `<X509Data><X509Certificate>${cleanCert}</X509Certificate></X509Data>`, getKey: () => privateKeyPem };
  sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
  sig.canonicalizationAlgorithm = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
  sig.computeSignature(xml);
  return sig.getSignedXml();
}

app.listen(3005, () => console.log("🚀 Proxy Automático v3 Online"));

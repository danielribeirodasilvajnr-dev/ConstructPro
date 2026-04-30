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
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  supabase = createClient(url, key);
} catch(e) { console.warn("Erro ao iniciar Supabase"); }

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

    let privateKeyPem, certificatePem;
    try {
      const pfxAsn1 = forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer).getBytes());
      const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, credentials.certificate_password);

      // BUSCA POR OID (PADRÃO ROBUSTO)
      const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });
      
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
      const certBag = certBags[forge.pki.oids.certBag]?.[0];
      
      if (keyBag && keyBag.key) privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);
      if (certBag && certBag.cert) certificatePem = forge.pki.certificateToPem(certBag.cert);

      // FALLBACK MANUAL (SE O OID FALHAR)
      if (!privateKeyPem || !certificatePem) {
        (pfx.safeContents || []).forEach(sc => {
          (sc.safeEntries || []).forEach(entry => {
            if (entry.key && !privateKeyPem) privateKeyPem = forge.pki.privateKeyToPem(entry.key);
            if (entry.cert && !certificatePem) certificatePem = forge.pki.certificateToPem(entry.cert);
          });
        });
      }
    } catch (e) { throw new Error('Erro ao processar PFX: ' + e.message); }

    if (!privateKeyPem || !certificatePem) throw new Error('Chaves não encontradas no certificado.');

    const httpsAgent = new https.Agent({
      pfx: pfxBuffer,
      passphrase: credentials.certificate_password,
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    });

    if (action === 'CONSULT') {
      const soapRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:serv="http://www.esocial.gov.br/servicos/empregador/loteeventos/WsConsultarLoteEventos"><soapenv:Header/><soapenv:Body><serv:ConsultarLoteEventos><serv:consulta><protocolo xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0">${protocolo}</protocolo></serv:consulta></serv:ConsultarLoteEventos></soapenv:Body></soapenv:Envelope>`;
      const response = await axios.post(URL_CONSULTA, soapRequest, {
        headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/loteeventos/WsConsultarLoteEventos/ConsultarLoteEventos"' },
        httpsAgent
      });
      const result = response.data;
      const reciboMatch = result.match(/<nrRecibo>(.*?)<\/nrRecibo>/);
      const status = result.includes('sucesso') || result.includes('201') || result.includes('202') ? 'SUCESSO' : 'ERRO';
      return res.json({ success: true, status, recibo: reciboMatch ? reciboMatch[1] : null });
    }

    // TRANSMISSÃO S-2300 / OUTROS
    const nrInscEmpregador = eventData.proprietarioCpfCnpj.replace(/\D/g, '');
    const tpInscEmpregador = nrInscEmpregador.length === 11 ? '2' : '1';
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    const eventId = `ID${tpInscEmpregador}${nrInscEmpregador.padEnd(14, '0')}${timestamp}${Math.floor(Math.random()*10000).toString().padStart(5, '0')}`;

    let eventXml = "";
    if (eventType === 'S-1000') {
      eventXml = `<evtInfoEmpregador xmlns="http://www.esocial.gov.br/schema/evt/evtInfoEmpregador/v_S_01_02_00" Id="${eventId}"><ideEvento><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>AevumPro1.0</verProc></ideEvento><ideEmpregador><tpInsc>${tpInscEmpregador}</tpInsc><nrInsc>${nrInscEmpregador}</nrInsc></ideEmpregador><infoEmpregador><inclusao><idePeriodo><iniValid>2024-04</iniValid></idePeriodo><infoCadastro><nmRazao>${eventData.proprietarioNome}</nmRazao><classTrib>21</classTrib><indCoop>0</indCoop><indConstr>1</indConstr><indDesFolha>0</indDesFolha></infoCadastro></inclusao></infoEmpregador></evtInfoEmpregador>`;
    } else if (eventType === 'S-2300') {
       eventXml = `<evtTSVInicio xmlns="http://www.esocial.gov.br/schema/evt/evtTSVInicio/v_S_01_02_00" Id="${eventId}"><ideEvento><indRetif>1</indRetif><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>AevumPro1.0</verProc></ideEvento><ideEmpregador><tpInsc>${tpInscEmpregador}</tpInsc><nrInsc>${nrInscEmpregador}</nrInsc></ideEmpregador><trabalhador><cpfTrab>${eventData.workerCpf.replace(/\D/g, '')}</cpfTrab><nmTrab>${eventData.workerNome}</nmTrab><sexo>M</sexo><racaCor>1</racaCor><estCiv>1</estCiv><grauInstr>07</grauInstr><nascimento><dtNascto>${eventData.workerNascimento || '1980-01-01'}</dtNascto><paisNascto>105</paisNascto></nascimento><endereco><brasil><tpLograd>R</tpLograd><lograd>AV PRINCIPAL</lograd><nrLograd>100</nrLograd><bairro>CENTRO</bairro><cep>${eventData.workerCep?.replace(/\D/g, '') || '00000000'}</cep><codMunic>3550308</codMunic><uf>SP</uf></brasil></endereco></trabalhador><infoTSVInicio><matricula>${eventData.workerMatricula || '001'}</matricula><codCateg>${eventData.workerCategoria || '701'}</codCateg><dtInicio>2024-04-01</dtInicio><infoComplementares><cargo><nmCargo>${eventData.workerCargo || 'PEDREIRO'}</nmCargo><cboCargo>${eventData.workerCbo || '715210'}</cboCargo></cargo></infoComplementares></infoTSVInicio></evtTSVInicio>`;
    }

    const signedXml = signXML(eventXml, privateKeyPem, certificatePem, eventId);
    const soapRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:serv="http://www.esocial.gov.br/servicos/empregador/loteeventos/WsEnviarLoteEventos"><soapenv:Header/><soapenv:Body><serv:EnviarLoteEventos><serv:loteEventos><eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/v1_1_1"><envioLoteEventos><ideEmpregador><tpInsc>${tpInscEmpregador}</tpInsc><nrInsc>${nrInscEmpregador}</nrInsc></ideEmpregador><ideTransmissor><tpInsc>1</tpInsc><nrInsc>${nrInscEmpregador.padEnd(14, '0')}</nrInsc></ideTransmissor><eventos><evento Id="${eventId}">${signedXml}</evento></eventos></envioLoteEventos></eSocial></serv:loteEventos></serv:EnviarLoteEventos></soapenv:Body></soapenv:Envelope>`;

    const response = await axios.post(URL_ENVIO, soapRequest, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/loteeventos/WsEnviarLoteEventos/EnviarLoteEventos"' },
      httpsAgent
    });
    const result = response.data;
    const protocoloMatch = result.match(/<protocolo>(.*?)<\/protocolo>/);
    if (!protocoloMatch) throw new Error('Erro eSocial: ' + result.substring(0, 200).replace(/<[^>]*>/g, ' '));
    res.json({ success: true, protocolo: protocoloMatch[1] });

  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
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

app.listen(3005, () => console.log("🚀 Proxy Produção v4 Online"));

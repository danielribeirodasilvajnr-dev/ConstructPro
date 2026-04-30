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
app.use(express.json());

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

app.post('/esocial', async (req, res) => {
  try {
    const regularizationId = "a762e663-14e4-422b-b320-47af29eeb94a";
    const empCpfCnpj = "25502713865";
    const tpInscEmpregador = '2';

    console.log(`[DESTRAVAMENTO] Extraindo chaves do certificado do Marcelino...`);

    const { data: credentials } = await supabase.from('esocial_credentials').select('*').eq('regularization_id', regularizationId).single();
    if (!credentials) throw new Error("Credenciais não encontradas.");

    const pfxPath = credentials.certificate_url.split('esocial_files/')[1];
    const { data: pfxBlob } = await supabase.storage.from('esocial_files').download(pfxPath);
    const pfxBuffer = Buffer.from(await pfxBlob.arrayBuffer());
    
    const pfxAsn1 = forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer).getBytes());
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, credentials.certificate_password);
    
    let privateKeyPem, certificatePem;
    
    // Método getBags (O mais seguro)
    const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
    if (certBags && certBags.length > 0) {
      certificatePem = forge.pki.certificateToPem(certBags[0].cert);
    }
    
    const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag];
    if (keyBags && keyBags.length > 0) {
      privateKeyPem = forge.pki.privateKeyToPem(keyBags[0].key);
    }

    if (!certificatePem || !privateKeyPem) throw new Error("Falha ao extrair chaves do PFX.");

    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    const eventId = `ID${tpInscEmpregador}${empCpfCnpj.padEnd(14, '0')}${timestamp}00001`;
    
    const eventXml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtInfoEmpregador/v_S_01_02_00">
  <evtInfoEmpregador Id="${eventId}">
    <ideEvento><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>AevumPro1.0</verProc></ideEvento>
    <ideEmpregador><tpInsc>${tpInscEmpregador}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador>
    <infoEmpregador>
      <inclusao>
        <idePeriodo><iniValid>2024-01</iniValid></idePeriodo>
        <infoCadastro>
          <classTrib>21</classTrib><natJurid>4081</natJurid><indCoop>0</indCoop><indConstr>0</indConstr><indDesFolha>0</indDesFolha><indOptRegEletron>0</indOptRegEletron>
          <contato><nmCont>MARCELINO BASTOS</nmCont><cpfCont>${empCpfCnpj}</cpfCont></contato>
        </infoCadastro>
      </inclusao>
    </infoEmpregador>
  </evtInfoEmpregador>
</eSocial>`;

    const sig = new SignedXml();
    sig.addReference(`//*[local-name(.)='evtInfoEmpregador']`, ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"], "http://www.w3.org/2001/04/xmlenc#sha256");
    const cleanCert = certificatePem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n|\r/g, '');
    sig.keyInfoProvider = { getKeyInfo: () => `<X509Data><X509Certificate>${cleanCert}</X509Certificate></X509Data>`, getKey: () => privateKeyPem };
    sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
    sig.canonicalizationAlgorithm = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
    sig.computeSignature(eventXml);
    const signedXml = sig.getSignedXml();

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://www.esocial.gov.br/servicos/empregador/loteeventos/WsEnviarLoteEventos">
  <soapenv:Body><ws:EnviarLoteEventos><ws:loteEventos><eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/v1_1_1"><envioLoteEventos><ideEmpregador><tpInsc>${tpInscEmpregador}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><ideTransmissor><tpInsc>${tpInscEmpregador}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideTransmissor><eventos><evento Id="${eventId}">${signedXml}</evento></eventos></envioLoteEventos></eSocial></ws:loteEventos></ws:EnviarLoteEventos></soapenv:Body></soapenv:Envelope>`;

    const response = await axios.post('https://webservices.envio.esocial.gov.br/servicos/empregador/enviarloteeventos/WsEnviarLoteEventos.svc', soapRequest, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/loteeventos/WsEnviarLoteEventos/EnviarLoteEventos"' },
      httpsAgent
    });
    
    res.json({ success: true, protocolo: response.data });

  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});

app.listen(3005, () => console.log("🚀 Proxy de EXTRAÇÃO DEFINITIVA Online"));

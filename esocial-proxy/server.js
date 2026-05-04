const express = require('express');
const cors = require('cors');
const https = require('https');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const forge = require('node-forge');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const URL_ENVIO = 'https://webservices.envio.esocial.gov.br/servicos/empregador/enviarloteeventos/WsEnviarLoteEventos.svc';
const URL_CONSULTA = 'https://webservices.consulta.esocial.gov.br/servicos/empregador/consultarloteeventos/WsConsultarLoteEventos.svc';

app.post('/esocial', async (req, res) => {
  try {
    const { action, eventData = {}, regularizationId } = req.body;
    const { data: credentials } = await supabase.from('esocial_credentials').select('*').eq('regularization_id', regularizationId).single();
    const { data: pfxBlob } = await supabase.storage.from('esocial_files').download(credentials.certificate_url.split('esocial_files/')[1]);
    const pfxBuffer = Buffer.from(await pfxBlob.arrayBuffer());
    
    const pfx = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer).getBytes()), credentials.certificate_password);
    const certificate = pfx.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag][0].cert;
    const privateKey = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;

    const commonName = certificate.subject.getField('CN').value;
    const transCpfCnpj = commonName.split(':').pop(); 
    const empCpfCnpj = (eventData.proprietarioCpfCnpj || "25502713865").replace(/\D/g, '');

    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    const eventId = `ID2${empCpfCnpj.padEnd(14, '0')}${timestamp}${Math.floor(Math.random()*100000).toString().padStart(5, '0')}`;
    
    const workerCpf = (eventData.workerCpf || "").replace(/\D/g, '');
    const workerNome = (eventData.workerNome || "").toUpperCase();
    
    const ns = `http://www.esocial.gov.br/schema/evt/evtTSVInicio/v_S_01_03_00`;
    
    // CONTEÚDO BRUTO DO EVENTO
    const eventXml = `<evtTSVInicio Id="${eventId}"><ideEvento><indRetif>1</indRetif><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>2</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><trabalhador><cpfTrab>${workerCpf}</cpfTrab><nmTrab>${workerNome}</nmTrab><sexo>${eventData.sexo || 'M'}</sexo><racaCor>${eventData.racaCor || '1'}</racaCor><estCiv>${eventData.estCiv || '1'}</estCiv><grauInstr>${eventData.grauInstr || '07'}</grauInstr><nascimento><dtNascto>${eventData.nascimento || '1985-05-20'}</dtNascto><paisNascto>105</paisNascto><paisNac>105</paisNac></nascimento></trabalhador><infoTSVInicio><cadIni>S</cadIni><codCateg>${eventData.codCateg || '701'}</codCateg><dtInicio>${eventData.dtInicio || '2024-04-01'}</dtInicio></infoTSVInicio></evtTSVInicio>`;
    
    const toSign = `<eSocial xmlns="${ns}">${eventXml}</eSocial>`;

    const md = forge.md.sha256.create();
    md.update(toSign, 'utf8');
    const digest = forge.util.encode64(md.digest().getBytes());

    // USANDO EXCLUSIVE CANONICALIZATION (C14N EXCLUSIVO) - PADRÃO DE SISTEMAS JAVA/GOVERNO
    const c14nAlg = "http://www.w3.org/2001/10/xml-exc-c14n#"; 
    
    const signedInfoXml = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="${c14nAlg}"/><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><Transform Algorithm="${c14nAlg}"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><DigestValue>${digest}</DigestValue></Reference></SignedInfo>`;

    const mdSig = forge.md.sha256.create();
    mdSig.update(signedInfoXml, 'utf8');
    const signature = forge.util.encode64(privateKey.sign(mdSig));
    const certBase64 = forge.util.encode64(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes());
    
    const fullSignature = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">${signedInfoXml}<SignatureValue>${signature}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo></Signature>`;

    const finalEventXml = `<eSocial xmlns="${ns}">${eventXml}${fullSignature}</eSocial>`;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0"><soapenv:Body><ns:EnviarLoteEventos><ns:loteEventos><eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/v1_1_1"><envioLoteEventos grupo="2"><ideEmpregador><tpInsc>2</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><ideTransmissor><tpInsc>2</tpInsc><nrInsc>${transCpfCnpj}</nrInsc></ideTransmissor><eventos><evento Id="${eventId}">${finalEventXml}</evento></eventos></envioLoteEventos></eSocial></ns:loteEventos></ns:EnviarLoteEventos></soapenv:Body></soapenv:Envelope>`;

    const response = await axios.post(URL_ENVIO, soapRequest, { headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0/ServicoEnviarLoteEventos/EnviarLoteEventos"' }, httpsAgent: new https.Agent({ pfx: pfxBuffer, passphrase: credentials.certificate_password, rejectUnauthorized: false, minVersion: 'TLSv1.2' }) });
    res.json({ success: true, response: response.data });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.post('/consultar', async (req, res) => {
  try {
    const { protocolo, regularizationId } = req.body;
    const { data: credentials } = await supabase.from('esocial_credentials').select('*').eq('regularization_id', regularizationId).single();
    const { data: pfxBlob } = await supabase.storage.from('esocial_files').download(credentials.certificate_url.split('esocial_files/')[1]);
    const pfxBuffer = Buffer.from(await pfxBlob.arrayBuffer());
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0"><soapenv:Body><ns:ConsultarLoteEventos><ns:consulta><eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/consulta/retornoProcessamento/v1_0_0"><consultaLoteEventos><protocoloEnvio>${protocolo}</protocoloEnvio></consultaLoteEventos></eSocial></ns:consulta></ns:ConsultarLoteEventos></soapenv:Body></soapenv:Envelope>`;
    const response = await axios.post(URL_CONSULTA, soapRequest, { headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0/ServicoConsultarLoteEventos/ConsultarLoteEventos"' }, httpsAgent: new https.Agent({ pfx: pfxBuffer, passphrase: credentials.certificate_password, rejectUnauthorized: false, minVersion: 'TLSv1.2' }) });
    res.json({ success: true, response: response.data });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.listen(3005, () => console.log("🚀 Proxy Dual-Mode (Exclusive C14N v1.3) Online"));

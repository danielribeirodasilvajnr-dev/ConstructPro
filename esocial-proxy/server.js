const express = require('express');
const cors = require('cors');
const https = require('https');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const forge = require('node-forge');
const { SignedXml } = require('xml-crypto');
const { DOMParser } = require('@xmldom/xmldom');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const URL_ENVIO = 'https://webservices.envio.esocial.gov.br/servicos/empregador/enviarloteeventos/WsEnviarLoteEventos.svc';
const URL_CONSULTA = 'https://webservices.consulta.esocial.gov.br/servicos/empregador/consultarloteeventos/WsConsultarLoteEventos.svc';

/**
 * Assina o XML usando xml-crypto para C14N real + forge para RSA-SHA256.
 * O digest é calculado sobre o <eSocial> completo usando C14N com enveloped-signature.
 * O URI="" é usado conforme exigência do eSocial para assinatura global.
 */
function assinarXml(xmlStr, privateKeyPem, certPem) {
  // 1. Parse do documento
  const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');
  const eSocialNode = doc.documentElement;

  // 2. Usar xml-crypto para canonicalizar com enveloped-signature (remove futura <Signature>)
  const sigHelper = new SignedXml({ canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315' });
  const c14nXml = sigHelper.getCanonXml(
    ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    eSocialNode
  );

  // 3. Digest SHA256 do conteúdo canonicalizado
  const md = forge.md.sha256.create();
  md.update(c14nXml, 'utf8');
  const digestBase64 = forge.util.encode64(md.digest().getBytes());

  // 4. Montar <SignedInfo> com URI="" (exigência do eSocial)
  const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><DigestValue>${digestBase64}</DigestValue></Reference></SignedInfo>`;

  // 5. Canonicalizar o <SignedInfo> antes de assinar (padrão W3C)
  const signedInfoC14n = sigHelper.getCanonXml(
    ['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    new DOMParser().parseFromString(signedInfo, 'text/xml').documentElement
  );

  // 6. Assinar com RSA-SHA256
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const mdSig = forge.md.sha256.create();
  mdSig.update(signedInfoC14n, 'utf8');
  const signatureValue = forge.util.encode64(privateKey.sign(mdSig));

  // 7. Certificado base64
  const certificate = forge.pki.certificateFromPem(certPem);
  const certBase64 = forge.util.encode64(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes());

  // 8. Bloco <Signature> completo
  const signatureBlock = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">${signedInfo}<SignatureValue>${signatureValue}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo></Signature>`;

  // 9. Inserir assinatura antes do </eSocial>
  const resultado = xmlStr.replace('</eSocial>', `${signatureBlock}</eSocial>`);

  // Debug
  fs.writeFileSync('debug_xml_assinado.xml', resultado, 'utf8');
  console.log(`[DEBUG] C14N length: ${c14nXml.length}, Digest: ${digestBase64.substring(0, 20)}...`);

  return resultado;
}

app.post('/esocial', async (req, res) => {
  try {
    const { action, eventData = {}, regularizationId } = req.body;

    const { data: credentials } = await supabase.from('esocial_credentials')
      .select('*')
      .eq('regularization_id', regularizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    const { data: pfxBlob } = await supabase.storage.from('esocial_files').download(credentials.certificate_url.split('esocial_files/')[1]);
    const pfxBuffer = Buffer.from(await pfxBlob.arrayBuffer());

    const pfx = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer).getBytes()), credentials.certificate_password);
    const certificate = pfx.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag][0].cert;
    const keyBag = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag][0];

    const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);
    const certPem = forge.pki.certificateToPem(certificate);
    const commonName = certificate.subject.getField('CN').value;
    const transCpfCnpj = commonName.split(':').pop().replace(/\D/g, '');
    const empCpfCnpj = (eventData.proprietarioCpfCnpj || '25502713865').replace(/\D/g, '');

    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    const rnd = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const eventId = `ID2${empCpfCnpj.padEnd(14, '0')}${timestamp}${rnd}`;

    let xmlEvento = '';
    if (action === 'TRANSMIT_S1000') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtInfoEmpregador/v_S_01_03_00';
      xmlEvento = `<eSocial xmlns="${ns}"><evtInfoEmpregador Id="${eventId}"><ideEvento><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>2</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><infoEmpregador><inclusao><idePeriodo><iniValid>${eventData.iniValid || '2024-01'}</iniValid></idePeriodo><infoCadastro><classTrib>${eventData.classTrib || '21'}</classTrib><indDesFolha>0</indDesFolha><indOpcCP>1</indOpcCP><indOptRegEletron>0</indOptRegEletron></infoCadastro></inclusao></infoEmpregador></evtInfoEmpregador></eSocial>`;
    } else {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtTSVInicio/v_S_01_03_00';
      const workerCpf = (eventData.workerCpf || '').replace(/\D/g, '');
      const workerNome = (eventData.workerNome || '').toUpperCase();
      xmlEvento = `<eSocial xmlns="${ns}"><evtTSVInicio Id="${eventId}"><ideEvento><indRetif>1</indRetif><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>2</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><trabalhador><cpfTrab>${workerCpf}</cpfTrab><nmTrab>${workerNome}</nmTrab><sexo>${eventData.sexo || 'M'}</sexo><racaCor>${eventData.racaCor || '1'}</racaCor><estCiv>${eventData.estCiv || '1'}</estCiv><grauInstr>${eventData.grauInstr || '07'}</grauInstr><nascimento><dtNascto>${eventData.nascimento || '1980-03-05'}</dtNascto><paisNascto>105</paisNascto><paisNac>105</paisNac></nascimento><endereco><brasil><tpLograd>R</tpLograd><dscLograd>${eventData.logradouro || 'RUA'}</dscLograd><nrLograd>${eventData.numero || 'SN'}</nrLograd><bairro>${eventData.bairro || 'CENTRO'}</bairro><cep>${eventData.cep || '00000000'}</cep><codMunic>${eventData.codMunic || '3304557'}</codMunic><uf>${eventData.uf || 'SP'}</uf></brasil></endereco></trabalhador><infoTSVInicio><cadIni>N</cadIni><matricula>${eventData.matricula || '001'}</matricula><codCateg>${eventData.codCateg || '701'}</codCateg><dtInicio>${eventData.dtInicio || '2024-04-01'}</dtInicio><infoComplementares><cargoFuncao><nmCargo>PEDREIRO</nmCargo><CBOCargo>715210</CBOCargo></cargoFuncao></infoComplementares></infoTSVInicio></evtTSVInicio></eSocial>`;
    }

    const xmlAssinado = assinarXml(xmlEvento, privateKeyPem, certPem);

    const grupoLote = (action === 'TRANSMIT_S1000') ? '1' : '2';

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0"><soapenv:Body><ns:EnviarLoteEventos><ns:loteEventos><eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/v1_1_1"><envioLoteEventos grupo="${grupoLote}"><ideEmpregador><tpInsc>2</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><ideTransmissor><tpInsc>2</tpInsc><nrInsc>${transCpfCnpj}</nrInsc></ideTransmissor><eventos><evento Id="${eventId}">${xmlAssinado}</evento></eventos></envioLoteEventos></eSocial></ns:loteEventos></ns:EnviarLoteEventos></soapenv:Body></soapenv:Envelope>`;

    const response = await axios.post(URL_ENVIO, soapRequest, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0/ServicoEnviarLoteEventos/EnviarLoteEventos"' },
      httpsAgent: new https.Agent({ pfx: pfxBuffer, passphrase: credentials.certificate_password, rejectUnauthorized: false, minVersion: 'TLSv1.2' }),
    });
    res.json({ success: true, response: response.data });
  } catch (error) {
    console.error('ERRO /esocial:', error.message);
    res.json({ success: false, error: error.message });
  }
});

app.post('/consultar', async (req, res) => {
  try {
    const { protocolo, regularizationId } = req.body;
    const { data: credentials } = await supabase.from('esocial_credentials')
      .select('*')
      .eq('regularization_id', regularizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    const { data: pfxBlob } = await supabase.storage.from('esocial_files').download(credentials.certificate_url.split('esocial_files/')[1]);
    const pfxBuffer = Buffer.from(await pfxBlob.arrayBuffer());
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0"><soapenv:Body><ns:ConsultarLoteEventos><ns:consulta><eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/consulta/retornoProcessamento/v1_0_0"><consultaLoteEventos><protocoloEnvio>${protocolo}</protocoloEnvio></consultaLoteEventos></eSocial></ns:consulta></ns:ConsultarLoteEventos></soapenv:Body></soapenv:Envelope>`;
    const response = await axios.post(URL_CONSULTA, soapRequest, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0/ServicoConsultarLoteEventos/ConsultarLoteEventos"' },
      httpsAgent: new https.Agent({ pfx: pfxBuffer, passphrase: credentials.certificate_password, rejectUnauthorized: false, minVersion: 'TLSv1.2' }),
    });
    res.json({ success: true, response: response.data });
  } catch (error) {
    console.error('ERRO /consultar:', error.message);
    res.json({ success: false, error: error.message });
  }
});

app.listen(3005, () => console.log('🚀 Proxy C14N+Forge (URI Vazio Real) Online na porta 3005'));

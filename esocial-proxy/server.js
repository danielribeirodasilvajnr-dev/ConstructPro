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

// SECURITY: Restrict CORS to local development ports
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy: Origin not allowed'));
    }
  }
}));

app.use(express.json({ limit: '10mb' }));

// SECURITY: XML Sanitization Helper
function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

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
    const certPath = credentials.certificate_url.split('esocial_files/')[1];
    const { data: pfxBlob, error: downloadError } = await supabase.storage.from('esocial_files').download(certPath);
    
    if (downloadError || !pfxBlob) {
      throw new Error(`Não foi possível baixar o certificado do Storage (${certPath}). Verifique se o arquivo ainda existe.`);
    }

    const pfxBuffer = Buffer.from(await pfxBlob.arrayBuffer());

    if (action === 'CONSULT') {
      const { protocolo } = req.body;
      console.log(`[DEBUG] Consultando protocolo: ${protocolo}`);
      const soapRequest = `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0"><soapenv:Body><ns:ConsultarLoteEventos><ns:consulta><eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/consulta/retornoProcessamento/v1_0_0"><consultaLoteEventos><protocoloEnvio>${protocolo}</protocoloEnvio></consultaLoteEventos></eSocial></ns:consulta></ns:ConsultarLoteEventos></soapenv:Body></soapenv:Envelope>`;
      
      const response = await axios.post(URL_CONSULTA, soapRequest, {
        headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0/ServicoConsultarLoteEventos/ConsultarLoteEventos"' },
        httpsAgent: new https.Agent({ pfx: pfxBuffer, passphrase: credentials.certificate_password, rejectUnauthorized: false, minVersion: 'TLSv1.2' }),
      });

      const xmlRes = response.data;
      const statusMatch = xmlRes.match(/<cdResposta>([^<]+)<\/cdResposta>/);
      const reciboMatch = xmlRes.match(/<nrRecibo>([^<]+)<\/nrRecibo>/);
      const msgMatch = xmlRes.match(/<dscOcorrencia>([^<]+)<\/dscOcorrencia>/);

      const status = statusMatch && statusMatch[1] === '201' ? 'SUCESSO' : 'PROCESSANDO';
      const recibo = reciboMatch ? reciboMatch[1] : null;
      const message = msgMatch ? msgMatch[1] : (status === 'SUCESSO' ? 'Processado com sucesso' : 'Aguardando processamento...');

      // SECURITY: Return only necessary fields, never the full XML response
      return res.json({ success: true, status, recibo, message });
    }

    const { eventType, eventData = {} } = req.body;
    
    // SECURITY: Sanitize all input data before XML generation
    Object.keys(eventData).forEach(key => {
      if (typeof eventData[key] === 'string') {
        eventData[key] = escapeXml(eventData[key]);
      }
    });

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
    const empTpInsc = empCpfCnpj.length <= 11 ? '2' : '1';
    const eventId = `ID${empTpInsc}${empCpfCnpj.padEnd(14, '0')}${timestamp}${rnd}`;

    const eventType = req.body.eventType || (action === 'TRANSMIT_S1000' ? 'S-1000' : 'S-2300');
    let xmlEvento = '';

    if (eventType === 'S-1000') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtInfoEmpregador/v_S_01_03_00';
      xmlEvento = `<eSocial xmlns="${ns}"><evtInfoEmpregador Id="${eventId}"><ideEvento><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><infoEmpregador><inclusao><idePeriodo><iniValid>${eventData.iniValid || '2024-01'}</iniValid></idePeriodo><infoCadastro><classTrib>${eventData.classTrib || '21'}</classTrib><indDesFolha>0</indDesFolha><indOpcCP>1</indOpcCP><indOptRegEletron>0</indOptRegEletron></infoCadastro></inclusao></infoEmpregador></evtInfoEmpregador></eSocial>`;
    } else if (eventType === 'S-1005') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtTabEstab/v_S_01_03_00';
      const cno = (eventData.cnoNumero || '').replace(/\D/g, '');
      xmlEvento = `<eSocial xmlns="${ns}"><evtTabEstab Id="${eventId}"><ideEvento><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><infoEstab><inclusao><ideEstab><tpInsc>4</tpInsc><nrInsc>${cno}</nrInsc><iniValid>${eventData.iniValid || '2024-01'}</iniValid></ideEstab><dadosEstab><aliqRat>2</aliqRat><fap>1.0</fap></dadosEstab></inclusao></infoEstab></evtTabEstab></eSocial>`;
    } else if (eventType === 'S-1010') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtTabRubrica/v_S_01_03_00';
      xmlEvento = `<eSocial xmlns="${ns}"><evtTabRubrica Id="${eventId}"><ideEvento><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><infoRubrica><inclusao><ideRubrica><codRubr>1000</codRubr><ideTabRubr>TAB01</ideTabRubr><iniValid>${eventData.iniValid || '2024-01'}</iniValid></ideRubrica><dadosRubrica><dscRubr>SALARIO</dscRubr><tpRubr>1</tpRubr><codIncCP>11</codIncCP><codIncIRRF>11</codIncIRRF><codIncFGTS>11</codIncFGTS></dadosRubrica></inclusao></infoRubrica></evtTabRubrica></eSocial>`;
    } else if (eventType === 'S-1020') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtTabLotacao/v_S_01_03_00';
      xmlEvento = `<eSocial xmlns="${ns}"><evtTabLotacao Id="${eventId}"><ideEvento><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><infoLotacao><inclusao><ideLotacao><codLotacao>LOT01</codLotacao><iniValid>${eventData.iniValid || '2024-01'}</iniValid></ideLotacao><dadosLotacao><tpLotacao>21</tpLotacao><fpas>507</fpas><codTerc>0079</codTerc></dadosLotacao></inclusao></infoLotacao></evtTabLotacao></eSocial>`;
    } else if (eventType === 'S-2300') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtTSVInicio/v_S_01_03_00';
      const workerCpf = (eventData.workerCpf || '').replace(/\D/g, '');
      const workerNome = (eventData.workerNome || '').toUpperCase();
      xmlEvento = `<eSocial xmlns="${ns}"><evtTSVInicio Id="${eventId}"><ideEvento><indRetif>1</indRetif><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><trabalhador><cpfTrab>${workerCpf}</cpfTrab><nmTrab>${workerNome}</nmTrab><sexo>${eventData.sexo || 'M'}</sexo><racaCor>${eventData.racaCor || '1'}</racaCor><estCiv>${eventData.estCiv || '1'}</estCiv><grauInstr>${eventData.grauInstr || '07'}</grauInstr><nascimento><dtNascto>${eventData.nascimento || '1980-03-05'}</dtNascto><paisNascto>105</paisNascto><paisNac>105</paisNac></nascimento><endereco><brasil><tpLograd>R</tpLograd><dscLograd>${eventData.logradouro || 'RUA'}</dscLograd><nrLograd>${eventData.numero || 'SN'}</nrLograd><bairro>${eventData.bairro || 'CENTRO'}</bairro><cep>${eventData.cep || '00000000'}</cep><codMunic>${eventData.codMunic || '3304557'}</codMunic><uf>${eventData.uf || 'SP'}</uf></brasil></endereco></trabalhador><infoTSVInicio><cadIni>N</cadIni><matricula>${eventData.matricula || '001'}</matricula><codCateg>${eventData.codCateg || '701'}</codCateg><dtInicio>${eventData.dtInicio || '2024-04-01'}</dtInicio><infoComplementares><cargoFuncao><nmCargo>PEDREIRO</nmCargo><CBOCargo>715210</CBOCargo></cargoFuncao></infoComplementares></infoTSVInicio></evtTSVInicio></eSocial>`;
    } else if (eventType === 'S-2399') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtTSVTermino/v_S_01_03_00';
      const workerCpf = (eventData.workerCpf || '').replace(/\D/g, '');
      xmlEvento = `<eSocial xmlns="${ns}"><evtTSVTermino Id="${eventId}"><ideEvento><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><trabalhador><cpfTrab>${workerCpf}</cpfTrab></trabalhador><infoTSVTermino><dtTerm>${eventData.dtTerm || new Date().toISOString().split('T')[0]}</dtTerm></infoTSVTermino></evtTSVTermino></eSocial>`;
    } else if (eventType === 'S-1200') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtRemun/v_S_01_03_00';
      const workerCpf = (eventData.workerCpf || '').replace(/\D/g, '');
      xmlEvento = `<eSocial xmlns="${ns}"><evtRemun Id="${eventId}"><ideEvento><indRetif>1</indRetif><perApur>${eventData.period}</perApur><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><ideTrabalhador><cpfTrab>${workerCpf}</cpfTrab><infoComplem><nmTrab>${(eventData.workerNome || 'TRABALHADOR').toUpperCase()}</nmTrab></infoComplem><dmDev><ideDmDev>1</ideDmDev><infoPerApur><ideEstabLot><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc><codLotacao>LOT01</codLotacao><remunPerApur><ideRubrica><codRubr>1000</codRubr><ideTabRubr>TAB01</ideTabRubr><vrRubr>${eventData.value || '0.00'}</vrRubr></ideRubrica></remunPerApur></ideEstabLot></infoPerApur></dmDev></ideTrabalhador></evtRemun></eSocial>`;
    } else if (eventType === 'S-1210') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtPgtos/v_S_01_03_00';
      const workerCpf = (eventData.workerCpf || '').replace(/\D/g, '');
      xmlEvento = `<eSocial xmlns="${ns}"><evtPgtos Id="${eventId}"><ideEvento><perApur>${eventData.period}</perApur><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><ideBenef><cpfBenef>${workerCpf}</cpfBenef><infoPgto><dtPgto>${eventData.dtPgto || new Date().toISOString().split('T')[0]}</dtPgto><tpPgto>1</tpPgto><perRefer>${eventData.period}</perRefer><ideDmDev><ideDmDev>1</ideDmDev><vrLiq>${eventData.value || '0.00'}</vrLiq></ideDmDev></infoPgto></ideBenef></evtPgtos></eSocial>`;
    } else if (eventType === 'S-1298') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtReabertEvPer/v_S_01_03_00';
      xmlEvento = `<eSocial xmlns="${ns}"><evtReabertEvPer Id="${eventId}"><ideEvento><perApur>${eventData.period}</perApur><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador></evtReabertEvPer></eSocial>`;
    } else if (eventType === 'S-1299') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtFechaEvPer/v_S_01_03_00';
      xmlEvento = `<eSocial xmlns="${ns}"><evtFechaEvPer Id="${eventId}"><ideEvento><perApur>${eventData.period}</perApur><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><infoFech><nmResp>RESPONSAVEL</nmResp><cpfResp>${empCpfCnpj.length <= 11 ? empCpfCnpj : '00000000000'}</cpfResp><ideEstab><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEstab></infoFech></evtFechaEvPer></eSocial>`;
    } else {
      throw new Error(`Evento ${eventType} não suportado pelo proxy.`);
    }

    const xmlAssinado = assinarXml(xmlEvento, privateKeyPem, certPem);

    const tableEvents = ['S-1000', 'S-1005', 'S-1010', 'S-1020', 'S-1070'];
    const grupoLote = tableEvents.includes(eventType) ? '1' : '2';

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0"><soapenv:Body><ns:EnviarLoteEventos><ns:loteEventos><eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/v1_1_1"><envioLoteEventos grupo="${grupoLote}"><ideEmpregador><tpInsc>2</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><ideTransmissor><tpInsc>2</tpInsc><nrInsc>${transCpfCnpj}</nrInsc></ideTransmissor><eventos><evento Id="${eventId}">${xmlAssinado}</evento></eventos></envioLoteEventos></eSocial></ns:loteEventos></ns:EnviarLoteEventos></soapenv:Body></soapenv:Envelope>`;

    const response = await axios.post(URL_ENVIO, soapRequest, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0/ServicoEnviarLoteEventos/EnviarLoteEventos"' },
      httpsAgent: new https.Agent({ pfx: pfxBuffer, passphrase: credentials.certificate_password, rejectUnauthorized: false, minVersion: 'TLSv1.2' }),
    });

    const xmlRes = response.data;
    const protMatch = xmlRes.match(/<protocoloEnvio>([^<]+)<\/protocoloEnvio>/);
    const protocolo = protMatch ? protMatch[1] : null;

    // SECURITY: Return only protocol, never the full sensitive response
    res.json({ success: true, protocolo });
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
    
    const certPath = credentials.certificate_url.split('esocial_files/')[1];
    const { data: pfxBlob, error: downloadError } = await supabase.storage.from('esocial_files').download(certPath);
    if (downloadError || !pfxBlob) throw new Error(`Certificado não encontrado no storage: ${certPath}`);
    
    const pfxBuffer = Buffer.from(await pfxBlob.arrayBuffer());
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0"><soapenv:Body><ns:ConsultarLoteEventos><ns:consulta><eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/consulta/retornoProcessamento/v1_0_0"><consultaLoteEventos><protocoloEnvio>${protocolo}</protocoloEnvio></consultaLoteEventos></eSocial></ns:consulta></ns:ConsultarLoteEventos></soapenv:Body></soapenv:Envelope>`;
    
    const response = await axios.post(URL_CONSULTA, soapRequest, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0/ServicoConsultarLoteEventos/ConsultarLoteEventos"' },
      httpsAgent: new https.Agent({ pfx: pfxBuffer, passphrase: credentials.certificate_password, rejectUnauthorized: false, minVersion: 'TLSv1.2' }),
    });

    const xmlRes = response.data;
    const statusMatch = xmlRes.match(/<cdResposta>([^<]+)<\/cdResposta>/);
    const reciboMatch = xmlRes.match(/<nrRecibo>([^<]+)<\/nrRecibo>/);
    const msgMatch = xmlRes.match(/<dscOcorrencia>([^<]+)<\/dscOcorrencia>/);

    const status = statusMatch && statusMatch[1] === '201' ? 'SUCESSO' : 'PROCESSANDO';
    const recibo = reciboMatch ? reciboMatch[1] : null;
    const message = msgMatch ? msgMatch[1] : null;

    res.json({ success: true, status, recibo, message, response: xmlRes });
  } catch (error) {
    console.error('ERRO /consultar:', error.message);
    res.json({ success: false, error: error.message });
  }
});

app.listen(3005, () => console.log('🚀 Proxy C14N+Forge (URI Vazio Real) Online na porta 3005'));

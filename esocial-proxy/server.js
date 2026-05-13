const express = require('express');
const cors = require('cors');
const https = require('https');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const forge = require('node-forge');
const { SignedXml } = require('xml-crypto');
const { DOMParser } = require('@xmldom/xmldom');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// SECURITY: Restrict CORS to local development ports
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
app.use(cors({
  origin: function (origin, callback) {
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

// SECURITY: PII Masking Helper
function maskPII(obj) {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;
  
  const masked = Array.isArray(obj) ? [...obj] : { ...obj };
  const sensitiveKeys = ['cpf', 'cnpj', 'workerCpf', 'empCpfCnpj', 'nrInsc', 'cpfTrab', 'nascimento', 'dtNascto', 'certificate_password', 'passphrase'];
  
  Object.keys(masked).forEach(key => {
    if (sensitiveKeys.includes(key) && typeof masked[key] === 'string') {
      masked[key] = masked[key].length > 4 ? masked[key].substring(0, 3) + '***' + masked[key].slice(-2) : '***';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskPII(masked[key]);
    }
  });
  return masked;
}

// SECURITY: API Key Middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!process.env.PROXY_API_KEY || apiKey !== process.env.PROXY_API_KEY) {
    console.warn(`[SECURITY] Unauthorized access attempt from ${req.ip}`);
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or missing API Key' });
  }
  next();
};

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const URL_ENVIO = 'https://webservices.envio.esocial.gov.br/servicos/empregador/enviarloteeventos/WsEnviarLoteEventos.svc';
const URL_CONSULTA = 'https://webservices.consulta.esocial.gov.br/servicos/empregador/consultarloteeventos/WsConsultarLoteEventos.svc';

// Apply API Key protection to all routes
app.use(validateApiKey);

/**
 * Assina o XML usando xml-crypto para C14N real + forge para RSA-SHA256.
 */
function assinarXml(xmlStr, privateKeyPem, certPem) {
  // ... (logic remains same but removes debug write)
  const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');
  const eSocialNode = doc.documentElement;

  const sigHelper = new SignedXml({ canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315' });
  const c14nXml = sigHelper.getCanonXml(
    ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    eSocialNode
  );

  const md = forge.md.sha256.create();
  md.update(c14nXml, 'utf8');
  const digestBase64 = forge.util.encode64(md.digest().getBytes());

  const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><DigestValue>${digestBase64}</DigestValue></Reference></SignedInfo>`;

  const signedInfoC14n = sigHelper.getCanonXml(
    ['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    new DOMParser().parseFromString(signedInfo, 'text/xml').documentElement
  );

  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const mdSig = forge.md.sha256.create();
  mdSig.update(signedInfoC14n, 'utf8');
  const signatureValue = forge.util.encode64(privateKey.sign(mdSig));

  const certificate = forge.pki.certificateFromPem(certPem);
  const certBase64 = forge.util.encode64(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes());

  const signatureBlock = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">${signedInfo}<SignatureValue>${signatureValue}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo></Signature>`;

  const resultado = xmlStr.replace('</eSocial>', `${signatureBlock}</eSocial>`);

  // SECURITY: Removed debug write to disk
  console.log(`[ESOCIAL] XML assinado com sucesso. C14N length: ${c14nXml.length}`);

  return resultado;
}

app.post('/esocial', async (req, res) => {
  try {
    const { action, eventType: reqEventType, eventData: reqEventData = {}, regularizationId, indRetif, nrRecibo } = req.body;
    const eventData = { ...reqEventData };

    const { data: credentialsList, error: credError } = await supabase.from('esocial_credentials')
      .select('*')
      .eq('regularization_id', regularizationId)
      .order('created_at', { ascending: false });

    if (credError || !credentialsList || credentialsList.length === 0) {
      throw new Error(`Credenciais eSocial não encontradas.`);
    }

    const credentials = credentialsList[0];
    const certPath = credentials.certificate_url.split('esocial_files/')[1];
    
    const { data: pfxBlob, error: downloadError } = await supabase.storage.from('esocial_files').download(certPath);

    if (downloadError || !pfxBlob) {
      throw new Error(`Erro ao baixar certificado.`);
    }

    const pfxBuffer = Buffer.from(await pfxBlob.arrayBuffer());

    if (action === 'CONSULT') {
      const { protocolo } = req.body;
      const soapRequest = `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0"><soapenv:Body><ns:ConsultarLoteEventos><ns:consulta><eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/consulta/retornoProcessamento/v1_0_0"><consultaLoteEventos><protocoloEnvio>${protocolo}</protocoloEnvio></consultaLoteEventos></eSocial></ns:consulta></ns:ConsultarLoteEventos></soapenv:Body></soapenv:Envelope>`;

      const response = await axios.post(URL_CONSULTA, soapRequest, {
        headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0/ServicoConsultarLoteEventos/ConsultarLoteEventos"' },
        // SECURITY: rejectUnauthorized set to true
        httpsAgent: new https.Agent({ pfx: pfxBuffer, passphrase: credentials.certificate_password, rejectUnauthorized: true, minVersion: 'TLSv1.2' }),
      });

      const xmlRes = response.data;

      const statusMatch = xmlRes.match(/<cdResposta>([^<]+)<\/cdResposta>/);
      const reciboMatch = xmlRes.match(/<nrRecibo>([^<]+)<\/nrRecibo>/);
      const cdRetornoEvt = xmlRes.match(/<cdRetornoEvt>([^<]+)<\/cdRetornoEvt>/);

      const ocorrencias = [];
      const ocorrenciaRegex = /<ocorrencia>.*?<codigo>([^<]+)<\/codigo>.*?<descricao>([^<]+)<\/descricao>.*?<tipo>([^<]+)<\/tipo>.*?<\/ocorrencia>/gs;
      let ocMatch;
      while ((ocMatch = ocorrenciaRegex.exec(xmlRes)) !== null) {
        ocorrencias.push({ codigo: ocMatch[1], descricao: ocMatch[2], tipo: ocMatch[3] });
      }

      const cdResposta = statusMatch ? statusMatch[1] : '0';
      const cdEvt = cdRetornoEvt ? cdRetornoEvt[1] : null;

      const CODIGOS_ERRO_CONHECIDOS = {
        '411': '⛔ Assinante Inválido — O certificado usado não possui procuração eletrônica.',
        '401': '✅ Evento em Duplicidade — O eSocial já possui este evento registrado.',
        '748': '⛔ Protocolo Inválido.',
        '501': '⛔ Erro de preenchimento na consulta.',
        '403': '⛔ Acesso negado.',
        '422': '⛔ Erro de validação de schema.',
        '999': '⛔ Erro interno do governo.',
      };

      let status;
      if (cdResposta === '201') {
        status = (cdEvt && cdEvt !== '1') ? 'ERRO' : 'SUCESSO';
      } else if (cdResposta === '101' || cdResposta === '202') {
        status = 'PROCESSANDO';
      } else {
        status = 'ERRO';
      }

      if (ocorrencias.some(o => o.codigo === '411') || xmlRes.includes('<cdRetornoEvt>411</cdRetornoEvt>')) {
        status = 'ERRO';
      }

      if ((ocorrencias.some(o => o.codigo === '401') || xmlRes.includes('<cdRetornoEvt>401</cdRetornoEvt>')) && xmlRes.toLowerCase().includes('duplicidade')) {
        status = 'SUCESSO';
      }

      const recibo = reciboMatch ? reciboMatch[1] : null;
      let message;
      if (status === 'SUCESSO') message = 'Processado com sucesso';
      else if (ocorrencias.length > 0) message = ocorrencias.map(o => CODIGOS_ERRO_CONHECIDOS[o.codigo] || o.descricao).join(' | ');
      else message = `Erro do governo (código ${cdResposta}/${cdEvt || 'N/A'})`;

      console.log(`[ESOCIAL] Consulta realizada. Status: ${status}`);

      if (req.body.protocolo && req.body.regularizationId) {
        const updatePayload = { status, updated_at: new Date().toISOString() };
        if (recibo) updatePayload.recibo = recibo;
        if (ocorrencias.length > 0) updatePayload.resposta_governo = maskPII(ocorrencias);
        await supabase.from('esocial_events')
          .update(updatePayload)
          .eq('regularization_id', req.body.regularizationId)
          .eq('protocolo', req.body.protocolo);
      }

      // SECURITY: Sanitized response (removed raw xmlRes)
      return res.json({ success: true, status, recibo, message });
    }

    // SECURITY: Sanitize all input data
    Object.keys(eventData).forEach(key => {
      if (typeof eventData[key] === 'string') eventData[key] = escapeXml(eventData[key]);
    });

    const pfx = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer).getBytes()), credentials.certificate_password);
    const certificate = pfx.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag][0].cert;
    const keyBag = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag][0];

    const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);
    const certPem = forge.pki.certificateToPem(certificate);
    const commonName = certificate.subject.getField('CN').value;
    const transCpfCnpj = commonName.split(':').pop().replace(/\D/g, '');
    const empCpfCnpj = (eventData.proprietarioCpfCnpj || '').replace(/\D/g, '');

    const now = new Date();
    const offset = -3; 
    const brDate = new Date(now.getTime() + (offset * 3600000));
    const timestamp = brDate.toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    const rnd = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const empTpInsc = empCpfCnpj.length <= 11 ? '2' : '1';
    const empInscFormatted = empCpfCnpj.padEnd(14, '0');
    const eventId = `ID${empTpInsc}${empInscFormatted}${timestamp}${rnd}`;

    // SECURITY: Masked logging
    console.log(`[ESOCIAL] Gerando evento ${reqEventType || action} | ID: ${eventId}`);
    console.log(`[ESOCIAL] Dados (mascarados):`, JSON.stringify(maskPII(eventData)));

    const eventType = reqEventType || (action === 'TRANSMIT_S1000' ? 'S-1000' : 'S-2300');
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

      const sexo = eventData.sexo || eventData.workerSexo || 'M';
      const racaCor = String(eventData.racaCor || eventData.workerCorPele || '1');
      const estCiv = String(eventData.estCiv || '1');
      const grauInstr = String(eventData.grauInstr || eventData.workerEscolaridade || '07').padStart(2, '0');
      const nascimento = eventData.nascimento || eventData.workerNascimento || '1980-03-05';
      const matricula = eventData.matricula || eventData.workerMatricula || '001';
      const codCateg = eventData.codCateg || eventData.workerCategoria || '701';
      const dtInicio = eventData.dtInicio || '2024-04-01';
      const nmCargo = (eventData.workerCargo || eventData.nmCargo || 'PEDREIRO').toUpperCase();
      const cboCargo = eventData.workerCbo || eventData.CBOCargo || '715210';

      const logradouro = eventData.logradouro || eventData.workerLogradouro || 'RUA';
      const numero = eventData.numero || eventData.workerNumero || 'SN';
      const bairro = eventData.bairro || eventData.workerBairro || 'CENTRO';
      const cep = (eventData.cep || eventData.workerCep || '00000000').replace(/\D/g, '');
      const codMunic = eventData.codMunic || eventData.workerCodIbge || '3304557';
      const uf = eventData.uf || eventData.workerUf || 'SP';

      const ideEvento = `<ideEvento><indRetif>${indRetif || 1}</indRetif>${(indRetif == 2 && nrRecibo) ? `<nrRecibo>${nrRecibo}</nrRecibo>` : ''}<tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento>`;

      xmlEvento = `<eSocial xmlns="${ns}"><evtTSVInicio Id="${eventId}">${ideEvento}<ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><trabalhador><cpfTrab>${workerCpf}</cpfTrab><nmTrab>${workerNome}</nmTrab><sexo>${sexo}</sexo><racaCor>${racaCor}</racaCor><estCiv>${estCiv}</estCiv><grauInstr>${grauInstr}</grauInstr><nascimento><dtNascto>${nascimento}</dtNascto><paisNascto>105</paisNascto><paisNac>105</paisNac></nascimento><endereco><brasil><tpLograd>R</tpLograd><dscLograd>${logradouro}</dscLograd><nrLograd>${numero}</nrLograd><bairro>${bairro}</bairro><cep>${cep}</cep><codMunic>${codMunic}</codMunic><uf>${uf}</uf></brasil></endereco></trabalhador><infoTSVInicio><cadIni>N</cadIni><matricula>${matricula}</matricula><codCateg>${codCateg}</codCateg><dtInicio>${dtInicio}</dtInicio><infoComplementares><cargoFuncao><nmCargo>${nmCargo}</nmCargo><CBOCargo>${cboCargo}</CBOCargo></cargoFuncao></infoComplementares></infoTSVInicio></evtTSVInicio></eSocial>`;
    } else if (eventType === 'S-2399') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtTSVTermino/v_S_01_03_00';
      const workerCpf = (eventData.workerCpf || '').replace(/\D/g, '');
      const matricula = eventData.matricula || eventData.workerMatricula || '001';
      const brToday = brDate.toISOString().split('T')[0];
      const dtTermFinal = eventData.dtTerm || brToday; 
      const codCateg = String(eventData.codCateg || '701');
      const isDiretor = ['721', '722', '723', '771'].includes(codCateg);
      const mtvDesligTSV = isDiretor ? String(eventData.mtvDesligTSV || '01').padStart(2, '0') : null;

      const ideEvento = `<ideEvento><indRetif>${indRetif || 1}</indRetif>${(indRetif == 2 && nrRecibo) ? `<nrRecibo>${nrRecibo}</nrRecibo>` : ''}<tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento>`;

      xmlEvento = `<eSocial xmlns="${ns}"><evtTSVTermino Id="${eventId}">${ideEvento}<ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><ideTrabSemVinculo><cpfTrab>${workerCpf}</cpfTrab><matricula>${matricula}</matricula></ideTrabSemVinculo><infoTSVTermino><dtTerm>${dtTermFinal}</dtTerm>${mtvDesligTSV ? `<mtvDesligTSV>${mtvDesligTSV}</mtvDesligTSV>` : ''}</infoTSVTermino></evtTSVTermino></eSocial>`;
    } else if (eventType === 'S-1200') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtRemun/v_S_01_03_00';
      const workerCpf = (eventData.workerCpf || '').replace(/\D/g, '');
      const period = eventData.period || (eventData.month && eventData.year ? `${eventData.year}-${String(eventData.month).padStart(2, '0')}` : '2024-04');
      xmlEvento = `<eSocial xmlns="${ns}"><evtRemun Id="${eventId}"><ideEvento><indRetif>1</indRetif><perApur>${period}</perApur><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><ideTrabalhador><cpfTrab>${workerCpf}</cpfTrab><infoComplem><nmTrab>${(eventData.workerNome || 'TRABALHADOR').toUpperCase()}</nmTrab></infoComplem><dmDev><ideDmDev>1</ideDmDev><infoPerApur><ideEstabLot><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc><codLotacao>LOT01</codLotacao><remunPerApur><ideRubrica><codRubr>1000</codRubr><ideTabRubr>TAB01</ideTabRubr><vrRubr>${eventData.value || '0.00'}</vrRubr></ideRubrica></remunPerApur></ideEstabLot></infoPerApur></dmDev></ideTrabalhador></evtRemun></eSocial>`;
    } else if (eventType === 'S-1210') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtPgtos/v_S_01_03_00';
      const workerCpf = (eventData.workerCpf || '').replace(/\D/g, '');
      const period = eventData.period || (eventData.month && eventData.year ? `${eventData.year}-${String(eventData.month).padStart(2, '0')}` : '2024-04');
      xmlEvento = `<eSocial xmlns="${ns}"><evtPgtos Id="${eventId}"><ideEvento><perApur>${period}</perApur><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><ideBenef><cpfBenef>${workerCpf}</cpfBenef><infoPgto><dtPgto>${eventData.dtPgto || new Date().toISOString().split('T')[0]}</dtPgto><tpPgto>1</tpPgto><perRefer>${period}</perRefer><ideDmDev><ideDmDev>1</ideDmDev><vrLiq>${eventData.value || '0.00'}</vrLiq></ideDmDev></infoPgto></ideBenef></evtPgtos></eSocial>`;
    } else if (eventType === 'S-1298') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtReabertEvPer/v_S_01_03_00';
      xmlEvento = `<eSocial xmlns="${ns}"><evtReabertEvPer Id="${eventId}"><ideEvento><perApur>${eventData.period}</perApur><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador></evtReabertEvPer></eSocial>`;
    } else if (eventType === 'S-1299') {
      const ns = 'http://www.esocial.gov.br/schema/evt/evtFechaEvPer/v_S_01_03_00';
      xmlEvento = `<eSocial xmlns="${ns}"><evtFechaEvPer Id="${eventId}"><ideEvento><perApur>${eventData.period}</perApur><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><infoFech><nmResp>RESPONSAVEL</nmResp><cpfResp>${empCpfCnpj.length <= 11 ? empCpfCnpj : '00000000000'}</cpfResp><ideEstab><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEstab></infoFech></evtFechaEvPer></eSocial>`;
    } else {
      throw new Error(`Evento ${eventType} não suportado.`);
    }

    const xmlAssinado = assinarXml(xmlEvento, privateKeyPem, certPem);

    const tableEvents = ['S-1000', 'S-1005', 'S-1010', 'S-1020', 'S-1070'];
    const grupoLote = tableEvents.includes(eventType) ? '1' : '2';

    const transTpInsc = transCpfCnpj.length <= 11 ? '2' : '1';
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0"><soapenv:Body><ns:EnviarLoteEventos><ns:loteEventos><eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/v1_1_1"><envioLoteEventos grupo="${grupoLote}"><ideEmpregador><tpInsc>${empTpInsc}</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><ideTransmissor><tpInsc>${transTpInsc}</tpInsc><nrInsc>${transCpfCnpj}</nrInsc></ideTransmissor><eventos><evento Id="${eventId}">${xmlAssinado}</evento></eventos></envioLoteEventos></eSocial></ns:loteEventos></ns:EnviarLoteEventos></soapenv:Body></soapenv:Envelope>`;

    console.log(`[ESOCIAL] Enviando lote para eSocial (URL: ${URL_ENVIO})`);

    const response = await axios.post(URL_ENVIO, soapRequest, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0/ServicoEnviarLoteEventos/EnviarLoteEventos"' },
      httpsAgent: new https.Agent({ pfx: pfxBuffer, passphrase: credentials.certificate_password, rejectUnauthorized: true, minVersion: 'TLSv1.2' }),
    });

    const xmlRes = response.data;
    const protMatch = xmlRes.match(/<protocoloEnvio>([^<]+)<\/protocoloEnvio>/);
    const protocolo = protMatch ? protMatch[1] : null;

    if (protocolo && regularizationId) {
      const workerCpf = (eventData.workerCpf || '').replace(/\D/g, '') || null;
      const query = supabase
        .from('esocial_events')
        .select('id')
        .eq('regularization_id', regularizationId)
        .eq('tipo_evento', eventType);
      
      if (workerCpf) query.eq('cpf_trabalhador', workerCpf);
      else query.is('cpf_trabalhador', null);

      const { data: existingEvt } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (existingEvt?.id) {
        await supabase.from('esocial_events').update({
          protocolo,
          xml_assinado: xmlAssinado,
          status: 'ENVIADO',
          ide_evento_id: eventId,
          updated_at: new Date().toISOString()
        }).eq('id', existingEvt.id);
      } else {
        await supabase.from('esocial_events').insert({
          regularization_id: regularizationId,
          tipo_evento: eventType,
          cpf_trabalhador: workerCpf,
          xml_assinado: xmlAssinado,
          protocolo,
          status: 'ENVIADO',
          ide_evento_id: eventId
        });
      }
    }

    res.json({ success: true, protocolo });
  } catch (error) {
    console.error('ERRO /esocial:', error.message);
    res.json({ success: false, error: 'Erro no processamento do evento.' });
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
    if (downloadError || !pfxBlob) throw new Error(`Certificado não encontrado.`);

    const pfxBuffer = Buffer.from(await pfxBlob.arrayBuffer());
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0"><soapenv:Body><ns:ConsultarLoteEventos><ns:consulta><eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/consulta/retornoProcessamento/v1_0_0"><consultaLoteEventos><protocoloEnvio>${protocolo}</protocoloEnvio></consultaLoteEventos></eSocial></ns:consulta></ns:ConsultarLoteEventos></soapenv:Body></soapenv:Envelope>`;

    const response = await axios.post(URL_CONSULTA, soapRequest, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0/ServicoConsultarLoteEventos/ConsultarLoteEventos"' },
      httpsAgent: new https.Agent({ pfx: pfxBuffer, passphrase: credentials.certificate_password, rejectUnauthorized: true, minVersion: 'TLSv1.2' }),
    });

    const xmlRes = response.data;
    const statusMatch = xmlRes.match(/<cdResposta>([^<]+)<\/cdResposta>/);
    const reciboMatch = xmlRes.match(/<nrRecibo>([^<]+)<\/nrRecibo>/);
    const ocorrencias = [];
    const occurrencesRegex = /<dscOcorrencia>([^<]+)<\/dscOcorrencia>/g;
    let match;
    while ((match = occurrencesRegex.exec(xmlRes)) !== null) {
      ocorrencias.push(match[1]);
    }

    const responseCode = statusMatch ? statusMatch[1] : 'N/A';
    const status = responseCode === '201' ? 'SUCESSO' : (responseCode === '101' ? 'PROCESSANDO' : 'ERRO');
    const recibo = reciboMatch ? reciboMatch[1] : null;

    if (protocolo) {
      await supabase.from('esocial_events')
        .update({
          status,
          recibo,
          updated_at: new Date().toISOString()
        })
        .eq('protocolo', protocolo);
    }

    res.json({ success: true, status, recibo, message: ocorrencias[0] || '' });
  } catch (error) {
    console.error('ERRO /consultar:', error.message);
    res.json({ success: false, error: 'Erro na consulta do protocolo.' });
  }
});

app.listen(3005, '0.0.0.0', () => console.log('🚀 Proxy eSocial Online e Protegido (Porta 3005)'));


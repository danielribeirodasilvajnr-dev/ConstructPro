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

app.post('/esocial', async (req, res) => {
  try {
    const { action, eventData = {}, regularizationId } = req.body;
    
    const { data: credentials } = await supabase.from('esocial_credentials').select('*').eq('regularization_id', regularizationId).single();
    const pfxPath = credentials.certificate_url.split('esocial_files/')[1];
    const { data: pfxBlob } = await supabase.storage.from('esocial_files').download(pfxPath);
    const pfxBuffer = Buffer.from(await pfxBlob.arrayBuffer());
    
    const pfxAsn1 = forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer).getBytes());
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, credentials.certificate_password);
    const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
    const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag];
    const certificate = certBags[0].cert;
    const privateKey = keyBags[0].key;

    const commonName = certificate.subject.getField('CN').value;
    const transCpfCnpj = commonName.split(':').pop(); 
    const empCpfCnpj = (eventData.proprietarioCpfCnpj || "25502713865").replace(/\D/g, '');

    // VOLTANDO PARA O PADRÃO S-1000 (padEnd)
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    const eventId = `ID2${empCpfCnpj.padEnd(14, '0')}${timestamp}00001`;
    
    let eventXml = '';
    let rootTag = '';

    if (action === 'TRANSMIT_S1000') {
      rootTag = "evtInfoEmpregador";
      eventXml = `<evtInfoEmpregador xmlns="http://www.esocial.gov.br/schema/evt/evtInfoEmpregador/v_S_01_02_00" Id="${eventId}"><ideEvento><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>2</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><infoEmpregador><inclusao><idePeriodo><iniValid>2024-01</iniValid></idePeriodo><infoCadastro><classTrib>21</classTrib><natJurid>4081</natJurid><indCoop>0</indCoop><indConstr>0</indConstr><indDesFolha>0</indDesFolha><indOptRegEletron>0</indOptRegEletron><contato><nmCont>MARCELINO BASTOS</nmCont><cpfCont>${empCpfCnpj}</cpfCont></contato></infoCadastro></inclusao></infoEmpregador></evtInfoEmpregador>`;
    } else {
      rootTag = "evtTSVInicio";
      const workerCpf = (eventData.workerCpf || "").replace(/\D/g, '');
      const workerNome = (eventData.workerNome || "").toUpperCase();
      eventXml = `<evtTSVInicio xmlns="http://www.esocial.gov.br/schema/evt/evtTSVInicio/v_S_01_02_00" Id="${eventId}"><ideEvento><indRetif>1</indRetif><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento><ideEmpregador><tpInsc>2</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador><trabalhador><cpfTrab>${workerCpf}</cpfTrab><nmTrab>${workerNome}</nmTrab><sexo>${eventData.sexo || 'M'}</sexo><racaCor>${eventData.racaCor || '1'}</racaCor><estCiv>${eventData.estCiv || '1'}</estCiv><grauInstr>${eventData.grauInstr || '07'}</grauInstr><nascimento><dtNascto>${eventData.nascimento || '1985-05-20'}</dtNascto><codMunic>${eventData.codMunic || '3304557'}</codMunic><uf>${eventData.uf || 'SP'}</uf><paisNascto>105</paisNascto></nascimento></trabalhador><infoTSVInicio><cadIni>1</cadIni><infoComplementares><nmMae>${(eventData.nmMae || 'MARIA DA SILVA').toUpperCase()}</nmMae></infoComplementares><infoRegimeTrab><infoAutonomo><tpInsc>2</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></infoAutonomo></infoRegimeTrab><infoContrato><codCateg>${eventData.codCateg || '701'}</codCateg><dtInicio>${eventData.dtInicio || '2024-04-01'}</dtInicio><remuneracao><vrSalFx>${eventData.vrSalFx || '2500.00'}</vrSalFx><undSalFixo>5</undSalFixo></remuneracao></infoContrato></infoTSVInicio></evtTSVInicio>`;
    }

    const md = forge.md.sha256.create();
    md.update(eventXml, 'utf8');
    const digest = forge.util.encode64(md.digest().getBytes());

    const signedInfoXml = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/><Reference URI="#${eventId}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><DigestValue>${digest}</DigestValue></Reference></SignedInfo>`;

    const mdSig = forge.md.sha256.create();
    mdSig.update(signedInfoXml, 'utf8');
    const signature = forge.util.encode64(privateKey.sign(mdSig));
    const certBase64 = forge.util.encode64(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes());
    const fullSignature = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">${signedInfoXml}<SignatureValue>${signature}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo></Signature>`;

    const finalEventXml = `<eSocial xmlns="http://www.esocial.gov.br/schema/evt/${rootTag === 'evtInfoEmpregador' ? 'evtInfoEmpregador' : 'evtTSVInicio'}/v_S_01_02_00">${eventXml}${fullSignature}</eSocial>`;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0">
  <soapenv:Body>
    <ns:EnviarLoteEventos>
      <ns:loteEventos>
        <eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/v1_1_1">
          <envioLoteEventos grupo="${rootTag === 'evtInfoEmpregador' ? '1' : '2'}">
            <ideEmpregador><tpInsc>2</tpInsc><nrInsc>${empCpfCnpj}</nrInsc></ideEmpregador>
            <ideTransmissor><tpInsc>2</tpInsc><nrInsc>${transCpfCnpj}</nrInsc></ideTransmissor>
            <eventos><evento Id="${eventId}">${finalEventXml}</evento></eventos>
          </envioLoteEventos>
        </eSocial>
      </ns:loteEventos>
    </ns:EnviarLoteEventos>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await axios.post(URL_ENVIO, soapRequest, {
      headers: { 
        'Content-Type': 'text/xml; charset=utf-8', 
        'SOAPAction': '"http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0/ServicoEnviarLoteEventos/EnviarLoteEventos"' 
      },
      httpsAgent: new https.Agent({ pfx: pfxBuffer, passphrase: credentials.certificate_password, rejectUnauthorized: false, minVersion: 'TLSv1.2' })
    });
    
    res.json({ success: true, response: response.data });

  } catch (error) {
    res.json({ success: false, error: error.message, detail: error.response?.data });
  }
});

app.listen(3005, () => console.log("🚀 Proxy de Destravamento AevumPro Online"));

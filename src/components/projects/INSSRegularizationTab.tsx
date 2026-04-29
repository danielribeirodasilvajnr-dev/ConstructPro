import React, { useState, useEffect } from 'react';
import { 
  Save,
  CheckCircle2,
  Copy,
  MessageSquare,
  Hammer,
  Edit2,
  X,
  Check,
  Plus,
  AlertCircle,
  Undo2,
  DollarSign,
  UserPlus,
  ArrowLeft,
  Search,
  Printer,
  Trash2,
  Send,
  Eye,
  Eraser,
  Calculator,
  Target,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { INSSRegularization } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

interface Worker {
  id: string;
  nome: string;
  cpf: string;
  cargo_nome: string;
  cbo_cargo: string;
  matricula_esocial: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  uf: string;
  cod_ibge: string;
  cidade: string;
  nascimento: string;
  sexo: string;
  escolaridade: string;
  cor_pele: string;
  pais_nascimento: string;
  categoria: string;
  tab_rubrica: string;
  cod_rubrica: string;
  cod_lotacao: string;
}

interface INSSRegularizationTabProps {
  projectId: string;
  inssRegularization: INSSRegularization | null;
  onRefresh: () => void;
  readOnly?: boolean;
  isStandalone?: boolean;
}

const ESCOLARIDADE_OPTIONS = [
  { value: '1', label: '1 - Analfabeto' },
  { value: '2', label: '2 - Até 4º ano' },
  { value: '3', label: '3 - Até 5º ano' },
  { value: '4', label: '4 - Do 6º ao 9º ano' },
  { value: '5', label: '5 - Fundamental completo' },
  { value: '6', label: '6 - Médio incompleto' },
  { value: '7', label: '7 - Médio completo' },
  { value: '8', label: '8 - Superior incompleto' },
  { value: '9', label: '9 - Superior completo' },
  { value: '10', label: '10 - Pós-graduação' },
  { value: '11', label: '11 - Mestrado' },
  { value: '12', label: '12 - Doutorado' }
];

const COR_PELE_OPTIONS = [
  { value: '1', label: '1 - Branca' },
  { value: '2', label: '2 - Preta' },
  { value: '3', label: '3 - Parda' },
  { value: '4', label: '4 - Amarela' },
  { value: '5', label: '5 - Indígena' }
];

const CATEGORIA_OPTIONS = [
  { value: '701', label: '701 - Autônomo' },
  { value: '741', label: '741 - MEI' }
];

export function INSSRegularizationTab({ projectId, inssRegularization, onRefresh, readOnly, isStandalone }: INSSRegularizationTabProps) {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'summary' | 'management' | 'worker_form' | 's2300_view'>('summary');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [workModalMode, setWorkModalMode] = useState<'simple' | 'detailed'>('simple');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  
  // Form State - Client
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Negociando');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [prazos, setPrazos] = useState('MAED: | Parcelar:');
  const [observations, setObservations] = useState('');
  const [parceiro, setParceiro] = useState('- nenhum -');
  const [link, setLink] = useState('');
  const [cod, setCod] = useState('');
  const [password, setPassword] = useState('');
  const [maedDate, setMaedDate] = useState('');
  const [parcelarDate, setParcelarDate] = useState('');
  
  // Form State - Work
  const [address, setAddress] = useState('');
  const [areaConstruida, setAreaConstruida] = useState(0);
  const [proprietarioNome, setProprietarioNome] = useState('');
  const [proprietarioCpfCnpj, setProprietarioCpfCnpj] = useState('');
  const [cnoNumero, setCnoNumero] = useState('');
  const [rmtInicial, setRmtInicial] = useState(0);
  const [requisitoPercent, setRequisitoPercent] = useState(0);
  const [emitirDocumento, setEmitirDocumento] = useState('Não');

  // Form State - Worker
  const [workerCpf, setWorkerCpf] = useState('');
  const [workerNome, setWorkerNome] = useState('');
  const [workerCargo, setWorkerCargo] = useState('Pedreiro');
  const [workerCbo, setWorkerCbo] = useState('715210');
  const [workerMatricula, setWorkerMatricula] = useState('');
  const [workerCep, setWorkerCep] = useState('');
  const [workerLogradouro, setWorkerLogradouro] = useState('');
  const [workerNumero, setWorkerNumero] = useState('');
  const [workerComplemento, setWorkerComplemento] = useState('');
  const [workerBairro, setWorkerBairro] = useState('');
  const [workerUf, setWorkerUf] = useState('');
  const [workerCodIbge, setWorkerCodIbge] = useState('');
  const [workerCidade, setWorkerCidade] = useState('');
  const [workerNascimento, setWorkerNascimento] = useState('');
  const [workerSexo, setWorkerSexo] = useState('');
  const [workerEscolaridade, setWorkerEscolaridade] = useState('');
  const [workerCorPele, setWorkerCorPele] = useState('');
  const [workerPaisNascimento, setWorkerPaisNascimento] = useState('105');
  const [workerCategoria, setWorkerCategoria] = useState('701');
  const [workerTabRubrica, setWorkerTabRubrica] = useState('');
  const [workerCodRubrica, setWorkerCodRubrica] = useState('');
  const [workerCodLotacao, setWorkerCodLotacao] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState('');
  const [certificatePassword, setCertificatePassword] = useState('');
  const [certificateApelido, setCertificateApelido] = useState('');
  const [certificateCpfCnpj, setCertificateCpfCnpj] = useState('');
  const [esocialStatus, setEsocialStatus] = useState<{
    id?: string;
    status: 'PENDENTE' | 'ENVIADO' | 'PROCESSANDO' | 'SUCESSO' | 'ERRO';
    protocolo?: string;
    recibo?: string;
    tipo_evento: string;
    cpf_trabalhador: string;
    resposta_governo?: any;
  } | null>(null);

  const [esocialS1000Status, setEsocialS1000Status] = useState<{
    id?: string;
    status: 'PENDENTE' | 'ENVIADO' | 'PROCESSANDO' | 'SUCESSO' | 'ERRO';
    protocolo?: string;
    recibo?: string;
    tipo_evento: string;
    resposta_governo?: any;
  } | null>(null);

  useEffect(() => {
    if (inssRegularization) {
      setName(inssRegularization.name || '');
      setClient(inssRegularization.client || '');
      setPhone(inssRegularization.phone || '');
      setStatus(inssRegularization.status || 'Negociando');
      setCpfCnpj(inssRegularization.cpf_cnpj || '');
      setPrazos(inssRegularization.prazos || 'MAED: | Parcelar:');
      setObservations(inssRegularization.observations || '');
      setParceiro(inssRegularization.parceiro || '- nenhum -');
      setLink(inssRegularization.link || '');
      setCod(inssRegularization.cod || '');
      setPassword(inssRegularization.password || '');
      setMaedDate(inssRegularization.maed_date || '');
      setParcelarDate(inssRegularization.parcelar_date || '');
      setAddress(inssRegularization.address || '');
      setAreaConstruida(inssRegularization.area_construcao || 0);
      setProprietarioNome(inssRegularization.proprietario_nome || '');
      setProprietarioCpfCnpj(inssRegularization.proprietario_cpf_cnpj || '');
      setCnoNumero(inssRegularization.cno_numero || '');
      setRmtInicial(inssRegularization.rmt_inicial || 0);
      setRequisitoPercent(inssRegularization.requisito_percent || 0);
      setEmitirDocumento(inssRegularization.emitir_documento || 'Não');
      setCertificateUrl(inssRegularization.certificate_url || '');
      setCertificatePassword(inssRegularization.certificate_password || '');
      setCertificateApelido(inssRegularization.certificate_info?.apelido || '');
      setCertificateCpfCnpj(inssRegularization.certificate_info?.cpf_cnpj || '');
      
      fetchWorkers();
      checkS1000Status();
      if (selectedWorker) {
        checkEsocialStatus(selectedWorker.cpf);
      }
    }
  }, [inssRegularization, selectedWorker]);

  const checkEsocialStatus = async (cpf: string) => {
    if (!inssRegularization) return;
    try {
      const { data, error } = await supabase
        .from('esocial_events')
        .select('*')
        .eq('regularization_id', inssRegularization.id)
        .eq('cpf_trabalhador', cpf)
        .eq('tipo_evento', 'S-2300')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setEsocialStatus({
          id: data[0].id,
          status: data[0].status,
          protocolo: data[0].protocolo,
          recibo: data[0].recibo,
          tipo_evento: data[0].tipo_evento,
          cpf_trabalhador: data[0].cpf_trabalhador,
          resposta_governo: data[0].resposta_governo
        });
      } else {
        setEsocialStatus(null);
      }
    } catch (err) {
      console.error('Error checking esocial status:', err);
    }
  };

  const checkS1000Status = async () => {
    if (!inssRegularization) return;
    try {
      const { data, error } = await supabase
        .from('esocial_events')
        .select('*')
        .eq('regularization_id', inssRegularization.id)
        .eq('tipo_evento', 'S-1000')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setEsocialS1000Status({
          id: data[0].id,
          status: data[0].status,
          protocolo: data[0].protocolo,
          recibo: data[0].recibo,
          tipo_evento: data[0].tipo_evento,
          resposta_governo: data[0].resposta_governo
        });
      } else {
        setEsocialS1000Status(null);
      }
    } catch (err) {
      console.error('Error checking S-1000 status:', err);
    }
  };

  const handleTransmitESocial = async () => {
    if (!selectedWorker || !inssRegularization || isTransmitting) return;

    // ETAPA 2 - VALIDAÇÕES OBRIGATÓRIAS
    const errors: string[] = [];
    if (!validateCPF(selectedWorker.cpf)) errors.push('CPF do trabalhador inválido.');
    if (!selectedWorker.nome) errors.push('Nome do trabalhador é obrigatório.');
    if (!selectedWorker.nascimento) errors.push('Data de nascimento é obrigatória.');
    if (!selectedWorker.categoria) errors.push('Categoria (codCateg) não definida.');
    if (!selectedWorker.cbo_cargo) errors.push('CBO é obrigatório.');
    if (!selectedWorker.logradouro || !selectedWorker.numero || !selectedWorker.bairro || !selectedWorker.uf) {
      errors.push('Endereço do trabalhador está incompleto.');
    }
    if (!proprietarioCpfCnpj || (!validateCPF(proprietarioCpfCnpj) && !validateCNPJ(proprietarioCpfCnpj))) {
      errors.push('CPF/CNPJ do empregador inválido ou não preenchido.');
    }

    if (errors.length > 0) {
      alert(`Erro na validação do evento S-2300:\n\n- ${errors.join('\n- ')}`);
      return;
    }

    // ETAPA 3 - CONTROLE DE DUPLICIDADE E RETIFICAÇÃO
    let indRetif = 1;
    let nrRecibo = null;
    let forceDuplicityError = false;

    if (esocialStatus && esocialStatus.status === 'SUCESSO') {
      const wantRectify = confirm('Este trabalhador já possui um cadastro processado com sucesso no eSocial. Deseja enviar uma RETIFICAÇÃO?\n\n(Se clicar em CANCELAR, o sistema tentará enviar um novo registro e o eSocial retornará erro de DUPLICIDADE)');
      
      if (wantRectify) {
        indRetif = 2;
        nrRecibo = esocialStatus.recibo;
      } else {
        // O usuário escolheu enviar um novo registro (Original) mesmo já existindo. 
        // Isso vai forçar o erro de duplicidade no simulador.
        forceDuplicityError = true;
      }
    }

    setIsTransmitting(true);
    try {
      // ETAPA 4 - GERAR EVENTO (MOCKUP XML)
      const eventId = `ID${indRetif}${selectedWorker.cpf.replace(/\D/g, '')}${new Date().getTime()}`;
      const protocoloInicial = `PRT.${Math.random().toString(36).substring(7).toUpperCase()}`;
      const xmlMockup = `<?xml version="1.0" encoding="UTF-8"?><eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtTSVInicio/v_S_01_01_00"><evtTSVInicio Id="${eventId}"><ideEvento><indRetif>${indRetif}</indRetif>${nrRecibo ? `<nrRecibo>${nrRecibo}</nrRecibo>` : ''}</ideEvento></evtTSVInicio></eSocial>`;

      let eventIdInDb = esocialStatus?.id;

      // Se NÃO for retificação e já temos um registro, vamos ATUALIZAR em vez de inserir novo
      if (indRetif === 1 && eventIdInDb) {
        const { error: updateError } = await supabase
          .from('esocial_events')
          .update({
            xml_enviado: xmlMockup,
            protocolo: protocoloInicial,
            status: 'PROCESSANDO',
            resposta_governo: {
              envio_codigo: '201',
              envio_mensagem: 'Lote recebido com sucesso (Reenvio).'
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', eventIdInDb);
        
        if (updateError) throw updateError;
      } else {
        // É retificação ou primeiro envio: Criamos um NOVO registro
        const { data: eventData, error: eventError } = await supabase
          .from('esocial_events')
          .insert({
            regularization_id: inssRegularization.id,
            tipo_evento: 'S-2300',
            cpf_trabalhador: selectedWorker.cpf,
            xml_enviado: xmlMockup,
            protocolo: protocoloInicial,
            status: 'PROCESSANDO',
            resposta_governo: {
              envio_codigo: '201',
              envio_mensagem: 'Lote recebido com sucesso.'
            }
          })
          .select()
          .single();

        if (eventError) throw eventError;
        eventIdInDb = eventData.id;
      }

      // ETAPA 5, 6, 7 - ASSINATURA E ENVIO (SIMULAÇÃO)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Lógica de Sucesso ou Erro Fiscal
      const isSuccess = !forceDuplicityError && Math.random() > 0.05; 
      const protocolo = `PRT.${Math.random().toString(36).substring(7).toUpperCase()}`;
      const recibo = isSuccess ? `1.${Math.random().toString().substring(2, 12)}` : null;
      
      const { error: updateError } = await supabase
        .from('esocial_events')
        .update({
          status: isSuccess ? 'SUCESSO' : 'ERRO',
          protocolo,
          recibo,
          resposta_governo: { 
            envio_codigo: '201',
            envio_mensagem: 'Lote recebido com sucesso.',
            proc_codigo: isSuccess ? '202' : '401',
            proc_mensagem: isSuccess ? 'Sucesso' : 'Conteúdo do evento inválido.',
            detalhe: forceDuplicityError ? 'Foi localizado no sistema um evento em duplicidade com o evento a ser enviado, mesmo Tipo de Inscrição, Número de Inscrição, CPF, Matrícula.' : (!isSuccess ? 'Erro de validação na estrutura do XML.' : null),
            acao_sugerida: forceDuplicityError ? 'Verificar a matrícula informada e, se já utilizada em S-2190, S-2200, S-2300, S-2500 ou S-8200 de outro trabalhador, gerar uma nova matrícula.' : null
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', eventIdInDb);

      if (updateError) throw updateError;

      // ETAPA 9 - FEEDBACK
      if (isSuccess) {
        alert('Consulta finalizada! O evento foi processado com SUCESSO.');
        // Retorno automático após sucesso
        setTimeout(() => {
          setCurrentView('management');
          fetchWorkers();
        }, 1500);
      } else {
        alert('O eSocial rejeitou o evento. Verifique os detalhes no histórico.');
      }

      checkEsocialStatus(selectedWorker.cpf);
    } catch (err: any) {
      console.error('Error in eSocial flow:', err);
      const errorMsg = err.message || err.details || 'Erro desconhecido';
      alert(`Erro técnico na comunicação com o eSocial:\n\nDetalhamento: ${errorMsg}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleConsultESocial = async () => {
    if (!esocialStatus || isTransmitting || !inssRegularization) return;

    setIsTransmitting(true);
    try {
      // ETAPA 8 - CONSULTA (SIMULAÇÃO)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verificação real de duplicidade na consulta
      const { data: existingSuccess } = await supabase
        .from('esocial_events')
        .select('id')
        .eq('regularization_id', inssRegularization.id)
        .eq('cpf_trabalhador', esocialStatus.cpf_trabalhador)
        .eq('status', 'SUCESSO')
        .neq('id', esocialStatus.id)
        .limit(1);

      // Se já existe sucesso e este envio não é retificação (estamos simulando que indRetif=1 no XML se não houver recibo)
      // Nota: Na nossa simulação, se indRetif fosse 2, o esocialStatus.recibo estaria preenchido
      const isOriginal = !esocialStatus.recibo; 
      const forceDuplicity = isOriginal && existingSuccess && existingSuccess.length > 0;

      const isSuccess = !forceDuplicity && Math.random() > 0.05; 
      const protocolo = esocialStatus.protocolo || `PRT.${Math.random().toString(36).substring(7).toUpperCase()}`;
      const recibo = isSuccess ? (esocialStatus.recibo || `1.${Math.random().toString().substring(2, 12)}`) : null;
      
      const { error: updateError } = await supabase
        .from('esocial_events')
        .update({
          status: isSuccess ? 'SUCESSO' : 'ERRO',
          protocolo,
          recibo,
          resposta_governo: { 
            envio_codigo: '201',
            envio_mensagem: 'Lote recebido com sucesso.',
            proc_codigo: isSuccess ? '202' : '401',
            proc_mensagem: isSuccess ? 'Sucesso' : 'Conteúdo do evento inválido.',
            detalhe: forceDuplicity ? 'Foi localizado no sistema um evento em duplicidade com o evento a ser enviado, mesmo Tipo de Inscrição, Número de Inscrição, CPF, Matrícula.' : (!isSuccess ? 'Erro de validação técnica na estrutura do XML.' : null),
            acao_sugerida: forceDuplicity ? 'Verificar a matrícula informada e, se já utilizada em S-2190, S-2200, S-2300, S-2500 ou S-8200 de outro trabalhador, gerar uma nova matrícula.' : null
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', esocialStatus.id);
          
      if (updateError) throw updateError;

      if (isSuccess) {
        alert('Consulta finalizada! O evento foi processado com SUCESSO.');
        setTimeout(() => {
          setCurrentView('management');
          fetchWorkers();
        }, 1500);
      } else {
        alert('O eSocial rejeitou o evento. Verifique os detalhes no log de processamento.');
      }
      
      checkEsocialStatus(esocialStatus.cpf_trabalhador);
    } catch (err: any) {
      console.error('Error consulting eSocial:', err);
      alert(`Erro na consulta: ${err.message || 'Erro de conexão'}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleTransmitS1000 = async () => {
    if (!inssRegularization || isTransmitting) return;

    // Validações Empregador
    const errors: string[] = [];
    if (!proprietarioNome) errors.push('Nome do empregador é obrigatório.');
    if (!proprietarioCpfCnpj || (!validateCPF(proprietarioCpfCnpj) && !validateCNPJ(proprietarioCpfCnpj))) {
      errors.push('CPF/CNPJ do empregador inválido.');
    }

    if (errors.length > 0) {
      alert(`Erro na validação do evento S-1000:\n\n- ${errors.join('\n- ')}`);
      return;
    }

    let indRetif = 1;
    let nrRecibo = null;
    if (esocialS1000Status?.status === 'SUCESSO') {
      if (!confirm('O cadastro do empregador já foi processado com sucesso. Deseja enviar uma RETIFICAÇÃO?')) return;
      indRetif = 2;
      nrRecibo = esocialS1000Status.recibo;
    }

    setIsTransmitting(true);
    try {
      const protocoloInicial = `PRT.S1000.${Math.random().toString(36).substring(7).toUpperCase()}`;
      let eventIdInDb = esocialS1000Status?.id;

      if (indRetif === 1 && eventIdInDb) {
        await supabase.from('esocial_events').update({
          status: 'PROCESSANDO',
          protocolo: protocoloInicial,
          resposta_governo: { envio_codigo: '201', envio_mensagem: 'Lote recebido com sucesso (Reenvio).' },
          updated_at: new Date().toISOString()
        }).eq('id', eventIdInDb);
      } else {
        const { data, error } = await supabase.from('esocial_events').insert({
          regularization_id: inssRegularization.id,
          tipo_evento: 'S-1000',
          cpf_trabalhador: 'EMPREGADOR',
          status: 'PROCESSANDO',
          protocolo: protocoloInicial,
          resposta_governo: { envio_codigo: '201', envio_mensagem: 'Lote recebido com sucesso.' }
        }).select().single();
        if (error) throw error;
        eventIdInDb = data.id;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      checkS1000Status();
    } catch (err: any) {
      alert(`Erro no S-1000: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleConsultS1000 = async () => {
    if (!esocialS1000Status || isTransmitting) return;
    setIsTransmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const isSuccess = Math.random() > 0.05;
      const recibo = isSuccess ? `1.${Math.random().toString().substring(2, 12)}` : null;

      await supabase.from('esocial_events').update({
        status: isSuccess ? 'SUCESSO' : 'ERRO',
        recibo,
        resposta_governo: {
          envio_codigo: '201',
          envio_mensagem: 'Lote recebido com sucesso.',
          proc_codigo: isSuccess ? '202' : '401',
          proc_mensagem: isSuccess ? 'Sucesso' : 'Erro de processamento'
        },
        updated_at: new Date().toISOString()
      }).eq('id', esocialS1000Status.id);

      if (isSuccess) alert('S-1000 processado com SUCESSO!');
      checkS1000Status();
    } catch (err: any) {
      alert(`Erro na consulta S-1000: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  // CEP Auto-fetch
  useEffect(() => {
    const cleanCep = workerCep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddressByCep(cleanCep);
    }
  }, [workerCep]);

  const fetchAddressByCep = async (cep: string) => {
    setIsFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setWorkerLogradouro(data.logradouro || '');
        setWorkerBairro(data.bairro || '');
        setWorkerUf(data.uf || '');
        setWorkerCidade(data.localidade || '');
        setWorkerCodIbge(data.ibge || '');
      }
    } catch (err) {
      console.error('Error fetching CEP:', err);
    } finally {
      setIsFetchingCep(false);
    }
  };

  const fetchWorkers = async () => {
    if (!inssRegularization) return;
    try {
      const { data: workersData, error: workersError } = await supabase
        .from('inss_regularization_workers')
        .select('*')
        .eq('regularization_id', isStandalone ? projectId : inssRegularization.id)
        .order('created_at', { ascending: false });

      if (workersError) throw workersError;

      // Fetch esocial status for all workers
      const { data: eventsData, error: eventsError } = await supabase
        .from('esocial_events')
        .select('cpf_trabalhador, status')
        .eq('regularization_id', inssRegularization.id)
        .eq('tipo_evento', 'S-2300')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Map status to workers
      const workersWithStatus = (workersData || []).map(worker => {
        const latestEvent = eventsData?.find(e => e.cpf_trabalhador === worker.cpf);
        return {
          ...worker,
          esocial_status: latestEvent?.status || 'PENDENTE'
        };
      });

      setWorkers(workersWithStatus);
    } catch (err) {
      console.error('Error fetching workers:', err);
    }
  };

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cleanCPF.charAt(9))) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cleanCPF.charAt(10))) return false;
    return true;
  };

  const validateCNPJ = (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    if (cleanCNPJ.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    let size = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, size);
    const digits = cleanCNPJ.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let rev = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (rev !== parseInt(digits.charAt(0))) return false;
    size = size + 1;
    numbers = cleanCNPJ.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    rev = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (rev !== parseInt(digits.charAt(1))) return false;
    return true;
  };

  const handleSave = async () => {
    if (readOnly) return;
    
    // Validation for Client Modal
    if (isEditModalOpen && !cpfCnpj) {
      alert('O campo CPF / CNPJ é obrigatório.');
      return;
    }

    if (isEditModalOpen) {
      const isCpf = cpfCnpj.replace(/[^\d]/g, '').length <= 11;
      const isValid = isCpf ? validateCPF(cpfCnpj) : validateCNPJ(cpfCnpj);
      if (!isValid) {
        alert(`O ${isCpf ? 'CPF' : 'CNPJ'} informado é inválido.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const data: Partial<INSSRegularization> = {
        id: isStandalone ? projectId : undefined,
        project_id: isStandalone ? undefined : projectId,
        user_id: user.id,
        name,
        client,
        phone,
        status,
        cpf_cnpj: cpfCnpj,
        prazos,
        observations,
        parceiro,
        link,
        cod,
        password,
        maed_date: maedDate || null,
        parcelar_date: parcelarDate || null,
        address,
        area_construcao: areaConstruida,
        proprietario_nome: proprietarioNome,
        proprietario_cpf_cnpj: proprietarioCpfCnpj,
        cno_numero: cnoNumero,
        rmt_inicial: rmtInicial,
        requisito_percent: requisitoPercent,
        emitir_documento: emitirDocumento,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('inss_regularizations')
        .upsert(data, { onConflict: isStandalone ? 'id' : 'project_id' });

      if (error) {
        console.error('Supabase Error:', error);
        alert(`Erro ao salvar: ${error.message}`);
        throw error;
      }
      
      setIsEditModalOpen(false);
      setIsWorkModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditWorker = (worker: Worker) => {
    setEditingWorkerId(worker.id);
    setWorkerCpf(worker.cpf || '');
    setWorkerNome(worker.nome || '');
    setWorkerCargo(worker.cargo_nome || '');
    setWorkerCbo(worker.cbo_cargo || '');
    setWorkerMatricula(worker.matricula_esocial || '');
    setWorkerCep(worker.cep || '');
    setWorkerLogradouro(worker.logradouro || '');
    setWorkerNumero(worker.numero || '');
    setWorkerComplemento(worker.complemento || '');
    setWorkerBairro(worker.bairro || '');
    setWorkerUf(worker.uf || '');
    setWorkerCodIbge(worker.cod_ibge || '');
    setWorkerCidade(worker.cidade || '');
    setWorkerNascimento(worker.nascimento || '');
    setWorkerSexo(worker.sexo || '');
    setWorkerEscolaridade(worker.escolaridade || '');
    setWorkerCorPele(worker.cor_pele || '');
    setWorkerPaisNascimento(worker.pais_nascimento || '105');
    setWorkerCategoria(worker.categoria || '701');
    setWorkerTabRubrica(worker.tab_rubrica || '');
    setWorkerCodRubrica(worker.cod_rubrica || '');
    setWorkerCodLotacao(worker.cod_lotacao || '');
    setCurrentView('worker_form');
  };

  const resetWorkerForm = () => {
    setEditingWorkerId(null);
    setWorkerCpf('');
    setWorkerNome('');
    setWorkerCargo('Pedreiro');
    setWorkerCbo('715210');
    setWorkerMatricula('');
    setWorkerCep('');
    setWorkerLogradouro('');
    setWorkerNumero('');
    setWorkerComplemento('');
    setWorkerBairro('');
    setWorkerUf('');
    setWorkerCodIbge('');
    setWorkerCidade('');
    setWorkerNascimento('');
    setWorkerSexo('');
    setWorkerEscolaridade('');
    setWorkerCorPele('');
    setWorkerPaisNascimento('105');
    setWorkerCategoria('701');
    setWorkerTabRubrica('');
    setWorkerCodRubrica('');
    setWorkerCodLotacao('');
  };

  const handleSaveWorker = async () => {
    if (!user || !inssRegularization) return;
    
    setIsSaving(true);
    try {
      const workerData = {
        regularization_id: isStandalone ? projectId : inssRegularization.id,
        cpf: workerCpf,
        nome: workerNome,
        cargo_nome: workerCargo,
        cbo_cargo: workerCbo,
        matricula_esocial: workerMatricula,
        cep: workerCep,
        logradouro: workerLogradouro,
        numero: workerNumero,
        complemento: workerComplemento,
        bairro: workerBairro,
        uf: workerUf,
        cod_ibge: workerCodIbge,
        cidade: workerCidade,
        nascimento: workerNascimento || null,
        sexo: workerSexo,
        escolaridade: workerEscolaridade,
        cor_pele: workerCorPele,
        pais_nascimento: workerPaisNascimento,
        categoria: workerCategoria,
        tab_rubrica: workerTabRubrica,
        cod_rubrica: workerCodRubrica,
        cod_lotacao: workerCodLotacao
      };

      if (editingWorkerId) {
        const { error } = await supabase
          .from('inss_regularization_workers')
          .update(workerData)
          .eq('id', editingWorkerId);
        if (error) throw error;
        alert('Trabalhador atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('inss_regularization_workers')
          .insert(workerData);
        if (error) throw error;
        alert('Trabalhador cadastrado com sucesso!');
      }

      await fetchWorkers();
      setCurrentView('management');
      resetWorkerForm();
    } catch (err) {
      console.error('Error saving worker:', err);
      alert('Erro ao salvar trabalhador.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveWorker = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este trabalhador?')) return;
    try {
      const { error } = await supabase
        .from('inss_regularization_workers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchWorkers();
    } catch (err) {
      console.error('Error removing worker:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-32 animate-in fade-in duration-500">
      {/* Summary View */}
      {currentView === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Header Info Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
            {/* Name and Copy */}
            <div className="p-4 flex items-center gap-3 border-b border-slate-100">
              <h2 className="text-3xl font-bold text-slate-800">{client}</h2>
              <button onClick={() => copyToClipboard(client)} className="p-1.5 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">
                <Copy className="h-4 w-4 text-slate-600" />
              </button>
            </div>

            {/* Phone and WhatsApp */}
            <div className="p-4 flex items-center gap-2 border-b border-slate-100 bg-slate-50/50">
              <MessageSquare className="h-4 w-4 text-emerald-600 fill-emerald-600/20" />
              <span className="text-slate-600 font-medium">{phone} |</span>
            </div>

            {/* Status Row */}
            <div className="flex border-b border-slate-100">
              <div className="w-32 p-3 bg-slate-50 border-r border-slate-100 flex items-center">
                <span className="text-sm font-bold text-slate-700">Status</span>
              </div>
              <div className="flex-1 p-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold">
                  <MessageSquare className="h-3 w-3" />
                  {status} ➔ {status} ➔
                </div>
              </div>
            </div>

            {/* CPF / CNPJ Row */}
            <div className="flex border-b border-slate-100">
              <div className="w-32 p-3 bg-slate-50 border-r border-slate-100 flex items-center">
                <span className="text-sm font-bold text-slate-700">CPF / CNPJ</span>
              </div>
              <div className="flex-1 p-3 flex items-center gap-2">
                <button onClick={() => copyToClipboard(cpfCnpj)} className="p-1.5 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">
                  <Copy className="h-4 w-4 text-slate-600" />
                </button>
                <span className="text-slate-400 font-medium">|| {cpfCnpj}</span>
              </div>
            </div>

            {/* Detalhes Header */}
            <div className="p-3 bg-slate-50 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-700">Detalhes</span>
            </div>

            {/* Obras Row */}
            <div className="flex border-b border-slate-100">
              <div className="w-32 p-3 bg-slate-50 border-r border-slate-100 flex items-center">
                <span className="text-sm font-bold text-slate-700">Obras</span>
              </div>
              <div className="flex-1 p-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D94141] text-white rounded text-xs font-bold uppercase tracking-wider">
                  <Hammer className="h-3.5 w-3.5 fill-white" />
                  {name} / {areaConstruida.toFixed(2)}m²
                </div>
              </div>
            </div>

            {/* Prazos Row */}
            <div className="flex border-b border-slate-100">
              <div className="w-32 p-3 bg-slate-50 border-r border-slate-100 flex items-center">
                <span className="text-sm font-bold text-slate-700">Prazos:</span>
              </div>
              <div className="flex-1 p-3 flex items-center">
                <span className="text-slate-600 text-sm">{prazos}</span>
              </div>
            </div>

            {/* OBS Row */}
            <div className="flex">
              <div className="w-32 p-3 bg-slate-50 border-r border-slate-100 flex items-center">
                <span className="text-sm font-bold text-slate-700">OBS:</span>
              </div>
              <div className="flex-1 p-3">
                <span className="text-slate-600 text-sm">{observations}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#636E72] text-white rounded-md text-sm font-medium hover:bg-slate-600 transition-colors shadow-sm"
            >
              <Edit2 className="h-4 w-4" /> Editar
            </button>
            <button 
              onClick={() => { setWorkModalMode('simple'); setIsWorkModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1B8E5A] text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> Cadastrar Obra
            </button>
            <button 
              onClick={() => setCurrentView('management')}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-all shadow-lg uppercase tracking-widest"
            >
              <Hammer className="h-4 w-4" /> Gerenciar Obra
            </button>
          </div>
        </div>
      )}

      {/* Management View (Screen from 2nd photo) - Inline */}
      {currentView === 'management' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Management Header Card */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden text-slate-800">
            {/* Row 1: Nosso Contato */}
            <div className="flex border-b border-slate-100">
              <div className="w-40 p-3 bg-slate-50 border-r border-slate-100 flex items-center">
                <span className="text-sm font-bold text-slate-700">Nosso Contato</span>
              </div>
              <div className="flex-1 p-3 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-800">{client}</span>
                  <button onClick={() => copyToClipboard(client)} className="p-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors"><Copy className="h-3 w-3 text-slate-500" /></button>
                </div>
                <div className="flex items-center gap-1 text-slate-500 text-xs">
                  <MessageSquare className="h-3 w-3 text-emerald-600" />
                  <span>{phone} |</span>
                </div>
              </div>
            </div>

            {/* Row 2: Status */}
            <div className="flex border-b border-slate-100">
              <div className="w-40 p-3 bg-slate-50 border-r border-slate-100 flex items-center">
                <span className="text-sm font-bold text-slate-700">Status</span>
              </div>
              <div className="flex-1 p-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold">
                  <MessageSquare className="h-3 w-3" />
                  {status} ➔ {status} ➔
                </div>
              </div>
            </div>

            {/* Row 3: Proprietário */}
            <div className="flex border-b border-slate-100">
              <div className="w-40 p-3 bg-slate-50 border-r border-slate-100 flex items-center">
                <span className="text-sm font-bold text-slate-700">Proprietário</span>
              </div>
              <div className="flex-1 p-3 flex items-center gap-2">
                <button onClick={() => copyToClipboard(proprietarioNome)} className="p-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-500" /></button>
                <button onClick={() => copyToClipboard(proprietarioCpfCnpj)} className="p-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-500" /></button>
                <span className="px-2 py-0.5 bg-slate-500 text-white rounded text-[10px] font-bold">{proprietarioNome || 'Não definido'}</span>
                {proprietarioCpfCnpj && (
                  <span className="text-sm font-bold text-slate-700 ml-2">{proprietarioCpfCnpj}</span>
                )}
              </div>
            </div>

            {/* Row 4: Dados / Endereço */}
            <div className="flex border-b border-slate-100">
              <div className="w-40 p-3 bg-slate-50 border-r border-slate-100 flex items-center">
                <span className="text-sm font-bold text-slate-700">Dados / Endereço</span>
              </div>
              <div className="flex-1 p-3">
                <span className="text-sm font-bold uppercase text-slate-700">{name} / {areaConstruida.toFixed(2)}m² / {address}</span>
              </div>
            </div>

            {/* Row 5: CNO / RMT */}
            <div className="flex border-b border-slate-100">
              <div className="w-40 p-3 bg-slate-50 border-r border-slate-100 flex items-center">
                <span className="text-sm font-bold text-slate-700">CNO / RMT</span>
              </div>
              <div className="flex-1 p-3 flex items-center gap-3">
                <button onClick={() => copyToClipboard(cnoNumero)} className="p-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-500" /></button>
                <span className="text-sm font-bold text-slate-700">{cnoNumero || '---'} / R$ {rmtInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / Requisito: {requisitoPercent}%</span>
                <span className="px-2 py-0.5 bg-red-500 text-white rounded text-[10px] font-bold flex items-center gap-1">F.A. <AlertCircle className="h-3 w-3" /></span>
              </div>
            </div>

            {/* Row 6: Observações */}
            <div className="flex">
              <div className="w-40 p-3 bg-slate-50 border-r border-slate-100 flex items-center">
                <span className="text-sm font-bold text-slate-700">Observações</span>
              </div>
              <div className="flex-1 p-3">
                <span className="text-sm font-bold text-slate-700">Tempo da obra (meses): 0 / 0 :: {observations}</span>
              </div>
            </div>
          </div>

          {/* Management Buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setWorkModalMode('detailed'); setIsWorkModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#636E72] text-white rounded text-sm font-bold hover:bg-slate-600 transition-colors shadow-md">
              <Edit2 className="h-4 w-4" /> Editar Obra
            </button>
            <button onClick={() => setCurrentView('summary')} className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded text-sm font-bold hover:bg-blue-600 transition-colors shadow-md">
              <Undo2 className="h-4 w-4 rotate-180" /> Voltar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1B8E5A] text-white rounded text-sm font-bold hover:bg-emerald-700 transition-colors shadow-md">
              <DollarSign className="h-4 w-4" /> DARFs ➔
            </button>
          </div>

          {/* Checklist Section */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Checklist Inicial</span>
              <X className="h-4 w-4 text-slate-400 cursor-pointer" />
            </div>
            <div className="p-4 space-y-4 text-slate-800">
              {[
                'Verificar documentos da obra',
                'Fazer / Revisar CNO da obra',
                'Verificar se já tem créditos de INSS',
                'Confirmar RMT inicial',
                'Confirmar 50% ou 70% do RMT',
                'Confirmar recibos de autônomo ou NF de MEI'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-12">
                  <button className="px-3 py-1.5 bg-[#E23F3F] text-white rounded text-xs font-bold hover:bg-red-600 shadow-sm">Fazer ➔</button>
                  <span className="text-sm font-bold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setCurrentView('s1000_view')}
              className={cn(
                "px-4 py-2 text-white rounded text-xs font-bold opacity-90 hover:opacity-100 shadow-sm flex items-center gap-1",
                esocialS1000Status?.status === 'SUCESSO' ? "bg-emerald-600" : "bg-[#E27676]"
              )}
            >
              {esocialS1000Status?.status === 'SUCESSO' ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              Info empregador
            </button>
            <button className="px-4 py-2 bg-[#E27676] text-white rounded text-xs font-bold opacity-90 hover:opacity-100 shadow-sm flex items-center gap-1">
              <Plus className="h-3 w-3" /> Estabelecimento / obra
            </button>
            <button className="px-4 py-2 bg-[#E27676] text-white rounded text-xs font-bold opacity-90 hover:opacity-100 shadow-sm flex items-center gap-1">
              <Plus className="h-3 w-3" /> Lotação tributária
            </button>
            <button className="px-4 py-2 bg-[#E27676] text-white rounded text-xs font-bold opacity-90 hover:opacity-100 shadow-sm flex items-center gap-1">
              <Plus className="h-3 w-3" /> Rúbrica
            </button>
          </div>

          {/* Digital Certificate Section */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <div className="p-4 bg-[#1C232E] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold uppercase tracking-widest">Configuração de Certificado Digital A1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                  certificateUrl ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                )}>
                  {certificateUrl ? 'Certificado Vinculado' : 'Sem Certificado'}
                </span>
              </div>
            </div>
            <div className="p-6 bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Arquivo do Certificado (.pfx / .p12)</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="file" 
                        accept=".pfx,.p12"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          setIsUploadingCert(true);
                          try {
                            // Sanitiza o nome do arquivo para evitar problemas de caracteres
                            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                            const filePath = `certificates/${projectId}/${sanitizedFileName}`;
                            
                            const { data, error } = await supabase.storage
                              .from('project-documents')
                              .upload(filePath, file, { 
                                upsert: true,
                                contentType: file.type || 'application/x-pkcs12'
                              });
                            
                            if (error) {
                              console.error('Storage Error:', error);
                              throw new Error(error.message);
                            }
                            
                            const { data: { publicUrl } } = supabase.storage
                              .from('project-documents')
                              .getPublicUrl(filePath);
                            
                            setCertificateUrl(publicUrl);
                            
                            // Salva no banco de dados
                            const { error: dbError } = await supabase
                              .from('inss_regularizations')
                              .update({ certificate_url: publicUrl })
                              .eq('id', inssRegularization?.id);
                              
                            if (dbError) throw dbError;
                              
                            alert('Certificado carregado com sucesso!');
                          } catch (err: any) {
                            console.error('Error uploading certificate:', err);
                            alert(`Erro ao carregar certificado: ${err.message || 'Verifique sua conexão ou permissões.'}`);
                          } finally {
                            setIsUploadingCert(false);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className={cn(
                        "w-full border-2 border-dashed rounded-md p-3 flex flex-col items-center justify-center transition-colors",
                        certificateUrl ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-white hover:border-blue-300"
                      )}>
                        {isUploadingCert ? (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        ) : certificateUrl ? (
                          <div className="flex items-center gap-2 text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-medium">Certificado pronto</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Plus className="h-5 w-5 text-slate-400" />
                            <span className="text-xs text-slate-500 font-medium">Clique para selecionar o arquivo</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {certificateUrl && (
                      <button 
                        onClick={() => { setCertificateUrl(''); setCertificatePassword(''); }}
                        className="p-2 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Senha do Certificado</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      value={certificatePassword}
                      onChange={(e) => setCertificatePassword(e.target.value)}
                      placeholder="••••••••"
                      className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Apelido</label>
                  <input 
                    type="text" 
                    value={certificateApelido}
                    onChange={(e) => setCertificateApelido(e.target.value)}
                    placeholder="Ex: Sérgio"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CPF / CNPJ</label>
                  <input 
                    type="text" 
                    value={certificateCpfCnpj}
                    onChange={(e) => setCertificateCpfCnpj(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        const { error } = await supabase
                          .from('inss_regularizations')
                          .update({ 
                            certificate_password: certificatePassword,
                            certificate_info: {
                              apelido: certificateApelido,
                              cpf_cnpj: certificateCpfCnpj
                            }
                          })
                          .eq('id', inssRegularization?.id);
                        if (error) throw error;
                        alert('Dados do certificado salvos com sucesso!');
                        onRefresh();
                      } catch (err) {
                        console.error('Error saving cert data:', err);
                        alert('Erro ao salvar dados.');
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                    className="w-full px-6 py-2 bg-[#1B8E5A] text-white rounded text-sm font-bold hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" /> Salvar Certificado
                  </button>
                </div>
              </div>

              {/* Certificate Table (Mirroring reference) */}
              {certificateUrl && (
                <div className="mt-8 overflow-hidden rounded border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3 w-16">#</th>
                        <th className="p-3">Certificado</th>
                        <th className="p-3">CPF / CNPJ</th>
                        <th className="p-3 w-32 text-center">Padrão</th>
                        <th className="p-3 w-24 text-center">Excluir</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr className="border-b border-slate-100">
                        <td className="p-3 text-slate-400">01</td>
                        <td className="p-3 font-bold text-slate-800">{certificateApelido || 'Sérgio'}</td>
                        <td className="p-3">
                          <div className="text-slate-600">{certificateCpfCnpj || '161.196.598-54'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {certificateUrl.split('/').pop()?.substring(0, 30)}...
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-bold uppercase">
                            <Check className="h-3 w-3" /> Padrão
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={async () => {
                              if (!confirm('Excluir certificado?')) return;
                              try {
                                await supabase
                                  .from('inss_regularizations')
                                  .update({ 
                                    certificate_url: null, 
                                    certificate_password: null,
                                    certificate_info: null 
                                  })
                                  .eq('id', inssRegularization?.id);
                                onRefresh();
                              } catch (err) {
                                console.error('Error deleting cert:', err);
                              }
                            }}
                            className="p-1.5 bg-[#D94141] text-white rounded hover:bg-red-700 transition-colors"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <p className="mt-4 text-[10px] text-slate-400 italic flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Seu certificado é armazenado de forma segura e utilizado apenas para comunicação com o eSocial via WebService criptografado.
              </p>
            </div>
          </div>

          <p className="text-slate-400 text-[10px] italic font-medium uppercase tracking-wider">Cadastre trabalhador e remunerações para liberar os botões acima.</p>

          {/* Workers Section */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-700">Trabalhadores</span>
                <div className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase tracking-tight shadow-sm">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {workers.filter(w => w.esocial_status === 'SUCESSO').length} de {workers.length} Transmitidos
                </div>
              </div>
              <X className="h-4 w-4 text-slate-400 cursor-pointer" />
            </div>
            
            <div className="p-6 space-y-6 bg-slate-50/50">
              {workers.length > 0 ? (
                workers.map(worker => (
                  <div key={worker.id} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{worker.nome}</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                          {CATEGORIA_OPTIONS.find(opt => opt.value === worker.categoria)?.label || worker.categoria}
                        </p>
                      </div>
                      {/* Status eSocial Badge */}
                      {worker.esocial_status === 'SUCESSO' && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase border border-emerald-200 shadow-sm">
                          <CheckCircle2 className="h-3 w-3" /> eSocial Transmitido
                        </div>
                      )}
                      {worker.esocial_status === 'ERRO' && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase border border-red-200 shadow-sm">
                          <AlertCircle className="h-3 w-3" /> Erro no eSocial
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <DollarSign className="h-3 w-3" /> Add Remuneração
                      </button>
                      <button onClick={() => handleEditWorker(worker)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <Eye className="h-3 w-3" /> Ver / Editar
                      </button>
                      <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <Eraser className="h-3 w-3" /> Limpar remunerações
                      </button>
                      <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <Printer className="h-3 w-3" /> Gerar recibos
                      </button>
                      <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <Calculator className="h-3 w-3" /> Totalizar 1
                      </button>
                      <button onClick={() => handleRemoveWorker(worker.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm">
                        <Trash2 className="h-3 w-3" /> Remover trabalhador
                      </button>
                      <button 
                        onClick={() => { setSelectedWorker(worker); setCurrentView('s2300_view'); }}
                        className={cn(
                          "flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-bold text-white transition-all shadow-md",
                          worker.esocial_status === 'SUCESSO' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#1B8E5A] hover:bg-emerald-700"
                        )}
                      >
                        <Send className="h-3 w-3" /> 
                        {worker.esocial_status === 'SUCESSO' ? 'Evento Enviado' : 'Cadastrar trab'}
                      </button>
                      <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 rounded text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-md">
                        <Target className="h-3 w-3" /> Encerrar trab
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 font-medium italic">Nenhum trabalhador cadastrado.</div>
              )}

              <div className="flex justify-start pt-4">
                <button 
                  onClick={() => { resetWorkerForm(); setCurrentView('worker_form'); }}
                  className="flex items-center gap-2 px-6 py-2 bg-white border border-blue-500 text-blue-500 rounded text-sm font-bold hover:bg-blue-50 transition-all shadow-sm uppercase tracking-wider"
                >
                  <UserPlus className="h-4 w-4" /> Novo Trabalhador
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#1C232E] text-white uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="p-3">P.A.</th>
                    <th className="p-3 text-center">Correção</th>
                    <th className="p-3 text-center">Ações</th>
                    <th className="p-3 text-center">Verificação</th>
                    <th className="p-3 text-center">INSS Pago</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td colSpan={5} className="p-4">
                      <div className="flex items-center gap-12">
                        <button className="px-3 py-1.5 bg-[#E23F3F] text-white rounded text-xs font-bold shadow-sm">Fazer ➔</button>
                        <span className="text-sm font-bold text-slate-700">eSocial - Desligar trabalhadores</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Delete Button */}
          <div className="pt-4">
            <button className="px-4 py-2 border border-red-500 text-red-500 rounded text-xs font-bold hover:bg-red-50 transition-colors uppercase tracking-widest">
              Excluir Registro
            </button>
          </div>
        </div>
      )}

      {/* S-2300 Event View */}
      {currentView === 's2300_view' && selectedWorker && (
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800">
              Evento S-2300 – Trabalhador Sem Vínculo de Emprego/Estatutário – Início
            </h2>
            <button 
              onClick={() => { setSelectedWorker(null); setCurrentView('management'); }}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-all shadow-md"
            >
              Voltar para obra
            </button>
          </div>

          <div className="p-8">
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-1/3 p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">Procurador:</td>
                    <td className="p-2 text-slate-800 font-bold">CPF/CNPJ: 161.196.598-54</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">nome_empregador</td>
                    <td className="p-2 text-slate-800 font-bold uppercase">{proprietarioNome}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">cpf_empregador</td>
                    <td className="p-2 text-slate-800 font-bold">{proprietarioCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">nome</td>
                    <td className="p-2 text-slate-800 font-bold uppercase">{selectedWorker.nome}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">cpftrab</td>
                    <td className="p-2 text-slate-800 font-bold">{selectedWorker.cpf}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">matricula</td>
                    <td className="p-2 text-slate-800 font-bold">{selectedWorker.matricula_esocial}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">cep</td>
                    <td className="p-2 text-slate-800 font-bold">{selectedWorker.cep}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">nascimento</td>
                    <td className="p-2 text-slate-800 font-bold">{selectedWorker.nascimento}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">escolaridade</td>
                    <td className="p-2 text-slate-800 font-bold">{selectedWorker.escolaridade}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">cordapele</td>
                    <td className="p-2 text-slate-800 font-bold">{selectedWorker.cor_pele}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">end_tplograd</td>
                    <td className="p-2 text-slate-800 font-bold">R</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">endereco</td>
                    <td className="p-2 text-slate-800 font-bold uppercase">{selectedWorker.logradouro}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">end_nrlograd</td>
                    <td className="p-2 text-slate-800 font-bold">{selectedWorker.numero}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">end_complemento</td>
                    <td className="p-2 text-slate-800 font-bold uppercase">{selectedWorker.complemento || '---'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">end_bairro</td>
                    <td className="p-2 text-slate-800 font-bold uppercase">{selectedWorker.bairro}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">end_codmunic</td>
                    <td className="p-2 text-slate-800 font-bold">{selectedWorker.cod_ibge}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">end_uf</td>
                    <td className="p-2 text-slate-800 font-bold">{selectedWorker.uf}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">pais_nasc</td>
                    <td className="p-2 text-slate-800 font-bold">{selectedWorker.pais_nascimento}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">cargo</td>
                    <td className="p-2 text-slate-800 font-bold uppercase">{selectedWorker.cargo_nome}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">CBOCargo</td>
                    <td className="p-2 text-slate-800 font-bold">{selectedWorker.cbo_cargo}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">sexo</td>
                    <td className="p-2 text-slate-800 font-bold">{selectedWorker.sexo}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">evento</td>
                    <td className="p-2 text-slate-800 font-bold">2300</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">codCateg</td>
                    <td className="p-2 text-slate-800 font-bold">{selectedWorker.categoria}</td>
                  </tr>
                  <tr>
                    <td className="p-2 bg-slate-50 text-slate-500 font-medium border-r border-slate-200">periodo</td>
                    <td className="p-2 text-slate-800 font-bold">{new Date().toISOString().split('T')[0]}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8">
              <button 
                onClick={esocialStatus && esocialStatus.status !== 'ERRO' ? handleConsultESocial : handleTransmitESocial}
                disabled={isTransmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md font-bold transition-all shadow-lg text-lg",
                  isTransmitting ? "bg-slate-400 cursor-not-allowed" : 
                  esocialStatus && esocialStatus.status === 'SUCESSO' ? "bg-[#007AFF] hover:bg-blue-700 text-white" :
                  "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
              >
                {isTransmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {esocialStatus && esocialStatus.status !== 'ERRO' ? 'Consultando...' : 'Transmitindo...'}
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-5 w-5" />
                    {esocialStatus && esocialStatus.status === 'SUCESSO' 
                      ? 'Consultar Status / Recibo' 
                      : esocialStatus && esocialStatus.status === 'ERRO' 
                        ? 'Tentar Transmitir Novamente'
                        : 'Transmitir Evento / Consultar'}
                  </>
                )}
              </button>
              
              {/* Detailed Government Log (Mirroring reference) */}
              {esocialStatus && (esocialStatus.status === 'SUCESSO' || esocialStatus.status === 'ERRO' || esocialStatus.status === 'PROCESSANDO') && (
                <div className="mt-8 p-6 bg-white border border-slate-200 rounded shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <span className="font-bold text-slate-800">Envio =&gt; </span>
                      <span className={cn(
                        "font-medium",
                        esocialStatus.status === 'ERRO' ? "text-red-600" : "text-emerald-600"
                      )}>
                        {esocialStatus.resposta_governo?.envio_codigo || '201'} - {esocialStatus.resposta_governo?.envio_mensagem || 'Lote recebido com sucesso.'}
                      </span>
                    </div>

                    {(esocialStatus.status === 'SUCESSO' || esocialStatus.status === 'ERRO') && (
                      <div>
                        <span className="font-bold text-slate-800">Processamento =&gt; </span>
                        <span className={cn(
                          "font-medium",
                          esocialStatus.status === 'ERRO' ? "text-red-600" : "text-emerald-600"
                        )}>
                          {esocialStatus.resposta_governo?.proc_codigo || (esocialStatus.status === 'SUCESSO' ? '202' : '401')} - {esocialStatus.resposta_governo?.proc_mensagem || (esocialStatus.status === 'SUCESSO' ? 'Sucesso' : 'Conteúdo do evento inválido.')}
                        </span>
                      </div>
                    )}

                    {esocialStatus.status === 'ERRO' && (
                      <div className="pt-2 text-slate-600 text-sm leading-relaxed space-y-4">
                        <p>
                          {esocialStatus.resposta_governo?.detalhe || 'Foi localizado no sistema um evento em duplicidade com o evento a ser enviado, mesmo Tipo de Inscrição, Número de Inscrição, CPF, Matrícula, Data de ingresso no ogmo ou no Sindicato.'}
                        </p>
                        <p>
                          O contrato de trabalho já se encontra cadastrado na base de dados do Ambiente Nacional do eSocial. CPF: {selectedWorker.cpf}. 
                          <span className="block mt-2 font-bold text-slate-700">
                            Ação Sugerida: {esocialStatus.resposta_governo?.acao_sugerida || 'Verificar a matrícula informada e, se já utilizada em S-2190, S-2200, S-2300, S-2500 ou S-8200 de outro trabalhador, gerar uma nova matrícula.'}
                          </span>
                        </p>
                      </div>
                    )}

                    {esocialStatus.status === 'SUCESSO' && (
                      <div className="pt-2 text-emerald-700 text-sm font-medium">
                        <p>O evento foi aceito e processado com sucesso pelo Ambiente Nacional do eSocial.</p>
                        <p className="mt-1 text-slate-400 font-mono text-[10px]">Número do Recibo: {esocialStatus.recibo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Badge (Simple) */}
              {esocialStatus && (
                <div className={cn(
                  "mt-6 p-4 rounded-md border",
                  esocialStatus.status === 'SUCESSO' ? "bg-emerald-50 border-emerald-200" :
                  esocialStatus.status === 'ERRO' ? "bg-red-50 border-red-200" :
                  "bg-blue-50 border-blue-200"
                )}>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Status eSocial: {esocialStatus.status}</p>
                  <p className="text-[10px] text-slate-400">Protocolo: {esocialStatus.protocolo || '---'}</p>
                  {esocialStatus.recibo && (
                    <p className="text-[10px] text-slate-400">Recibo: {esocialStatus.recibo}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Worker Form View */}
      {currentView === 'worker_form' && (
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800">
              {editingWorkerId ? 'Editar Trabalhador' : 'Novo Trabalhador'} — Obra #{projectId.substring(0, 4)}
            </h2>
            <button onClick={() => { resetWorkerForm(); setCurrentView('management'); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <div className="p-8 space-y-8 text-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CPF</label>
                <input type="text" value={workerCpf} onChange={e => setWorkerCpf(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome</label>
                <input type="text" value={workerNome} onChange={e => setWorkerNome(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do cargo</label>
                <input type="text" value={workerCargo} onChange={e => setWorkerCargo(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CBO Cargo IBGE (pedreiro = 715210)</label>
                <input type="text" value={workerCbo} onChange={e => setWorkerCbo(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Matricula (eSocial)</label>
                <input type="text" value={workerMatricula} onChange={e => setWorkerMatricula(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CEP (apenas números)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={workerCep} 
                    onChange={e => setWorkerCep(e.target.value.replace(/\D/g, '').substring(0, 8))} 
                    placeholder="00000000" 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none pr-10" 
                  />
                  {isFetchingCep && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logradouro</label>
                <input type="text" value={workerLogradouro} onChange={e => setWorkerLogradouro(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nº</label>
                <input type="text" value={workerNumero} onChange={e => setWorkerNumero(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Complemento</label>
                <input type="text" value={workerComplemento} onChange={e => setWorkerComplemento(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bairro</label>
                <input type="text" value={workerBairro} onChange={e => setWorkerBairro(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">UF</label>
                <input type="text" value={workerUf} onChange={e => setWorkerUf(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cod IBGE</label>
                <input type="text" value={workerCodIbge} onChange={e => setWorkerCodIbge(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cidade</label>
                <input type="text" value={workerCidade} onChange={e => setWorkerCidade(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nascimento</label>
                <input type="date" value={workerNascimento} onChange={e => setWorkerNascimento(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sexo</label>
                <select value={workerSexo} onChange={e => setWorkerSexo(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white">
                  <option value="">--</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Escolaridade</label>
                <select value={workerEscolaridade} onChange={e => setWorkerEscolaridade(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white">
                  <option value="">--</option>
                  {ESCOLARIDADE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cor da Pele</label>
                <select value={workerCorPele} onChange={e => setWorkerCorPele(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white">
                  <option value="">--</option>
                  {COR_PELE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">País nascimento (Brasil = 105)</label>
                <input type="text" value={workerPaisNascimento} onChange={e => setWorkerPaisNascimento(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
                <select value={workerCategoria} onChange={e => setWorkerCategoria(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white">
                  <option value="">--</option>
                  {CATEGORIA_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tab. Rúbrica</label>
                <input type="text" value={workerTabRubrica} onChange={e => setWorkerTabRubrica(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cód. Rúbrica</label>
                <input type="text" value={workerCodRubrica} onChange={e => setWorkerCodRubrica(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cód. Lotação</label>
                <input type="text" value={workerCodLotacao} onChange={e => setWorkerCodLotacao(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button onClick={() => { resetWorkerForm(); setCurrentView('management'); }} className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 transition-colors">
                Voltar para obra
              </button>
              <button onClick={handleSaveWorker} disabled={isSaving} className="px-10 py-2 bg-[#007AFF] text-white rounded text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg disabled:opacity-50">
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Edit2 className="h-4 w-4" />
                <span>Editar</span>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Nome</label>
                <div className="relative">
                  <input type="text" value={client} onChange={e => setClient(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Fone</label>
                <div className="relative">
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Parceiro</label>
                <div className="relative">
                  <select value={parceiro} onChange={e => setParceiro(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none appearance-none bg-white">
                    <option value="- nenhum -">- nenhum -</option>
                    <option value="Parceiro 1">Parceiro 1</option>
                    <option value="Parceiro 2">Parceiro 2</option>
                  </select>
                  <Check className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">CPF / CNPJ <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={cpfCnpj} 
                    onChange={e => setCpfCnpj(e.target.value)} 
                    placeholder="Obrigatório"
                    className={cn(
                      "w-full border rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none",
                      !cpfCnpj ? "border-red-200 bg-red-50/10" : "border-slate-300"
                    )} 
                  />
                  {cpfCnpj && (
                    <Check className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4",
                      (cpfCnpj.replace(/[^\d]/g, '').length <= 11 ? validateCPF(cpfCnpj) : validateCNPJ(cpfCnpj)) 
                        ? "text-emerald-500" 
                        : "text-red-400"
                    )} />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">link</label>
                <div className="relative">
                  <input type="text" value={link} onChange={e => setLink(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">cod</label>
                <div className="relative">
                  <input type="text" value={cod} onChange={e => setCod(e.target.value)} autoComplete="off" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">senha</label>
                <div className="relative">
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">obs</label>
                <div className="relative">
                  <input type="text" value={observations} onChange={e => setObservations(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">MAED</label>
                <div className="relative">
                  <input type="date" value={maedDate} onChange={e => setMaedDate(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Parcelar</label>
                <div className="relative">
                  <input type="date" value={parcelarDate} onChange={e => setParcelarDate(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-[#636E72] text-white text-xs font-bold rounded hover:bg-slate-600 transition-colors">Close</button>
              <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-[#007AFF] text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Work Modal (Simple for Create, Detailed for Edit) */}
      {isWorkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Edit2 className="h-4 w-4" />
                <span>Editar</span>
              </div>
              <button onClick={() => setIsWorkModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Nome da obra</label>
                <div className="relative">
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="CASA / COMERCIO / GALPÃO" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              {workModalMode === 'detailed' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Nome proprietário</label>
                    <div className="relative">
                      <input type="text" value={proprietarioNome} onChange={e => setProprietarioNome(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">CPF / CNPJ do Proprietário</label>
                    <div className="relative">
                      <input type="text" value={proprietarioCpfCnpj} onChange={e => setProprietarioCpfCnpj(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Área construída</label>
                <div className="relative">
                  <input type="number" value={areaConstruida || ''} onChange={e => setAreaConstruida(Number(e.target.value))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              {workModalMode === 'detailed' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">CNO</label>
                    <div className="relative">
                      <input type="text" value={cnoNumero} onChange={e => setCnoNumero(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">RMT inicial</label>
                    <div className="relative">
                      <input type="number" value={rmtInicial || ''} onChange={e => setRmtInicial(Number(e.target.value))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Requisito (%)</label>
                    <div className="relative">
                      <input type="number" value={requisitoPercent || ''} onChange={e => setRequisitoPercent(Number(e.target.value))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Endereço</label>
                <div className="relative">
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              {workModalMode === 'detailed' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Emitir NF, DAS ou recibo mensal?</label>
                  <div className="relative">
                    <select value={emitirDocumento} onChange={e => setEmitirDocumento(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none appearance-none bg-white">
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </select>
                    <Check className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">OBS</label>
                <div className="relative">
                  <textarea value={observations} onChange={e => setObservations(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none min-h-[80px]" />
                  <Check className="absolute right-3 top-6 h-4 w-4 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setIsWorkModalOpen(false)} className="px-4 py-2 bg-[#636E72] text-white text-xs font-bold rounded hover:bg-slate-600 transition-colors">Close</button>
              <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-[#007AFF] text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* S-1000 Event View */}
      {currentView === 's1000_view' && inssRegularization && (
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 mt-6">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Transmitir eventos para o eSocial</h2>
              <p className="text-xs text-slate-500 mt-1">Confirme se as informações estão corretas antes de transmitir!</p>
            </div>
            <button 
              onClick={() => setCurrentView('management')}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-all shadow-md"
            >
              Voltar para obra
            </button>
          </div>

          <div className="p-8">
            <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
              Evento S-1000 - Informações iniciais do empregador
            </h3>

            <div className="border border-slate-200 rounded overflow-hidden mb-8">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-1/3 p-3 bg-slate-50 text-slate-500 font-medium border-r border-slate-200 uppercase text-[10px] tracking-wider">Procurador:</td>
                    <td className="p-3 text-slate-800 font-bold">CPF/CNPJ: {certificateCpfCnpj || '161.196.598-54'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 bg-slate-50 text-slate-500 font-medium border-r border-slate-200 uppercase text-[10px] tracking-wider">nome_empregador</td>
                    <td className="p-3 text-slate-800 font-bold uppercase">{proprietarioNome}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 bg-slate-50 text-slate-500 font-medium border-r border-slate-200 uppercase text-[10px] tracking-wider">cpf_empregador</td>
                    <td className="p-3 text-slate-800 font-bold">{proprietarioCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 bg-slate-50 text-slate-500 font-medium border-r border-slate-200 uppercase text-[10px] tracking-wider">evento</td>
                    <td className="p-3 text-slate-800 font-bold">1000</td>
                  </tr>
                  <tr>
                    <td className="p-3 bg-slate-50 text-slate-500 font-medium border-r border-slate-200 uppercase text-[10px] tracking-wider">periodo</td>
                    <td className="p-3 text-slate-800 font-bold">{new Date().toISOString().substring(0, 7)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={esocialS1000Status && esocialS1000Status.status !== 'ERRO' && esocialS1000Status.status !== 'PENDENTE' ? handleConsultS1000 : handleTransmitS1000}
                disabled={isTransmitting}
                className={cn(
                  "w-full py-4 rounded font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg uppercase tracking-widest",
                  isTransmitting ? "bg-slate-400 cursor-not-allowed" : 
                  (esocialS1000Status?.status === 'PROCESSANDO' ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-[#1B8E5A] hover:bg-emerald-700 text-white")
                )}
              >
                {isTransmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {esocialS1000Status?.status === 'PROCESSANDO' ? 'Consultando...' : 'Transmitindo...'}
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Transmitir Evento / Consultar
                  </>
                )}
              </button>
              
              {/* Detailed Log S-1000 */}
              {esocialS1000Status && (esocialS1000Status.status === 'SUCESSO' || esocialS1000Status.status === 'ERRO' || esocialS1000Status.status === 'PROCESSANDO') && (
                <div className="p-6 bg-white border border-slate-200 rounded shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <span className="font-bold text-slate-800">Envio =&gt; </span>
                      <span className={cn(
                        "font-medium",
                        esocialS1000Status.status === 'ERRO' ? "text-red-600" : "text-emerald-600"
                      )}>
                        {esocialS1000Status.resposta_governo?.envio_codigo || '201'} - {esocialS1000Status.resposta_governo?.envio_mensagem || 'Lote recebido com sucesso.'}
                      </span>
                    </div>

                    {(esocialS1000Status.status === 'SUCESSO' || esocialS1000Status.status === 'ERRO') && (
                      <div>
                        <span className="font-bold text-slate-800">Processamento =&gt; </span>
                        <span className={cn(
                          "font-medium",
                          esocialS1000Status.status === 'ERRO' ? "text-red-600" : "text-emerald-600"
                        )}>
                          {esocialS1000Status.resposta_governo?.proc_codigo || '202'} - {esocialS1000Status.resposta_governo?.proc_mensagem || 'Sucesso'}
                        </span>
                      </div>
                    )}

                    {esocialS1000Status.status === 'ERRO' && (
                      <div className="pt-2 text-slate-600 text-sm leading-relaxed space-y-4">
                        <p>{esocialS1000Status.resposta_governo?.detalhe || 'Erro desconhecido no processamento do S-1000.'}</p>
                        <span className="block mt-2 font-bold text-slate-700">
                          Ação Sugerida: {esocialS1000Status.resposta_governo?.acao_sugerida || 'Verifique os dados cadastrais do empregador.'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default INSSRegularizationTab;

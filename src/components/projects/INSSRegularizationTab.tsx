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
  ExternalLink,
  Info,
  Calendar,
  ChevronDown,
  Lock,
  Wallet,
  History,
  Building2,
  RefreshCw
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
  esocial_status?: 'PENDENTE' | 'ENVIADO' | 'PROCESSANDO' | 'SUCESSO' | 'ERRO';
  protocolo?: string;
  recibo?: string;
  resposta_governo?: any;
  s2399_status?: 'PENDENTE' | 'ENVIADO' | 'PROCESSANDO' | 'SUCESSO' | 'ERRO';
  s2399_protocolo?: string;
  s2399_recibo?: string;
  s2399_resposta_governo?: any;
  s2399_date?: string;
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


// FUNÇÃO PROXY LOCAL PARA MTLS NO NODE.JS
async function invokeProxy(options: any) {
  try {
    const response = await fetch('http://localhost:3005/esocial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options.body)
    });
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export function INSSRegularizationTab({ projectId, inssRegularization, onRefresh, readOnly, isStandalone }: INSSRegularizationTabProps) {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'summary' | 'management' | 'worker_form' | 's2300_view' | 's1200_view' | 's1210_view' | 's1298_view' | 's1000_view' | 's1005_view' | 's1010_view' | 's1020_view' | 's2399_view'>(() => {
    return (sessionStorage.getItem(`currentRegularizationView_${projectId}`) as any) || 'summary';
  });

  useEffect(() => {
    sessionStorage.setItem(`currentRegularizationView_${projectId}`, currentView);
  }, [currentView, projectId]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [workModalMode, setWorkModalMode] = useState<'simple' | 'detailed'>('simple');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(() => {
    return sessionStorage.getItem(`selectedWorkerId_${projectId}`);
  });

  useEffect(() => {
    if (selectedWorkerId) {
      sessionStorage.setItem(`selectedWorkerId_${projectId}`, selectedWorkerId);
    } else {
      sessionStorage.removeItem(`selectedWorkerId_${projectId}`);
    }
  }, [selectedWorkerId, projectId]);

  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Sincroniza selectedWorker quando a lista de workers carrega ou o ID muda
  useEffect(() => {
    if (selectedWorkerId && workers.length > 0) {
      const worker = workers.find(w => w.id === selectedWorkerId);
      if (worker) {
        setSelectedWorker(worker);
      }
    }
  }, [selectedWorkerId, workers]);

  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);

  // Fallback de segurança: Se a view exige um worker mas ele sumiu (refresh), volta para gestão
  useEffect(() => {
    const viewsRequiringWorker = ['s2300_view', 's2399_view', 'worker_form'];
    if (viewsRequiringWorker.includes(currentView) && !selectedWorkerId && !editingWorkerId) {
      setCurrentView('management');
    }
  }, [currentView, selectedWorkerId, editingWorkerId]);
  
  // Form State - Client
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
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
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Form State - Work
  const [address, setAddress] = useState('');
  const [areaConstruida, setAreaConstruida] = useState(0);
  const [proprietarioNome, setProprietarioNome] = useState('');
  const [proprietarioCpfCnpj, setProprietarioCpfCnpj] = useState('');
  const [cnoNumero, setCnoNumero] = useState('');
  const [rmtInicial, setRmtInicial] = useState(0);
  const [requisitoPercent, setRequisitoPercent] = useState(0);
  const [emitirDocumento, setEmitirDocumento] = useState('Não');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoria, setCategoria] = useState('');

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
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [esocialCredentials, setEsocialCredentials] = useState<any>(null);
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

  const [esocialS1005Status, setEsocialS1005Status] = useState<{
    id?: string;
    status: 'PENDENTE' | 'ENVIADO' | 'PROCESSANDO' | 'SUCESSO' | 'ERRO';
    protocolo?: string;
    recibo?: string;
    tipo_evento: string;
    resposta_governo?: any;
  } | null>(null);

  const [esocialS1020Status, setEsocialS1020Status] = useState<{
    id?: string;
    status: 'PENDENTE' | 'ENVIADO' | 'PROCESSANDO' | 'SUCESSO' | 'ERRO';
    protocolo?: string;
    recibo?: string;
    tipo_evento: string;
    resposta_governo?: any;
  } | null>(null);

  const [esocialS1010Status, setEsocialS1010Status] = useState<{
    id?: string;
    status: 'PENDENTE' | 'ENVIADO' | 'PROCESSANDO' | 'SUCESSO' | 'ERRO';
    protocolo?: string;
    recibo?: string;
    tipo_evento: string;
    resposta_governo?: any;
  } | null>(null);

  const [isRubricaModalOpen, setIsRubricaModalOpen] = useState(false);
  const [codRubrica, setCodRubrica] = useState('200');
  const [tabRubrica, setTabRubrica] = useState('200');
  const [descRubrica, setDescRubrica] = useState('Prestação de serviço de trabalhador sem vínculo empregatício');
  const [incidPrev, setIncidPrev] = useState('13');
  const [incidIrrf, setIncidIrrf] = useState('11');

  const [isLotacaoModalOpen, setIsLotacaoModalOpen] = useState(false);

  // Remuneration Modal State
  const [isRemunerationModalOpen, setIsRemunerationModalOpen] = useState(false);
  const [remValue, setRemValue] = useState('1800,00');
  const [remStartMonth, setRemStartMonth] = useState('3');
  const [remStartYear, setRemStartYear] = useState('2026');
  const [remEndMonth, setRemEndMonth] = useState('11');
  const [remEndYear, setRemEndYear] = useState('2026');
  const [targetWorkerForRem, setTargetWorkerForRem] = useState<any>(null);
  const [selectedRemForEvent, setSelectedRemForEvent] = useState<any>(null);
  const [selectedPeriodForEvent, setSelectedPeriodForEvent] = useState<string | null>(null);
  const [periodStatuses, setPeriodStatuses] = useState<Record<string, any>>({});
  const [checklistData, setChecklistData] = useState<Record<string, string>>({});
  const [allRemunerations, setAllRemunerations] = useState<any[]>(() => {
    const saved = localStorage.getItem(`remunerations_${projectId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Save remunerations whenever they change
  useEffect(() => {
    localStorage.setItem(`remunerations_${projectId}`, JSON.stringify(allRemunerations));
  }, [allRemunerations, projectId]);

  const handleClearRemunerations = (workerId: string) => {
    if (confirm('Deseja realmente limpar todas as remunerações deste trabalhador?')) {
      setAllRemunerations(prev => prev.filter(r => r.workerId !== workerId));
    }
  };

  const handleOpenRemunerationModal = (worker: any) => {
    setTargetWorkerForRem(worker);
    setIsRemunerationModalOpen(true);
  };

  const handleSaveRemuneration = async () => {
    if (!targetWorkerForRem) return;
    
    setIsSaving(true);
    try {
      const val = parseFloat(remValue.replace('.', '').replace(',', '.'));
      const startM = parseInt(remStartMonth);
      const startY = parseInt(remStartYear);
      const endM = parseInt(remEndMonth);
      const endY = parseInt(remEndYear);

      const newRems = [];
      let currM = startM;
      let currY = startY;

      while (currY < endY || (currY === endY && currM <= endM)) {
        newRems.push({
          id: `${targetWorkerForRem.id}-${currM}-${currY}`,
          workerId: targetWorkerForRem.id,
          workerNome: targetWorkerForRem.nome,
          month: currM,
          year: currY,
          value: val,
          remStatus: 'PENDENTE',
          pagStatus: 'PENDENTE',
          isLocked: true
        });

        currM++;
        if (currM > 12) {
          currM = 1;
          currY++;
        }
      }

      // Merge with existing (updating duplicates)
      const existingMap = new Map(allRemunerations.map(r => [r.id, r]));
      newRems.forEach(r => {
        // If it's already locked and exists, don't overwrite unless we want to allow it
        // User said "travar os dados mensais", so we set locked: true
        existingMap.set(r.id, { ...r, isLocked: true });
      });
      
      setAllRemunerations(Array.from(existingMap.values()));
      
      setIsRemunerationModalOpen(false);
      alert(`Remunerações geradas com sucesso para o período!`);
    } catch (err) {
      alert('Erro ao processar valores.');
    } finally {
      setIsSaving(false);
    }
  };

  // Requirement Summary Calculation
  const totalRemuneration = allRemunerations.reduce((sum, rem) => sum + rem.value, 0);
  const targetRequisito = (rmtInicial || 0) * ((requisitoPercent || 50) / 100);
  const percentCompleted = targetRequisito > 0 ? (totalRemuneration / targetRequisito) * 100 : 0;

  const toggleRemStatus = (remId: string, field: 'remStatus' | 'pagStatus') => {
    setAllRemunerations(prev => prev.map(r => {
      if (r.id === remId) {
        const nextStatus = r[field] === 'SUCESSO' ? 'PENDENTE' : 'SUCESSO';
        return { ...r, [field]: nextStatus };
      }
      return r;
    }));
  };
  const [tipoLotacao, setTipoLotacao] = useState('21');
  const [infoFpas, setInfoFpas] = useState('FPAS - 507 / Cod. terceiros - 0079');

  // Helper to get unique PA periods sorted
  const getUniquePAs = () => {
    const pas = new Set<string>();
    allRemunerations.forEach(r => pas.add(`${String(r.month).padStart(2, '0')}-${r.year}`));
    return Array.from(pas).sort((a, b) => {
      const [ma, ya] = a.split('-').map(Number);
      const [mb, yb] = b.split('-').map(Number);
      return ya !== yb ? ya - yb : ma - mb;
    });
  };

  useEffect(() => {
    if (inssRegularization) {
      setName(inssRegularization.name || '');
      setClient(inssRegularization.client || '');
      setPhone(inssRegularization.phone || '');
      setEmail(inssRegularization.email || '');
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
      setChecklistData(inssRegularization.checklist_data || {});
      setCertificateUrl(inssRegularization.certificate_url || '');
      setCertificatePassword(inssRegularization.certificate_password || '');
      setCertificateApelido(inssRegularization.certificate_info?.apelido || '');
      setCertificateCpfCnpj(inssRegularization.certificate_info?.cpf_cnpj || '');
      
      fetchWorkers();
      checkS1000Status();
      checkS1005Status();
      checkS1020Status();
      checkS1010Status();
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
  const renderEventLog = (event: any, tipo: string, cpf?: string) => {
    if (!event || event.status === 'PENDENTE') return null;

    return (
      <div className="mt-6 border border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              event.status === 'SUCESSO' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : 
              event.status === 'ERRO' ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            )} />
            <span className="text-[10px] font-black text-white uppercase tracking-[2px]">Log de Processamento eSocial</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 font-mono">ID: {event.id || 'N/A'}</span>
        </div>
        
        <div className="p-6 bg-[#161B22] space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status do Governo</p>
              <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm",
                event.status === 'SUCESSO' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                event.status === 'ERRO' ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-primary/10 text-primary border border-primary/20"
              )}>
                {event.status === 'SUCESSO' ? <Check className="h-3 w-3" /> : event.status === 'ERRO' ? <X className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
                {event.status}
              </div>
            </div>
            {event.recibo && (
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Número do Recibo</p>
                <p className="text-xs font-black text-white font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 inline-block select-all cursor-copy hover:bg-white/10 transition-all">
                  {event.recibo}
                </p>
              </div>
            )}
            {event.protocolo && (
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocolo de Envio</p>
                <p className="text-xs font-black text-slate-400 font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 inline-block select-all italic">
                  {event.protocolo}
                </p>
              </div>
            )}
          </div>

          {event.resposta_governo && (
            <div className="pt-4 border-t border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Mensagem do Sistema</p>
              <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-slate-300 font-medium leading-relaxed font-mono">
                  {event.resposta_governo.envio_mensagem || event.resposta_governo.message || (event.status === 'SUCESSO' ? 'Evento processado e aceito pelo eSocial.' : 'Aguardando retorno do processamento...')}
                </p>
                {event.resposta_governo.ocorre_mensagem && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Ocorrência eSocial:</p>
                    <p className="text-[11px] text-red-300/80 font-bold">{event.resposta_governo.ocorre_mensagem}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button 
              onClick={() => handleMarkAsDone(tipo, cpf)}
              className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Já foi feito!
            </button>
          </div>
        </div>
      </div>
    );
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

  const checkS1005Status = async () => {
    if (!inssRegularization) return;
    try {
      const { data, error } = await supabase
        .from('esocial_events')
        .select('*')
        .eq('regularization_id', inssRegularization.id)
        .eq('tipo_evento', 'S-1005')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setEsocialS1005Status({
          id: data[0].id,
          status: data[0].status,
          protocolo: data[0].protocolo,
          recibo: data[0].recibo,
          tipo_evento: data[0].tipo_evento,
          resposta_governo: data[0].resposta_governo
        });
      } else {
        setEsocialS1005Status(null);
      }
    } catch (err) {
      console.error('Error checking S-1005 status:', err);
    }
  };

  const checkS1020Status = async () => {
    if (!inssRegularization) return;
    try {
      const { data, error } = await supabase
        .from('esocial_events')
        .select('*')
        .eq('regularization_id', inssRegularization.id)
        .eq('tipo_evento', 'S-1020')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setEsocialS1020Status({
          id: data[0].id,
          status: data[0].status,
          protocolo: data[0].protocolo,
          recibo: data[0].recibo,
          tipo_evento: data[0].tipo_evento,
          resposta_governo: data[0].resposta_governo
        });
      } else {
        setEsocialS1020Status(null);
      }
    } catch (err) {
      console.error('Error checking S-1020 status:', err);
    }
  };

  const checkS1010Status = async () => {
    if (!inssRegularization) return;
    try {
      const { data, error } = await supabase
        .from('esocial_events')
        .select('*')
        .eq('regularization_id', inssRegularization.id)
        .eq('tipo_evento', 'S-1010')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setEsocialS1010Status({
          id: data[0].id,
          status: data[0].status,
          protocolo: data[0].protocolo,
          recibo: data[0].recibo,
          tipo_evento: data[0].tipo_evento,
          resposta_governo: data[0].resposta_governo
        });
      } else {
        setEsocialS1010Status(null);
      }
    } catch (err) {
      console.error('Error checking S-1010 status:', err);
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

      // ETAPA 5, 6, 7 - ASSINATURA E ENVIO (REAL VIA BACKEND)
      const { data: response, error: fnError } = await invokeProxy({
        body: {
          eventType: 'S-2300',
          regularizationId: inssRegularization.id,
          eventData: {
            proprietarioCpfCnpj,
            workerCpf,
            workerNome,
            workerSexo,
            workerCorPele,
            workerEscolaridade,
            workerNascimento,
            workerPaisNascimento,
            workerLogradouro,
            workerNumero,
            workerComplemento,
            workerBairro,
            workerCep,
            workerCodIbge,
            workerUf,
            workerMatricula,
            workerCategoria,
            workerCargo,
            workerCbo,
            transmissorCpfCnpj: certificateCpfCnpj
          }
        }
      });

      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);

      const { protocolo } = response;
      
      alert(`Lote enviado com sucesso! Protocolo: ${protocolo}. O processamento no eSocial pode levar alguns segundos.`);

      // ETAPA 9 - FEEDBACK
      checkEsocialStatus(selectedWorker.cpf);
    } catch (err: any) {
      console.error('Error in eSocial flow:', err);
      const errorMsg = err.message || err.details || 'Erro desconhecido';
      alert(`Erro na integração com o eSocial:\n\n${errorMsg}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleConsultESocial = async () => {
    if (!esocialStatus || isTransmitting || !inssRegularization) return;

    setIsTransmitting(true);
    try {
      // ETAPA 8 - CONSULTA (REAL VIA BACKEND)
      const { data: response, error: fnError } = await invokeProxy({
        body: {
          action: 'CONSULT',
          protocolo: esocialStatus.protocolo,
          regularizationId: inssRegularization.id
        }
      });

      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);
      
      if (response.status === 'SUCESSO') {
        alert('Consulta finalizada! O evento foi processado com SUCESSO.');
        setTimeout(() => {
          setCurrentView('management');
          fetchWorkers();
        }, 1500);
      } else {
        alert('O eSocial retornou erro no processamento. Verifique os detalhes no log.');
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
      const { data: response, error: fnError } = await invokeProxy({
        body: {
          eventType: 'S-1000',
          regularizationId: inssRegularization.id,
          indRetif,
          nrRecibo,
          eventData: {
            proprietarioNome,
            proprietarioCpfCnpj,
            transmissorCpfCnpj: certificateCpfCnpj
          }
        }
      });

      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);

      alert(`Lote S-1000 enviado com sucesso! Protocolo: ${response.protocolo}`);
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
      const { data: response, error: fnError } = await invokeProxy({
        body: {
          action: 'CONSULT',
          protocolo: esocialS1000Status.protocolo,
          regularizationId: inssRegularization.id
        }
      });

      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);

      if (response.status === 'SUCESSO') alert('S-1000 processado com SUCESSO!');
      checkS1000Status();
    } catch (err: any) {
      alert(`Erro na consulta S-1000: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleTransmitS1005 = async () => {
    if (!inssRegularization || isTransmitting) return;
    if (!cnoNumero) {
      alert('Número do CNO é obrigatório para o evento S-1005.');
      return;
    }

    let indRetif = 1;
    let nrRecibo = null;
    if (esocialS1005Status?.status === 'SUCESSO') {
      if (!confirm('O cadastro da obra já foi processado. Deseja enviar uma RETIFICAÇÃO?')) return;
      indRetif = 2;
      nrRecibo = esocialS1005Status.recibo;
    }

    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: {
          eventType: 'S-1005',
          regularizationId: inssRegularization.id,
          indRetif,
          nrRecibo,
          eventData: { 
            proprietarioCpfCnpj, 
            cnoNumero,
            transmissorCpfCnpj: certificateCpfCnpj
          }
        }
      });

      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);

      alert(`Lote S-1005 enviado! Protocolo: ${response.protocolo}`);
      checkS1005Status();
    } catch (err: any) {
      alert(`Erro no S-1005: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleConsultS1005 = async () => {
    if (!esocialS1005Status || isTransmitting) return;
    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: { action: 'CONSULT', protocolo: esocialS1005Status.protocolo, regularizationId: inssRegularization.id }
      });
      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);
      if (response.status === 'SUCESSO') alert('S-1005 processado com SUCESSO!');
      checkS1005Status();
    } catch (err: any) {
      alert(`Erro na consulta S-1005: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleTransmitS1020 = async () => {
    if (!inssRegularization || isTransmitting) return;

    let indRetif = 1;
    let nrRecibo = null;
    if (esocialS1020Status?.status === 'SUCESSO') {
      if (!confirm('A lotação tributária já foi processada. Deseja enviar uma RETIFICAÇÃO?')) return;
      indRetif = 2;
      nrRecibo = esocialS1020Status.recibo;
    }

    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: {
          eventType: 'S-1020',
          regularizationId: inssRegularization.id,
          indRetif,
          nrRecibo,
          eventData: { proprietarioCpfCnpj }
        }
      });

      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);

      alert(`Lote S-1020 enviado! Protocolo: ${response.protocolo}`);
      checkS1020Status();
    } catch (err: any) {
      alert(`Erro no S-1020: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleConsultS1020 = async () => {
    if (!esocialS1020Status || isTransmitting) return;
    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: { action: 'CONSULT', protocolo: esocialS1020Status.protocolo, regularizationId: inssRegularization.id }
      });
      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);
      if (response.status === 'SUCESSO') alert('S-1020 processado com SUCESSO!');
      checkS1020Status();
    } catch (err: any) {
      alert(`Erro na consulta S-1020: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };
  const handleTransmitS1010 = async () => {
    if (!inssRegularization || isTransmitting) return;

    let indRetif = 1;
    let nrRecibo = null;
    if (esocialS1010Status?.status === 'SUCESSO') {
      if (!confirm('A rúbrica já foi processada. Deseja enviar uma RETIFICAÇÃO?')) return;
      indRetif = 2;
      nrRecibo = esocialS1010Status.recibo;
    }

    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: {
          eventType: 'S-1010',
          regularizationId: inssRegularization.id,
          indRetif,
          nrRecibo,
          eventData: { proprietarioCpfCnpj }
        }
      });

      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);

      alert(`Lote S-1010 enviado! Protocolo: ${response.protocolo}`);
      checkS1010Status();
    } catch (err: any) {
      alert(`Erro no S-1010: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleConsultS1010 = async () => {
    if (!esocialS1010Status || isTransmitting) return;
    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: { action: 'CONSULT', protocolo: esocialS1010Status.protocolo, regularizationId: inssRegularization.id }
      });
      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);
      if (response.status === 'SUCESSO') alert('S-1010 processado com SUCESSO!');
      checkS1010Status();
    } catch (err: any) {
      alert(`Erro na consulta S-1010: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleTransmitS1200 = async () => {
    if (!selectedRemForEvent || isTransmitting || !inssRegularization) return;

    const worker = workers.find(w => w.id === selectedRemForEvent.workerId);
    if (worker?.esocial_status !== 'SUCESSO') {
      alert('ERRO DE FLUXO: Você precisa transmitir o evento S-2300 deste trabalhador com sucesso antes de enviar a remuneração (S-1200).');
      return;
    }

    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: {
          eventType: 'S-1200',
          regularizationId: inssRegularization.id,
          eventData: {
            workerCpf: worker.cpf,
            proprietarioCpfCnpj,
            month: selectedRemForEvent.month,
            year: selectedRemForEvent.year,
            value: selectedRemForEvent.value
          }
        }
      });

      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);

      // Update local state to PROCESSANDO
      setAllRemunerations(prev => prev.map(r => 
        r.id === selectedRemForEvent.id ? { ...r, remStatus: 'PROCESSANDO', remProtocolo: response.protocolo } : r
      ));
      
      setSelectedRemForEvent((prev: any) => ({ ...prev, remStatus: 'PROCESSANDO', remProtocolo: response.protocolo }));
      alert(`Lote S-1200 enviado! Protocolo: ${response.protocolo}`);
    } catch (err: any) {
      alert(`Erro no S-1200: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleConsultS1200 = async () => {
    if (!selectedRemForEvent || isTransmitting) return;
    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: {
          action: 'CONSULT',
          protocolo: selectedRemForEvent.remProtocolo,
          regularizationId: inssRegularization.id
        }
      });

      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);

      const { status, recibo } = response;

      // Update local state
      setAllRemunerations(prev => prev.map(r => 
        r.id === selectedRemForEvent.id ? { ...r, remStatus: status, remRecibo: recibo } : r
      ));

      setSelectedRemForEvent((prev: any) => ({ ...prev, remStatus: status, remRecibo: recibo }));
      
      if (status === 'SUCESSO') alert('S-1200 processado com SUCESSO!');
      else alert('Erro ao processar S-1200. Verifique os detalhes no log.');
    } catch (err: any) {
      alert(`Erro na consulta S-1200: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleTransmitS1210 = async () => {
    if (!selectedRemForEvent || isTransmitting || !inssRegularization) return;
    const worker = workers.find(w => w.id === selectedRemForEvent.workerId);

    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: {
          eventType: 'S-1210',
          regularizationId: inssRegularization.id,
          eventData: {
            workerCpf: worker?.cpf,
            proprietarioCpfCnpj,
            month: selectedRemForEvent.month,
            year: selectedRemForEvent.year,
            value: selectedRemForEvent.value
          }
        }
      });

      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);

      setAllRemunerations(prev => prev.map(r => 
        r.id === selectedRemForEvent.id ? { ...r, pagStatus: 'PROCESSANDO', pagProtocolo: response.protocolo } : r
      ));
      setSelectedRemForEvent((prev: any) => ({ ...prev, pagStatus: 'PROCESSANDO', pagProtocolo: response.protocolo }));
      alert(`Lote S-1210 enviado! Protocolo: ${response.protocolo}`);
    } catch (err: any) {
      alert(`Erro no S-1210: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleConsultS1210 = async () => {
    if (!selectedRemForEvent || isTransmitting) return;
    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: { action: 'CONSULT', protocolo: selectedRemForEvent.pagProtocolo, regularizationId: inssRegularization.id }
      });
      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);
      const { status, recibo } = response;
      setAllRemunerations(prev => prev.map(r => 
        r.id === selectedRemForEvent.id ? { ...r, pagStatus: status, pagRecibo: recibo } : r
      ));
      setSelectedRemForEvent((prev: any) => ({ ...prev, pagStatus: status, pagRecibo: recibo }));
      if (status === 'SUCESSO') alert('S-1210 processado com SUCESSO!');
      else alert('Erro ao processar S-1210.');
    } catch (err: any) {
      alert(`Erro na consulta S-1210: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };


  const handleTransmitS1298 = async () => {
    if (!selectedPeriodForEvent || isTransmitting || !inssRegularization) return;
    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: {
          eventType: 'S-1298',
          regularizationId: inssRegularization.id,
          eventData: { period: selectedPeriodForEvent }
        }
      });
      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);
      setPeriodStatuses(prev => ({
        ...prev,
        [selectedPeriodForEvent]: { 
          ...prev[selectedPeriodForEvent], 
          s1298Status: 'PROCESSANDO', 
          s1298Protocolo: response.protocolo 
        }
      }));
      alert(`Evento S-1298 enviado para o período ${selectedPeriodForEvent}!`);
    } catch (err: any) {
      alert(`Erro no S-1298: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleConsultS1298 = async () => {
    if (!selectedPeriodForEvent || isTransmitting) return;
    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: { action: 'CONSULT', protocolo: periodStatuses[selectedPeriodForEvent]?.s1298Protocolo, regularizationId: inssRegularization.id }
      });
      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);
      const { status, recibo } = response;
      setPeriodStatuses(prev => ({
        ...prev,
        [selectedPeriodForEvent]: { ...prev[selectedPeriodForEvent], s1298Status: status, s1298Recibo: recibo }
      }));
      if (status === 'SUCESSO') alert('S-1298 processado com SUCESSO!');
      else alert('Erro ao processar reabertura.');
    } catch (err: any) {
      alert(`Erro na consulta S-1298: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleConsultS1299 = async () => {
    if (!selectedPeriodForEvent || isTransmitting) return;
    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: { action: 'CONSULT', protocolo: periodStatuses[selectedPeriodForEvent]?.s1299Protocolo, regularizationId: inssRegularization.id }
      });
      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);
      const { status, recibo } = response;
      setPeriodStatuses(prev => ({
        ...prev,
        [selectedPeriodForEvent]: { ...prev[selectedPeriodForEvent], s1299Status: status, s1299Recibo: recibo }
      }));
      if (status === 'SUCESSO') alert('S-1299 processado com SUCESSO! Folha Fechada.');
      else alert('Erro ao processar fechamento.');
    } catch (err: any) {
      alert(`Erro na consulta S-1299: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };


  const handleTransmitS1299 = async () => {
    if (!selectedPeriodForEvent || isTransmitting || !inssRegularization) return;
    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: {
          eventType: 'S-1299',
          regularizationId: inssRegularization.id,
          eventData: { 
            period: selectedPeriodForEvent,
            proprietarioCpfCnpj,
            year: selectedPeriodForEvent.split('/')[1],
            month: selectedPeriodForEvent.split('/')[0]
          }
        }
      });
      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);
      setPeriodStatuses(prev => ({
        ...prev,
        [selectedPeriodForEvent]: { 
          ...prev[selectedPeriodForEvent], 
          s1299Status: 'PROCESSANDO', 
          s1299Protocolo: response.protocolo 
        }
      }));
      alert(`Folha de pagamento FECHADA para o período ${selectedPeriodForEvent}!`);
    } catch (err: any) {
      alert(`Erro no S-1299: ${err.message}`);
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
        .select('cpf_trabalhador, status, protocolo, recibo, resposta_governo, tipo_evento')
        .eq('regularization_id', inssRegularization.id)
        .in('tipo_evento', ['S-2300', 'S-2399'])
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Map status to workers
      const workersWithStatus = (workersData || []).map(worker => {
        const s2300Event = eventsData?.find(e => e.cpf_trabalhador === worker.cpf && e.tipo_evento === 'S-2300');
        const s2399Event = eventsData?.find(e => e.cpf_trabalhador === worker.cpf && e.tipo_evento === 'S-2399');
        
        return {
          ...worker,
          esocial_status: s2300Event?.status || 'PENDENTE',
          protocolo: s2300Event?.protocolo,
          recibo: s2300Event?.recibo,
          resposta_governo: s2300Event?.resposta_governo,
          s2399_status: s2399Event?.status || 'PENDENTE',
          s2399_protocolo: s2399Event?.protocolo,
          s2399_recibo: s2399Event?.recibo,
          s2399_resposta_governo: s2399Event?.resposta_governo
        };
      });

      setWorkers(workersWithStatus);
    } catch (err) {
      console.error('Error fetching workers:', err);
    }
  };

  const fetchEventsHistory = async () => {
    if (!inssRegularization) return;
    try {
      const { data, error } = await supabase
        .from('esocial_events')
        .select('*')
        .eq('regularization_id', inssRegularization.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setAllEvents(data || []);
    } catch (err) {
      console.error('Error fetching event history:', err);
    }
  };

  useEffect(() => {
    if (inssRegularization) {
      fetchWorkers();
      fetchCredentials();
      fetchEventsHistory();
    }
  }, [inssRegularization]);

  const fetchCredentials = async () => {
    if (!inssRegularization) return;
    const { data } = await supabase
      .from('esocial_credentials')
      .select('*')
      .eq('regularization_id', inssRegularization.id)
      .single();
    
    if (data) {
      setEsocialCredentials(data);
      setCertificateUrl(data.certificate_url);
      // We don't set the password in the frontend state for security, 
      // it will be handled by the Edge Function
    }
  };

  const handleSaveCredentials = async () => {
    if (!inssRegularization || !certificateUrl || !certificatePassword) {
      alert('Preencha o certificado e a senha.');
      return;
    }

    try {
      const { error } = await supabase.from('esocial_credentials').upsert({
        regularization_id: inssRegularization.id,
        certificate_url: certificateUrl,
        certificate_password: certificatePassword, // Encrypted at rest in DB (Ideally)
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      alert('Configurações do certificado salvas com segurança no banco de dados!');
      fetchCredentials();
    } catch (err: any) {
      alert(`Erro ao salvar credenciais: ${err.message}`);
    }
  };

  const handleUploadCertificate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !inssRegularization) return;

    setIsUploadingCert(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${inssRegularization.id}_${Math.random()}.${fileExt}`;
      const filePath = `certificates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('esocial_files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('esocial_files')
        .getPublicUrl(filePath);

      setCertificateUrl(publicUrl);
      setCertificateApelido(file.name);
      alert('Certificado enviado com sucesso! Agora informe a senha e clique em Salvar.');
    } catch (err: any) {
      alert(`Erro no upload: ${err.message}`);
    } finally {
      setIsUploadingCert(false);
    }
  };
  const handleMarkAsDone = async (tipo: string, cpf?: string) => {
    if (!inssRegularization) return;
    const recibo = prompt(`Informe o Número do Recibo do evento ${tipo} obtido no portal eSocial:`);
    if (!recibo) return;

    setIsTransmitting(true);
    try {
      const { error } = await supabase
        .from('esocial_events')
        .insert({
          regularization_id: inssRegularization.id,
          tipo_evento: tipo,
          cpf_trabalhador: cpf || null,
          status: 'SUCESSO',
          recibo: recibo,
          resposta_governo: { manual: true, message: 'Marcado manualmente como concluído.' }
        });

      if (error) throw error;
      
      alert('Evento marcado como concluído com sucesso!');
      
      if (tipo === 'S-1000') checkS1000Status();
      else if (tipo === 'S-1005') checkS1005Status();
      else if (tipo === 'S-1020') checkS1020Status();
      else if (tipo === 'S-1010') checkS1010Status();
      else if (cpf) {
        checkEsocialStatus(cpf);
        fetchWorkers();
      }
      
    } catch (err: any) {
      alert(`Erro ao marcar como concluído: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleTransmitS2399 = async () => {
    if (!selectedWorker || isTransmitting || !inssRegularization) return;

    if (selectedWorker.esocial_status !== 'SUCESSO') {
      alert('ERRO: Você precisa transmitir o evento S-2300 (Início) deste trabalhador antes de encerrar (S-2399).');
      return;
    }

    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: {
          eventType: 'S-2399',
          regularizationId: inssRegularization.id,
          eventData: {
            workerCpf: selectedWorker.cpf,
            proprietarioCpfCnpj,
            matricula: selectedWorker.matricula_esocial,
            dtTerm: terminationDate
          }
        }
      });

      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);

      // Persist event in DB
      await supabase.from('esocial_events').insert({
        regularization_id: inssRegularization.id,
        tipo_evento: 'S-2399',
        cpf_trabalhador: selectedWorker.cpf,
        protocolo: response.protocolo,
        status: 'PROCESSANDO',
        resposta_governo: {
          envio_codigo: '201',
          envio_mensagem: 'Lote de encerramento recebido com sucesso.'
        }
      });

      // Update worker with S2399 status locally
      setWorkers(prev => prev.map(w => 
        w.id === selectedWorker.id ? { ...w, s2399_status: 'PROCESSANDO', s2399_protocolo: response.protocolo } : w
      ));
      
      setSelectedWorker((prev: any) => prev ? { ...prev, s2399_status: 'PROCESSANDO', s2399_protocolo: response.protocolo } : null);

      alert(`Lote S-2399 enviado com sucesso! Protocolo registrado.`);
    } catch (err: any) {
      alert(`Não foi possível concluir o envio. Verifique os dados e tente novamente.`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleConsultS2399 = async () => {
    if (!selectedWorker || !selectedWorker.s2399_protocolo || isTransmitting) return;
    setIsTransmitting(true);
    try {
      const { data: response, error: fnError } = await invokeProxy({
        body: { action: 'CONSULT', protocolo: selectedWorker.s2399_protocolo, regularizationId: inssRegularization.id }
      });
      if (fnError) throw fnError;
      if (!response.success) throw new Error(response.error);
      const { status, recibo } = response;

      setWorkers(prev => prev.map(w => 
        w.id === selectedWorker.id ? { ...w, s2399_status: status, s2399_recibo: recibo } : w
      ));
      setSelectedWorker((prev: any) => prev ? { ...prev, s2399_status: status, s2399_recibo: recibo } : null);

      if (status === 'SUCESSO') {
        alert('S-2399 processado com SUCESSO! O recibo foi gerado.');
      } else if (status === 'PROCESSANDO') {
        alert('O eSocial ainda está processando o lote. Por favor, aguarde mais alguns segundos e tente consultar novamente.');
      } else {
        alert(`Ocorreu um problema no processamento. Mensagem: ${response.message || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      console.error('Erro na consulta:', err);
      alert(`Erro na consulta S-2399: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const toggleChecklistItem = async (key: string) => {
    if (!inssRegularization || readOnly) return;
    
    const currentStatus = checklistData[key] || 'PENDENTE';
    const newStatus = currentStatus === 'SUCESSO' ? 'PENDENTE' : 'SUCESSO';
    const newChecklist = { ...checklistData, [key]: newStatus };
    
    setChecklistData(newChecklist);
    
    try {
      await supabase
        .from('inss_regularizations')
        .update({ checklist_data: newChecklist })
        .eq('id', inssRegularization.id);
    } catch (err) {
      console.error('Error updating checklist:', err);
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
      {/* Summary View - DARK THEME PREVIEW */}
      {currentView === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Header Summary Card - DARK THEME */}
          <div className="bg-[#1C232E] rounded-2xl shadow-sm border border-white/5 overflow-hidden text-white mb-6">
            <div className="p-8 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
              <h3 className="text-3xl font-black tracking-tight">{client}</h3>
              <p className="text-slate-400 text-sm mt-1 font-medium">{phone} | {email}</p>
            </div>
            
            {/* CPF/CNPJ Row */}
            <div className="flex border-b border-white/5">
              <div className="w-40 p-4 bg-white/5 border-r border-white/5 flex items-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">CPF / CNPJ:</span>
              </div>
              <div className="flex-1 p-4 flex items-center">
                <span className="text-white font-bold">{proprietarioCpfCnpj || 'Não informado'}</span>
              </div>
            </div>

            {/* Obras Row */}
            <div className="flex border-b border-white/5">
              <div className="w-40 p-4 bg-white/5 border-r border-white/5 flex items-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Obras:</span>
              </div>
              <div className="flex-1 p-4 flex items-center gap-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D94141] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-500/20">
                  <Hammer className="h-3.5 w-3.5 fill-white" />
                  {name} / {areaConstruida.toFixed(2)}m²
                </div>
              </div>
            </div>

            {/* Prazos Row */}
            <div className="flex border-b border-white/5">
              <div className="w-40 p-4 bg-white/5 border-r border-white/5 flex items-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Prazos:</span>
              </div>
              <div className="flex-1 p-4 flex items-center">
                <span className="text-slate-300 text-sm font-medium">{prazos}</span>
              </div>
            </div>

            {/* OBS Row */}
            <div className="flex">
              <div className="w-40 p-4 bg-white/5 border-r border-white/5 flex items-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">OBS:</span>
              </div>
              <div className="flex-1 p-4">
                <span className="text-slate-400 text-sm leading-relaxed italic">{observations}</span>
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
          {/* Management Header Card - DARK THEME PREMIUM */}
          <div className="bg-[#1C232E] rounded-2xl shadow-2xl border border-white/5 overflow-hidden text-white">
            {/* Header: Name and Phone */}
            <div className="p-8 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl font-black tracking-tight">{client}</h2>
                <button onClick={() => copyToClipboard(client)} className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-primary font-mono text-lg font-bold">
                <MessageSquare className="h-5 w-5" />
                <span>{phone} |</span>
              </div>
            </div>

            {/* Row 2: Status */}
            <div className="flex border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <div className="w-48 p-4 bg-white/5 border-r border-white/5 flex items-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</span>
              </div>
              <div className="flex-1 p-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                  <MessageSquare className="h-4 w-4" />
                  {status} ➔ {status} ➔
                </div>
              </div>
            </div>

            {/* Row 3: CPF / CNPJ */}
            <div className="flex border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <div className="w-48 p-4 bg-white/5 border-r border-white/5 flex items-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">CPF / CNPJ</span>
              </div>
              <div className="flex-1 p-4 flex items-center gap-3">
                <button onClick={() => copyToClipboard(proprietarioCpfCnpj)} className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                  <Copy className="h-4 w-4" />
                </button>
                <span className="text-slate-400 font-bold">||</span>
                <span className="text-xl font-bold text-slate-300 tracking-wider font-mono">{proprietarioCpfCnpj}</span>
              </div>
            </div>

            <div className="flex border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <div className="w-48 p-4 bg-white/5 border-r border-white/5 flex items-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">RMT Inicial</span>
              </div>
              <div className="flex-1 p-4 flex items-center gap-3">
                <span className="text-xl font-bold text-slate-300 tracking-wider font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rmtInicial || 0)}
                </span>
              </div>
            </div>

            {/* Row 5: Obras */}
            <div className="flex border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <div className="w-48 p-4 bg-white/5 border-r border-white/5 flex items-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Obras</span>
              </div>
              <div className="flex-1 p-4 flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D94141] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-red-500/20">
                  <Hammer className="h-4 w-4 fill-white" />
                  {name} / {areaConstruida.toFixed(2)}m²
                </div>
              </div>
            </div>

            {/* Row 6: Prazos */}
            <div className="flex border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <div className="w-48 p-4 bg-white/5 border-r border-white/5 flex items-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Prazos:</span>
              </div>
              <div className="flex-1 p-4 flex items-center">
                <span className="text-slate-300 text-base font-bold tracking-tight">{prazos}</span>
              </div>
            </div>

            {/* Row 7: OBS */}
            <div className="flex hover:bg-white/[0.02] transition-colors">
              <div className="w-48 p-4 bg-white/5 border-r border-white/5 flex items-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">OBS:</span>
              </div>
              <div className="flex-1 p-4">
                <span className="text-slate-400 text-sm leading-relaxed italic">{observations}</span>
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

          {/* Certificate Configuration - DARK THEME */}
          <div className="bg-[#1C232E] rounded-2xl shadow-xl border border-white/5 overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Configuração do certificado</span>
              <X className="h-4 w-4 text-slate-500 cursor-pointer hover:text-white" />
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Certificado Digital A1 - Procurador</label>
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          readOnly 
                          value={certificateApelido || (certificateUrl ? 'Certificado Carregado' : '')} 
                          placeholder="Clique em escolher arquivo"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition-all"
                        />
                        {certificateUrl && <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />}
                      </div>
                      <label className="px-5 py-3 bg-white/5 text-white rounded-xl text-xs font-black hover:bg-white/10 cursor-pointer transition-all flex items-center gap-2 border border-white/10 shadow-lg uppercase tracking-widest">
                        {isUploadingCert ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-4 w-4" />}
                        Escolher
                        <input type="file" className="hidden" accept=".pfx,.p12" onChange={handleUploadCertificate} disabled={isUploadingCert} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha do Certificado</label>
                    <input 
                      type="password" 
                      value={certificatePassword}
                      onChange={(e) => setCertificatePassword(e.target.value)}
                      placeholder="Senha do arquivo .pfx"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-lg"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-4">
                    <div className="p-2 bg-emerald-500 rounded-lg text-white shadow-lg shadow-emerald-500/20"><CheckCircle2 className="h-5 w-5" /></div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Status da Credencial</p>
                      <p className="text-[11px] text-emerald-500/80 font-medium leading-relaxed">
                        {esocialCredentials 
                          ? '✅ Credenciais salvas com segurança no banco de dados. Os eventos serão assinados no servidor.' 
                          : '⚠️ Nenhuma credencial configurada. Necessário para transmitir eventos ao eSocial.'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveCredentials}
                    className="w-full py-4 bg-primary text-white rounded-xl font-black text-sm hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase tracking-[2px]"
                  >
                    <Save className="h-4 w-4" />
                    Salvar Configurações
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Section - DARK THEME PREMIUM */}
          <div className="bg-[#1C232E] rounded-2xl shadow-2xl border border-white/5 overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Checklist Inicial</span>
              <X className="h-4 w-4 text-slate-500 cursor-pointer hover:text-white transition-colors" />
            </div>
            <div className="p-8 space-y-6">
              {[
                { id: 'documentos', label: 'Verificar documentos da obra' },
                { id: 'cno', label: 'Fazer / Revisar CNO da obra' },
                { id: 'creditos', label: 'Verificar se já tem créditos de INSS' },
                { id: 'rmt_inicial', label: 'Confirmar RMT inicial' },
                { id: 'rmt_percent', label: 'Confirmar 50% ou 70% do RMT' },
                { id: 'recibos', label: 'Confirmar recibos de autônomo ou NF de MEI' }
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between group">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{item.label}</span>
                  <button 
                    onClick={() => toggleChecklistItem(item.id)}
                    className={cn(
                      "px-6 py-2 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all",
                      checklistData[item.id] === 'SUCESSO' ? "bg-emerald-600 shadow-emerald-500/20" : "bg-[#E23F3F] hover:bg-red-600 shadow-red-500/10"
                    )}
                  >
                    {checklistData[item.id] === 'SUCESSO' ? (
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5" /> Concluído
                      </div>
                    ) : 'Pendente ➔'}
                  </button>
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
            <button 
              onClick={() => setCurrentView('s1005_view')}
              className={cn(
                "px-4 py-2 text-white rounded text-xs font-bold opacity-90 hover:opacity-100 shadow-sm flex items-center gap-1",
                esocialS1005Status?.status === 'SUCESSO' ? "bg-emerald-600" : "bg-[#E27676]"
              )}
            >
              {esocialS1005Status?.status === 'SUCESSO' ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              Estabelecimento / obra
            </button>
            <button 
              onClick={() => setCurrentView('s1020_view')}
              className={cn(
                "px-4 py-2 text-white rounded text-xs font-bold opacity-90 hover:opacity-100 shadow-sm flex items-center gap-1",
                esocialS1020Status?.status === 'SUCESSO' ? "bg-emerald-600" : "bg-[#E27676]"
              )}
            >
              {esocialS1020Status?.status === 'SUCESSO' ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              Lotação tributária
            </button>
            <button 
              onClick={() => setCurrentView('s1010_view')}
              className={cn(
                "px-4 py-2 text-white rounded text-xs font-bold opacity-90 hover:opacity-100 shadow-sm flex items-center gap-1",
                esocialS1010Status?.status === 'SUCESSO' ? "bg-emerald-600" : "bg-[#E27676]"
              )}
            >
              {esocialS1010Status?.status === 'SUCESSO' ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              Rúbrica
            </button>
          </div>

          <p className="text-slate-400 text-[10px] italic font-medium uppercase tracking-wider">Cadastre trabalhador e remunerações para liberar os botões acima.</p>

          {/* Workers Section - DARK THEME */}
          <div className="bg-[#1C232E] rounded-2xl shadow-xl border border-white/5 overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Trabalhadores</span>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-lg">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {workers.filter(w => w.esocial_status === 'SUCESSO').length} de {workers.length} Transmitidos
                </div>
              </div>
              <X className="h-4 w-4 text-slate-500 cursor-pointer hover:text-white" />
            </div>
            
            <div className="p-8 space-y-6 bg-[#1C232E]">
              {workers.length > 0 ? (
                workers.map(worker => (
                  <div key={worker.id} className="bg-white/5 p-8 rounded-2xl border border-white/5 shadow-2xl space-y-8 group hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-3xl font-black text-white tracking-tight">{worker.nome}</h3>
                        <p className="text-primary font-black uppercase tracking-[2px] text-xs mt-1">
                          {CATEGORIA_OPTIONS.find(opt => opt.value === worker.categoria)?.label || worker.categoria}
                        </p>
                      </div>
                      {/* Status eSocial Badge */}
                      {worker.esocial_status === 'SUCESSO' && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 text-emerald-500 rounded-xl text-[10px] font-black uppercase border border-emerald-500/20 shadow-lg tracking-widest">
                          <CheckCircle2 className="h-3.5 w-3.5" /> eSocial Transmitido
                        </div>
                      )}
                      {worker.esocial_status === 'ERRO' && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase border border-red-500/20 shadow-lg tracking-widest">
                          <AlertCircle className="h-3.5 w-3.5" /> Erro no eSocial
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      <button 
                        onClick={() => handleOpenRemunerationModal(worker)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white hover:bg-white/10 transition-all shadow-lg uppercase tracking-widest"
                      >
                        <DollarSign className="h-4 w-4 text-emerald-500" /> Add Remuneração
                      </button>
                      <button onClick={() => handleEditWorker(worker)} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white hover:bg-white/10 transition-all shadow-lg uppercase tracking-widest">
                        <Eye className="h-4 w-4 text-primary" /> Ver / Editar
                      </button>
                      <button 
                        onClick={() => handleClearRemunerations(worker.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white hover:bg-red-500/20 hover:text-red-500 transition-all shadow-lg uppercase tracking-widest"
                      >
                        <Eraser className="h-4 w-4" /> Limpar remunerações
                      </button>
                      <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white hover:bg-white/10 transition-all shadow-lg uppercase tracking-widest">
                        <Printer className="h-4 w-4 text-slate-400" /> Gerar recibos
                      </button>
                      <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white hover:bg-white/10 transition-all shadow-lg uppercase tracking-widest">
                        <Calculator className="h-4 w-4 text-slate-400" /> Totalizar 1
                      </button>
                      <button onClick={() => handleRemoveWorker(worker.id)} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white hover:bg-red-500/20 hover:text-red-500 transition-all shadow-lg uppercase tracking-widest">
                        <Trash2 className="h-4 w-4" /> Remover trabalhador
                      </button>
                      <button 
                        onClick={() => { 
                          setSelectedWorkerId(worker.id);
                          setSelectedWorker(worker); 
                          setCurrentView('s2300_view'); 
                        }}
                        className={cn(
                          "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black text-white transition-all shadow-xl uppercase tracking-widest",
                          worker.esocial_status === 'SUCESSO' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary hover:bg-primary/90"
                        )}
                      >
                        <Send className="h-4 w-4" /> 
                        {worker.esocial_status === 'SUCESSO' ? 'Evento Enviado' : 'Cadastrar trab'}
                      </button>
                      <button 
                        onClick={() => { 
                          setSelectedWorkerId(worker.id);
                          setSelectedWorker(worker); 
                          setCurrentView('s2399_view'); 
                        }}
                        className={cn(
                          "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black text-white transition-all shadow-xl uppercase tracking-widest",
                          worker.s2399_status === 'SUCESSO' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"
                        )}
                      >
                        <Target className="h-4 w-4" /> 
                        {worker.s2399_status === 'SUCESSO' ? 'Trabalhador Encerrado' : 'Encerrar trab'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-slate-600 font-black uppercase tracking-widest italic text-xs">Nenhum trabalhador cadastrado.</div>
              )}

              <div className="flex justify-start pt-6">
                <button 
                  onClick={() => { resetWorkerForm(); setCurrentView('worker_form'); }}
                  className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-primary text-primary rounded-xl text-xs font-black hover:bg-primary/10 transition-all shadow-xl shadow-primary/10 uppercase tracking-[2px]"
                >
                  <UserPlus className="h-5 w-5" /> Novo Trabalhador
                </button>
              </div>
            </div>
          </div>
          
          {/* Requirement Summary Dashboard - DARK THEME */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-8">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-2xl space-y-4 hover:border-primary/20 transition-all">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Total Remunerações</p>
                <p className="text-3xl font-black text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRemuneration)}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-700 ease-out", percentCompleted >= 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-primary shadow-[0_0_10px_rgba(0,122,255,0.5)]")}
                      style={{ width: `${Math.min(percentCompleted, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-400">{percentCompleted.toFixed(1)}%</span>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-2xl space-y-4 hover:border-primary/20 transition-all">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Requisito ({requisitoPercent}%)</p>
                <p className="text-3xl font-black text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(targetRequisito)}
                </p>
                <p className="text-[10px] text-slate-500 italic font-medium uppercase tracking-widest">Valor alvo baseado na RMT Inicial</p>
              </div>

              <div className={cn(
                "p-6 rounded-2xl border shadow-2xl space-y-4 flex flex-col justify-center transition-all",
                percentCompleted >= 100 
                  ? "bg-emerald-500/10 border-emerald-500/20" 
                  : "bg-primary/10 border-primary/20"
              )}>
                <div className="flex items-center justify-between">
                  <p className={cn("text-[11px] font-black uppercase tracking-[2px]", percentCompleted >= 100 ? "text-emerald-500" : "text-primary")}>Status Requisito</p>
                  {percentCompleted >= 100 ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <AlertCircle className="h-6 w-6 text-primary" />}
                </div>
                <p className={cn("text-xl font-black tracking-tighter", percentCompleted >= 100 ? "text-emerald-500" : "text-primary")}>
                  {percentCompleted >= 100 ? 'REQUISITO ATINGIDO' : 'EM PROCESSAMENTO'}
                </p>
                <p className={cn("text-[11px] font-medium leading-relaxed uppercase tracking-widest", percentCompleted >= 100 ? "text-emerald-500/70" : "text-primary/70")}>
                  {percentCompleted >= 100 ? 'Parabéns! O valor mínimo foi superado.' : `Faltam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, targetRequisito - totalRemuneration))} para o alvo.`}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/5 shadow-2xl mx-8 mb-8">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-[#1C232E] text-slate-500 uppercase text-[10px] font-black tracking-[2px] border-b border-white/5">
                  <tr>
                    <th className="p-6 border-r border-white/5">P.A.</th>
                    {workers.map(w => (
                      <th key={w.id} className="p-6 border-r border-white/5 text-center">
                        <span className="text-white">#{w.nome.split(' ')[0]}</span> <br/> <span className="opacity-60">Aut {w.categoria}</span>
                      </th>
                    ))}
                    <th className="p-6 border-r border-white/5 text-center">Correção</th>
                    <th className="p-6 border-r border-white/5 text-center">Ações</th>
                    <th className="p-6 border-r border-white/5 text-center">Verificação</th>
                    <th className="p-6 text-center">INSS Pago</th>
                  </tr>
                </thead>
                <tbody className="text-white bg-[#1C232E]">
                  {getUniquePAs().length > 0 ? (
                    getUniquePAs().map(pa => {
                      const rowTotal = allRemunerations
                        .filter(r => `${String(r.month).padStart(2, '0')}-${r.year}` === pa)
                        .reduce((sum, r) => sum + r.value, 0);
                      
                      const correcaoPct = 4.37; // Mock percentage
                      const correcaoVal = rowTotal * (correcaoPct / 100);

                      return (
                        <tr key={pa} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="p-6 font-black text-slate-300 border-r border-white/5 bg-white/5">{pa}</td>
                          {workers.map(w => {
                            const rem = allRemunerations.find(r => r.workerId === w.id && `${String(r.month).padStart(2, '0')}-${r.year}` === pa);
                            return (
                              <td key={w.id} className="p-6 text-center border-r border-white/5 font-black text-white">
                                {rem ? (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="text-lg tracking-tighter text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rem.value)}</span>
                                      {rem.isLocked && <Lock className="h-3.5 w-3.5 text-primary animate-pulse" />}
                                      <Printer className="h-4 w-4 text-slate-500 cursor-pointer hover:text-white transition-colors" />
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <button 
                                          onClick={() => {
                                            setSelectedWorkerId(w.id);
                                            setSelectedWorker(w);
                                            setSelectedRemForEvent(rem);
                                            setCurrentView('s1200_view');
                                          }}
                                        className={cn(
                                          "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black text-white transition-all shadow-xl uppercase tracking-widest",
                                          rem.remStatus === 'SUCESSO' ? "bg-emerald-600" : "bg-primary hover:bg-blue-700 shadow-primary/20"
                                        )}
                                      >
                                        <Send className="h-3 w-3" /> Rem
                                      </button>
                                      <button 
                                          onClick={() => {
                                            setSelectedWorkerId(w.id);
                                            setSelectedWorker(w);
                                            setSelectedRemForEvent(rem);
                                            setCurrentView('s1210_view');
                                          }}
                                        className={cn(
                                          "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black text-white transition-all shadow-xl uppercase tracking-widest",
                                          rem.pagStatus === 'SUCESSO' ? "bg-emerald-600" : "bg-slate-700 hover:bg-slate-600 shadow-black/20"
                                        )}
                                      >
                                        <Wallet className="h-3 w-3" /> Pag
                                      </button>
                                    </div>
                                  </div>
                                ) : '-'}
                              </td>
                            );
                          })}
                          <td className="p-6 text-center border-r border-white/5">
                            <span className="text-[10px] font-black text-emerald-500 block mb-1 uppercase tracking-widest">{correcaoPct}%</span>
                            <span className="text-sm font-black text-white tracking-tight">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(correcaoVal)}
                            </span>
                          </td>
                          <td className="p-6 border-r border-white/5">
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex flex-col gap-1 w-full">
                                <button 
                                  onClick={() => {
                                    setSelectedPeriodForEvent(pa);
                                    setCurrentView('s1299_view');
                                  }}
                                  className="w-full px-3 py-2 bg-emerald-600 text-[9px] font-black text-white rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 uppercase tracking-widest"
                                >
                                  <Lock className="h-3 w-3" /> Fechar Folha (1299)
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedPeriodForEvent(pa);
                                    setCurrentView('s1298_view');
                                  }}
                                  className="w-full px-3 py-2 bg-slate-700 text-[9px] font-black text-white rounded-lg hover:bg-slate-600 shadow-lg shadow-black/10 flex items-center justify-center gap-1.5 uppercase tracking-widest"
                                >
                                  <Unlock className="h-3 w-3" /> Reabrir Folha (1298)
                                </button>
                              </div>
                              <div className="flex items-center gap-2 w-full">
                                <button className="p-2 bg-white/5 text-slate-400 rounded-lg hover:text-white border border-white/10 transition-colors">
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                <button className="flex-1 px-3 py-2 bg-red-500 text-[9px] font-black text-white rounded-lg hover:bg-red-600 shadow-lg shadow-red-500/10 uppercase tracking-widest">
                                  NF / RPA
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="p-6 text-center border-r border-white/5 min-w-[140px]">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">RMT: <span className="text-white">R$ 0,00</span></p>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Porc.: <span className="text-white">0,00 %</span></p>
                          </td>
                          <td className="p-6 text-center">
                            <div className="flex justify-center">
                              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center cursor-pointer shadow-lg shadow-emerald-500/20 hover:scale-110 transition-transform">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={workers.length + 5} className="p-16 text-center text-slate-600 font-black uppercase tracking-widest text-xs italic bg-white/2">
                        Adicione remunerações aos trabalhadores para gerar os períodos de apuração.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          
          {/* Delete Button */}
          <div className="pt-4">
            <button className="px-4 py-2 border border-red-500 text-red-500 rounded text-xs font-bold hover:bg-red-50 transition-colors uppercase tracking-widest">
              Excluir Registro
            </button>
          </div>
        </div>
      )}

      {/* S-1298 Event View */}
      {currentView === 's1298_view' && selectedPeriodForEvent && (
        <div className="bg-[#1C232E] rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                Transmitir eventos para o eSocial
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Confirme se as informações estão corretas antes de transmitir!</p>
            </div>
            <button 
              onClick={() => { setSelectedPeriodForEvent(null); setCurrentView('management'); }}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
            >
              Voltar para obra
            </button>
          </div>

          <div className="p-8">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-emerald-500" />
              Evento S-1298 – Reabertura dos Eventos Periódicos
            </h3>

            <div className="border border-white/5 rounded-2xl overflow-hidden mb-8 shadow-inner bg-white/[0.02]">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="w-1/3 p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Procurador:</td>
                    <td className="p-4 text-white font-black font-mono">CPF/CNPJ: {certificateCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Empregador:</td>
                    <td className="p-4 text-white font-black uppercase">{proprietarioNome}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CPF Empregador:</td>
                    <td className="p-4 text-white font-black font-mono">{proprietarioCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Evento:</td>
                    <td className="p-4 text-primary font-black">1298</td>
                  </tr>
                  <tr>
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Período:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedPeriodForEvent.split('-')[1]}-{selectedPeriodForEvent.split('-')[0]}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-6">
              <button 
                onClick={periodStatuses[selectedPeriodForEvent]?.s1298Status === 'SUCESSO' || periodStatuses[selectedPeriodForEvent]?.s1298Status === 'PROCESSANDO' ? handleConsultS1298 : handleTransmitS1298}
                disabled={isTransmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-black transition-all shadow-2xl text-lg uppercase tracking-tighter",
                  isTransmitting ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                )}
              >
                {isTransmitting ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Send className="h-6 w-6" />
                )}
                {isTransmitting ? 'Processando...' : 'Transmitir Evento / Consultar'}
              </button>

              {renderEventLog(periodStatuses[selectedPeriodForEvent] ? { status: periodStatuses[selectedPeriodForEvent].s1298Status, protocolo: periodStatuses[selectedPeriodForEvent].s1298Protocolo, recibo: periodStatuses[selectedPeriodForEvent].s1298Recibo } : null, 'S-1298')}
            </div>
          </div>
        </div>
      )}

      {/* S-1299 Event View */}
      {currentView === 's1299_view' && selectedPeriodForEvent && (
        <div className="bg-[#1C232E] rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                Evento S-1299 – Fechamento dos Eventos Periódicos
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">
                Encerramento da folha para geração da DCTFWeb
              </p>
            </div>
            <button 
              onClick={() => { setSelectedPeriodForEvent(null); setCurrentView('management'); }}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
            >
              Voltar para obra
            </button>
          </div>

          <div className="p-8">
            <div className="border border-white/5 rounded-2xl overflow-hidden mb-8 shadow-inner bg-white/[0.02]">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="w-1/3 p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Procurador:</td>
                    <td className="p-4 text-white font-black font-mono">CPF/CNPJ: {certificateCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Empregador:</td>
                    <td className="p-4 text-white font-black uppercase">{proprietarioNome}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CPF Empregador:</td>
                    <td className="p-4 text-white font-black font-mono">{proprietarioCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Evento:</td>
                    <td className="p-4 text-primary font-black">1299</td>
                  </tr>
                  <tr>
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Período:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedPeriodForEvent.split('-')[1]}-{selectedPeriodForEvent.split('-')[0]}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-6">
              <button 
                onClick={periodStatuses[selectedPeriodForEvent]?.s1299Status === 'SUCESSO' || periodStatuses[selectedPeriodForEvent]?.s1299Status === 'PROCESSANDO' ? handleConsultS1299 : handleTransmitS1299}
                disabled={isTransmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-black transition-all shadow-2xl text-lg uppercase tracking-tighter",
                  isTransmitting ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                )}
              >
                {isTransmitting ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Send className="h-6 w-6" />
                )}
                {isTransmitting ? 'Processando...' : 'Transmitir Fechamento / Consultar'}
              </button>

              {renderEventLog(periodStatuses[selectedPeriodForEvent] ? { status: periodStatuses[selectedPeriodForEvent].s1299Status, protocolo: periodStatuses[selectedPeriodForEvent].s1299Protocolo, recibo: periodStatuses[selectedPeriodForEvent].s1299Recibo } : null, 'S-1299')}
            </div>
          </div>
        </div>
      )}
      {currentView === 's1210_view' && selectedWorker && selectedRemForEvent && (
        <div className="bg-[#1C232E] rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                Evento S-1210 – Pagamentos de Rendimentos do Trabalho
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">
                Data Estimada do Pagamento: {new Date(selectedRemForEvent.year, selectedRemForEvent.month, 5).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <button 
              onClick={() => { 
                setSelectedWorkerId(null);
                setSelectedRemForEvent(null); 
                setCurrentView('management'); 
              }}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
            >
              Voltar para obra
            </button>
          </div>

          <div className="p-8">
            <div className="border border-white/5 rounded-2xl overflow-hidden shadow-inner bg-white/[0.02]">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="w-1/3 p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Procurador:</td>
                    <td className="p-4 text-white font-black font-mono">CPF/CNPJ: {certificateCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Empregador:</td>
                    <td className="p-4 text-white font-black uppercase">{proprietarioNome}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CPF Empregador:</td>
                    <td className="p-4 text-white font-black font-mono">{proprietarioCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Período Apuração:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedRemForEvent.year}-{String(selectedRemForEvent.month).padStart(2, '0')}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Beneficiário:</td>
                    <td className="p-4 text-primary font-black uppercase tracking-tight">{selectedWorker.nome}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CPF Beneficiário:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedWorker.cpf}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Data Pagto:</td>
                    <td className="p-4 text-white font-black">{new Date(selectedRemForEvent.year, selectedRemForEvent.month, 5).toLocaleDateString('pt-BR')}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Tipo Pagto:</td>
                    <td className="p-4 text-white font-medium">1 - Pagamento de rendimentos do trabalho</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Valor Líquido:</td>
                    <td className="p-4 text-emerald-500 font-black text-2xl tracking-tighter">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedRemForEvent.value)}
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Evento:</td>
                    <td className="p-4 text-primary font-black">1210</td>
                  </tr>
                  <tr>
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Transmissão:</td>
                    <td className="p-4 text-slate-400 font-bold font-mono">{new Date().toLocaleDateString('pt-BR')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 space-y-6">
              <button 
                onClick={selectedRemForEvent.pagStatus === 'SUCESSO' || selectedRemForEvent.pagStatus === 'PROCESSANDO' ? handleConsultS1210 : handleTransmitS1210}
                disabled={isTransmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-black transition-all shadow-2xl text-lg uppercase tracking-tighter",
                  isTransmitting ? "bg-slate-700 text-slate-500 cursor-not-allowed" : 
                  selectedRemForEvent.pagStatus === 'SUCESSO' ? "bg-primary hover:bg-blue-700 text-white shadow-primary/20" :
                  "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                )}
              >
                {isTransmitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    {selectedRemForEvent.pagStatus === 'PROCESSANDO' ? 'Consultando...' : 'Transmitindo...'}
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    {selectedRemForEvent.pagStatus === 'SUCESSO' 
                      ? 'Consultar Status / Recibo' 
                      : selectedRemForEvent.pagStatus === 'ERRO' 
                        ? 'Tentar Transmitir Novamente'
                        : 'Transmitir Evento S-1210'}
                  </>
                )}
              </button>
              
              {renderEventLog({ status: selectedRemForEvent.pagStatus, protocolo: selectedRemForEvent.pagProtocolo, recibo: selectedRemForEvent.pagRecibo }, 'S-1210', selectedWorker.cpf)}
            </div>
          </div>
        </div>
      )}

      {/* S-1200 Event View */}
      {currentView === 's1200_view' && selectedWorker && selectedRemForEvent && (
        <div className="bg-[#1C232E] rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                Evento S-1200 – Remuneração de Trabalhador
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Período de Apuração: <span className="text-primary font-black">{selectedRemForEvent.month}/{selectedRemForEvent.year}</span>
              </p>
            </div>
            <button 
              onClick={() => { 
                setSelectedWorkerId(null);
                setSelectedRemForEvent(null); 
                setCurrentView('management'); 
              }}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
            >
              Voltar para obra
            </button>
          </div>

          <div className="p-8">
            <div className="border border-white/5 rounded-2xl overflow-hidden shadow-inner bg-white/[0.02]">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="w-1/3 p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Procurador:</td>
                    <td className="p-4 text-white font-black font-mono">CPF/CNPJ: {certificateCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Empregador:</td>
                    <td className="p-4 text-white font-black uppercase">{proprietarioNome}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CPF Empregador:</td>
                    <td className="p-4 text-white font-black font-mono">{proprietarioCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Período Apuração:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedRemForEvent.year}-{String(selectedRemForEvent.month).padStart(2, '0')}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Trabalhador:</td>
                    <td className="p-4 text-primary font-black uppercase tracking-tight">{selectedWorker.nome}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CPF Trabalhador:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedWorker.cpf}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Matrícula:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedWorker.matricula_esocial}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Categoria:</td>
                    <td className="p-4 text-white font-bold">{selectedWorker.categoria}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Remuneração:</td>
                    <td className="p-4 text-emerald-500 font-black text-2xl tracking-tighter">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedRemForEvent.value)}
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Evento:</td>
                    <td className="p-4 text-primary font-black">1200</td>
                  </tr>
                  <tr>
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Transmissão:</td>
                    <td className="p-4 text-slate-400 font-bold font-mono">{new Date().toLocaleDateString('pt-BR')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 space-y-6">
              <button 
                onClick={selectedRemForEvent.remStatus === 'SUCESSO' || selectedRemForEvent.remStatus === 'PROCESSANDO' ? handleConsultS1200 : handleTransmitS1200}
                disabled={isTransmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-black transition-all shadow-2xl text-lg uppercase tracking-tighter",
                  isTransmitting ? "bg-slate-700 text-slate-500 cursor-not-allowed" : 
                  selectedRemForEvent.remStatus === 'SUCESSO' ? "bg-primary hover:bg-blue-700 text-white shadow-primary/20" :
                  "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                )}
              >
                {isTransmitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    {selectedRemForEvent.remStatus === 'PROCESSANDO' ? 'Consultando...' : 'Transmitindo...'}
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    {selectedRemForEvent.remStatus === 'SUCESSO' 
                      ? 'Consultar Status / Recibo' 
                      : selectedRemForEvent.remStatus === 'ERRO' 
                        ? 'Tentar Transmitir Novamente'
                        : 'Transmitir Evento S-1200'}
                  </>
                )}
              </button>
              
              {renderEventLog({ status: selectedRemForEvent.remStatus, protocolo: selectedRemForEvent.remProtocolo, recibo: selectedRemForEvent.remRecibo }, 'S-1200', selectedWorker.cpf)}
              
              <div className="flex flex-col items-center gap-6 mt-8">
                <div className="flex items-center gap-4 w-full">
                  <div className="h-px flex-1 bg-white/5"></div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Ações Auxiliares</p>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button 
                    onClick={() => handleMarkAsDone('S-1200')}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                  >
                    Já foi feito!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 's2300_view' && selectedWorker && (
        <div className="bg-[#1C232E] rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">
              Evento S-2300 – Início do Trabalhador Sem Vínculo
            </h2>
            <button 
              onClick={() => { 
                setSelectedWorkerId(null);
                setSelectedWorker(null); 
                setCurrentView('management'); 
              }}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
            >
              Voltar para obra
            </button>
          </div>

          <div className="p-8">
            <div className="border border-white/5 rounded-2xl overflow-hidden shadow-inner bg-white/[0.02]">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="w-1/3 p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Procurador:</td>
                    <td className="p-4 text-white font-black font-mono">CPF/CNPJ: {certificateCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Empregador:</td>
                    <td className="p-4 text-white font-black uppercase">{proprietarioNome}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CPF Empregador:</td>
                    <td className="p-4 text-white font-black font-mono">{proprietarioCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Trabalhador:</td>
                    <td className="p-4 text-primary font-black uppercase tracking-tight">{selectedWorker.nome}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CPF Trabalhador:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedWorker.cpf}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Matrícula:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedWorker.matricula_esocial}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CEP:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedWorker.cep}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Nascimento:</td>
                    <td className="p-4 text-white font-black">{selectedWorker.nascimento}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Escolaridade:</td>
                    <td className="p-4 text-white font-bold">{selectedWorker.escolaridade}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Cargo:</td>
                    <td className="p-4 text-white font-black uppercase">{selectedWorker.cargo_nome}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CBO Cargo:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedWorker.cbo_cargo}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Categoria:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedWorker.categoria}</td>
                  </tr>
                  <tr>
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Data Evento:</td>
                    <td className="p-4 text-slate-400 font-bold font-mono">{new Date().toISOString().split('T')[0]}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 space-y-6">
              <button 
                onClick={esocialStatus && esocialStatus.status !== 'ERRO' ? handleConsultESocial : handleTransmitESocial}
                disabled={isTransmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-black transition-all shadow-2xl text-lg uppercase tracking-tighter",
                  isTransmitting ? "bg-slate-700 text-slate-500 cursor-not-allowed" : 
                  esocialStatus && esocialStatus.status === 'SUCESSO' ? "bg-primary hover:bg-blue-700 text-white shadow-primary/20" :
                  "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                )}
              >
                {isTransmitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    {esocialStatus && esocialStatus.status !== 'ERRO' ? 'Consultando...' : 'Transmitindo...'}
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    {esocialStatus && esocialStatus.status === 'SUCESSO' 
                      ? 'Consultar Status / Recibo' 
                      : esocialStatus && esocialStatus.status === 'ERRO' 
                        ? 'Tentar Transmitir Novamente'
                        : 'Transmitir Evento / Consultar'}
                  </>
                )}
              </button>
              
              {renderEventLog({ status: selectedWorker.esocial_status, protocolo: selectedWorker.protocolo, recibo: selectedWorker.recibo, resposta_governo: selectedWorker.resposta_governo }, 'S-2300', selectedWorker.cpf)}
              
              <div className="flex flex-col items-center gap-6 mt-8">
                <div className="flex items-center gap-4 w-full">
                  <div className="h-px flex-1 bg-white/5"></div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Ações Auxiliares</p>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button 
                    onClick={() => handleMarkAsDone('S-2300', selectedWorker.cpf)}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                  >
                    Já foi feito!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* S-2399 Event View */}
      {currentView === 's2399_view' && selectedWorker && (
        <div className="bg-[#1C232E] rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                Evento S-2399 – Término do Trabalhador Sem Vínculo
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Finalização de prestação de serviço
              </p>
            </div>
            <button 
              onClick={() => { 
                setSelectedWorkerId(null);
                setSelectedWorker(null); 
                setCurrentView('management'); 
              }}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
            >
              Voltar para obra
            </button>
          </div>

          <div className="p-8">
            <div className="border border-white/5 rounded-2xl overflow-hidden shadow-inner bg-white/[0.02]">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="w-1/3 p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Trabalhador:</td>
                    <td className="p-4 text-primary font-black uppercase tracking-tight">{selectedWorker.nome}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CPF Trabalhador:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedWorker.cpf}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Matrícula:</td>
                    <td className="p-4 text-white font-black font-mono">{selectedWorker.matricula_esocial}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Data de Término:</td>
                    <td className="p-4">
                      <input 
                        type="date" 
                        value={terminationDate} 
                        onChange={(e) => setTerminationDate(e.target.value)} 
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-black outline-none focus:border-primary transition-all"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Evento:</td>
                    <td className="p-4 text-primary font-black">2399</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 space-y-6">
              <button 
                onClick={selectedWorker.s2399_status === 'PROCESSANDO' ? handleConsultS2399 : handleTransmitS2399}
                disabled={isTransmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-black transition-all shadow-2xl text-lg uppercase tracking-tighter",
                  isTransmitting ? "bg-slate-700 text-slate-500 cursor-not-allowed" : 
                  selectedWorker.s2399_status === 'SUCESSO' ? "bg-primary text-white shadow-primary/20" :
                  selectedWorker.s2399_status === 'PROCESSANDO' ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" :
                  "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                )}
              >
                {isTransmitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    {selectedWorker.s2399_status === 'PROCESSANDO' ? 'Consultando...' : 'Transmitindo...'}
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    {selectedWorker.s2399_status === 'SUCESSO' 
                      ? 'Encerrado com Sucesso' 
                      : selectedWorker.s2399_status === 'PROCESSANDO'
                        ? 'Consultar Retorno do Governo'
                        : selectedWorker.s2399_status === 'ERRO' 
                          ? 'Tentar Transmitir Novamente'
                          : 'Transmitir Evento S-2399'}
                  </>
                )}
              </button>
              {selectedWorker.s2399_status === 'PROCESSANDO' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mt-4 animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 text-blue-400">
                      <History className="h-5 w-5" />
                      <span className="font-bold text-sm uppercase tracking-widest">Aguardando Resposta</span>
                    </div>
                    <button 
                      onClick={async () => {
                        if (!confirm('Deseja realmente resetar o status deste evento? Use apenas se estiver travado.')) return;
                        await supabase.from('esocial_events').delete().eq('cpf_trabalhador', selectedWorker.cpf).eq('tipo_evento', 'S-2399');
                        window.location.reload();
                      }}
                      className="text-[10px] font-bold text-red-400 hover:text-red-300 underline uppercase tracking-tighter"
                    >
                      Limpar Status (Reset)
                    </button>
                  </div>
                  <p className="text-blue-100/60 text-xs">
                    O evento já foi recebido pelo governo. Clique no botão acima para verificar se o recibo oficial já foi gerado.
                  </p>
                </div>
              )}
              {renderEventLog({ status: selectedWorker.s2399_status, protocolo: selectedWorker.s2399_protocolo, recibo: selectedWorker.s2399_recibo, resposta_governo: selectedWorker.s2399_resposta_governo }, 'S-2399', selectedWorker.cpf)}
            </div>
          </div>
        </div>
      )}


      {/* New Worker Form View - DARK */}
      {currentView === 'worker_form' && (
        <div className="bg-[#1C232E] rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">
              {editingWorkerId ? 'Editar Trabalhador' : 'Novo Trabalhador'} — Obra #{projectId.substring(0, 4)}
            </h2>
            <button onClick={() => { resetWorkerForm(); setCurrentView('management'); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="h-5 w-5 text-slate-400 hover:text-white" />
            </button>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">CPF</label>
                <input type="text" value={workerCpf} onChange={e => setWorkerCpf(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner" placeholder="000.000.000-00" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Nome Completo</label>
                <input type="text" value={workerNome} onChange={e => setWorkerNome(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner uppercase" placeholder="Nome do Trabalhador" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do cargo</label>
                <input type="text" value={workerCargo} onChange={e => setWorkerCargo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CBO Cargo IBGE (pedreiro = 715210)</label>
                <input type="text" value={workerCbo} onChange={e => setWorkerCbo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Matricula (eSocial)</label>
                <input type="text" value={workerMatricula} onChange={e => setWorkerMatricula(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
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
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none pr-10" 
                  />
                  {isFetchingCep && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logradouro</label>
                <input type="text" value={workerLogradouro} onChange={e => setWorkerLogradouro(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nº</label>
                <input type="text" value={workerNumero} onChange={e => setWorkerNumero(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Complemento</label>
                <input type="text" value={workerComplemento} onChange={e => setWorkerComplemento(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bairro</label>
                <input type="text" value={workerBairro} onChange={e => setWorkerBairro(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">UF</label>
                <input type="text" value={workerUf} onChange={e => setWorkerUf(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cod IBGE</label>
                <input type="text" value={workerCodIbge} onChange={e => setWorkerCodIbge(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cidade</label>
                <input type="text" value={workerCidade} onChange={e => setWorkerCidade(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nascimento</label>
                <input type="date" value={workerNascimento} onChange={e => setWorkerNascimento(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sexo</label>
                <select value={workerSexo} onChange={e => setWorkerSexo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none">
                  <option value="" className="bg-[#1C232E]">--</option>
                  <option value="M" className="bg-[#1C232E]">Masculino</option>
                  <option value="F" className="bg-[#1C232E]">Feminino</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Escolaridade</label>
                <select value={workerEscolaridade} onChange={e => setWorkerEscolaridade(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none">
                  <option value="" className="bg-[#1C232E]">--</option>
                  {ESCOLARIDADE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#1C232E]">{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cor da Pele</label>
                <select value={workerCorPele} onChange={e => setWorkerCorPele(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none">
                  <option value="" className="bg-[#1C232E]">--</option>
                  {COR_PELE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#1C232E]">{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">País nascimento (Brasil = 105)</label>
                <input type="text" value={workerPaisNascimento} onChange={e => setWorkerPaisNascimento(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
                <select value={workerCategoria} onChange={e => setWorkerCategoria(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none">
                  <option value="" className="bg-[#1C232E]">--</option>
                  {CATEGORIA_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#1C232E]">{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tab. Rúbrica</label>
                <input type="text" value={workerTabRubrica} onChange={e => setWorkerTabRubrica(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cód. Rúbrica</label>
                <input type="text" value={workerCodRubrica} onChange={e => setWorkerCodRubrica(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cód. Lotação</label>
                <input type="text" value={workerCodLotacao} onChange={e => setWorkerCodLotacao(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
            </div>

            {/* Transmission History - PREMIUM AUDIT VIEW (DARK) */}
            <div className="bg-[#1C232E] rounded-2xl shadow-xl border border-white/5 overflow-hidden mb-8">
              <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-white uppercase tracking-widest text-xs">Histórico de Transmissões (Auditoria)</h3>
                </div>
                <button 
                  onClick={fetchEventsHistory}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400"
                  title="Atualizar Histórico"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 text-slate-500 border-b border-white/5">
                      <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest">Evento</th>
                      <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest">Identificador</th>
                      <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest">Data/Hora</th>
                      <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest">Protocolo</th>
                      <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest">Recibo</th>
                      <th className="px-4 py-3 text-center font-bold text-[10px] uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allEvents && allEvents.length > 0 ? (
                      allEvents.map((event: any) => (
                        <tr key={event.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-4">
                            <span className="font-black text-white">{event.tipo_evento}</span>
                          </td>
                          <td className="px-4 py-4 text-slate-400 font-mono text-xs">
                            {event.cpf_trabalhador}
                          </td>
                          <td className="px-4 py-4 text-slate-500 text-xs">
                            {new Date(event.updated_at).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-4 text-slate-500 font-mono text-[10px]">
                            {event.protocolo || '---'}
                          </td>
                          <td className="px-4 py-4 text-slate-300 font-bold">
                            {event.recibo || (
                              <span className="text-[10px] text-slate-600 italic font-normal">Aguardando...</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={cn(
                              "px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter",
                              event.status === 'SUCESSO' ? "bg-emerald-500/20 text-emerald-500" :
                              event.status === 'ERRO' ? "bg-red-500/20 text-red-500" :
                              "bg-blue-500/20 text-blue-500 animate-pulse"
                            )}>
                              {event.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-600 italic text-xs">
                          Nenhum evento transmitido até o momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/5 bg-white/5 p-6 -mx-8 -mb-8">
              <button 
                onClick={() => { resetWorkerForm(); setCurrentView('management'); }} 
                className="px-6 py-2.5 bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-600 transition-all shadow-lg"
              >
                Voltar para obra
              </button>
              <button 
                onClick={handleSaveWorker} 
                disabled={isSaving} 
                className="px-10 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                  </div>
                ) : 'Salvar Trabalhador'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C232E] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2 text-white font-black uppercase tracking-widest text-xs">
                <Edit2 className="h-4 w-4 text-primary" />
                <span>Editar Cliente</span>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Nome</label>
                <div className="relative">
                  <input type="text" value={client} onChange={e => setClient(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner" />
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Fone</label>
                <div className="relative">
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner" />
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Parceiro</label>
                <div className="relative">
                  <select value={parceiro} onChange={e => setParceiro(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner appearance-none">
                    <option value="- nenhum -" className="bg-[#1C232E]">- nenhum -</option>
                    <option value="Parceiro 1" className="bg-[#1C232E]">Parceiro 1</option>
                    <option value="Parceiro 2" className="bg-[#1C232E]">Parceiro 2</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">CPF / CNPJ <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={cpfCnpj} 
                    onChange={e => setCpfCnpj(e.target.value)} 
                    placeholder="Obrigatório"
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner",
                      !cpfCnpj ? "border-red-500/30" : "border-white/10"
                    )} 
                  />
                  {cpfCnpj && (
                    <Check className={cn(
                      "absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4",
                      (cpfCnpj.replace(/[^\d]/g, '').length <= 11 ? validateCPF(cpfCnpj) : validateCNPJ(cpfCnpj)) 
                        ? "text-emerald-500" 
                        : "text-red-400"
                    )} />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">link</label>
                <input type="text" value={link} onChange={e => setLink(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">cod</label>
                <input type="text" value={cod} onChange={e => setCod(e.target.value)} autoComplete="off" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" title="Senha" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">obs</label>
                <textarea value={observations} onChange={e => setObservations(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner min-h-[80px]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">MAED</label>
                  <input type="date" value={maedDate} onChange={e => setMaedDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Parcelar</label>
                  <input type="date" value={parcelarDate} onChange={e => setParcelarDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end gap-3">
              <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-600 transition-all">Fechar</button>
              <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Work Modal (Simple for Create, Detailed for Edit) */}
      {isWorkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C232E] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2 text-white font-black uppercase tracking-widest text-xs">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Dados da Obra (eSocial)</span>
              </div>
              <button onClick={() => setIsWorkModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Nome da obra</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="CASA / COMERCIO / GALPÃO" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner uppercase" />
              </div>

              {workModalMode === 'detailed' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Nome proprietário</label>
                    <input type="text" value={proprietarioNome} onChange={e => setProprietarioNome(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner uppercase" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">CPF / CNPJ do Proprietário</label>
                    <input type="text" value={proprietarioCpfCnpj} onChange={e => setProprietarioCpfCnpj(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner font-mono" />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Área construída</label>
                  <input type="number" value={areaConstruida || ''} onChange={e => setAreaConstruida(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">CNO</label>
                  <input type="text" value={cnoNumero} onChange={e => setCnoNumero(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner font-mono" />
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">


              {workModalMode === 'detailed' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">RMT Inicial</label>
                    <input type="number" value={rmtInicial || ''} onChange={e => setRmtInicial(Number(e.target.value))} placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Requisito (%)</label>
                      <span className="text-[9px] text-primary font-bold italic">Lei 10/2021 - Verificar no portal SERO</span>
                    </div>
                    <input type="number" value={requisitoPercent || ''} onChange={e => setRequisitoPercent(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner" />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Endereço Completo</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner uppercase" />
              </div>

              {workModalMode === 'detailed' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Emitir Documento Mensal?</label>
                  <select value={emitirDocumento} onChange={e => setEmitirDocumento(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner">
                    <option value="Não" className="bg-[#1C232E]">Não</option>
                    <option value="Sim" className="bg-[#1C232E]">Sim</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Observações do Projeto</label>
                <textarea value={observations} onChange={e => setObservations(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner min-h-[80px]" />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end gap-3">
              <button onClick={() => setIsWorkModalOpen(false)} className="px-6 py-2.5 bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-600 transition-all">Cancelar</button>
              <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* S-1000 Event View */}
      {currentView === 's1000_view' && inssRegularization && (
        <div className="bg-[#1C232E] rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 mt-6">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Eventos de Tabela — S-1000</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Informações Iniciais do Empregador/Contribuinte</p>
            </div>
            <button 
              onClick={() => setCurrentView('management')}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
            >
              Voltar para obra
            </button>
          </div>

          <div className="p-8">
            <div className="border border-white/5 rounded-2xl overflow-hidden shadow-inner bg-white/[0.02] mb-8">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="w-1/3 p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Procurador:</td>
                    <td className="p-4 text-white font-black font-mono">CPF/CNPJ: {certificateCpfCnpj || '161.196.598-54'}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Empregador:</td>
                    <td className="p-4 text-white font-black uppercase">{proprietarioNome}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CPF Empregador:</td>
                    <td className="p-4 text-white font-black font-mono">{proprietarioCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Evento:</td>
                    <td className="p-4 text-primary font-black">1000</td>
                  </tr>
                  <tr>
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Período:</td>
                    <td className="p-4 text-slate-400 font-bold font-mono">{new Date().toISOString().substring(0, 7)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-6">
              <button 
                onClick={esocialS1000Status && esocialS1000Status.status !== 'ERRO' && esocialS1000Status.status !== 'PENDENTE' ? handleConsultS1000 : handleTransmitS1000}
                disabled={isTransmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-black transition-all shadow-2xl text-lg uppercase tracking-tighter",
                  isTransmitting ? "bg-slate-700 text-slate-500 cursor-not-allowed" : 
                  (esocialS1000Status?.status === 'PROCESSANDO' ? "bg-primary hover:bg-blue-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20")
                )}
              >
                {isTransmitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    {esocialS1000Status?.status === 'PROCESSANDO' ? 'Consultando...' : 'Transmitindo...'}
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    Transmitir Evento / Consultar
                  </>
                )}
              </button>
              
              {renderEventLog(esocialS1000Status, 'S-1000')}
            </div>
          </div>
        </div>
      )}



      {/* S-1005 Event View - DARK */}
      {currentView === 's1005_view' && inssRegularization && (
        <div className="bg-[#1C232E] rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 mt-6">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Evento S-1005 – Tabela de Estabelecimentos</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Informações de Obras de Construção Civil</p>
            </div>
            <button 
              onClick={() => setCurrentView('management')}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
            >
              Voltar para obra
            </button>
          </div>

          <div className="p-8">
            <div className="border border-white/5 rounded-2xl overflow-hidden shadow-inner bg-white/[0.02] mb-8">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="w-1/3 p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Procurador:</td>
                    <td className="p-4 text-white font-black font-mono">CPF/CNPJ: {certificateCpfCnpj || '161.196.598-54'}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Empregador:</td>
                    <td className="p-4 text-white font-black uppercase">{proprietarioNome}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CPF Empregador:</td>
                    <td className="p-4 text-white font-black font-mono">{proprietarioCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CNO:</td>
                    <td className="p-4 text-white font-black font-mono">{cnoNumero}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Evento:</td>
                    <td className="p-4 text-primary font-black">1005</td>
                  </tr>
                  <tr>
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Período:</td>
                    <td className="p-4 text-slate-400 font-bold font-mono">{new Date().toISOString().substring(0, 7)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-6">
              <button 
                onClick={esocialS1005Status && esocialS1005Status.status !== 'ERRO' && esocialS1005Status.status !== 'PENDENTE' ? handleConsultS1005 : handleTransmitS1005}
                disabled={isTransmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-black transition-all shadow-2xl text-lg uppercase tracking-tighter",
                  isTransmitting ? "bg-slate-700 text-slate-500 cursor-not-allowed" : 
                  (esocialS1005Status?.status === 'PROCESSANDO' ? "bg-primary hover:bg-blue-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20")
                )}
              >
                {isTransmitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    {esocialS1005Status?.status === 'PROCESSANDO' ? 'Consultando...' : 'Transmitindo...'}
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    Transmitir Evento / Consultar
                  </>
                )}
              </button>
              
              {renderEventLog(esocialS1005Status, 'S-1005')}

              <div className="flex flex-col items-center gap-6 mt-8">
                <div className="flex items-center gap-4 w-full">
                  <div className="h-px flex-1 bg-white/5"></div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Ações Auxiliares</p>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button 
                    onClick={() => handleMarkAsDone('S-1005')}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                  >
                    Já foi feito!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* S-1020 Event View - DARK */}
      {currentView === 's1020_view' && inssRegularization && (
        <div className="bg-[#1C232E] rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 mt-6">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Evento S-1020 – Tabela de Lotações</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Classificação das Lotações Tributárias</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsLotacaoModalOpen(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all shadow-lg"
              >
                <Settings className="h-3.5 w-3.5" /> Configurar
              </button>
              <button 
                onClick={() => setCurrentView('management')}
                className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
              >
                Voltar para obra
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="border border-white/5 rounded-2xl overflow-hidden shadow-inner bg-white/[0.02] mb-8">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="w-1/3 p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Procurador:</td>
                    <td className="p-4 text-white font-black font-mono">CPF/CNPJ: {certificateCpfCnpj || '161.196.598-54'}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Empregador:</td>
                    <td className="p-4 text-white font-black uppercase">{proprietarioNome}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">CPF Empregador:</td>
                    <td className="p-4 text-white font-black font-mono">{proprietarioCpfCnpj}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Tipo Lotação:</td>
                    <td className="p-4 text-white font-bold">{tipoLotacao}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Evento:</td>
                    <td className="p-4 text-primary font-black">1020</td>
                  </tr>
                  <tr>
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Período:</td>
                    <td className="p-4 text-slate-400 font-bold font-mono">{new Date().toISOString().substring(0, 7)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-6">
              <button 
                onClick={esocialS1020Status && esocialS1020Status.status !== 'ERRO' && esocialS1020Status.status !== 'PENDENTE' ? handleConsultS1020 : handleTransmitS1020}
                disabled={isTransmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-black transition-all shadow-2xl text-lg uppercase tracking-tighter",
                  isTransmitting ? "bg-slate-700 text-slate-500 cursor-not-allowed" : 
                  (esocialS1020Status?.status === 'PROCESSANDO' ? "bg-primary hover:bg-blue-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20")
                )}
              >
                {isTransmitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    {esocialS1020Status?.status === 'PROCESSANDO' ? 'Consultando...' : 'Transmitindo...'}
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    Transmitir Evento / Consultar
                  </>
                )}
              </button>

              {renderEventLog(esocialS1020Status, 'S-1020')}

            </div>
          </div>
        </div>
      )}

      {/* Lotacao Modal (S-1020) - DARK */}
      {isLotacaoModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C232E] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <span className="text-white font-black uppercase tracking-widest text-xs">Informações da Lotação</span>
              <button onClick={() => setIsLotacaoModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Código lotação</label>
                <input type="text" value="01" readOnly className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 outline-none shadow-inner cursor-not-allowed" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Tipo lotação</label>
                <div className="relative">
                  <select value={tipoLotacao} onChange={(e) => setTipoLotacao(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner appearance-none">
                    <option value="21" className="bg-[#1C232E]">21 - obra própria de pessoa física</option>
                    <option value="01" className="bg-[#1C232E]">01 - classificação de atividades econômicas</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Informações FPAS</label>
                <input type="text" value={infoFpas} onChange={(e) => setInfoFpas(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner" />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white/5 border-t border-white/5 flex items-center gap-3">
              <button onClick={() => setIsLotacaoModalOpen(false)} className="flex-1 py-3 bg-slate-700 text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-600 transition-all">Cancelar</button>
              <button 
                onClick={() => { setIsLotacaoModalOpen(false); setCurrentView('s1020_view'); }}
                className="flex-1 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> Criar Lotação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* S-1010 Event View - DARK */}
      {currentView === 's1010_view' && inssRegularization && (
        <div className="bg-[#1C232E] rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 mt-6">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Evento S-1010 – Tabela de Rúbricas</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configuração de Incidências Tributárias</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsRubricaModalOpen(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all shadow-lg"
              >
                <Settings className="h-3.5 w-3.5" /> Configurar
              </button>
              <button 
                onClick={() => setCurrentView('management')}
                className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
              >
                Voltar para obra
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="border border-white/5 rounded-2xl overflow-hidden shadow-inner bg-white/[0.02] mb-8">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="w-1/3 p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Procurador:</td>
                    <td className="p-4 text-white font-black font-mono">CPF/CNPJ: {certificateCpfCnpj || '161.196.598-54'}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Descrição:</td>
                    <td className="p-4 text-white font-black uppercase">{descRubrica}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Cód. Rúbrica:</td>
                    <td className="p-4 text-white font-black font-mono">{codRubrica}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Inc. Prev:</td>
                    <td className="p-4 text-white font-bold">{incidPrev}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Evento:</td>
                    <td className="p-4 text-primary font-black">1010</td>
                  </tr>
                  <tr>
                    <td className="p-4 bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-r border-white/5">Período:</td>
                    <td className="p-4 text-slate-400 font-bold font-mono">{new Date().toISOString().substring(0, 7)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-6">
              <button 
                onClick={esocialS1010Status && esocialS1010Status.status !== 'ERRO' && esocialS1010Status.status !== 'PENDENTE' ? handleConsultS1010 : handleTransmitS1010}
                disabled={isTransmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-black transition-all shadow-2xl text-lg uppercase tracking-tighter",
                  isTransmitting ? "bg-slate-700 text-slate-500 cursor-not-allowed" : 
                  (esocialS1010Status?.status === 'PROCESSANDO' ? "bg-primary hover:bg-blue-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20")
                )}
              >
                {isTransmitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    {esocialS1010Status?.status === 'PROCESSANDO' ? 'Consultando...' : 'Transmitindo...'}
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    Transmitir Evento / Consultar
                  </>
                )}
              </button>

              {renderEventLog(esocialS1010Status, 'S-1010')}
            </div>
          </div>
        </div>
      )}

      {/* Rubrica Modal (S-1010) - DARK */}
      {isRubricaModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C232E] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <span className="text-white font-black uppercase tracking-widest text-xs">Informações da Rúbrica</span>
              <button onClick={() => setIsRubricaModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Código rúbrica</label>
                  <input type="text" value={codRubrica} onChange={(e) => setCodRubrica(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Tab rúbrica</label>
                  <input type="text" value={tabRubrica} onChange={(e) => setTabRubrica(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Descrição</label>
                <textarea value={descRubrica} onChange={(e) => setDescRubrica(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner min-h-[60px] uppercase" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Inc. Previdência</label>
                <div className="relative">
                  <select value={incidPrev} onChange={(e) => setIncidPrev(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner appearance-none">
                    <option value="13" className="bg-[#1C232E]">13 - Base de cálculo (13º)</option>
                    <option value="00" className="bg-[#1C232E]">00 - Não é base</option>
                    <option value="11" className="bg-[#1C232E]">11 - Base de cálculo mensal</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Incidência IRRF</label>
                <div className="relative">
                  <select value={incidIrrf} onChange={(e) => setIncidIrrf(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner appearance-none">
                    <option value="11" className="bg-[#1C232E]">11 - Remuneração mensal</option>
                    <option value="00" className="bg-[#1C232E]">00 - Não é base</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white/5 border-t border-white/5 flex items-center gap-3">
              <button onClick={() => setIsRubricaModalOpen(false)} className="flex-1 py-3 bg-slate-700 text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-600 transition-all">Cancelar</button>
              <button 
                onClick={() => { setIsRubricaModalOpen(false); setCurrentView('s1010_view'); }}
                className="flex-1 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> Criar Rúbrica
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Remuneration Modal - DARK */}
      {isRemunerationModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C232E] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2 text-white font-black uppercase tracking-widest text-xs">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span>Cadastrar Remunerações</span>
              </div>
              <button onClick={() => setIsRemunerationModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3">
                <Info className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-[11px] text-primary/80 font-medium leading-relaxed uppercase tracking-wider">
                  Os valores gerados serão <span className="text-white font-black">BLOQUEADOS</span> para edição manual após a criação. Use o botão "Limpar" para destravar.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Valor Mensal</label>
                <div className="relative">
                  <input type="text" value={remValue} onChange={(e) => setRemValue(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg text-white focus:border-primary outline-none transition-all shadow-inner font-black" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">BRL</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Mês Inicial</label>
                  <select value={remStartMonth} onChange={(e) => setRemStartMonth(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner appearance-none">
                    {[...Array(12)].map((_, i) => (<option key={i + 1} value={i + 1} className="bg-[#1C232E]">{i + 1}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Ano Inicial</label>
                  <select value={remStartYear} onChange={(e) => setRemStartYear(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner appearance-none">
                    {[2021, 2022, 2023, 2024, 2025, 2026, 2027].map(y => (<option key={y} value={y} className="bg-[#1C232E]">{y}</option>))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Mês Final</label>
                  <select value={remEndMonth} onChange={(e) => setRemEndMonth(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner appearance-none">
                    {[...Array(12)].map((_, i) => (<option key={i + 1} value={i + 1} className="bg-[#1C232E]">{i + 1}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Ano Final</label>
                  <select value={remEndYear} onChange={(e) => setRemEndYear(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all shadow-inner appearance-none">
                    {[2021, 2022, 2023, 2024, 2025, 2026, 2027].map(y => (<option key={y} value={y} className="bg-[#1C232E]">{y}</option>))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end gap-3">
              <button onClick={() => setIsRemunerationModalOpen(false)} className="px-6 py-2.5 bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-600 transition-all">Cancelar</button>
              <button 
                onClick={handleSaveRemuneration} 
                disabled={isSaving}
                className="px-8 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Gerar Remunerações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default INSSRegularizationTab;

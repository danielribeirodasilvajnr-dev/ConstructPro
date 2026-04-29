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
  ArrowLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { INSSRegularization } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

interface INSSRegularizationTabProps {
  projectId: string;
  inssRegularization: INSSRegularization | null;
  onRefresh: () => void;
  readOnly?: boolean;
  isStandalone?: boolean;
}

export function INSSRegularizationTab({ projectId, inssRegularization, onRefresh, readOnly, isStandalone }: INSSRegularizationTabProps) {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'summary' | 'management' | 'worker_form'>('summary');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  
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
  const [workerCategoria, setWorkerCategoria] = useState('');
  const [workerTabRubrica, setWorkerTabRubrica] = useState('');
  const [workerCodRubrica, setWorkerCodRubrica] = useState('');
  const [workerCodLotacao, setWorkerCodLotacao] = useState('');

  const [isSaving, setIsSaving] = useState(false);

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
    }
  }, [inssRegularization]);

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

  const handleSaveWorker = async () => {
    if (!user || !inssRegularization) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('inss_regularization_workers')
        .insert({
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
        });

      if (error) throw error;
      
      alert('Trabalhador cadastrado com sucesso!');
      setCurrentView('management');
      // Reset form
      setWorkerCpf('');
      setWorkerNome('');
    } catch (err) {
      console.error('Error saving worker:', err);
      alert('Erro ao salvar trabalhador.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
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
              onClick={() => setIsWorkModalOpen(true)}
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
                <button className="p-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-500" /></button>
                <button className="p-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-500" /></button>
                <span className="px-2 py-0.5 bg-slate-500 text-white rounded text-[10px] font-bold">Não definido</span>
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
                <button className="p-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors"><Copy className="h-3.5 w-3.5 text-slate-500" /></button>
                <span className="text-sm font-bold text-slate-700">R$ 0,00 / Requisito: R$ %</span>
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
            <button onClick={() => setIsWorkModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#636E72] text-white rounded text-sm font-bold hover:bg-slate-600 transition-colors shadow-md">
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
            {['Info empregador', 'Estabelecimento / obra', 'Lotação tributária', 'Rúbrica'].map(btn => (
              <button key={btn} className="px-4 py-2 bg-[#E27676] text-white rounded text-xs font-bold opacity-90 hover:opacity-100 shadow-sm">
                <Plus className="h-3 w-3 inline mr-1" /> {btn}
              </button>
            ))}
          </div>
          <p className="text-slate-400 text-[10px] italic font-medium uppercase tracking-wider">Cadastre trabalhador e remunerações para liberar os botões acima.</p>

          {/* New Worker Button */}
          <div className="flex justify-start">
            <button 
              onClick={() => setCurrentView('worker_form')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold hover:bg-emerald-700 transition-all shadow-md uppercase tracking-wider"
            >
              <UserPlus className="h-4 w-4" /> Novo Trabalhador
            </button>
          </div>

          {/* Workers Section */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Trabalhadores</span>
              <X className="h-4 w-4 text-slate-400 cursor-pointer" />
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

      {/* New Worker Form View */}
      {currentView === 'worker_form' && (
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800">Novo Trabalhador — Obra #{projectId.substring(0, 4)}</h2>
            <button onClick={() => setCurrentView('management')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CEP</label>
                <input type="text" value={workerCep} onChange={e => setWorkerCep(e.target.value)} placeholder="11222333" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
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
                  <option value="Fundamental">Fundamental</option>
                  <option value="Médio">Médio</option>
                  <option value="Superior">Superior</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cor da Pele</label>
                <select value={workerCorPele} onChange={e => setWorkerCorPele(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white">
                  <option value="">--</option>
                  <option value="Branca">Branca</option>
                  <option value="Preta">Preta</option>
                  <option value="Parda">Parda</option>
                  <option value="Amarela">Amarela</option>
                  <option value="Indígena">Indígena</option>
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
                  <option value="Empregado">Empregado</option>
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
              <button onClick={() => setCurrentView('management')} className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 transition-colors">
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
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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

      {/* Editar Obra Modal */}
      {isWorkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white w-full max-md rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
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
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Nome da obra</label>
                <div className="relative">
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

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

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Área construída</label>
                <div className="relative">
                  <input type="number" value={areaConstruida} onChange={e => setAreaConstruida(Number(e.target.value))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

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
                  <input type="number" value={rmtInicial} onChange={e => setRmtInicial(Number(e.target.value))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Requisito (%)</label>
                <div className="relative">
                  <input type="number" value={requisitoPercent} onChange={e => setRequisitoPercent(Number(e.target.value))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Endereço</label>
                <div className="relative">
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

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

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">OBS</label>
                <div className="relative">
                  <input type="text" value={observations} onChange={e => setObservations(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
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
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  MapPin, 
  Layers, 
  TrendingUp, 
  Save, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

type PCIStep = 'identification' | 'memorial' | 'budget' | 'summary';

const InputGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-0 border border-slate-700 rounded-lg overflow-hidden shadow-lg mb-8">
    <div className="bg-[#2F528F] px-4 py-2 border-b border-slate-700">
      <h3 className="text-xs font-black text-white uppercase tracking-wider">{label}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-12 bg-[#E9EBF5]">
      {children}
    </div>
  </div>
);

const InputField = ({ label, placeholder, value, onChange, className = "md:col-span-4", required = false }: any) => (
  <div className={cn(
    "border-r border-b border-white/40 p-2 transition-colors", 
    required ? "bg-[#D9E1F2]" : "bg-[#E9EBF5]",
    className
  )}>
    <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">
      {label} {required && <span className="text-blue-600">*</span>}
    </label>
    <input 
      type="text" 
      placeholder={placeholder}
      className="w-full bg-transparent border-none p-0 text-sm text-slate-900 font-bold placeholder:text-slate-400 focus:ring-0 outline-none"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

const UFField = ({ label, value, onChange, required = true }: any) => (
  <div className={cn(
    "md:col-span-1 border-r border-b border-white/40 p-2 flex flex-col items-center justify-center transition-colors",
    required ? "bg-[#D9E1F2]" : "bg-orange-50/50",
  )}>
    <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">{label}</label>
    <input 
      type="text" 
      maxLength={2}
      className="w-full bg-transparent border-none p-0 text-xs text-center text-slate-900 font-black placeholder:text-slate-400 focus:ring-0 outline-none uppercase"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

export function PCIView() {
  const [activeStep, setActiveStep] = useState<PCIStep>('identification');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(() => {
    // Tenta carregar dados salvos anteriormente
    const saved = localStorage.getItem('pci_form_draft');
    return saved ? JSON.parse(saved) : {
      proponente_nome: '',
      proponente_email: '',
      proponente_cpf_cnpj: '',
      proponente_telefone: '',
      rtp_nome: '',
      rtp_email: '',
      rtp_conselho: '',
      rtp_uf: '',
      rtp_cpf: '',
      rtp_telefone: '',
      rte_nome: '',
      rte_email: '',
      rte_conselho: '',
      rte_uf: '',
      rte_cpf: '',
      rte_telefone: '',
      imovel_endereco: '',
      imovel_complemento: '',
      imovel_bairro: '',
      imovel_cep: '',
      imovel_municipio: '',
      imovel_uf: '',
      imovel_matricula: '',
      imovel_ori: '',
      imovel_coord_lat: '',
      imovel_coord_lat_dir: 'S',
      imovel_coord_lon: '',
      imovel_coord_lon_dir: 'W',
      imovel_construtora: '',
      imovel_construtora_cnpj: '',
      imovel_finalidade: '',
      memorial_cobertura: '',
      memorial_paredes_externas: '',
      memorial_paredes_internas: '',
    };
  });

  // Salva automaticamente sempre que houver mudança
  React.useEffect(() => {
    localStorage.setItem('pci_form_draft', JSON.stringify(formData));
  }, [formData]);

  const steps = [
    { id: 'identification', label: 'Identificação', icon: FileText },
    { id: 'memorial', label: 'PCI', icon: MapPin },
    { id: 'budget', label: 'Orçamento PLS', icon: Layers },
    { id: 'summary', label: 'Resumo e Envio', icon: TrendingUp },
  ];

  const handleSave = async () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        // Foca na aba principal (Proposta_Constr_Individual ou similar)
        const wsName = wb.SheetNames.find(n => n.includes('Proposta')) || wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        // Mapeamento de Células (Coordenadas reais da Planilha PCI)
        const getValue = (cell: string) => ws[cell]?.v || '';

        setFormData(prev => ({
          ...prev,
          proponente_nome: getValue('G6'),
          proponente_email: getValue('W6'),
          proponente_cpf_cnpj: getValue('AK6'),
          proponente_telefone: getValue('AR6'),
          
          rtp_nome: getValue('G8'),
          rtp_conselho: getValue('AK8'),
          rtp_uf: getValue('AX8'),
          rtp_cpf: getValue('BC8'),

          imovel_endereco: getValue('G14'),
          imovel_complemento: getValue('AK14'),
          imovel_bairro: getValue('G16'),
          imovel_cep: getValue('W16'),
          imovel_municipio: getValue('AK16'),
          imovel_uf: getValue('AX16'),
          
          imovel_matricula: getValue('G18'),
          imovel_finalidade: getValue('BC18'),
        }));

        alert('Planilha importada com sucesso!');
      } catch (error) {
        console.error('Erro ao ler Excel:', error);
        alert('Erro ao processar o arquivo. Verifique se o formato está correto.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Hidden File Input */}
      <input 
        type="file" 
        id="excel-upload" 
        className="hidden" 
        accept=".xlsx, .xls, .xlsm"
        onChange={handleImportExcel}
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#BCB5AC]">Planilha Digital</span>
          <h2 className="text-4xl font-black text-white tracking-tighter mt-1">PCI Digital</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => document.getElementById('excel-upload')?.click()}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 hover:bg-blue-500 transition-all active:scale-95 shadow-xl shadow-blue-900/20"
          >
            <FileText className="h-4 w-4" />
            Importar .xlsm
          </button>
          <button className="px-6 py-3 rounded-xl bg-white/5 text-white font-bold flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95 border border-white/10">
            Visualizar Impressão
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-[#BCB5AC] text-[#1C232E] font-bold flex items-center gap-2 hover:bg-white transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-black/20"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar Dados'}
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="flex items-center justify-between bg-[#1C232E] p-2 rounded-2xl border border-white/5 overflow-x-auto gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id as PCIStep)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all whitespace-nowrap",
                isActive 
                  ? "bg-[#2B3647] text-white shadow-lg border border-white/10" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-[#BCB5AC]" : "")} />
              <span className="text-xs font-bold uppercase tracking-wider">{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative min-h-[600px] p-8">
        <AnimatePresence mode="wait">
          {activeStep === 'identification' && (
            <motion.div
              key="identification"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-6">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Caixa_Econ%C3%B4mica_Federal_logo.svg/1024px-Caixa_Econ%C3%B4mica_Federal_logo.svg.png" alt="Caixa" className="h-8 object-contain" />
                <div className="text-right">
                  <h4 className="text-lg font-black text-slate-800 tracking-tight">Proposta de Construção Individual</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Construção em Terreno Próprio e Aquisição de Terreno e Construção</p>
                </div>
              </div>

              <InputGroup label="Identificação">
                <InputField 
                  label="Proponente" 
                  className="md:col-span-5"
                  required={true}
                  value={formData.proponente_nome}
                  onChange={(v: string) => setFormData({...formData, proponente_nome: v})}
                />
                <InputField 
                  label="E-mail" 
                  className="md:col-span-3"
                  required={true}
                  value={formData.proponente_email}
                  onChange={(v: string) => setFormData({...formData, proponente_email: v})}
                />
                <InputField 
                  label="CPF/CNPJ Prop." 
                  className="md:col-span-2"
                  required={true}
                  value={formData.proponente_cpf_cnpj}
                  onChange={(v: string) => setFormData({...formData, proponente_cpf_cnpj: v})}
                />
                <InputField 
                  label="Telefone Prop." 
                  className="md:col-span-2"
                  required={true}
                  value={formData.proponente_telefone}
                  onChange={(v: string) => setFormData({...formData, proponente_telefone: v})}
                />

                <InputField 
                  label="RT pelo Proj. Arquit./Edif. - RTP" 
                  className="md:col-span-4"
                  required={true}
                  value={formData.rtp_nome}
                  onChange={(v: string) => setFormData({...formData, rtp_nome: v})}
                />
                <InputField 
                  label="E-mail - RTP" 
                  className="md:col-span-2"
                  required={true}
                  value={formData.rtp_email}
                  onChange={(v: string) => setFormData({...formData, rtp_email: v})}
                />
                <InputField 
                  label="Nº CAU/CREA/CFT-RTP" 
                  className="md:col-span-2"
                  required={true}
                  value={formData.rtp_conselho}
                  onChange={(v: string) => setFormData({...formData, rtp_conselho: v})}
                />
                <UFField 
                  label="UF" 
                  required={true}
                  value={formData.rtp_uf}
                  onChange={(v: string) => setFormData({...formData, rtp_uf: v})}
                />
                <InputField 
                  label="CPF - RTP" 
                  className="md:col-span-1.5"
                  required={true}
                  value={formData.rtp_cpf}
                  onChange={(v: string) => setFormData({...formData, rtp_cpf: v})}
                />
                <InputField 
                  label="Telefone - RTP" 
                  className="md:col-span-1.5"
                  required={true}
                  value={formData.rtp_telefone}
                  onChange={(v: string) => setFormData({...formData, rtp_telefone: v})}
                />

                <InputField 
                  label="RT pela Execução da Obra - RTE" 
                  className="md:col-span-4"
                  required={true}
                  value={formData.rte_nome}
                  onChange={(v: string) => setFormData({...formData, rte_nome: v})}
                />
                <InputField 
                  label="E-mail - RTE" 
                  className="md:col-span-2"
                  required={true}
                  value={formData.rte_email}
                  onChange={(v: string) => setFormData({...formData, rte_email: v})}
                />
                <InputField 
                  label="Nº CAU/CREA/CFT-RTE" 
                  className="md:col-span-2"
                  required={true}
                  value={formData.rte_conselho}
                  onChange={(v: string) => setFormData({...formData, rte_conselho: v})}
                />
                <UFField 
                  label="UF" 
                  required={true}
                  value={formData.rte_uf}
                  onChange={(v: string) => setFormData({...formData, rte_uf: v})}
                />
                <InputField 
                  label="CPF - RTE" 
                  className="md:col-span-1.5"
                  required={true}
                  value={formData.rte_cpf}
                  onChange={(v: string) => setFormData({...formData, rte_cpf: v})}
                />
                <InputField 
                  label="Telefone - RTE" 
                  className="md:col-span-1.5"
                  required={true}
                  value={formData.rte_telefone}
                  onChange={(v: string) => setFormData({...formData, rte_telefone: v})}
                />
              </InputGroup>

              <InputGroup label="Identificação do imóvel proposto">
                <InputField 
                  label="Endereço" 
                  className="md:col-span-8"
                  required={true}
                  value={formData.imovel_endereco}
                  onChange={(v: string) => setFormData({...formData, imovel_endereco: v})}
                />
                <InputField 
                  label="Complemento" 
                  className="md:col-span-4"
                  required={true}
                  value={formData.imovel_complemento}
                  onChange={(v: string) => setFormData({...formData, imovel_complemento: v})}
                />
                <InputField 
                  label="Bairro" 
                  className="md:col-span-4"
                  required={true}
                  value={formData.imovel_bairro}
                  onChange={(v: string) => setFormData({...formData, imovel_bairro: v})}
                />
                <InputField 
                  label="CEP" 
                  className="md:col-span-3"
                  required={true}
                  value={formData.imovel_cep}
                  onChange={(v: string) => setFormData({...formData, imovel_cep: v})}
                />
                <InputField 
                  label="Município" 
                  className="md:col-span-4"
                  required={true}
                  value={formData.imovel_municipio}
                  onChange={(v: string) => setFormData({...formData, imovel_municipio: v})}
                />
                <UFField 
                  label="UF" 
                  required={true}
                  value={formData.imovel_uf}
                  onChange={(v: string) => setFormData({...formData, imovel_uf: v})}
                />

                <InputField 
                  label="Matrícula" 
                  className="md:col-span-1"
                  required={true}
                  value={formData.imovel_matricula}
                  onChange={(v: string) => setFormData({...formData, imovel_matricula: v})}
                />
                <InputField 
                  label="ORI (Registro de Imóveis)" 
                  className="md:col-span-2"
                  required={true}
                  value={formData.imovel_ori}
                  onChange={(v: string) => setFormData({...formData, imovel_ori: v})}
                />
                
                {/* Coordenadas como Caixas Individuais */}
                <div className="md:col-span-3 grid grid-cols-4 bg-[#D9E1F2]">
                  <div className="col-span-4 px-2 py-0.5 border-b border-white/40">
                    <label className="block text-[8px] font-bold text-slate-600 uppercase">Coordenadas (Graus°, Min', S")</label>
                  </div>
                  <div className="border-r border-white/40 p-1">
                    <input 
                      type="text" 
                      className="w-full bg-transparent border-none p-0 text-[11px] text-center text-slate-900 font-bold focus:ring-0 outline-none"
                      value={formData.imovel_coord_lat}
                      onChange={e => setFormData({...formData, imovel_coord_lat: e.target.value})}
                    />
                  </div>
                  <div className="border-r border-orange-400 p-1 bg-white mx-0.5 my-0.5 border">
                    <input 
                      type="text" 
                      maxLength={1}
                      className="w-full bg-transparent border-none p-0 text-[11px] text-center text-slate-900 font-black uppercase focus:ring-0 outline-none"
                      value={formData.imovel_coord_lat_dir}
                      onChange={e => setFormData({...formData, imovel_coord_lat_dir: e.target.value})}
                    />
                  </div>
                  <div className="border-r border-white/40 p-1">
                    <input 
                      type="text" 
                      className="w-full bg-transparent border-none p-0 text-[11px] text-center text-slate-900 font-bold focus:ring-0 outline-none"
                      value={formData.imovel_coord_lon}
                      onChange={e => setFormData({...formData, imovel_coord_lon: e.target.value})}
                    />
                  </div>
                  <div className="border-orange-400 p-1 bg-white mx-0.5 my-0.5 border">
                    <input 
                      type="text" 
                      maxLength={1}
                      className="w-full bg-transparent border-none p-0 text-[11px] text-center text-slate-900 font-black uppercase focus:ring-0 outline-none"
                      value={formData.imovel_coord_lon_dir}
                      onChange={e => setFormData({...formData, imovel_coord_lon_dir: e.target.value})}
                    />
                  </div>
                </div>

                <InputField 
                  label="Construtora (se houver)" 
                  className="md:col-span-2"
                  required={true}
                  value={formData.imovel_construtora}
                  onChange={(v: string) => setFormData({...formData, imovel_construtora: v})}
                />
                <InputField 
                  label="CNPJ" 
                  className="md:col-span-1.5"
                  required={true}
                  value={formData.imovel_construtora_cnpj}
                  onChange={(v: string) => setFormData({...formData, imovel_construtora_cnpj: v})}
                />
                <InputField 
                  label="Finalidade" 
                  className="md:col-span-2.5"
                  required={true}
                  value={formData.imovel_finalidade}
                  onChange={(v: string) => setFormData({...formData, imovel_finalidade: v})}
                />
              </InputGroup>

              <div className="flex justify-end pt-8">
                <button 
                  onClick={() => setActiveStep('memorial')}
                  className="px-10 py-4 bg-[#2F528F] text-white font-black rounded-2xl uppercase tracking-[2px] flex items-center gap-3 hover:bg-slate-700 transition-all shadow-xl shadow-black/20"
                >
                  Continuar Preenchimento
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {activeStep === 'memorial' && (
            <motion.div
              key="memorial"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="bg-[#2F528F] text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded">
                  Documentação para Análise Técnica
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Página 1 de 3</span>
              </div>

              <InputGroup label="Documentação Básica">
                <InputField 
                  label="Alvará de Licença da Obra" 
                  className="md:col-span-4"
                  required={true}
                  value={formData.doc_alvara}
                  onChange={(v: string) => setFormData({...formData, doc_alvara: v})}
                />
                <InputField 
                  label="Data do Alvará" 
                  className="md:col-span-4"
                  required={true}
                  value={formData.doc_alvara_data}
                  onChange={(v: string) => setFormData({...formData, doc_alvara_data: v})}
                />
                <InputField 
                  label="Número do Alvará" 
                  className="md:col-span-4"
                  required={true}
                  value={formData.doc_alvara_num}
                  onChange={(v: string) => setFormData({...formData, doc_alvara_num: v})}
                />
                <InputField 
                  label="ART/RRT de Proj. Arquit./Edif." 
                  className="md:col-span-6"
                  required={true}
                  value={formData.doc_art_proj}
                  onChange={(v: string) => setFormData({...formData, doc_art_proj: v})}
                />
                <InputField 
                  label="Número" 
                  className="md:col-span-6"
                  required={true}
                  value={formData.doc_art_proj_num}
                  onChange={(v: string) => setFormData({...formData, doc_art_proj_num: v})}
                />
                <InputField 
                  label="ART/RRT de Exec. de Obra" 
                  className="md:col-span-6"
                  required={true}
                  value={formData.doc_art_exec}
                  onChange={(v: string) => setFormData({...formData, doc_art_exec: v})}
                />
                <InputField 
                  label="Número" 
                  className="md:col-span-6"
                  required={true}
                  value={formData.doc_art_exec_num}
                  onChange={(v: string) => setFormData({...formData, doc_art_exec_num: v})}
                />
              </InputGroup>

              <InputGroup label="Áreas">
                <InputField 
                  label="Área Coberta Padrão (m²)" 
                  className="md:col-span-2"
                  required={true}
                  value={formData.area_coberta}
                  onChange={(v: string) => setFormData({...formData, area_coberta: v})}
                />
                <InputField 
                  label="Área Permeável (m²)" 
                  className="md:col-span-2"
                  required={true}
                  value={formData.area_permeavel}
                  onChange={(v: string) => setFormData({...formData, area_permeavel: v})}
                />
                <InputField 
                  label="Área Descoberta Coberta (m²)" 
                  className="md:col-span-2"
                  required={true}
                  value={formData.area_descoberta}
                  onChange={(v: string) => setFormData({...formData, area_descoberta: v})}
                />
                <InputField 
                  label="Área Construída Total (m²)" 
                  className="md:col-span-2"
                  required={true}
                  value={formData.area_total}
                  onChange={(v: string) => setFormData({...formData, area_total: v})}
                />
                <InputField 
                  label="Área do Terreno (m²)" 
                  className="md:col-span-2"
                  required={true}
                  value={formData.area_terreno_m2}
                  onChange={(v: string) => setFormData({...formData, area_terreno_m2: v})}
                />
                <InputField 
                  label="Valor do Terreno (R$)" 
                  className="md:col-span-2"
                  required={true}
                  value={formData.valor_terreno_rs}
                  onChange={(v: string) => setFormData({...formData, valor_terreno_rs: v})}
                />
              </InputGroup>

              <div className="bg-[#2F528F] px-4 py-2 rounded-t-lg">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Memorial Descritivo</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-300 border border-slate-300 rounded-b-lg overflow-hidden mb-8">
                {[
                  { id: 'cobertura', label: 'Cobertura' },
                  { id: 'revest_ext', label: 'Revestimento Paredes Externas' },
                  { id: 'revest_int', label: 'Revestimento Paredes Internas' },
                  { id: 'pisos', label: 'Pisos' },
                  { id: 'esquadrias', label: 'Esquadrias' },
                  { id: 'inst_eletricas', label: 'Instalações Elétricas' },
                  { id: 'inst_hidraulicas', label: 'Instalações Hidráulicas' },
                  { id: 'loucas_metais', label: 'Louças e Metais' },
                ].map((item) => (
                  <div key={item.id} className="bg-[#D9E1F2] p-3 space-y-1">
                    <label className="block text-[9px] font-black text-slate-600 uppercase">{item.label}</label>
                    <textarea 
                      className="w-full bg-white/50 border-none p-2 text-xs text-slate-900 font-bold focus:ring-1 focus:ring-[#2F528F] outline-none min-h-[60px] rounded"
                      placeholder={`Descreva a solução para ${item.label.toLowerCase()}...`}
                      value={(formData as any)[`mem_${item.id}`]}
                      onChange={e => setFormData({...formData, [`mem_${item.id}`]: e.target.value})}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-8">
                <button 
                  onClick={() => setActiveStep('identification')}
                  className="px-6 py-4 text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 hover:text-[#2F528F] transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </button>
                <button 
                  onClick={() => setActiveStep('budget')}
                  className="px-10 py-4 bg-[#2F528F] text-white font-black rounded-2xl uppercase tracking-[2px] flex items-center gap-3 hover:bg-slate-700 transition-all shadow-xl shadow-black/20"
                >
                  Próximo: Orçamento
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {activeStep === 'budget' && (
            <motion.div
              key="budget"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="bg-[#2F528F] text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded">
                  Custos e Cronograma
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Página 2 de 3</span>
              </div>

              {/* Tabela de Custos */}
              <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 bg-[#2F528F] text-white text-[9px] font-black uppercase p-2 gap-2">
                  <div className="col-span-1 text-center">Item</div>
                  <div className="col-span-5">Serviços</div>
                  <div className="col-span-2 text-center">Incidência (%)</div>
                  <div className="col-span-4 text-center">Custos Propostos (R$)</div>
                </div>
                <div className="max-h-[400px] overflow-y-auto bg-white">
                  {[
                    "Demolição e Limpeza", "Infraestrutura", "Supraestrutura", "Paredes e Painéis",
                    "Esquadrias", "Vidros e Plásticos", "Cobertura", "Impermeabilização",
                    "Revestimento Interno", "Forros", "Revestimento Externo", "Pinturas",
                    "Pisos", "Acabamentos", "Instalação Elétrica", "Instalação Hidráulica",
                    "Esgoto e Águas Pluviais", "Louças e Metais", "Complementares", "Outros"
                  ].map((service, index) => (
                    <div key={index} className="grid grid-cols-12 border-b border-slate-100 items-center text-[11px] hover:bg-slate-50">
                      <div className="col-span-1 py-2 text-center font-bold text-slate-400 border-r border-slate-100">{index + 1}</div>
                      <div className="col-span-5 py-2 px-3 font-medium text-slate-700 border-r border-slate-100">{service}</div>
                      <div className="col-span-2 py-1 px-2 border-r border-slate-100">
                        <input type="text" className="w-full text-center bg-[#E9EBF5] border-none p-1 font-bold text-blue-700 rounded" placeholder="0,00" />
                      </div>
                      <div className="col-span-4 py-1 px-2">
                        <input type="text" className="w-full text-right bg-[#E9EBF5] border-none p-1 font-bold text-slate-900 rounded" placeholder="R$ 0,00" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-12 bg-[#D9E1F2] p-2 font-black text-[10px] uppercase border-t border-slate-300 text-slate-800">
                  <div className="col-span-6 text-right pr-4">Custo Total da Obra:</div>
                  <div className="col-span-6 text-right pr-2">R$ 0,00</div>
                </div>
              </div>

              {/* Cronograma */}
              <div className="mt-8 space-y-4">
                <div className="bg-[#E9EBF5] border-l-4 border-[#2F528F] p-4 rounded-r-lg">
                  <h4 className="text-xs font-black text-[#2F528F] uppercase tracking-wider">Cronograma de Execução da Obra</h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">Previsão de evolução física e financeira por etapas.</p>
                </div>

                <div className="grid grid-cols-12 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden text-[9px] font-black uppercase text-center text-slate-600">
                  <div className="col-span-1 bg-slate-50 py-2">Etapa</div>
                  <div className="col-span-3 bg-slate-50 py-2">Execução Prevista (%)</div>
                  <div className="col-span-4 bg-slate-50 py-2">Incidência Acumulada (%)</div>
                  <div className="col-span-4 bg-slate-50 py-2">Valor Estimado (R$)</div>
                  
                  {[1, 2, 3, 4, 5].map((etapa) => (
                    <React.Fragment key={etapa}>
                      <div className="col-span-1 bg-white py-3 border-t border-slate-100 text-slate-400 font-bold">{etapa}</div>
                      <div className="col-span-3 bg-white py-2 border-t border-slate-100 px-2">
                        <input type="text" className="w-full bg-[#D9E1F2] border-none p-1 text-center font-black text-blue-700 rounded" placeholder="0%" />
                      </div>
                      <div className="col-span-4 bg-white py-2 border-t border-slate-100 px-2">
                        <input type="text" className="w-full bg-slate-50 border-none p-1 text-center font-bold text-slate-400 rounded" disabled value="0%" />
                      </div>
                      <div className="col-span-4 bg-white py-2 border-t border-slate-100 px-2 text-right flex items-center justify-end pr-4 font-bold text-slate-800">
                        R$ 0,00
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button 
                  onClick={() => setActiveStep('memorial')}
                  className="px-6 py-4 text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 hover:text-[#2F528F] transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </button>
                <button 
                  onClick={() => setActiveStep('summary')}
                  className="px-10 py-4 bg-[#2F528F] text-white font-black rounded-2xl uppercase tracking-[2px] flex items-center gap-3 hover:bg-slate-700 transition-all shadow-xl shadow-black/20"
                >
                  Página Final
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {activeStep === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-12"
            >
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Pronto para Enviar!</h3>
                <p className="text-slate-500 mt-2">Sua proposta PCI foi preenchida com sucesso e está pronta para ser exportada ou enviada para análise.</p>
              </div>
              <div className="flex justify-center gap-4 pt-4">
                <button className="px-8 py-4 border border-slate-200 rounded-2xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Baixar PDF (Modelo Caixa)
                </button>
                <button className="px-8 py-4 bg-[#2F528F] text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-black/20 hover:scale-105 transition-all">
                  Enviar para Aprovação
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

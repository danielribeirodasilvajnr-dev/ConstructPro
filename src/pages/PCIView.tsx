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

type PCIStep = 'identification' | 'memorial' | 'budget' | 'summary';

export function PCIView() {
  const [activeStep, setActiveStep] = useState<PCIStep>('identification');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Proponente
    proponente_nome: '',
    proponente_email: '',
    proponente_cpf_cnpj: '',
    proponente_telefone: '',
    
    // RT Projeto (RTP)
    rtp_nome: '',
    rtp_email: '',
    rtp_conselho: '', // CAU/CREA/CFT
    rtp_uf: '',
    rtp_cpf: '',
    rtp_telefone: '',

    // RT Execuo (RTE)
    rte_nome: '',
    rte_email: '',
    rte_conselho: '',
    rte_uf: '',
    rte_cpf: '',
    rte_telefone: '',

    // Imvel
    imovel_endereco: '',
    imovel_complemento: '',
    imovel_bairro: '',
    imovel_cep: '',
    imovel_municipio: '',
    imovel_uf: '',
    imovel_matricula: '',
    imovel_ori: '',
    imovel_coordenadas: '',
    imovel_construtora: '',
    imovel_cnpj_construtora: '',
    imovel_finalidade: '',

    // Outros
    tipo_proposta: 'construcao_terreno_proprio',
    destino_imovel: 'residencial',
    memorial_cobertura: '',
    memorial_paredes_externas: '',
    memorial_paredes_internas: '',
    valor_terreno: 0,
    valor_obra: 0,
  });

  const steps = [
    { id: 'identification', label: 'Identificação', icon: FileText },
    { id: 'memorial', label: 'Memorial Descritivo', icon: MapPin },
    { id: 'budget', label: 'Orçamento PLS', icon: Layers },
    { id: 'summary', label: 'Resumo e Envio', icon: TrendingUp },
  ];

  const handleSave = async () => {
    setLoading(true);
    // TODO: Implement Supabase Save
    setTimeout(() => setLoading(false), 1000);
  };

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

  const InputField = ({ label, placeholder, value, onChange, className = "md:col-span-4" }: any) => (
    <div className={cn("border-r border-b border-white/40 p-2", className)}>
      <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">{label}</label>
      <input 
        type="text" 
        placeholder={placeholder}
        className="w-full bg-transparent border-none p-0 text-sm text-slate-900 font-bold placeholder:text-slate-400 focus:ring-0 outline-none"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );

  const UFField = ({ label, value, onChange }: any) => (
    <div className="md:col-span-1 border-r border-b border-white/40 p-2 flex flex-col items-center justify-center bg-orange-50/50">
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#BCB5AC]">Planilha Digital</span>
          <h2 className="text-4xl font-black text-white tracking-tighter mt-1">PCI Digital</h2>
        </div>
        <div className="flex gap-2">
           <button 
            className="px-6 py-3 rounded-xl bg-white/5 text-white font-bold flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95 border border-white/10"
          >
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
        {steps.map((step, index) => {
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
                  value={formData.proponente_nome}
                  onChange={(v: string) => setFormData({...formData, proponente_nome: v})}
                />
                <InputField 
                  label="E-mail" 
                  className="md:col-span-3"
                  value={formData.proponente_email}
                  onChange={(v: string) => setFormData({...formData, proponente_email: v})}
                />
                <InputField 
                  label="CPF/CNPJ Prop." 
                  className="md:col-span-2"
                  value={formData.proponente_cpf_cnpj}
                  onChange={(v: string) => setFormData({...formData, proponente_cpf_cnpj: v})}
                />
                <InputField 
                  label="Telefone Prop." 
                  className="md:col-span-2"
                  value={formData.proponente_telefone}
                  onChange={(v: string) => setFormData({...formData, proponente_telefone: v})}
                />

                <InputField 
                  label="RT pelo Proj. Arquit./Edif. - RTP" 
                  className="md:col-span-4"
                  value={formData.rtp_nome}
                  onChange={(v: string) => setFormData({...formData, rtp_nome: v})}
                />
                <InputField 
                  label="E-mail - RTP" 
                  className="md:col-span-2"
                  value={formData.rtp_email}
                  onChange={(v: string) => setFormData({...formData, rtp_email: v})}
                />
                <InputField 
                  label="Nº CAU/CREA/CFT-RTP" 
                  className="md:col-span-2"
                  value={formData.rtp_conselho}
                  onChange={(v: string) => setFormData({...formData, rtp_conselho: v})}
                />
                <UFField 
                  label="UF" 
                  value={formData.rtp_uf}
                  onChange={(v: string) => setFormData({...formData, rtp_uf: v})}
                />
                <InputField 
                  label="CPF - RTP" 
                  className="md:col-span-1.5"
                  value={formData.rtp_cpf}
                  onChange={(v: string) => setFormData({...formData, rtp_cpf: v})}
                />
                <InputField 
                  label="Telefone - RTP" 
                  className="md:col-span-1.5"
                  value={formData.rtp_telefone}
                  onChange={(v: string) => setFormData({...formData, rtp_telefone: v})}
                />

                <InputField 
                  label="RT pela Execução da Obra - RTE" 
                  className="md:col-span-4"
                  value={formData.rte_nome}
                  onChange={(v: string) => setFormData({...formData, rte_nome: v})}
                />
                <InputField 
                  label="E-mail - RTE" 
                  className="md:col-span-2"
                  value={formData.rte_email}
                  onChange={(v: string) => setFormData({...formData, rte_email: v})}
                />
                <InputField 
                  label="Nº CAU/CREA/CFT-RTE" 
                  className="md:col-span-2"
                  value={formData.rte_conselho}
                  onChange={(v: string) => setFormData({...formData, rte_conselho: v})}
                />
                <UFField 
                  label="UF" 
                  value={formData.rte_uf}
                  onChange={(v: string) => setFormData({...formData, rte_uf: v})}
                />
                <InputField 
                  label="CPF - RTE" 
                  className="md:col-span-1.5"
                  value={formData.rte_cpf}
                  onChange={(v: string) => setFormData({...formData, rte_cpf: v})}
                />
                <InputField 
                  label="Telefone - RTE" 
                  className="md:col-span-1.5"
                  value={formData.rte_telefone}
                  onChange={(v: string) => setFormData({...formData, rte_telefone: v})}
                />
              </InputGroup>

              <InputGroup label="Identificação do imóvel proposto">
                <InputField 
                  label="Endereço" 
                  className="md:col-span-8"
                  value={formData.imovel_endereco}
                  onChange={(v: string) => setFormData({...formData, imovel_endereco: v})}
                />
                <InputField 
                  label="Complemento" 
                  className="md:col-span-4"
                  value={formData.imovel_complemento}
                  onChange={(v: string) => setFormData({...formData, imovel_complemento: v})}
                />
                <InputField 
                  label="Bairro" 
                  className="md:col-span-4"
                  value={formData.imovel_bairro}
                  onChange={(v: string) => setFormData({...formData, imovel_bairro: v})}
                />
                <InputField 
                  label="CEP" 
                  className="md:col-span-3"
                  value={formData.imovel_cep}
                  onChange={(v: string) => setFormData({...formData, imovel_cep: v})}
                />
                <InputField 
                  label="Município" 
                  className="md:col-span-4"
                  value={formData.imovel_municipio}
                  onChange={(v: string) => setFormData({...formData, imovel_municipio: v})}
                />
                <UFField 
                  label="UF" 
                  value={formData.imovel_uf}
                  onChange={(v: string) => setFormData({...formData, imovel_uf: v})}
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
              className="p-8 space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['cobertura', 'paredes_externas', 'paredes_internas'].map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                      {field.replace('_', ' ')}
                    </label>
                    <textarea 
                      placeholder="Descreva o material e acabamento..."
                      className="w-full bg-[#2B3647]/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-[#BCB5AC] outline-none transition-all shadow-inner min-h-[120px]"
                      value={(formData as any)[`memorial_${field}`]}
                      onChange={e => setFormData({...formData, [`memorial_${field}`]: e.target.value})}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-8">
                <button 
                  onClick={() => setActiveStep('identification')}
                  className="px-6 py-4 text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </button>
                <button 
                  onClick={() => setActiveStep('budget')}
                  className="px-10 py-4 bg-[#BCB5AC] text-[#1C232E] font-black rounded-2xl uppercase tracking-[2px] flex items-center gap-3 hover:bg-white transition-all shadow-xl shadow-black/30"
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
              className="p-8 space-y-8"
            >
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-center gap-4">
                <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
                <div>
                  <p className="text-red-500 font-bold text-sm">Orçamento Pendente</p>
                  <p className="text-red-500/70 text-xs">Os itens de orçamento sero importados automaticamente da Planilha PCI selecionada.</p>
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button 
                  onClick={() => setActiveStep('memorial')}
                  className="px-6 py-4 text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </button>
                <button 
                  onClick={() => setActiveStep('summary')}
                  className="px-10 py-4 bg-[#BCB5AC] text-[#1C232E] font-black rounded-2xl uppercase tracking-[2px] flex items-center gap-3 hover:bg-white transition-all shadow-xl shadow-black/30"
                >
                  Resumo Final
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
              className="p-12 text-center space-y-6"
            >
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Pronto para Enviar!</h3>
                <p className="text-slate-500 mt-2">Sua proposta PCI foi preenchida com sucesso e est pronta para ser exportada ou enviada para anlise.</p>
              </div>
              <div className="flex justify-center gap-4 pt-4">
                <button className="px-8 py-4 border border-white/10 rounded-2xl text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
                  Baixar PDF (Modelo Caixa)
                </button>
                <button className="px-8 py-4 bg-[#BCB5AC] text-[#1C232E] font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-black/20 hover:scale-105 transition-all">
                  Enviar para Aprovao
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

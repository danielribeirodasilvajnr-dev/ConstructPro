import React, { useState, useEffect } from 'react';
import { Home, ArrowRight, ArrowLeft, Send, CheckCircle2, AlertCircle, Building, MapPin, User, Calculator, XCircle } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { supabase } from '../lib/supabase';

export function HousingSimulatorView() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const [formData, setFormData] = useState({
    // Passo 1 (Dados Caixa)
    tipoPessoa: 'Fisica',
    tipoFinanciamento: 'Residencial',
    categoria: 'Aquisição de Imóvel Novo',
    valorImovel: '',
    uf: 'SP',
    cidade: '',
    possuoImovel: false,
    portabilidade: false,
    
    // Passo 2
    cpf: '',
    telefone: '',
    rendaFamiliar: '',
    dataNascimento: '',
    possui3AnosFGTS: 'Não',
    maisDeUmComprador: 'Não',
    
    // Configurações avançadas
    sistemaAmortizacao: 'SAC',
    prazoMeses: '420',
    taxaJurosAnual: '9.5',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Cálculo do prazo máximo baseado na data de nascimento (Regra: Máx 80 anos e 6 meses ao fim do contrato)
  useEffect(() => {
    if (formData.dataNascimento) {
      const birth = new Date(formData.dataNascimento);
      const today = new Date();
      
      let ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12;
      ageInMonths -= birth.getMonth();
      ageInMonths += today.getMonth();
      
      if (today.getDate() < birth.getDate()) {
        ageInMonths--;
      }
      
      const maxAgeMonths = 966; // 80 anos e 6 meses
      let maxTerm = maxAgeMonths - ageInMonths;
      
      if (maxTerm > 420) maxTerm = 420; // Teto de 35 anos
      if (maxTerm < 0) maxTerm = 0;
      
      setFormData(prev => ({ ...prev, prazoMeses: maxTerm.toString() }));
    }
  }, [formData.dataNascimento]);

  // Busca as taxas de juros atualizadas do banco de dados (Supabase)
  useEffect(() => {
    async function fetchRates() {
      setIsLoadingRates(true);
      try {
        const { data, error } = await supabase
          .from('interest_rates')
          .select('rate')
          .eq('financing_type', formData.tipoFinanciamento)
          .single();

        if (error) {
          console.error("Erro ao buscar taxas de juros no banco de dados:", error);
          // Caso falhe, mantém a taxa padrão do formData atual
        } else if (data) {
          setFormData(prev => ({ ...prev, taxaJurosAnual: data.rate.toString() }));
        }
      } catch (err) {
        console.error("Erro inesperado ao buscar taxas:", err);
      } finally {
        setIsLoadingRates(false);
      }
    }
    
    fetchRates();
  }, [formData.tipoFinanciamento]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 2000);
  };

  // Calculations
  const valorImovel = parseFloat(formData.valorImovel.replace(/\D/g, '')) / 100 || 0;
  const rendaFamiliar = parseFloat(formData.rendaFamiliar.replace(/\D/g, '')) / 100 || 0;
  
  const percentualFinanciado = 0.8;
  const valorFinanciado = valorImovel * percentualFinanciado;
  const valorEntrada = valorImovel - valorFinanciado;
  
  const prazoMeses = parseInt(formData.prazoMeses) || 420;
  const jurosAnual = parseFloat(formData.taxaJurosAnual) || 9.5;
  const jurosMensal = jurosAnual / 12 / 100;
  
  const taxaAdministrativa = 25.0; // Mensalidade comum
  const seguroEstimado = valorImovel * 0.0003; // Estimativa de MIP + DFI (aprox 0.03% a.m.)

  let primeiraParcela = 0;
  let ultimaParcela = 0;

  if (formData.sistemaAmortizacao === 'SAC' && prazoMeses > 0) {
    const amortizacao = valorFinanciado / prazoMeses;
    primeiraParcela = amortizacao + (valorFinanciado * jurosMensal) + taxaAdministrativa + seguroEstimado;
    ultimaParcela = amortizacao + (amortizacao * jurosMensal) + taxaAdministrativa + seguroEstimado;
  } else if (prazoMeses > 0 && jurosMensal > 0) {
    // PRICE
    const parcelaPrice = valorFinanciado * (jurosMensal * Math.pow(1 + jurosMensal, prazoMeses)) / (Math.pow(1 + jurosMensal, prazoMeses) - 1);
    primeiraParcela = parcelaPrice + taxaAdministrativa + seguroEstimado;
    ultimaParcela = primeiraParcela;
  }

  const limiteRenda = rendaFamiliar * 0.3; // Parcela não pode comprometer mais que 30% da renda
  const rendaSuficiente = primeiraParcela <= limiteRenda || limiteRenda === 0;

  // Formatting helpers
  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseInt(numbers) / 100;
    if (isNaN(amount)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4').substring(0, 14);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/g, '($1) $2-$3').substring(0, 15);
  };

  if (submitted) {
    return (
      <div className="max-w-[800px] mx-auto w-full pb-32 animate-in fade-in duration-500">
        <div className="bg-surface rounded-2xl shadow-xl border border-success/30 p-12 text-center overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#10B981] to-transparent" />
          <div className="mx-auto w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-3xl font-extrabold text-on-surface mb-4">Simulação Enviada com Sucesso!</h2>
          <p className="text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed">
            Nossos especialistas em financiamento imobiliário receberam seus dados detalhados e farão uma análise personalizada do seu perfil para garantir as melhores condições.
          </p>
          <button 
            onClick={() => {
              setSubmitted(false);
              setStep(1);
            }}
            className="px-8 py-3 bg-surface-container-low hover:bg-surface-container-high text-on-surface font-bold rounded-xl transition-colors"
          >
            Fazer nova simulação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto w-full pb-32 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
          <Home className="h-8 w-8 text-success" />
          Simulador Habitacional Pro
        </h1>
        <p className="text-on-surface-variant mt-2">Calculadora avançada com regras exatas de Amortização (SAC/Price), Seguros e limites de renda.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-surface-container-low z-0" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-success z-0 transition-all duration-500"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />
        
        {[
          { num: 1, label: 'Dados Iniciais', icon: Building },
          { num: 2, label: 'Dados Pessoais', icon: User },
          { num: 3, label: 'Resultado', icon: Calculator }
        ].map((s) => (
          <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 shadow-lg",
              step >= s.num ? "bg-success text-on-surface shadow-success/20" : "bg-surface text-on-surface-variant border-2 border-outline"
            )}>
              <s.icon className="h-4 w-4" />
            </div>
            <span className={cn(
              "text-xs font-bold uppercase tracking-wider absolute -bottom-6 w-32 text-center",
              step >= s.num ? "text-success" : "text-on-surface-variant"
            )}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-2xl shadow-xl border border-outline overflow-hidden mt-12">
        {/* Passo 1: Dados Iniciais (Exatamente igual à Caixa) */}
        {step === 1 && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <div className="p-8 border-b border-outline bg-surface/50">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-success text-success text-sm">1</span>
                Dados iniciais
              </h2>
              <p className="text-on-surface-variant mt-4 text-sm max-w-2xl leading-relaxed">
                Esta é uma simulação para aquisição de imóvel residencial (novo ou usado) ou para obtenção de empréstimo com garantia do seu imóvel destinado a pessoas físicas.
              </p>
            </div>
            
            <div className="p-8 space-y-8">
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-on-surface-variant">Este financiamento ou empréstimo com garantia de imóvel é para uma pessoa:</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="tipoPessoa" 
                      value="Fisica"
                      checked={formData.tipoPessoa === 'Fisica'}
                      onChange={(e) => handleInputChange('tipoPessoa', e.target.value)}
                      className="accent-[#10B981] w-4 h-4"
                    />
                    <span className="text-on-surface text-sm">Física</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="tipoPessoa" 
                      value="Juridica"
                      checked={formData.tipoPessoa === 'Juridica'}
                      onChange={(e) => handleInputChange('tipoPessoa', e.target.value)}
                      className="accent-[#10B981] w-4 h-4"
                    />
                    <span className="text-on-surface text-sm">Jurídica</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant">
                  Qual tipo de financiamento ou empréstimo com garantia de imóvel você deseja? <span className="text-orange-500">*</span>
                </label>
                <select 
                  value={formData.tipoFinanciamento}
                  onChange={(e) => handleInputChange('tipoFinanciamento', e.target.value)}
                  className="w-full md:w-1/2 block bg-surface border border-outline rounded-lg px-4 py-3 text-sm text-on-surface focus:border-success outline-none"
                >
                  <option value="Residencial">Residencial</option>
                  <option value="Comercial">Comercial</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant">
                  Selecione a opção de Financiamento/Empréstimo <span className="text-orange-500">*</span>
                </label>
                <select 
                  value={formData.categoria}
                  onChange={(e) => handleInputChange('categoria', e.target.value)}
                  className="w-full md:w-1/2 block bg-surface border border-outline rounded-lg px-4 py-3 text-sm text-on-surface focus:border-success outline-none"
                >
                  <option value="Aquisição de Imóvel Novo">Aquisição de Imóvel Novo</option>
                  <option value="Aquisição de Imóvel Usado">Aquisição de Imóvel Usado</option>
                  <option value="Construção">Construção</option>
                  <option value="Reforma ou Ampliação">Reforma ou Ampliação</option>
                  <option value="Aquisição de Terreno">Aquisição de Terreno</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant">
                  Valor aproximado do imóvel? <span className="text-orange-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.valorImovel}
                  onChange={(e) => handleInputChange('valorImovel', formatCurrencyInput(e.target.value))}
                  placeholder="0,00"
                  className="w-full md:w-1/3 block bg-surface border border-outline rounded-lg px-4 py-3 text-sm text-on-surface focus:border-success outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant">
                  Em qual cidade está localizado o imóvel? <span className="text-orange-500">*</span>
                </label>
                <div className="flex gap-4 w-full md:w-1/2">
                  <select 
                    value={formData.uf}
                    onChange={(e) => handleInputChange('uf', e.target.value)}
                    className="w-24 shrink-0 bg-surface border border-outline rounded-lg px-4 py-3 text-sm text-on-surface focus:border-success outline-none"
                  >
                    <option value="SP">SP</option>
                    <option value="RJ">RJ</option>
                    <option value="MG">MG</option>
                    <option value="PR">PR</option>
                    <option value="SC">SC</option>
                    <option value="RS">RS</option>
                  </select>
                  <input 
                    type="text" 
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    placeholder="Informe a cidade"
                    className="flex-1 bg-surface border border-outline rounded-lg px-4 py-3 text-sm text-on-surface focus:border-success outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.possuoImovel}
                    onChange={(e) => handleInputChange('possuoImovel', e.target.checked)}
                    className="accent-[#10B981] w-4 h-4 rounded border-outline bg-surface"
                  />
                  <span className="text-on-surface-variant text-sm">Possuo imóvel nesta cidade</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.portabilidade}
                    onChange={(e) => handleInputChange('portabilidade', e.target.checked)}
                    className="accent-[#10B981] w-4 h-4 rounded border-outline bg-surface"
                  />
                  <span className="text-on-surface-variant text-sm">Portabilidade de Crédito Imobiliário</span>
                </label>
              </div>

            </div>
            <div className="p-6 bg-surface/30 border-t border-outline flex justify-start">
              <button 
                onClick={handleNext}
                disabled={!formData.valorImovel || !formData.cidade}
                className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-primary text-on-surface text-sm font-bold rounded transition-colors disabled:opacity-50"
              >
                Próxima etapa
              </button>
            </div>
          </div>
        )}

        {/* Passo 2: Dados Pessoais & Configurações Avançadas */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <div className="p-8 border-b border-outline bg-surface/50">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <User className="h-5 w-5 text-success" />
                Dados do Comprador
              </h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">CPF</label>
                  <input 
                    type="text" 
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full bg-surface border border-outline rounded-lg px-4 py-3 text-sm text-on-surface focus:border-success outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-surface border border-outline rounded-lg px-4 py-3 text-sm text-on-surface focus:border-success outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Renda Bruta Familiar Mensal</label>
                  <input 
                    type="text" 
                    value={formData.rendaFamiliar}
                    onChange={(e) => handleInputChange('rendaFamiliar', formatCurrencyInput(e.target.value))}
                    placeholder="R$ 0,00"
                    className="w-full bg-surface border border-outline rounded-lg px-4 py-3 text-sm text-on-surface focus:border-success outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Data de Nascimento do comprador mais velho</label>
                  <input 
                    type="date" 
                    value={formData.dataNascimento}
                    onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                    className="w-full bg-surface border border-outline rounded-lg px-4 py-3 text-sm text-on-surface focus:border-success outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Possui 3 anos de FGTS?</label>
                  <select 
                    value={formData.possui3AnosFGTS}
                    onChange={(e) => handleInputChange('possui3AnosFGTS', e.target.value)}
                    className="w-full bg-surface border border-outline rounded-lg px-4 py-3 text-sm text-on-surface focus:border-success outline-none"
                  >
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Mais de um comprador ou dependente?</label>
                  <select 
                    value={formData.maisDeUmComprador}
                    onChange={(e) => handleInputChange('maisDeUmComprador', e.target.value)}
                    className="w-full bg-surface border border-outline rounded-lg px-4 py-3 text-sm text-on-surface focus:border-success outline-none"
                  >
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>

                {/* Opções avançadas transferidas do Passo 1 */}
                <div className="space-y-2 md:col-span-2 pt-6 border-t border-outline">
                  <h3 className="text-on-surface font-bold mb-4">Configurações Avançadas de Simulação</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Sistema de Amortização</label>
                  <select 
                    value={formData.sistemaAmortizacao}
                    onChange={(e) => handleInputChange('sistemaAmortizacao', e.target.value)}
                    className="w-full bg-surface border border-outline rounded-lg px-4 py-3 text-sm text-on-surface focus:border-success outline-none"
                  >
                    <option value="SAC">SAC (Parcelas Decrescentes)</option>
                    <option value="PRICE">PRICE (Parcelas Fixas)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Prazo Máximo Permitido</label>
                  <div className="w-full bg-surface/50 border border-outline rounded-lg px-4 py-3 text-sm text-on-surface-variant flex justify-between items-center cursor-not-allowed">
                    <span className="font-bold">{formData.prazoMeses} meses {(parseInt(formData.prazoMeses) / 12).toFixed(1).replace('.0', '')} anos</span>
                    <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded border border-success/20">Calculado pela Idade</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Taxa de Juros Anual (%)</label>
                  <div className="w-full bg-surface/50 border border-outline rounded-lg px-4 py-3 text-sm text-on-surface-variant flex justify-between items-center cursor-not-allowed">
                    {isLoadingRates ? (
                      <span className="flex items-center gap-2 text-on-surface-variant">
                        <div className="w-4 h-4 border-2 border-outline border-t-outline rounded-full animate-spin" />
                        Buscando taxa atualizada...
                      </span>
                    ) : (
                      <>
                        <span className="font-bold">{formData.taxaJurosAnual}% ao ano</span>
                        <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded border border-success/20">Taxa Oficial (Banco de Dados)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-surface/30 border-t border-outline flex justify-between items-center">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 bg-transparent text-on-surface-variant hover:text-on-surface font-bold rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <button 
                onClick={handleNext}
                disabled={!formData.cpf || !formData.telefone || !formData.rendaFamiliar || !formData.dataNascimento}
                className="flex items-center gap-2 px-6 py-3 bg-success hover:bg-[#059669] text-on-surface font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                Ver Simulação <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Passo 3: Resultado Estimado */}
        {step === 3 && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <div className="p-8 border-b border-outline bg-surface/50">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <Calculator className="h-5 w-5 text-success" />
                Resultado Detalhado da Simulação
              </h2>
            </div>
            
            <div className="p-8 space-y-8">
              {!rendaSuficiente ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start gap-4">
                  <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-on-surface font-bold mb-1">Atenção ao Comprometimento de Renda</h4>
                    <p className="text-on-surface-variant text-sm leading-relaxed">
                      A parcela inicial de <strong className="text-red-400">{formatCurrency(primeiraParcela)}</strong> ultrapassa o limite máximo permitido pela Caixa Econômica, que é de 30% da renda bruta informada (<strong className="text-on-surface">{formatCurrency(limiteRenda)}</strong>). Recomendamos aumentar a entrada ou adicionar um co-participante para compor renda.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-success/10 border border-success/20 rounded-xl p-6 flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-success shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-on-surface font-bold mb-1">Renda Aprovada (Pré-análise)</h4>
                    <p className="text-on-surface-variant text-sm leading-relaxed">
                      A parcela de <strong className="text-on-surface">{formatCurrency(primeiraParcela)}</strong> está dentro da margem de 30% da sua renda familiar (Limite: <strong className="text-on-surface">{formatCurrency(limiteRenda)}</strong>). Os cálculos incluem estimativas de Seguros (MIP/DFI) e Taxa de Administração.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface border border-outline rounded-xl p-6">
                  <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Valor do Imóvel</p>
                  <p className="text-xl font-bold text-on-surface">{formatCurrency(valorImovel)}</p>
                </div>
                <div className="bg-surface border border-outline rounded-xl p-6">
                  <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Entrada Mínima (20%)</p>
                  <p className="text-xl font-bold text-orange-400">{formatCurrency(valorEntrada)}</p>
                </div>
                <div className="bg-surface border border-outline rounded-xl p-6">
                  <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Financiamento</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(valorFinanciado)}</p>
                </div>
                <div className="bg-surface border border-outline rounded-xl p-6">
                  <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Taxa de Juros (a.a)</p>
                  <p className="text-xl font-bold text-on-surface">{jurosAnual}%</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1C232E] to-[#1a202c] border border-outline rounded-xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-2xl -mr-16 -mt-16" />
                <h4 className="text-on-surface font-bold mb-6 text-lg relative z-10 flex items-center gap-2">
                  Parcelas do Financiamento 
                  <span className="text-xs bg-surface-container-high px-2 py-1 rounded text-on-surface-variant font-medium">Tabela {formData.sistemaAmortizacao}</span>
                </h4>
                
                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                  <div>
                    <p className="text-on-surface-variant text-sm mb-1">Primeira Parcela</p>
                    <p className="text-3xl font-extrabold text-on-surface">{formatCurrency(primeiraParcela)}</p>
                  </div>
                  <div className="hidden md:block w-px bg-surface-container-high" />
                  <div>
                    <p className="text-on-surface-variant text-sm mb-1">Última Parcela</p>
                    <p className="text-3xl font-extrabold text-on-surface">{formatCurrency(ultimaParcela)}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-outline flex flex-wrap gap-6 relative z-10">
                  <div>
                    <p className="text-on-surface-variant text-xs mb-1">Prazo</p>
                    <p className="text-sm font-bold text-on-surface">{prazoMeses} meses</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant text-xs mb-1">Seguros (Estimado)</p>
                    <p className="text-sm font-bold text-on-surface">{formatCurrency(seguroEstimado)} /mês</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant text-xs mb-1">Taxa Admin (Caixa)</p>
                    <p className="text-sm font-bold text-on-surface">{formatCurrency(taxaAdministrativa)} /mês</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-surface/30 border-t border-outline flex flex-col sm:flex-row justify-between items-center gap-4">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 bg-transparent text-on-surface-variant hover:text-on-surface font-bold rounded-lg transition-colors w-full sm:w-auto justify-center"
              >
                <ArrowLeft className="h-4 w-4" /> Alterar Dados
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-success hover:bg-[#059669] text-on-surface font-bold rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-success/20 w-full sm:w-auto justify-center disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Enviar para Análise
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Star, Zap, Building, Calculator, Shield, ArrowRight, Minus } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export function PlansView() {
  const { currentPlan, loading } = useSubscription();
  const { profile } = useAuth();
  
  const isPending = profile?.subscription_status === 'pending';

  const plans = [
    {
      id: 'start',
      name: 'START',
      description: 'Ideal para profissionais autônomos iniciando na gestão.',
      projects: 1,
      regularizations: 1,
      icon: Zap,
      popular: false,
    },
    {
      id: 'pro',
      name: 'PRO',
      description: 'Para construtores e engenheiros com fluxo contínuo.',
      projects: 3,
      regularizations: 3,
      icon: Building,
      popular: false,
    },
    {
      id: 'elite',
      name: 'ELITE',
      description: 'Para construtoras e escritórios de alto volume.',
      projects: 10,
      regularizations: 10,
      icon: Star,
      popular: true,
    },
    {
      id: 'inss',
      name: 'INSS',
      description: 'Foco total em regularizações e cálculos previdenciários.',
      projects: 0,
      regularizations: 'Ilimitadas',
      icon: Calculator,
      popular: false,
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSubscribe = (planId: string) => {
    // Integração futura com checkout
    window.open('https://api.whatsapp.com/send?phone=5511999999999&text=Olá! Gostaria de assinar o plano ' + planId.toUpperCase(), '_blank');
  };

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-24 relative animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center gap-4 mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-on-surface uppercase group relative z-10">
          ESCOLHA SEU <span className="text-primary group-hover:drop-shadow-[0_0_15px_rgba(34,255,136,0.5)] transition-all">PLANO</span>
        </h2>
        <div className="flex items-center gap-3 mt-2 relative z-10">
          <div className="h-[1px] w-12 bg-primary/30" />
          <p className="text-on-surface-variant text-[11px] font-display uppercase tracking-[4px]">Desbloqueie o Poder do 360Pro</p>
          <div className="h-[1px] w-12 bg-primary/30" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 px-4 md:px-0">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "relative bg-surface-container-low/40 backdrop-blur-xl rounded-[32px] border transition-all duration-500 overflow-hidden flex flex-col group hover:translate-y-[-8px]",
              plan.popular 
                ? "border-primary/50 shadow-[0_20px_40px_-10px_rgba(34,255,136,0.15)] hover:shadow-[0_30px_60px_-15px_rgba(34,255,136,0.3)]" 
                : "border-outline hover:border-primary/30"
            )}
          >
            {plan.popular && (
              <div className="absolute top-0 left-0 w-full bg-primary py-1.5 flex justify-center items-center">
                <span className="text-[10px] font-display font-bold text-background uppercase tracking-[3px]">Mais Popular</span>
              </div>
            )}
            
            <div className={cn("p-8 flex-1", plan.popular ? "pt-12" : "")}>
              <div className="flex items-center justify-between mb-6">
                <div className={cn(
                  "p-3 rounded-2xl flex items-center justify-center transition-colors duration-500",
                  plan.popular ? "bg-primary/20 text-primary" : "bg-surface text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  <plan.icon className="w-6 h-6" />
                </div>
                {(!isPending && currentPlan?.id === plan.id) && (
                  <div className="px-3 py-1 bg-surface border border-primary text-primary text-[10px] font-display font-bold rounded-full uppercase tracking-[2px]">
                    Seu Plano
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-display font-bold text-on-surface tracking-tight mb-2 uppercase">{plan.name}</h3>
              <p className="text-sm text-on-surface-variant mb-8 min-h-[40px]">{plan.description}</p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    {plan.projects > 0 ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Minus className="w-3 h-3 text-error" />}
                  </div>
                  <span className="text-sm text-on-surface">
                    {plan.projects === 0 ? (
                      <span className="text-on-surface-variant">Sem Gestão de Obras</span>
                    ) : (
                      <><strong>{plan.projects}</strong> {plan.projects === 1 ? 'Obra Ativa' : 'Obras Ativas'}</>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-on-surface">
                    <strong>{plan.regularizations}</strong> {plan.regularizations === 1 ? 'Regularização INSS' : 'Regularizações INSS'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-on-surface">
                    Calculadora INSS <strong>Ilimitada</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-on-surface">
                    Simulador Hab. <strong>Ilimitado</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 opacity-60">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-surface flex items-center justify-center border border-outline">
                    <Shield className="w-3 h-3 text-on-surface-variant" />
                  </div>
                  <span className="text-sm text-on-surface-variant">
                    Suporte & Atualizações
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8 pt-0 mt-auto">
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={!isPending && currentPlan?.id === plan.id}
                className={cn(
                  "w-full py-4 rounded-xl font-display font-bold uppercase tracking-[2px] text-[11px] flex items-center justify-center gap-2 transition-all duration-300",
                  (!isPending && currentPlan?.id === plan.id)
                    ? "bg-surface border border-outline text-on-surface-variant cursor-not-allowed opacity-50"
                    : plan.popular
                      ? "bg-primary text-background shadow-[0_0_20px_-5px_rgba(34,255,136,0.4)] hover:scale-[1.02]"
                      : "bg-surface-container-high text-on-surface border border-outline hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                )}
              >
                {(!isPending && currentPlan?.id === plan.id) ? 'Plano Atual' : (isPending ? 'ASSINAR AGORA' : 'Mudar Plano')}
                {(!isPending && currentPlan?.id === plan.id) ? null : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

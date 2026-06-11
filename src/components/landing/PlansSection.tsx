import React from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight } from 'lucide-react';

interface PlansSectionProps {
  onCtaClick: () => void;
}

export function PlansSection({ onCtaClick }: PlansSectionProps) {
  const plans = [
    {
      name: "Starter",
      description: "Para profissionais autônomos começando a organizar processos.",
      features: ["1 Obra", /* "1 Regularização", */ "Ferramentas Inclusas (Gestão Básica)"],
      isPopular: false
    },
    {
      name: "Professional",
      description: "Ideal para pequenos escritórios com demandas recorrentes.",
      features: ["3 Obras", /* "3 Regularizações", */ "Ferramentas Inclusas (Acesso Completo)" /*, "Simulador Habitacional", "Calculadora de INSS" */],
      isPopular: true
    },
    {
      name: "Business",
      description: "Para construtoras que precisam de controle total em escala.",
      features: ["10 Obras", /* "10 Regularizações", */ "Ferramentas Inclusas", "Relatórios Avançados", "Múltiplos Usuários", "Suporte Prioritário"],
      isPopular: false
    }
    // {
    //   name: "INSS",
    //   description: "Módulo exclusivo para cálculo e gestão previdenciária de obras.",
    //   features: ["Acesso apenas às ferramentas de INSS", "Simulações Ilimitadas", "Relatórios CNO/SERO"],
    //   isPopular: false
    // }
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden" id="planos">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-on-surface mb-6">
            Escolha o plano ideal
          </h2>
          <p className="text-on-surface-variant text-lg">
            Modelos de assinatura flexíveis que crescem junto com a sua empresa.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex flex-col p-8 rounded-3xl transition-all duration-300 ${
                plan.isPopular 
                  ? 'bg-surface border-2 border-primary shadow-2xl shadow-primary/10 scale-105 z-10' 
                  : 'bg-surface/50 border border-outline hover:border-primary/50 hover:bg-surface'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-primary text-background text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                    Mais Vendido
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-on-surface mb-2">{plan.name}</h3>
                <p className="text-sm text-on-surface-variant min-h-[40px]">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm text-on-surface-variant">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={onCtaClick}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider transition-all ${
                  plan.isPopular
                    ? 'bg-primary text-background hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-surface-variant text-on-surface hover:bg-outline border border-outline'
                }`}
              >
                Solicitar Demonstração
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

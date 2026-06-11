import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

export function SolutionsSection() {
  const solutions = [
    "Gestão Financeira Centralizada",
    "Diário de Obra Fotográfico",
    "Portal do Cliente 100% Transparente",
    // "Simulador Habitacional Inteligente",
    // "Calculadora de INSS Integrada",
    // "Módulo de Regularização de Imóveis",
    "Relatórios Gerenciais Automáticos",
    "Controle de Cronograma Físico-Financeiro",
    "Gestão de Tarefas e Equipes",
    "Controle de Compras e Estoque",
    "Dashboard de Indicadores em Tempo Real"
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden" id="funcionalidades">
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block mb-4">
             <span className="bg-success/10 text-success text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full">A Solução Definitiva</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-on-surface mb-6">
            O 360PRO resolve tudo isso
          </h2>
          <p className="text-on-surface-variant text-lg">
            Todas as ferramentas que você precisa para gerenciar sua construtora, escritório de arquitetura ou engenharia em um único lugar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group flex flex-col items-center text-center gap-4 p-6 rounded-3xl bg-surface/30 border border-outline/50 hover:bg-surface hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-success/20 transition-all">
                 <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <span className="text-on-surface text-sm md:text-base font-bold">{solution}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

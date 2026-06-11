import React from 'react';
import { motion } from 'motion/react';
import { XCircle } from 'lucide-react';

export function ProblemsSection() {
  const problems = [
    "Controle financeiro descentralizado",
    "Falta de transparência para clientes",
    // "Cálculo de INSS complexo e demorado",
    // "Regularizações espalhadas em pastas físicas",
    "Informações perdidas no WhatsApp",
    "Retrabalho constante entre equipes",
    "Dificuldade em acompanhar o avanço físico",
    "Orçamentos estourados por falta de gestão"
  ];

  return (
    <section className="py-24 bg-surface/20 border-y border-outline/30 relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-on-surface mb-6">
            Você ainda gerencia suas obras com planilhas e processos manuais?
          </h2>
          <p className="text-on-surface-variant text-lg">
            O mercado da construção civil mudou. Processos analógicos geram perda de dinheiro, atrasos e clientes insatisfeitos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 p-6 rounded-2xl bg-surface/40 border border-error/10 hover:border-error/30 transition-colors"
            >
              <XCircle className="w-6 h-6 text-error shrink-0 mt-0.5" />
              <span className="text-on-surface-variant text-sm md:text-base font-medium">{problem}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

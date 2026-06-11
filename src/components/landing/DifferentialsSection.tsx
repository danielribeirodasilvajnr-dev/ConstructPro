import React from 'react';
import { motion } from 'motion/react';
import { Layers, Calculator, Home, Users, Cloud, HardHat, FileText } from 'lucide-react';

export function DifferentialsSection() {
  const differentials = [
    {
      icon: <FileText />,
      title: "Funcionalidade Exclusiva",
      description: "Uma ferramenta inédita que está sendo desenvolvida para revolucionar os seus processos.",
      isExclusive: true
    },
    {
      icon: <Home />,
      title: "Funcionalidade Exclusiva",
      description: "Mais poder e inteligência para sua construtora. Detalhes serão revelados no lançamento.",
      isExclusive: true
    },
    {
      icon: <Calculator />,
      title: "Funcionalidade Exclusiva",
      description: "Uma solução automatizada que vai economizar dezenas de horas da sua equipe.",
      isExclusive: true
    },
    {
      icon: <Layers />,
      title: "Funcionalidade Exclusiva",
      description: "Controle absoluto sobre processos complexos, de forma simples e integrada.",
      isExclusive: true
    },
    {
      icon: <Users />,
      title: "Portal do Cliente",
      description: "Transparência total. Seu cliente acompanha fotos, documentos e pagamentos."
    },
    {
      icon: <HardHat />,
      title: "Feito por Profissionais",
      description: "Sistema criado por engenheiros que vivem a realidade das obras."
    }
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-on-surface mb-6">
            Por que escolher o 360PRO?
          </h2>
          <p className="text-on-surface-variant text-lg">
            Muito mais do que um gestor de tarefas. Uma plataforma completa de inteligência para construtoras e escritórios.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {differentials.map((diff, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-surface border border-outline hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-background text-primary transition-colors">
                  {React.cloneElement(diff.icon as any, { className: 'w-7 h-7' })}
                </div>
                {(diff as any).isExclusive && (
                  <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-[1px] px-2 py-1 rounded-md">
                    Funcionalidade Exclusiva
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">{diff.title}</h3>
              <p className="text-on-surface-variant leading-relaxed">
                {diff.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

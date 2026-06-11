import React from 'react';
import { motion } from 'motion/react';
import { Calculator, Home, HardHat, FileText, Wallet, Camera, PieChart } from 'lucide-react';

export function ExclusiveToolsSection() {
  const tools = [
    { icon: <Calculator />, name: "Calculadora de INSS", badge: "Premium", span: "md:col-span-2 lg:col-span-1 lg:row-span-2", bg: "bg-rose-500/10", border: "border-rose-500/30", iconColor: "text-rose-500" },
    { icon: <Home />, name: "Simulador Habitacional", span: "col-span-1", bg: "bg-indigo-500/10", border: "border-indigo-500/30", iconColor: "text-indigo-500" },
    { icon: <HardHat />, name: "Gestão de Obras", span: "col-span-1", bg: "bg-amber-500/10", border: "border-amber-500/30", iconColor: "text-amber-500" },
    { icon: <FileText />, name: "Regularizações", span: "col-span-1", bg: "bg-cyan-500/10", border: "border-cyan-500/30", iconColor: "text-cyan-500" },
    { icon: <Wallet />, name: "Fluxo Financeiro", span: "md:col-span-2 lg:col-span-1", bg: "bg-emerald-500/10", border: "border-emerald-500/30", iconColor: "text-emerald-500" },
    { icon: <Camera />, name: "Diário de Obra", span: "col-span-1", bg: "bg-blue-500/10", border: "border-blue-500/30", iconColor: "text-blue-500" },
    { icon: <PieChart />, name: "Relatórios Automáticos", span: "col-span-1", bg: "bg-purple-500/10", border: "border-purple-500/30", iconColor: "text-purple-500" }
  ];

  return (
    <section className="py-24 bg-surface/20 border-y border-outline/30 relative">
      <div className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-on-surface mb-6">
            Ferramentas que você não encontra em outros sistemas
          </h2>
          <p className="text-on-surface-variant text-lg">
            Desenhado para ser o hub central do seu negócio na construção civil.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 gap-4 max-w-5xl mx-auto auto-rows-[160px]">
          {tools.map((tool, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`${tool.span} group rounded-3xl ${tool.bg} border ${tool.border} p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 relative overflow-hidden backdrop-blur-sm`}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className={`w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center ${tool.iconColor} shadow-sm`}>
                  {React.cloneElement(tool.icon as any, { className: 'w-6 h-6' })}
                </div>
                {tool.badge && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full shadow-lg shadow-rose-500/30">
                    {tool.badge}
                  </span>
                )}
              </div>
              
              <h3 className={`text-lg md:text-xl font-bold ${tool.iconColor} relative z-10 drop-shadow-sm`}>
                {tool.name}
              </h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

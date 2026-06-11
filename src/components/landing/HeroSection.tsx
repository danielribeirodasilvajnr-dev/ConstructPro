import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play, BarChart3, Users, Building, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onCtaClick: () => void;
}

export function HeroSection({ onCtaClick }: HeroSectionProps) {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[200px] pointer-events-none animate-pulse" />

      <div className="container relative z-10 px-6 mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Text Content */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-8 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-display font-bold uppercase tracking-[2px] w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Plataforma Premium para Construção
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-on-surface leading-[1.1]">
            A Plataforma Completa para <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Gestão, Financeiro e Controle</span> de Obras
            {/* FUTURO: A Plataforma Completa para <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Gestão, Regularização e Controle</span> de Obras */}
          </h1>

          <p className="text-lg md:text-xl text-on-surface-variant font-light leading-relaxed">
            Gerencie obras, financeiro, diário de obra e clientes em um único sistema desenvolvido para profissionais da construção civil.
            {/* FUTURO: Gerencie obras, regularizações, INSS e clientes em um único sistema desenvolvido para profissionais da construção civil. */}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={onCtaClick}
              className="group relative flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-display font-bold text-background transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_-10px_rgba(34,255,136,0.5)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <span className="relative z-10">Solicitar Demonstração</span>
              <ArrowRight className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1" />
            </button>
            <button 
              onClick={() => {
                document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group flex items-center justify-center gap-2 rounded-xl bg-surface border border-outline px-8 py-4 text-sm font-display font-bold text-on-surface transition-all hover:bg-surface-variant hover:border-outline-variant"
            >
              <Play className="h-4 w-4 text-primary" />
              <span>Conhecer Funcionalidades</span>
            </button>
          </div>

          <div className="flex items-center gap-6 pt-6 text-sm text-on-surface-variant">
             <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Sem taxa de setup</div>
             <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Suporte VIP</div>
          </div>
        </motion.div>

        {/* Abstract UI Mockup Wrapper */}
        <div className="relative w-full aspect-[4/3] hidden lg:block">
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full h-full rounded-3xl border border-outline/50 bg-surface/40 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col relative z-10"
          >
            {/* Mockup Header */}
            <div className="h-12 border-b border-outline/50 flex items-center px-4 gap-2 bg-surface/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-error/80" />
                <div className="w-3 h-3 rounded-full bg-warning/80" />
                <div className="w-3 h-3 rounded-full bg-success/80" />
              </div>
              <div className="mx-auto px-12 py-1.5 rounded-md bg-surface border border-outline text-[10px] text-on-surface-variant font-mono">
                app.360pro.com.br/dashboard
              </div>
            </div>
            
            {/* Mockup Body */}
            <div className="flex-1 flex p-4 gap-4 bg-background/50">
              {/* Sidebar Skeleton */}
              <div className="w-16 rounded-xl border border-outline/50 bg-surface/50 flex flex-col items-center py-4 gap-4">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                  <Building className="w-4 h-4 text-primary" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-on-surface-variant" />
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-on-surface-variant" />
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-on-surface-variant" />
                </div>
              </div>

              {/* Main Content Skeleton */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                   <div className="flex flex-col">
                     <div className="text-[10px] font-bold text-primary uppercase tracking-[2px]">Projeto Ativo</div>
                     <div className="text-lg font-bold text-on-surface">Residencial Alpha</div>
                   </div>
                   <div className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[9px] font-bold uppercase tracking-[1px]">Em Andamento</div>
                </div>
                
                {/* Cards Grid */}
                <div className="grid grid-cols-3 gap-4">
                   {[1, 2, 3].map((i) => (
                     <motion.div 
                       key={i}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.4 + (i * 0.1) }}
                       className="h-24 rounded-xl border border-outline/50 bg-surface/50 p-3 flex flex-col justify-between"
                     >
                       <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            {i === 1 && <BarChart3 className="w-4 h-4 text-primary" />}
                            {i === 2 && <ShieldCheck className="w-4 h-4 text-primary" />}
                            {i === 3 && <Users className="w-4 h-4 text-primary" />}
                         </div>
                         <span className="text-[8px] font-bold uppercase text-on-surface-variant tracking-[1px] leading-tight">
                            {i === 1 && "VALOR DO CONTRATO"}
                            {i === 2 && "SALDO EM CAIXA"}
                            {i === 3 && "AVANÇO FÍSICO"}
                         </span>
                       </div>
                       <div>
                         <div className="text-sm font-bold text-on-surface">
                            {i === 1 && "R$ 1.250.000"}
                            {i === 2 && "R$ 450.000"}
                            {i === 3 && "65%"}
                         </div>
                       </div>
                     </motion.div>
                   ))}
                </div>

                {/* Chart Area */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex-1 rounded-xl border border-outline/50 bg-surface/50 p-4 flex flex-col"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-[2px] text-on-surface">Distribuição de Custos</span>
                    <div className="flex gap-3">
                      <span className="text-[8px] flex items-center gap-1 font-bold text-on-surface-variant uppercase"><div className="w-2 h-2 rounded-full bg-primary" /> Realizado</span>
                      <span className="text-[8px] flex items-center gap-1 font-bold text-on-surface-variant uppercase"><div className="w-2 h-2 rounded-full bg-outline" /> Previsto</span>
                    </div>
                  </div>
                  <div className="flex-1 flex items-end gap-3 px-2">
                     {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                       <div key={i} className="flex-1 flex gap-1 items-end h-full">
                         <motion.div 
                           initial={{ height: 0 }}
                           animate={{ height: `${h + 15}%` }}
                           transition={{ delay: 1 + (i * 0.1), duration: 0.5 }}
                           className="flex-1 bg-surface-variant border border-outline border-b-0 rounded-t-sm"
                         />
                         <motion.div 
                           initial={{ height: 0 }}
                           animate={{ height: `${h}%` }}
                           transition={{ delay: 1 + (i * 0.1), duration: 0.5 }}
                           className="flex-1 bg-primary/80 rounded-t-sm"
                         />
                       </div>
                     ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Floating Element (Moved outside of the overflow-hidden container) */}
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 1.5 }}
             className="absolute -right-6 bottom-12 p-4 rounded-2xl bg-surface border border-outline shadow-xl flex items-center gap-4 z-20"
          >
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <div className="text-sm font-bold text-on-surface whitespace-nowrap">Obra Finalizada</div>
              <div className="text-xs text-on-surface-variant whitespace-nowrap">Cronograma 100%</div>
              {/* FUTURO: <div className="text-xs text-on-surface-variant whitespace-nowrap">Regularização 100%</div> */}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

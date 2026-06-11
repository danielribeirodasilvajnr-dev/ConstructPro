import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Zap } from 'lucide-react';

interface CtaSectionProps {
  onCtaClick: () => void;
}

export function CtaSection({ onCtaClick }: CtaSectionProps) {
  return (
    <section className="py-24 bg-surface relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-surface-variant/50 backdrop-blur-xl border border-outline rounded-[40px] p-10 md:p-16 text-center shadow-2xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-display font-bold uppercase tracking-[2px] w-fit mb-8">
            <Zap className="w-3 h-3" />
            Comece Agora Mesmo
          </div>

          <h2 className="text-4xl md:text-6xl font-display font-bold text-on-surface mb-6 leading-tight">
            Transforme a gestão das suas obras
          </h2>
          
          <p className="text-xl text-on-surface-variant mb-10 max-w-2xl mx-auto leading-relaxed">
            Centralize processos, reduza retrabalho e ofereça mais transparência aos seus clientes. O futuro da construção civil já chegou.
          </p>

          <button 
            onClick={onCtaClick}
            className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-10 py-5 text-sm md:text-base font-display font-bold text-background transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_-10px_rgba(34,255,136,0.6)] overflow-hidden uppercase tracking-[3px]"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <span className="relative z-10">Solicitar Demonstração</span>
            <ArrowRight className="h-5 w-5 relative z-10 transition-transform group-hover:translate-x-2" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

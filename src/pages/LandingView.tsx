import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  ShieldCheck, 
  LineChart, 
  Camera, 
  Calculator, 
  ChevronRight,
  HardHat,
  Layers,
  Zap
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LandingViewProps {
  onLogin: () => void;
}

export function LandingView({ onLogin }: LandingViewProps) {
  const { theme } = useTheme();

  const benefits = [
    {
      icon: <LineChart className="w-6 h-6 text-primary" />,
      title: "Gestão Financeira",
      description: "Controle total sobre o orçamento, custos e fluxo de caixa da sua obra em tempo real."
    },
    {
      icon: <Camera className="w-6 h-6 text-primary" />,
      title: "Diário de Obra",
      description: "Acompanhe a evolução do projeto através de relatórios fotográficos diários e logs detalhados."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
      title: "Transparência Total",
      description: "Acesso seguro para proprietários visualizarem o progresso e aprovarem etapas com total segurança."
    },
    {
      icon: <Calculator className="w-6 h-6 text-primary" />,
      title: "Simulações Exatas",
      description: "Ferramentas integradas para cálculo de INSS, simulações habitacionais e previsões de custos."
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* High-Tech Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[200px] pointer-events-none animate-pulse" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full py-6 px-8 flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden border border-outline shadow-xl bg-surface">
             <img src={theme === 'dark' ? "/logo-dark.png" : "/logo-light.png"} alt="360Pro" className="w-full h-full object-cover relative z-10" />
          </div>
          <span className="text-xl font-display font-bold uppercase tracking-[4px] text-on-surface">
            360<span className="text-primary">Pro</span>
          </span>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onLogin}
          className="group relative flex items-center gap-2 rounded-xl bg-surface/50 backdrop-blur-md border border-outline px-6 py-2.5 text-xs font-display font-bold text-on-surface transition-all hover:border-primary/50 hover:bg-primary/5 uppercase tracking-[2px]"
        >
          Acessar Sistema
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </motion.button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-display font-bold uppercase tracking-[3px] mb-4">
            <Zap className="w-3 h-3" />
            O Futuro da Gestão de Obras
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-[2px] text-on-surface leading-tight">
            CONTROLE TOTAL <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/40">
              DA SUA OBRA
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto font-light leading-relaxed">
            Plataforma centralizada para gestão financeira, acompanhamento diário, controle de cronograma e relatórios transparentes para clientes.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              onClick={onLogin}
              className="group relative flex w-full sm:w-auto items-center justify-center gap-4 rounded-2xl bg-primary px-10 py-5 text-sm font-display font-bold text-background transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_-10px_rgba(34,255,136,0.6)] uppercase tracking-[4px] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              INICIAR AGORA
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <div className="w-full max-w-6xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
              className="group relative bg-surface/40 backdrop-blur-xl border border-outline rounded-[32px] p-8 hover:border-primary/30 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/30 transition-all duration-700" />
              
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                {benefit.icon}
              </div>
              
              <h3 className="text-lg font-display font-bold text-on-surface mb-3 tracking-wide">
                {benefit.title}
              </h3>
              
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-on-surface-variant/50 text-xs font-display tracking-[2px] uppercase">
        &copy; {new Date().getFullYear()} 360Pro. Todos os direitos reservados.
      </footer>
    </div>
  );
}

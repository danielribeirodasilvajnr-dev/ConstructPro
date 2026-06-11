import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowRight } from 'lucide-react';

import { HeroSection } from '../components/landing/HeroSection';
import { ProblemsSection } from '../components/landing/ProblemsSection';
import { SolutionsSection } from '../components/landing/SolutionsSection';
import { GallerySection } from '../components/landing/GallerySection';
import { DifferentialsSection } from '../components/landing/DifferentialsSection';
import { MetricsSection } from '../components/landing/MetricsSection';
import { ExclusiveToolsSection } from '../components/landing/ExclusiveToolsSection';
import { PlansSection } from '../components/landing/PlansSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { FaqSection } from '../components/landing/FaqSection';
import { CtaSection } from '../components/landing/CtaSection';

interface LandingViewProps {
  onLogin: () => void;
}

export function LandingViewV2({ onLogin }: LandingViewProps) {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-background relative flex flex-col font-sans">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full z-50 py-6 px-6 lg:px-12 flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="relative flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-2xl overflow-hidden border border-outline shadow-xl bg-surface">
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
          className="group relative flex items-center gap-2 rounded-xl bg-surface/50 backdrop-blur-md border border-outline px-5 py-2.5 lg:px-6 lg:py-2.5 text-xs font-display font-bold text-on-surface transition-all hover:border-primary/50 hover:bg-primary/5 uppercase tracking-[2px]"
        >
          Acessar Sistema
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </motion.button>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <HeroSection onCtaClick={onLogin} />
        <ProblemsSection />
        <SolutionsSection />
        <GallerySection />
        <DifferentialsSection />
        <MetricsSection />
        <ExclusiveToolsSection />
        <PlansSection onCtaClick={onLogin} />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection onCtaClick={onLogin} />
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 bg-surface border-t border-outline text-center">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface">
               <img src={theme === 'dark' ? "/logo-dark.png" : "/logo-light.png"} alt="360Pro" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-display font-bold uppercase tracking-[3px] text-on-surface">
              360<span className="text-primary">Pro</span>
            </span>
          </div>
          <p className="text-on-surface-variant/70 text-xs font-display tracking-[2px] uppercase">
            &copy; {new Date().getFullYear()} 360Pro. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

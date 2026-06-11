import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Wallet, BookOpen, Home, Calculator, FileText, PieChart, Users, X } from 'lucide-react';

export function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const screens = [
    { id: 1, title: "Dashboard Principal", icon: <LayoutDashboard />, color: "bg-blue-500/10 text-blue-500" },
    { id: 2, title: "Gestão Financeira", icon: <Wallet />, color: "bg-emerald-500/10 text-emerald-500" },
    { id: 3, title: "Diário de Obra", icon: <BookOpen />, color: "bg-amber-500/10 text-amber-500" },
    // { id: 4, title: "Simulador Habitacional", icon: <Home />, color: "bg-indigo-500/10 text-indigo-500" },
    // { id: 5, title: "Calculadora de INSS", icon: <Calculator />, color: "bg-rose-500/10 text-rose-500" },
    // { id: 6, title: "Regularizações", icon: <FileText />, color: "bg-cyan-500/10 text-cyan-500" },
    { id: 7, title: "Relatórios", icon: <PieChart />, color: "bg-purple-500/10 text-purple-500" },
    { id: 8, title: "Portal do Cliente", icon: <Users />, color: "bg-orange-500/10 text-orange-500" },
  ];

  return (
    <section className="py-24 bg-surface/20 border-y border-outline/30">
      <div className="container mx-auto px-6">
         <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-on-surface mb-6">
            Conheça o 360PRO por dentro
          </h2>
          <p className="text-on-surface-variant text-lg">
            Uma interface pensada na melhor experiência de uso. Simples, bonita e extremamente funcional.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {screens.map((screen, index) => (
            <motion.div
              key={screen.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedImage(screen.id)}
              className="group cursor-pointer aspect-video rounded-2xl bg-surface border border-outline hover:border-primary/50 overflow-hidden relative flex flex-col items-center justify-center gap-3 transition-all"
            >
               {/* Abstract background representation of a screen */}
               <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
               <div className="absolute inset-x-0 top-0 h-4 bg-surface-variant/50 border-b border-outline flex items-center px-2 gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-outline"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-outline"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-outline"></div>
               </div>
               
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${screen.color} relative z-10 group-hover:scale-110 transition-transform`}>
                  {React.cloneElement(screen.icon as any, { className: 'w-6 h-6' })}
               </div>
               <span className="text-xs font-bold text-on-surface relative z-10">{screen.title}</span>
               
               <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors z-0" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal View */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl aspect-video bg-surface rounded-3xl border border-outline shadow-2xl flex flex-col overflow-hidden"
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-background/50 hover:bg-background text-on-surface transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              {/* Fake System Window */}
              <div className="h-10 bg-surface-variant flex items-center px-4 border-b border-outline">
                 <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-error" />
                   <div className="w-3 h-3 rounded-full bg-warning" />
                   <div className="w-3 h-3 rounded-full bg-success" />
                 </div>
                 <div className="mx-auto text-sm font-medium text-on-surface-variant">
                   {screens.find(s => s.id === selectedImage)?.title}
                 </div>
              </div>
              <div className="flex-1 bg-background flex items-center justify-center">
                 <div className="text-center space-y-6">
                    <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center ${screens.find(s => s.id === selectedImage)?.color}`}>
                      {React.cloneElement(screens.find(s => s.id === selectedImage)?.icon as any, { className: 'w-12 h-12' })}
                    </div>
                    <div className="text-2xl font-bold text-on-surface">
                       Visualização Ampliada: {screens.find(s => s.id === selectedImage)?.title}
                    </div>
                    <div className="text-on-surface-variant max-w-md mx-auto">
                       Aqui será exibida a imagem real da tela ({screens.find(s => s.id === selectedImage)?.title}). Adicione o arquivo correspondente na pasta public e atualize o código.
                    </div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

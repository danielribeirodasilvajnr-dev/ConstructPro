import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Moon, 
  Sun, 
  Bell, 
  Mail, 
  Globe, 
  Check, 
  Monitor,
  MousePointer2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [notifications, setNotifications] = useState({
    email: true,
    system: true,
    whatsapp: false
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10 overflow-y-auto pt-[5vh] md:pt-[10vh]">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#181C21] rounded-3xl border border-white/5 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#4170FF]/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-2xl">
                  <Settings className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Configurações</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Personalize sua experiência</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 space-y-10 max-h-[80vh] overflow-y-auto pr-4 custom-scrollbar">
              {/* Theme Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Aparência Visual</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Escolha o tema que mais lhe agrada</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'dark', label: 'Escuro', icon: Moon },
                    { id: 'light', label: 'Claro', icon: Sun },
                    { id: 'system', label: 'Sistema', icon: Monitor },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all active:scale-95 group",
                        theme === t.id 
                          ? "bg-[#4170FF]/10 border-[#4170FF] text-[#4170FF]" 
                          : "bg-black/20 border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      <t.icon className={cn("h-6 w-6 transition-transform group-hover:scale-110", theme === t.id && "scale-110")} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Notifications Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Notificações</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Controle como você é avisado</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 'system', label: 'Alertas do Sistema', desc: 'Notificações dentro da plataforma', icon: Bell },
                    { id: 'email', label: 'E-mail Diário', desc: 'Resumo das atividades da obra por e-mail', icon: Mail },
                    { id: 'whatsapp', label: 'Mensagens WhatsApp', desc: 'Alertas urgentes via WhatsApp', icon: MousePointer2 },
                  ].map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => setNotifications(prev => ({ ...prev, [n.id]: !prev[n.id as keyof typeof prev] }))}
                      className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-800 rounded-xl group-hover:bg-slate-700 transition-colors">
                          <n.icon className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{n.label}</p>
                          <p className="text-[10px] text-slate-500">{n.desc}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "w-12 h-6 rounded-full relative transition-all duration-300 transition-all",
                        notifications[n.id as keyof typeof notifications] ? "bg-[#4170FF]" : "bg-slate-800"
                      )}>
                        <div className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-lg",
                          notifications[n.id as keyof typeof notifications] ? "left-7" : "left-1"
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Language Section */}
              <section className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Idioma e Região</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Defina suas preferências regionais</p>
                </div>
                <div className="p-4 bg-black/20 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-slate-800 rounded-xl">
                      <Globe className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-xs font-bold text-slate-200">Português (Brasil)</p>
                  </div>
                  <span className="text-[10px] font-black text-[#4170FF] uppercase tracking-widest bg-[#4170FF]/10 px-2 py-1 rounded">Padrão</span>
                </div>
              </section>

              {/* Footer Actions */}
              <div className="flex gap-4 pt-6 border-t border-white/5">
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-[#4170FF] text-white text-xs font-black uppercase tracking-[2px] rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
                >
                  <Check className="h-4 w-4" /> Finalizar Ajustes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Search,
  ChevronLeft,
  Bell,
  CircleHelp,
  Settings,
  LogOut,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-800 bg-[#181C21]/85 px-8 backdrop-blur-md">
      <div className="flex items-center gap-8">
        {title && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tighter text-white">{title}</h1>
          </div>
        )}
        {!title && <h1 className="text-xl font-bold tracking-tighter text-white uppercase tracking-[4px] text-sm opacity-50">ConstructPro</h1>}
        
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar no ConstructPro..." 
            className="w-96 rounded-xl border border-slate-800 bg-[#0B0F15] py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:border-[#4170FF] outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-[#4170FF]/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex gap-2 text-slate-400">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }}
              className={cn(
                "relative p-2.5 rounded-xl transition-all",
                isNotificationsOpen ? "bg-[#4170FF]/10 text-[#4170FF]" : "hover:bg-white/5"
              )}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#f97316] border-2 border-[#181C21]"></span>
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-[#1e2430] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notificações</span>
                      <span className="text-[9px] font-bold text-[#4170FF] cursor-pointer hover:underline">Marcar todas como lidas</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                      {[
                        { icon: CheckCircle2, text: 'Novo Diário de Obra enviado', time: 'Há 5 min', color: 'text-emerald-500' },
                        { icon: AlertCircle, text: 'Atraso no cronograma detectado', time: 'Há 1 hora', color: 'text-amber-500' },
                        { icon: Bell, text: 'Novo colaborador adicionado', time: 'Há 3 horas', color: 'text-[#4170FF]' },
                      ].map((n, i) => (
                        <div key={i} className="p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0 group">
                          <div className="flex gap-3">
                            <div className={cn("mt-1 p-1.5 rounded-lg bg-black/20", n.color)}>
                              <n.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs text-slate-200 group-hover:text-white transition-colors">{n.text}</p>
                              <p className="text-[10px] text-slate-500">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-black/20 text-center border-t border-white/5">
                      <span className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest cursor-pointer">Ver todas as notificações</span>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors">
            <CircleHelp className="h-5 w-5" />
          </button>
          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Avatar */}
        <div className="relative">
          <div 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }}
            className={cn(
              "h-10 w-10 overflow-hidden rounded-xl border-2 shadow-xl cursor-pointer transition-all active:scale-95",
              isProfileOpen ? "border-[#4170FF] ring-4 ring-[#4170FF]/10 scale-105" : "border-slate-800 hover:border-slate-600"
            )}
          >
            <img 
              src={user?.user_metadata?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuDr2KBEM3IfNuLeYQzBV2epZtmQRHo705P26eLsIJNDiEclnujrH-W8yGNhysNXXqjOiVzILkQhCDIwxjR0PGIerPvj8eqJTY7Oc8UEQKKnhaSsupnlPqauvvqKk3HoJNEcvL1Kyc0iwjG1Z-tQN2YkiFoDh5SO8ALfjcgKp8FuaK6v3Tsp4RQcn2s7yE3k14OYP1RI8jfXjJ8uHoczokjDD4vwOK4TciQdENZTm185x4zIDC_1ElKSlJ8kQxS_R-2KzY0iRSGLhg"} 
              alt="Profile" 
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <AnimatePresence>
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-64 bg-[#1e2430] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-5 bg-black/20 border-b border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mb-1">Logado como</p>
                    <p className="text-sm font-bold text-white truncate">{user?.email || 'Usuário ConstructPro'}</p>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                      <User className="h-4 w-4 group-hover:text-[#4170FF]" /> Meu Perfil
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                      <Settings className="h-4 w-4 group-hover:text-[#4170FF]" /> Configurações
                    </button>
                    <div className="h-px bg-white/5 my-2 mx-2"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all group"
                    >
                      <LogOut className="h-4 w-4" /> Sair da Conta
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

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
  AlertCircle,
  Camera,
  Loader2,
  Menu
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { ProfileModal } from './profile/ProfileModal';
import { SettingsModal } from './profile/SettingsModal';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setUser({ ...user, profile });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };


  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 md:h-20 items-center justify-between border-b border-slate-800 bg-[#1C232E]/85 px-4 md:px-8 backdrop-blur-md">
        <div className="flex items-center gap-4 md:gap-8">
          <button 
            onClick={onMenuClick}
            className="p-2 -ml-2 text-slate-400 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>

          {title && (
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => window.history.back()}
                className="text-slate-500 hover:text-white transition-colors hidden md:block"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg md:text-xl font-bold tracking-tighter text-white truncate max-w-[150px] md:max-w-none">{title}</h1>
            </div>
          )}
          {!title && <h1 className="text-xl font-bold tracking-tighter text-white uppercase tracking-[4px] text-sm opacity-50 hidden md:block">AevumPro</h1>}
          
          <div className="relative hidden xl:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar no AevumPro..." 
              className="w-96 rounded-xl border border-slate-800 bg-[#2B3647] py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:border-[#BCB5AC] outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-[#BCB5AC]/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#BCB5AC] ring-2 ring-[#1C232E]" />
            </button>
            
            <AnimatePresence>
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-[#1C232E] rounded-2xl border border-white/5 shadow-2xl p-4 z-20"
                  >
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Notificações</h3>
                      <span className="px-2 py-0.5 bg-[#BCB5AC]/10 text-[#BCB5AC] text-[8px] font-bold rounded">2 Novas</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-200 line-clamp-1 group-hover:text-white">Pagamento Confirmado</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">A fatura da obra "Residencial..."</p>
                        </div>
                      </div>
                      <div className="flex gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
                        <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-200 line-clamp-1 group-hover:text-white">Atraso na Entrega</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">O fornecedor de cimento atrasou...</p>
                        </div>
                      </div>
                    </div>
                    <button className="w-full mt-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                      Ver todas as notificações
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <CircleHelp className="h-5 w-5" />
          </button>
          
          <div className="h-8 w-px bg-white/5 mx-2" />

          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1.5 md:pl-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group active:scale-95"
            >
              <div className="flex-col items-end hidden md:flex">
                <span className="text-xs font-black text-white tracking-tight group-hover:text-[#BCB5AC] transition-colors line-clamp-1 max-w-[120px]">
                  {user?.profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                </span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[1px]">Administrador</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[#BCB5AC]/10 flex items-center justify-center text-[#BCB5AC] font-black border border-[#BCB5AC]/20 overflow-hidden shadow-inner group-hover:border-[#BCB5AC]/40 transition-all">
                {user?.profile?.avatar_url ? (
                  <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (user?.email || 'A').charAt(0).toUpperCase()
                )}
              </div>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-[#1C232E] rounded-2xl border border-white/5 shadow-2xl overflow-hidden z-20"
                  >
                    <div className="p-4 bg-gradient-to-br from-[#BCB5AC]/20 via-[#BCB5AC]/5 to-transparent border-b border-white/5 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-[#BCB5AC] flex items-center justify-center text-[#1C232E] font-black text-xl shadow-lg border border-white/20 overflow-hidden">
                        {user?.profile?.avatar_url ? (
                          <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (user?.email || 'A').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black text-[#BCB5AC] uppercase tracking-widest mb-0.5">Conta Ativa</p>
                        <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <button 
                        onClick={() => { setIsProfileModalOpen(true); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                      >
                        <User className="h-4 w-4 group-hover:text-[#BCB5AC]" /> Detalhes do Perfil
                      </button>
                      <button 
                        onClick={() => { setIsSettingsModalOpen(true); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                      >
                        <Settings className="h-4 w-4 group-hover:text-[#BCB5AC]" /> Configurações
                      </button>
                      <div className="h-px bg-white/5 my-2 mx-2"></div>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all"
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

      <div className="z-[100]">
        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
          onUpdate={fetchUser}
        />
        <SettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
        />
      </div>
    </>
  );
}

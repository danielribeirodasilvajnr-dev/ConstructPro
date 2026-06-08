import React, { useState } from 'react';
import {
  Search,
  Bell,
  CircleHelp,
  Settings,
  LogOut,
  User,
  CheckCircle2,
  AlertCircle,
  Menu,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ProfileModal } from './profile/ProfileModal';
import { SettingsModal } from './profile/SettingsModal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user, profile, isProprietor, signOut, refreshRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatDisplayName = (name: string) => {
    if (!name) return 'Usuário';
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 1) return name;
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-20 md:h-24 items-center justify-between border-b border-outline bg-surface/80 px-4 md:px-12 backdrop-blur-xl">
        <div className="flex items-center gap-6 md:gap-12">
          <button
            onClick={onMenuClick}
            className="p-3 -ml-3 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-2xl transition-all duration-300 active:scale-90"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="relative hidden xl:block group">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="PESQUISAR NO 360PRO..."
              className="w-[450px] rounded-2xl border border-outline bg-background/50 py-3.5 pl-12 pr-4 text-xs font-display tracking-widest text-on-surface focus:border-primary/50 outline-none transition-all placeholder:text-on-surface-variant/40 focus:ring-4 focus:ring-primary/5 shadow-inner"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-8">
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-3 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-2xl transition-all duration-300"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(34,255,136,0.8)] animate-pulse" />
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-96 bg-surface-container-high/95 backdrop-blur-2xl rounded-3xl border border-outline shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] p-6 z-20"
                  >
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline">
                      <h3 className="text-xs font-display font-bold text-on-surface uppercase tracking-[3px]">Notificações</h3>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-display font-bold rounded-lg border border-primary/20">2 ATIVAS</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-4 p-3 hover:bg-surface-container-low rounded-2xl transition-all duration-300 cursor-pointer group border border-transparent hover:border-outline">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">PAGAMENTO CONFIRMADO</p>
                          <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">A fatura da obra "Residencial Horizonte" foi processada com sucesso.</p>
                        </div>
                      </div>
                      <div className="flex gap-4 p-3 hover:bg-surface-container-low rounded-2xl transition-all duration-300 cursor-pointer group border border-transparent hover:border-outline">
                        <div className="h-10 w-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0 border border-error/20 group-hover:bg-error/20 transition-colors">
                          <AlertCircle className="h-5 w-5 text-error" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-on-surface group-hover:text-error transition-colors">ALERTA DE PRAZO</p>
                          <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">O fornecedor reportou atraso logístico na entrega de insumos críticos.</p>
                        </div>
                      </div>
                    </div>
                    <button className="w-full mt-6 py-3 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px] hover:text-primary transition-all border border-outline hover:border-primary/20 rounded-xl bg-background/50">
                      CENTRAL DE NOTIFICAÇÕES
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={toggleTheme}
            className="p-3 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-2xl transition-all duration-300"
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button className="p-3 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-2xl transition-all duration-300">
            <CircleHelp className="h-5 w-5" />
          </button>

          <div className="h-10 w-px bg-surface-container-high mx-2" />

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-4 p-2 pl-4 bg-background/50 hover:bg-background/80 rounded-2xl border border-outline transition-all duration-300 group active:scale-95"
            >
              <div className="flex-col items-end hidden md:flex">
                <span className="text-xs font-display font-bold text-on-surface tracking-wider group-hover:text-primary transition-colors line-clamp-1 max-w-[150px] uppercase">
                  {formatDisplayName(profile?.full_name || user?.email?.split('@')[0])}
                </span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-[2px] opacity-70">
                  {isProprietor ? 'Proprietário' : 'Gestor Elite'}
                </span>
              </div>
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20 overflow-hidden shadow-inner group-hover:border-primary/50 transition-all relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {profile?.avatar_url && !imageError ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <User className="h-6 w-6 text-primary" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-72 bg-surface-container-high/95 backdrop-blur-2xl rounded-3xl border border-outline shadow-2xl overflow-hidden z-20"
                  >
                    <div className="p-6 bg-gradient-to-br from-primary/10 via-transparent to-transparent border-b border-outline flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-background flex items-center justify-center text-primary font-black text-xl shadow-xl border border-primary/20 overflow-hidden relative group">
                        {profile?.avatar_url && !imageError ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-7 w-7" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-primary font-display font-bold uppercase tracking-[2px] mb-1">
                          {isProprietor ? 'PROPRIETÁRIO' : 'GESTOR ELITE'}
                        </p>
                        <p className="text-[11px] font-bold text-on-surface truncate opacity-90">{user?.email}</p>
                      </div>
                    </div>

                    <div className="p-3">
                      <button
                        onClick={() => { setIsProfileModalOpen(true); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-4 px-4 py-4 text-[11px] font-display font-bold text-on-surface-variant uppercase tracking-widest hover:text-on-surface hover:bg-surface-container-low rounded-xl transition-all group"
                      >
                        <User className="h-4 w-4 group-hover:text-primary transition-colors" /> Detalhes do Perfil
                      </button>
                      <button
                        onClick={() => { setIsSettingsModalOpen(true); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-4 px-4 py-4 text-[11px] font-display font-bold text-on-surface-variant uppercase tracking-widest hover:text-on-surface hover:bg-surface-container-low rounded-xl transition-all group"
                      >
                        <Settings className="h-4 w-4 group-hover:text-primary transition-colors" /> Configurações
                      </button>
                      <div className="h-px bg-surface-container-low my-2 mx-4"></div>
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-4 px-4 py-4 text-[11px] font-display font-bold text-error uppercase tracking-widest hover:text-on-surface hover:bg-error/20 rounded-xl transition-all"
                      >
                        <LogOut className="h-4 w-4" /> Encerrar Sessão
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
          onUpdate={refreshRole}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      </div>
    </>
  );
}

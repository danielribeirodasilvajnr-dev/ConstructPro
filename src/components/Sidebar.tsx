import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  Calculator,
  CircleHelp,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isClient?: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isClient,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}: SidebarProps) {
  const { signOut, isProprietor, isAdmin, isStaff } = useAuth();
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projetos', icon: ClipboardList },
    { id: 'calculator', label: 'Calculadora INSS', icon: Calculator, adminOnly: true },
    { id: 'regularization', label: 'Regularização INSS', icon: FileSpreadsheet, adminOnly: true },
    { id: 'safety', label: 'Painel do Proprietário', icon: ShieldCheck },
  ];

  const navItems = isProprietor
    ? allNavItems.filter(item => item.id === 'safety')
    : allNavItems.filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        return true;
      });

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen flex-col bg-surface/90 backdrop-blur-xl border-r border-white/5 shadow-2xl transition-all duration-300 overflow-hidden",
        isCollapsed ? "w-0 -translate-x-full hidden" : "w-72 translate-x-0 flex",
        isMobileOpen ? "flex w-72 translate-x-0 !inline-flex" : "max-md:hidden max-md:w-0 max-md:-translate-x-full"
      )}>
        {/* Brand Section */}
        <div className="flex items-center gap-4 p-8 mb-4 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-surface relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5 opacity-50 group-hover:opacity-100 transition-opacity" />
            <img src="/logo.png" alt="360Pro" className="w-full h-full object-cover relative z-10 group-hover:scale-110 transition-transform duration-500 [filter:invert(1)_hue-rotate(180deg)]" />
          </div>
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h2 className="text-xl font-display font-bold tracking-[2px] text-white">360<span className="text-primary">PRO</span></h2>
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 bg-primary rounded-full animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-[3px] text-on-surface-variant whitespace-nowrap">Engineering Elite</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2 p-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileOpen(false);
              }}
              className={cn(
                "group flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-300 relative w-full overflow-hidden",
                "hover:scale-[1.02] active:scale-[0.98]",
                activeTab === item.id
                  ? "bg-primary text-background shadow-[0_0_25px_-5px_rgba(34,255,136,0.4)] font-bold"
                  : "text-on-surface-variant hover:text-white hover:bg-white/5"
              )}
            >
              {activeTab === item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
              )}
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:rotate-6",
                activeTab === item.id ? "text-background" : "group-hover:text-primary"
              )} />
              <span className="text-sm font-display uppercase tracking-wider relative z-10 whitespace-nowrap">{item.label}</span>
              
              {activeTab === item.id && (
                <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-background/50" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-8 mt-auto border-t border-white/5 bg-background/20">
          <div className="flex flex-col gap-3 w-full">
            <button
              className="flex items-center gap-4 text-xs font-display uppercase tracking-[2px] text-on-surface-variant hover:text-primary transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                <CircleHelp className="h-4 w-4" />
              </div>
              <span>Suporte Técnico</span>
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-4 text-xs font-display uppercase tracking-[2px] text-on-surface-variant hover:text-error transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg group-hover:bg-error/10 transition-colors">
                <LogOut className="h-4 w-4" />
              </div>
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

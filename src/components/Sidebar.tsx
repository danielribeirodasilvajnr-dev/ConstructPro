import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  ShieldCheck, 
  PlusCircle, 
  CircleHelp, 
  LogOut,
  ChevronLeft,
  ChevronRight
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
  const { signOut } = useAuth();
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projetos', icon: ClipboardList },
    { id: 'resources', label: 'Calculadora INSS', icon: Users },
    { id: 'safety', label: 'Painel do Proprietário', icon: ShieldCheck },
  ];

  const navItems = isClient 
    ? allNavItems.filter(item => item.id === 'safety')
    : allNavItems;

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
        "fixed left-0 top-0 z-50 flex h-screen flex-col bg-[#1C232E] border-r border-slate-800 shadow-2xl transition-all duration-300",
        // Desktop sizing
        isCollapsed ? "md:w-20" : "md:w-72",
        // Mobile sizing and positioning
        "w-72 md:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        // Hide completely on mobile if not open to avoid ghost elements
        !isMobileOpen && "pointer-events-none md:pointer-events-auto"
      )}>
      {/* Sidebar Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#BCB5AC] text-[#1C232E] shadow-lg hover:bg-slate-700 transition-transform active:scale-90 z-[60]"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Brand Section */}
      <div className={cn(
        "flex items-center gap-3 p-6 mb-2 overflow-hidden",
        isCollapsed && "justify-center p-4"
      )}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-white/10 shadow-lg bg-[#BCB5AC]">
          <img src="/logo.png" alt="AevumPro" className="w-full h-full object-cover" />
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <h2 className="text-sm font-bold tracking-tight text-white">AevumPro</h2>
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#BCB5AC] opacity-80 mt-0.5 whitespace-nowrap">Gestão de Obras</p>
          </div>
        )}
      </div>

      <nav className={cn(
        "flex flex-1 flex-col gap-1 p-4",
        isCollapsed && "items-center px-2"
      )}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileOpen(false);
            }}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg transition-all duration-150 relative",
              isCollapsed ? "justify-center w-12 h-12 p-0" : "px-4 py-3",
              activeTab === item.id 
                ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105 border border-white/10" 
                : "text-slate-400 hover:bg-white/5"
            )}
          >
            <item.icon className={cn("h-5 w-5", isCollapsed ? "h-6 w-6" : "h-5 w-5")} />
            {!isCollapsed && (
              <span className="text-sm font-medium animate-in fade-in slide-in-from-left-1 duration-200">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      <div className={cn(
        "p-6 mt-auto border-t border-slate-800 bg-slate-900/10",
        isCollapsed && "p-4 flex flex-col items-center"
      )}>
        {!isClient && (
          <button 
            title={isCollapsed ? "Novo Lançamento" : undefined}
            className={cn(
              "mb-6 flex items-center justify-center rounded-xl bg-[#BCB5AC] text-[#1C232E] transition-all hover:bg-slate-700 shadow-lg shadow-black/20 active:scale-95",
              isCollapsed ? "h-12 w-12 p-0" : "w-full py-3.5 gap-2 text-xs font-bold uppercase tracking-widest"
            )}
          >
            <PlusCircle className="h-5 w-5" />
            {!isCollapsed && <span>Novo Lançamento</span>}
          </button>
        )}
        <div className={cn("flex flex-col gap-1 w-full", isCollapsed && "items-center")}>
          <button 
            title={isCollapsed ? "Suporte" : undefined}
            className={cn(
              "flex items-center gap-3 text-sm text-slate-400 hover:text-primary transition-colors",
              isCollapsed ? "justify-center h-10 w-10 p-0" : "px-4 py-2"
            )}
          >
            <CircleHelp className="h-4 w-4" />
            {!isCollapsed && <span>Suporte</span>}
          </button>
          <button 
            onClick={signOut}
            title={isCollapsed ? "Sair" : undefined}
            className={cn(
              "flex items-center gap-3 text-sm text-slate-400 hover:text-error transition-colors",
              isCollapsed ? "justify-center h-10 w-10 p-0" : "px-4 py-2"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}


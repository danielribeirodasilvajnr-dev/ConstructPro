import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  ShieldCheck, 
  PlusCircle, 
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
        "fixed left-0 top-0 z-50 h-screen flex-col bg-[#1C232E] border-r border-slate-800 shadow-2xl transition-all duration-300 overflow-hidden",
        // Desktop/Tablet: Either full width (w-72) or completely hidden (w-0)
        isCollapsed ? "w-0 -translate-x-full hidden" : "w-72 translate-x-0 flex",
        // Mobile: Controlled by isMobileOpen, always full width when open
        isMobileOpen ? "flex w-72 translate-x-0 !inline-flex" : "max-md:hidden max-md:w-0 max-md:-translate-x-full"
      )}>
        {/* Brand Section */}
        <div className="flex items-center gap-3 p-6 mb-2 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-white/10 shadow-lg bg-[#BCB5AC]">
            <img src="/logo.png" alt="AevumPro" className="w-full h-full object-cover" />
          </div>
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <h2 className="text-sm font-bold tracking-tight text-white">AevumPro</h2>
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#BCB5AC] opacity-80 mt-0.5 whitespace-nowrap">Gestão de Obras</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-150 relative w-full",
                activeTab === item.id 
                  ? "bg-[#BCB5AC] text-[#1C232E] shadow-lg shadow-black/20 scale-[1.02] border border-white/10" 
                  : "text-slate-400 hover:bg-white/5"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-semibold tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-800 bg-slate-900/10">
          {!isClient && (
            <button 
              className="mb-6 flex items-center justify-center rounded-xl bg-[#BCB5AC] text-[#1C232E] transition-all hover:bg-slate-700 shadow-lg shadow-black/20 active:scale-95 w-full py-3.5 gap-2 text-xs font-bold uppercase tracking-widest"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Novo Lançamento</span>
            </button>
          )}
          <div className="flex flex-col gap-1 w-full">
            <button 
              className="flex items-center gap-3 text-sm text-slate-400 hover:text-primary transition-colors px-4 py-2"
            >
              <CircleHelp className="h-5 w-5" />
              <span>Suporte</span>
            </button>
            <button 
              onClick={signOut}
              className="flex items-center gap-3 text-sm text-slate-400 hover:text-error transition-colors px-4 py-2"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

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
}

export function Sidebar({ activeTab, setActiveTab, isClient }: SidebarProps) {
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
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-[#181C21] border-r border-slate-800 shadow-2xl">
      <div className="flex items-center gap-3 p-6 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
          <span className="text-xl font-black">CP</span>
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white">ConstructPro</h2>
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#4170FF] opacity-80 mt-0.5">Gestão de Obras</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-150",
              activeTab === item.id 
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105 border border-white/10" 
                : "text-slate-400 hover:bg-white/5"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto border-t border-slate-800 bg-slate-900/10">
        {!isClient && (
          <button className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4170FF] py-3.5 text-xs font-bold text-white transition-all hover:bg-blue-600 shadow-lg shadow-blue-500/10 uppercase tracking-widest active:scale-95">
            <PlusCircle className="h-4 w-4" />
            Novo Lançamento
          </button>
        )}
        <div className="flex flex-col gap-1">
          <button className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-primary">
            <CircleHelp className="h-4 w-4" />
            Suporte
          </button>
          <button 
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-error"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}

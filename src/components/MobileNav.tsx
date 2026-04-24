import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  ShieldCheck 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isClient?: boolean;
}

export function MobileNav({ activeTab, setActiveTab, isClient }: MobileNavProps) {
  const allNavItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'projects', label: 'Obras', icon: ClipboardList },
    { id: 'resources', label: 'Cálculos', icon: Users },
    { id: 'safety', label: 'Painel', icon: ShieldCheck },
  ];

  const navItems = isClient 
    ? allNavItems.filter(item => item.id === 'safety')
    : allNavItems;

  if (isClient && navItems.length <= 1) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] flex h-16 items-center justify-around bg-[#1C232E]/95 backdrop-blur-lg border-t border-white/5 md:hidden px-2">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all active:scale-90",
            activeTab === item.id 
              ? "text-[#BCB5AC]" 
              : "text-slate-500"
          )}
        >
          <item.icon className={cn("h-5 w-5", activeTab === item.id && "scale-110")} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          {activeTab === item.id && (
            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#BCB5AC]" />
          )}
        </button>
      ))}
    </nav>
  );
}

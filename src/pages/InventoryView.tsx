import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { Package, ChevronLeft, LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, ClipboardList, History, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { InventoryDashboard } from '../components/inventory/InventoryDashboard';
import { InventoryMaterials } from '../components/inventory/InventoryMaterials';
import { InventoryMovements } from '../components/inventory/InventoryMovements';
import { InventoryReports } from '../components/inventory/InventoryReports';
import { useInventory } from '../hooks/useInventory';

interface InventoryViewProps {
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

type TabType = 'dashboard' | 'materials' | 'movements' | 'reports';

export function InventoryView({ selectedProjectId, onSelectProject }: InventoryViewProps) {
  const { projects, loading: loadingProjects } = useProjects();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (!selectedProjectId || !selectedProject) {
    return (
      <div className="space-y-12 max-w-[1400px] mx-auto pb-24 relative">
        <div className="flex flex-col items-center justify-center py-32 max-w-lg mx-auto text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <Package className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold uppercase tracking-tight text-on-surface">Controle de Estoque</h2>
          <p className="text-on-surface-variant leading-relaxed">
            Selecione uma obra ativa para gerenciar o almoxarifado, registrar entradas, saídas e acompanhar relatórios de consumo.
          </p>
          
          <div className="w-full mt-8 grid grid-cols-1 gap-4">
            {loadingProjects ? (
               <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            ) : (
              projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="flex items-center justify-between p-6 bg-surface-container-low border border-outline rounded-2xl hover:border-primary/50 transition-all group"
                >
                  <div className="text-left">
                    <h3 className="font-display font-bold uppercase tracking-widest text-on-surface group-hover:text-primary transition-colors">{project.name}</h3>
                    <p className="text-[11px] text-on-surface-variant">{project.location}</p>
                  </div>
                  <ChevronLeft className="h-5 w-5 rotate-180 text-on-surface-variant group-hover:text-primary transition-transform" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'materials', label: 'Materiais', icon: Package },
    { id: 'movements', label: 'Movimentações', icon: History },
    { id: 'reports', label: 'Relatórios', icon: ClipboardList }
  ];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-24 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onSelectProject(null)} 
            className="p-4 bg-surface-container-low hover:bg-primary/10 rounded-2xl transition-all duration-300 text-on-surface-variant hover:text-primary border border-outline group active:scale-90"
          >
            <ChevronLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-4">
              <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface uppercase">{selectedProject.name}</h2>
              <div className="px-4 py-1.5 text-[10px] font-display font-bold rounded-lg border backdrop-blur-xl uppercase tracking-[2px] bg-primary/10 text-primary border-primary/20">
                Almoxarifado
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-outline overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex items-center gap-2 px-8 py-5 text-[10px] font-display font-bold uppercase tracking-[3px] border-b-2 transition-all duration-300 whitespace-nowrap relative group",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {activeTab === tab.id && <div className="absolute inset-0 bg-primary/5 blur-xl -z-10" />}
          </button>
        ))}
      </div>

      <div className="relative">
        {activeTab === 'dashboard' && <InventoryDashboard projectId={selectedProjectId} />}
        {activeTab === 'materials' && <InventoryMaterials projectId={selectedProjectId} />}
        {activeTab === 'movements' && <InventoryMovements projectId={selectedProjectId} project={selectedProject} />}
        {activeTab === 'reports' && <InventoryReports projectId={selectedProjectId} />}
      </div>
    </div>
  );
}

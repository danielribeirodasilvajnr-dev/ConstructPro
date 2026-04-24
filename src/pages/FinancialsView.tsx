import React from 'react';
import { useProjects } from '../hooks/useProjects';
import { useProjectData } from '../hooks/useProjectData';
import { FinanceTab } from '../components/projects/FinanceTab';

interface FinancialsViewProps {
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

export function FinancialsView({ selectedProjectId, onSelectProject }: FinancialsViewProps) {
  const { projects } = useProjects();
  const { financialItems, budgetItems, refresh } = useProjectData(selectedProjectId);

  if (!selectedProjectId) {
    return (
      <div className="space-y-8 max-w-[1400px] mx-auto">
        <h2 className="text-3xl font-black text-white">Gestão Financeira Global</h2>
        <div className="bg-[#1C232E] p-8 rounded-2xl border border-white/5 text-center">
           <p className="text-slate-500 mb-6">Selecione um projeto para realizar lançamentos e visualizar o fluxo financeiro.</p>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map(p => (
                <button key={p.id} onClick={() => onSelectProject(p.id)} className="p-4 bg-[#0b0f19] border border-white/10 rounded-xl hover:border-emerald-500 transition-all text-white font-bold">
                  {p.name}
                </button>
              ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <FinanceTab projectId={selectedProjectId} financialItems={financialItems} budgetItems={budgetItems} onRefresh={refresh} />
    </div>
  );
}

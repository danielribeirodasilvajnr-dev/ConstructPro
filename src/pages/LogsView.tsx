import React from 'react';
import { useProjects } from '../hooks/useProjects';
import { useProjectData } from '../hooks/useProjectData';
import { DailyLogTab } from '../components/projects/DailyLogTab';

interface LogsViewProps {
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

export function LogsView({ selectedProjectId, onSelectProject }: LogsViewProps) {
  const { projects } = useProjects();
  const { dailyLogs, refresh } = useProjectData(selectedProjectId);

  if (!selectedProjectId) {
    return (
      <div className="space-y-8 max-w-[1400px] mx-auto">
        <h2 className="text-3xl font-black text-on-surface">Diários de Obra Global</h2>
        <div className="bg-surface p-8 rounded-2xl border border-outline text-center">
           <p className="text-on-surface-variant mb-6">Selecione um projeto para visualizar os registros diários (RDO).</p>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map(p => (
                <button key={p.id} onClick={() => onSelectProject(p.id)} className="p-4 bg-surface-container-low border border-outline rounded-xl hover:border-blue-400 transition-all text-on-surface font-bold">
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
      <DailyLogTab projectId={selectedProjectId} dailyLogs={dailyLogs} onRefresh={refresh} />
    </div>
  );
}

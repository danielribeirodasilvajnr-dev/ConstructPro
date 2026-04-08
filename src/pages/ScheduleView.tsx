import React from 'react';
import { useProjects } from '../hooks/useProjects';
import { useProjectData } from '../hooks/useProjectData';
import { ScheduleTab } from '../components/projects/ScheduleTab';

interface ScheduleViewProps {
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

export function ScheduleView({ selectedProjectId, onSelectProject }: ScheduleViewProps) {
  const { projects } = useProjects();
  const { scheduleItems, refresh } = useProjectData(selectedProjectId);

  if (!selectedProjectId) {
    return (
      <div className="space-y-8 max-w-[1400px] mx-auto">
        <h2 className="text-3xl font-black text-white">Cronograma Global</h2>
        <div className="bg-[#13171f] p-8 rounded-2xl border border-white/5 text-center">
           <p className="text-slate-500 mb-6">Selecione um projeto para visualizar o cronograma detalhado.</p>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map(p => (
                <button key={p.id} onClick={() => onSelectProject(p.id)} className="p-4 bg-[#0b0f19] border border-white/10 rounded-xl hover:border-blue-500 transition-colors text-white font-bold">
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
      <ScheduleTab projectId={selectedProjectId} scheduleItems={scheduleItems} onRefresh={refresh} />
    </div>
  );
}

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
        <h2 className="text-3xl font-black text-on-surface">Cronograma Global</h2>
        <div className="bg-surface p-8 rounded-2xl border border-outline text-center">
           <p className="text-on-surface-variant mb-6">Selecione um projeto para visualizar o cronograma detalhado.</p>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map(p => (
                <button key={p.id} onClick={() => onSelectProject(p.id)} className="p-4 bg-surface-container-low border border-outline rounded-xl hover:border-blue-500 transition-colors text-on-surface font-bold">
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

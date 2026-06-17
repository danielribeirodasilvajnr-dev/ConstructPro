import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { AlertCircle, ChevronLeft, FileSpreadsheet, FolderGit2, HardHat, SplitSquareHorizontal, FileWarning, CheckSquare, Clock } from 'lucide-react';
import { EngineeringDashboard } from '../components/engineering/EngineeringDashboard';
import { EngineeringExplorer } from '../components/engineering/EngineeringExplorer';
import { ClashDetectionTab } from '../components/engineering/ClashDetectionTab';
import { RfiManager } from '../components/engineering/RfiManager';

interface EngineeringViewProps {
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

export function EngineeringView({ selectedProjectId, onSelectProject }: EngineeringViewProps) {
  const { user } = useAuth();
  const { projects, loading } = useProjects();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explorer' | 'compatibilizacao' | 'rfi' | 'entregaveis' | 'asbuilt'>('explorer');

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (selectedProjectId && selectedProject) {
    return (
      <div className="space-y-12 max-w-[1400px] mx-auto pb-24 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onSelectProject(null)} 
              className="p-4 bg-surface-container-low hover:bg-primary/10 rounded-2xl transition-all duration-300 text-on-surface-variant hover:text-primary border border-outline group active:scale-90"
            >
              <ChevronLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface uppercase">{selectedProject.name}</h2>
                <div className="px-4 py-1.5 text-[10px] font-display font-bold rounded-lg border backdrop-blur-xl uppercase tracking-[2px] bg-primary/10 text-primary border-primary/20">
                  Engenharia
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1 w-1 bg-primary rounded-full animate-pulse" />
                <p className="text-on-surface-variant text-[11px] font-display uppercase tracking-[3px]">Gestão de Projetos e Compatibilização</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-outline mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 gap-2">
          {[
            { id: 'explorer', label: 'Diretórios e Arquivos', icon: FileSpreadsheet },
            { id: 'dashboard', label: 'Dashboard', icon: FolderGit2 },
            { id: 'compatibilizacao', label: 'Compatibilização', icon: SplitSquareHorizontal },
            { id: 'rfi', label: 'Ocorrências (RFI)', icon: FileWarning },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-5 text-[10px] font-display font-bold uppercase tracking-[2px] border-b-2 transition-all duration-300 whitespace-nowrap relative group flex items-center gap-2",
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
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
          
          {activeTab === 'explorer' && <EngineeringExplorer projectId={selectedProjectId} />}
          {activeTab === 'dashboard' && <EngineeringDashboard projectId={selectedProjectId} />}
          {activeTab === 'compatibilizacao' && <ClashDetectionTab projectId={selectedProjectId} />}
          {activeTab === 'rfi' && <RfiManager projectId={selectedProjectId} />}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-24 relative">
      <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16 relative">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div>
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-on-surface uppercase group">
            ENGENHARIA E <span className="text-primary group-hover:drop-shadow-[0_0_15px_rgba(34,255,136,0.5)] transition-all">PROJETOS</span>
          </h2>
          <div className="flex items-center gap-3 mt-3">
            <div className="h-[1px] w-12 bg-primary/30" />
            <p className="text-on-surface-variant text-[11px] font-display uppercase tracking-[4px]">Gestão Técnica de Obras</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[4px] animate-pulse">Carregando Projetos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="group relative bg-surface-container-low/40 backdrop-blur-xl rounded-[32px] border border-outline overflow-hidden flex flex-col transition-all duration-500 shadow-2xl hover:border-primary/40 cursor-pointer hover:translate-y-[-8px]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="p-10 flex-1 relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20">
                    <FolderGit2 className="h-6 w-6" />
                  </div>
                </div>

                <h3 className="text-2xl font-display font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[64px] uppercase leading-tight">{project.name}</h3>

                <div className="mt-8 space-y-5">
                  <p className="text-[11px] font-display font-bold text-on-surface-variant uppercase tracking-widest">{project.location}</p>
                </div>
              </div>

              <div className="px-10 py-6 bg-white/2 border-t border-outline flex items-center justify-between group-hover:bg-primary/5 transition-all duration-500">
                <span className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px] group-hover:text-primary transition-colors">Acessar Documentação</span>
                <div className="p-2 rounded-lg bg-surface-container-low group-hover:bg-primary text-on-surface-variant group-hover:text-background transition-all duration-500 shadow-[0_0_15px_rgba(34,255,136,0)] group-hover:shadow-[0_0_15px_rgba(34,255,136,0.4)]">
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

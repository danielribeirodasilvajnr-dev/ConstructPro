import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Map as MapIcon, 
  Calendar as CalendarIcon, 
  Edit, 
  Trash2, 
  ChevronLeft,
  AlertCircle,
  X
} from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useProjectData } from '../hooks/useProjectData';
import { BudgetTab } from '../components/projects/BudgetTab';
import { ScheduleTab } from '../components/projects/ScheduleTab';
import { FinanceTab } from '../components/projects/FinanceTab';
import { DailyLogTab } from '../components/projects/DailyLogTab';
import { cn } from '../lib/utils';
import { Project } from '../lib/types';

interface ProjectsViewProps {
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

export function ProjectsView({ selectedProjectId, onSelectProject }: ProjectsViewProps) {
  const { projects, loading: loadingProjects, saveProject, deleteProject, refresh: refreshProjects } = useProjects();
  const [activeTab, setActiveTab] = useState<'orcamento' | 'cronograma' | 'financeiro' | 'diario'>('orcamento');
  
  // Modals for Projects
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});

  // Hook for project specific data
  const { 
    budgetItems, 
    scheduleItems, 
    financialItems, 
    dailyLogs, 
    loading: loadingData, 
    refresh: refreshData 
  } = useProjectData(selectedProjectId);

  const handleEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
    setFormData(project);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingProject(null);
    setFormData({ status: 'Planejamento', area: 0 });
    setIsModalOpen(true);
  };

  const handleSaveProject = async () => {
    try {
      await saveProject(formData);
      setIsModalOpen(false);
      refreshProjects();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar projeto');
    }
  };

  const confirmDelete = async () => {
    if (deletingProject) {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
      refreshProjects();
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (selectedProjectId && selectedProject) {
    return (
      <div className="space-y-8 max-w-[1400px] mx-auto pb-24 relative animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => onSelectProject(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold tracking-tight text-white">{selectedProject.name}</h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-[#FFF3D6] text-[#C48C00]">
                  {selectedProject.status}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">{selectedProject.location} • Início: {selectedProject.start_date || 'N/D'}</p>
            </div>
          </div>
        </div>

        <div className="flex border-b border-white/10 mb-8">
          {[
            { id: 'orcamento', label: 'Orçamento' },
            { id: 'cronograma', label: 'Cronograma' },
            { id: 'financeiro', label: 'Financeiro' },
            { id: 'diario', label: 'Diário de Obra' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-[#3B82F6] text-[#3B82F6]"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'orcamento' && (
          <BudgetTab 
            projectId={selectedProjectId} 
            budgetItems={budgetItems} 
            financialItems={financialItems} 
            onRefresh={refreshData} 
          />
        )}
        {activeTab === 'cronograma' && (
          <ScheduleTab 
            projectId={selectedProjectId} 
            scheduleItems={scheduleItems} 
            onRefresh={refreshData} 
          />
        )}
        {activeTab === 'financeiro' && (
          <FinanceTab 
            projectId={selectedProjectId} 
            financialItems={financialItems} 
            budgetItems={budgetItems} 
            onRefresh={refreshData} 
          />
        )}
        {activeTab === 'diario' && (
          <DailyLogTab 
            projectId={selectedProjectId} 
            dailyLogs={dailyLogs} 
            onRefresh={refreshData} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-24 relative">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Projetos</h2>
          <p className="text-slate-500 text-[13px]">{projects.length} projeto(s) cadastrado(s)</p>
        </div>
        <button onClick={handleNew} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Novo Projeto
        </button>
      </div>

      {loadingProjects ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id} 
              onClick={() => onSelectProject(project.id)} 
              className="bg-[#13171f] rounded-xl border border-white/5 overflow-hidden flex flex-col group hover:shadow-lg hover:border-[#3B82F6]/50 cursor-pointer transition-all relative"
            >
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={(e) => handleEdit(e, project)} className="p-1.5 bg-[#0b0f15]/80 text-slate-400 hover:text-white border border-white/10 rounded-md backdrop-blur-sm transition-all">
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDeletingProject(project); }} className="p-1.5 bg-[#0b0f15]/80 text-slate-400 hover:text-red-500 border border-white/10 rounded-md backdrop-blur-sm transition-all">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="p-5 flex-1">
                <div className="flex items-center gap-3 mb-4 pr-14">
                  <h3 className="text-[15px] font-bold text-white truncate">{project.name}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#FFF3D6] text-[#C48C00]">
                    {project.status}
                  </span>
                </div>

                <div className="space-y-2 mb-2">
                  <div className="flex items-center gap-2 text-slate-400 mb-4">
                    <MapIcon className="h-3.5 w-3.5" />
                    <span className="text-[13px] font-medium">{project.location || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="h-3.5 w-3.5 flex items-center justify-center font-bold text-[10px] border border-slate-500 rounded-sm">m²</span>
                    <span className="text-[13px]">{project.area || '0'},00 m²</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span className="text-[13px]">{project.deadline || 'N/D'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#0b0f19] border border-white/5 shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-white">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h3>
               <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Nome do Projeto" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg p-3 text-white" />
              <input type="text" placeholder="Cliente" value={formData.client || ''} onChange={e => setFormData({ ...formData, client: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg p-3 text-white" />
              <input type="text" placeholder="Localização" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg p-3 text-white" />
              <div className="grid grid-cols-2 gap-4">
                 <input type="number" placeholder="Área (m²)" value={formData.area || 0} onChange={e => setFormData({ ...formData, area: Number(e.target.value) })} className="w-full bg-[#13171f] border border-white/10 rounded-lg p-3 text-white" />
                 <select value={formData.status || 'Planejamento'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg p-3 text-white">
                    <option value="Planejamento">Planejamento</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Finalizada">Finalizada</option>
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <input type="date" value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg p-3 text-white" />
                 <input type="date" value={formData.deadline || ''} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg p-3 text-white" />
              </div>
              <textarea placeholder="Descrição" rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg p-3 text-white" />
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-white">Cancelar</button>
                <button onClick={handleSaveProject} className="px-5 py-2 bg-blue-600 text-white rounded-lg">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

       {deletingProject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingProject(null)}></div>
          <div className="relative bg-[#13171f] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Excluir Projeto?</h3>
            <p className="text-sm text-slate-400 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingProject(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-300 border border-[#1e293b] rounded-xl">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  X,
  Users
} from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useProjectData } from '../hooks/useProjectData';
import { BudgetTab } from '../components/projects/BudgetTab';
import { ScheduleTab } from '../components/projects/ScheduleTab';
import { FinanceTab } from '../components/projects/FinanceTab';
import { DailyLogTab } from '../components/projects/DailyLogTab';
import { CollaboratorsModal } from '../components/projects/CollaboratorsModal';
import { cn } from '../lib/utils';
import { Project } from '../lib/types';
import { AlertModal } from '../components/ui/AlertModal';


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
  const [isCollaboratorsModalOpen, setIsCollaboratorsModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'error' | 'success' | 'warning' }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // Hook for project specific data
  const {
    budgetItems,
    scheduleItems,
    financialItems,
    dailyLogs,
    loading: loadingData,
    userRole,
    isEditor,
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
    setFormData({
      status: 'Planejamento',
      area: 0,
      start_date: new Date().toISOString().split('T')[0],
      name: '',
      client: '',
      location: '',
      deadline: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleSaveProject = async () => {
    try {
      await saveProject(formData);
      setIsModalOpen(false);
      refreshProjects();
    } catch (err: any) {
      console.error(err);
      setAlertConfig({
        isOpen: true,
        title: 'Erro ao Salvar',
        message: err.message || 'Não foi possível salvar o projeto.',
        type: 'error'
      });
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
          {userRole === 'owner' && (
            <button
              onClick={() => setIsCollaboratorsModalOpen(true)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-colors border border-slate-700"
            >
              <Users className="h-4 w-4" /> Colaboradores
            </button>
          )}
        </div>

        <div className="flex border-b border-slate-800 mb-10 overflow-x-auto scrollbar-hide">
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
                "px-8 py-5 text-[11px] font-bold uppercase tracking-[2px] border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "border-[#4170FF] text-[#4170FF]"
                  : "border-transparent text-slate-500 hover:text-slate-300"
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
            readOnly={!isEditor}
          />
        )}
        {activeTab === 'cronograma' && (
          <ScheduleTab
            projectId={selectedProjectId}
            scheduleItems={scheduleItems}
            onRefresh={refreshData}
            readOnly={!isEditor}
          />
        )}
        {activeTab === 'financeiro' && (
          <FinanceTab
            projectId={selectedProjectId}
            financialItems={financialItems}
            budgetItems={budgetItems}
            onRefresh={refreshData}
            readOnly={!isEditor}
          />
        )}
        {activeTab === 'diario' && (
          <DailyLogTab
            projectId={selectedProjectId}
            dailyLogs={dailyLogs}
            onRefresh={refreshData}
            readOnly={!isEditor}
          />
        )}

        {isCollaboratorsModalOpen && selectedProject && (
          <CollaboratorsModal
            project={selectedProject}
            onClose={() => setIsCollaboratorsModalOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-24 relative">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Projetos</h2>
          <p className="text-slate-500 text-sm mt-1">{projects.length} obra(s) no portfólio ConstructPro</p>
        </div>
        <button
          onClick={handleNew}
          className="px-6 py-3 bg-[#4170FF] text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/10 uppercase tracking-widest active:scale-95"
        >
          <Plus className="h-4 w-4" /> Novo Projeto
        </button>
      </div>

      {loadingProjects ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="bg-[#181C21] rounded-[24px] border border-slate-800 overflow-hidden flex flex-col group hover:shadow-2xl hover:border-[#4170FF]/50 cursor-pointer transition-all relative animate-in fade-in duration-500"
            >
              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-10">
                {project.user_id === projects.find(p => p.id === project.id)?.user_id && (
                  <>
                    <button
                      onClick={(e) => handleEdit(e, project)}
                      className="p-2 bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 rounded-lg backdrop-blur-md transition-all shadow-xl"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingProject(project); }}
                      className="p-2 bg-slate-900/90 text-slate-400 hover:text-red-500 border border-slate-800 rounded-lg backdrop-blur-md transition-all shadow-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              <div className="p-8 flex-1">
                <div className="flex items-start justify-between mb-6">
                  <span className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                    project.status === 'Em andamento' ? 'bg-[#FFF3D6] text-[#C48C00]' :
                      project.status === 'Finalizada' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-slate-800 text-slate-400'
                  )}>
                    {project.status}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-100 tracking-tight group-hover:text-[#4170FF] transition-colors line-clamp-2 min-h-[56px]">{project.name}</h3>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 text-slate-500">
                    <MapIcon className="h-4 w-4 text-slate-600" />
                    <span className="text-xs font-medium">Local: {project.location || 'Local não definido'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-4 h-4 flex items-center justify-center font-bold text-[9px] border border-slate-700 rounded-sm">m²</div>
                    <span className="text-xs font-medium">Área: {project.area || '0'},00 m²</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <CalendarIcon className="h-4 w-4 text-slate-600" />
                    <span className="text-xs font-medium">Prazo: {project.deadline || 'Sem prazo'}</span>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-900/30 border-t border-slate-800 flex items-center justify-between group-hover:bg-[#4170FF]/5 transition-colors">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Acessar Obra</span>
                <ChevronLeft className="h-4 w-4 text-slate-600 rotate-180 group-hover:text-[#4170FF] transform translate-x-0 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#181C21] rounded-[24px] shadow-2xl border border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100 tracking-tight">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-8 pb-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome da Obra</label>
                <input type="text" placeholder="Ex: Residência Alto do Lago..." value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cliente</label>
                  <input type="text" placeholder="Nome do proprietário" value={formData.client || ''} onChange={e => setFormData({ ...formData, client: e.target.value })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Status</label>
                  <select value={formData.status || 'Planejamento'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none appearance-none">
                    <option value="Planejamento">Planejamento</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Finalizada">Finalizada</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Área Total (m²)</label>
                  <input type="number" placeholder="0.00" value={formData.area || 0} onChange={e => setFormData({ ...formData, area: Number(e.target.value) })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Localização</label>
                  <input type="text" placeholder="Endereço da obra" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data de Início</label>
                  <input type="date" value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Previsão Entrega</label>
                  <input type="date" value={formData.deadline || ''} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none" />
                </div>
              </div>
              <textarea placeholder="Observações adicionais sobre o projeto..." rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none resize-none" />
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProject}
                  className="px-8 py-3 bg-[#4170FF] text-white text-xs font-bold rounded-xl uppercase tracking-[1.5px] hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98]"
                >
                  Salvar Projeto
                </button>
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

      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type as any}
      />
    </div>
  );
}

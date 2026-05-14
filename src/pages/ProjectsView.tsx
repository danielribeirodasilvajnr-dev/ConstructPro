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
import { BidComparisonTab } from '../components/projects/BidComparisonTab';
import { DailyLogTab } from '../components/projects/DailyLogTab';
import { MeasurementsTab } from '../components/projects/MeasurementsTab';
import { CollaboratorsModal } from '../components/projects/CollaboratorsModal';
import { CollaboratorsTab } from '../components/projects/CollaboratorsTab';
import { cn } from '../lib/utils';
import { Project } from '../lib/types';
import { AlertModal } from '../components/ui/AlertModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ProprietorView } from './ProprietorView';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';


interface ProjectsViewProps {
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

export function ProjectsView({ selectedProjectId, onSelectProject }: ProjectsViewProps) {
  const { user } = useAuth();
  const { projects, loading: loadingProjects, error, saveProject, deleteProject, refresh: refreshProjects } = useProjects();
  const [activeTab, setActiveTab] = useState<'orcamento' | 'cronograma' | 'financeiro' | 'concorrencia' | 'diario' | 'colaboradores' | 'medicoes'>('orcamento');

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
    bidGroups,
    dailyLogs,
    measurements,
    loading: loadingData,
    canEditBudget,
    canAccessFinance,
    canAccessBids,
    canAccessMeasurements,
    canAccessDailyLog,
    isAdmin,
    userRole,
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
    // SECURITY FIX: If the user's role for this specific project is 'proprietor',
    // force them into the ProprietorView, preventing access to the financial tabs.
    if (userRole === 'proprietor') {
      return <ProprietorView selectedProjectId={selectedProjectId} onBack={() => onSelectProject(null)} />;
    }

    return (
      <div className="space-y-12 max-w-[1400px] mx-auto pb-24 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onSelectProject(null)} 
              className="p-4 bg-white/5 hover:bg-primary/10 rounded-2xl transition-all duration-300 text-on-surface-variant hover:text-primary border border-white/5 group active:scale-90"
            >
              <ChevronLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white uppercase">{selectedProject.name}</h2>
                <div className={cn(
                  "px-4 py-1.5 text-[10px] font-display font-bold rounded-lg border backdrop-blur-xl uppercase tracking-[2px]",
                  selectedProject.status === 'Em andamento' ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(34,255,136,0.2)]' : 'bg-white/5 text-on-surface-variant border-white/10'
                )}>
                  {selectedProject.status}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1 w-1 bg-primary rounded-full animate-pulse" />
                <p className="text-on-surface-variant text-[11px] font-display uppercase tracking-[3px]">{selectedProject.location} • INÍCIO: {selectedProject.start_date || 'N/D'}</p>
              </div>
            </div>
          </div>
          {userRole === 'owner' && (
            <button
              onClick={() => setActiveTab('colaboradores')}
              className={cn(
                "w-full md:w-auto px-6 py-4 text-[10px] font-display font-bold uppercase tracking-[2px] rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 border active:scale-95",
                activeTab === 'colaboradores'
                  ? "bg-primary text-background border-primary shadow-[0_0_20px_rgba(34,255,136,0.3)]"
                  : "bg-surface-container-high/40 text-on-surface-variant border-white/5 hover:border-primary/30 hover:text-white"
              )}
            >
              <Users className="h-4 w-4" /> Gestão de Equipe
            </button>
          )}
        </div>

        <div className="flex border-b border-white/5 mb-10 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 gap-2">
          {[
            { id: 'orcamento', label: 'Orçamento', visible: canEditBudget },
            { id: 'financeiro', label: 'Financeiro', visible: canAccessFinance },
            { id: 'concorrencia', label: 'Concorrência', visible: canAccessBids },
            { id: 'cronograma', label: 'Cronograma', visible: canAccessBids },
            { id: 'medicoes', label: 'Medições', visible: canAccessMeasurements },
            { id: 'diario', label: 'Diário de Obra', visible: canAccessDailyLog },
          ].filter(tab => tab.visible).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-8 py-5 text-[10px] font-display font-bold uppercase tracking-[3px] border-b-2 transition-all duration-300 whitespace-nowrap relative group",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-white"
              )}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute inset-0 bg-primary/5 blur-xl -z-10" />}
            </button>
          ))}
        </div>

        <div className="relative">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
          {activeTab === 'orcamento' && (
            <BudgetTab
              projectId={selectedProjectId}
              budgetItems={budgetItems}
              financialItems={financialItems}
              onRefresh={refreshData}
              readOnly={!canEditBudget}
            />
          )}
          {activeTab === 'financeiro' && (
            <FinanceTab
              projectId={selectedProjectId}
              financialItems={financialItems}
              budgetItems={budgetItems}
              onRefresh={refreshData}
              readOnly={!canAccessFinance}
            />
          )}
          {activeTab === 'concorrencia' && (
            <BidComparisonTab
              projectId={selectedProjectId}
              bidGroups={bidGroups}
              budgetItems={budgetItems}
              onRefresh={refreshData}
              readOnly={!canAccessBids}
            />
          )}
          {activeTab === 'cronograma' && (
            <ScheduleTab
              projectId={selectedProjectId}
              scheduleItems={scheduleItems}
              onRefresh={refreshData}
              readOnly={!canAccessBids}
            />
          )}
          {activeTab === 'medicoes' && (
            <MeasurementsTab
              projectId={selectedProjectId}
              budgetItems={budgetItems}
              measurements={measurements}
              bidGroups={bidGroups}
              onRefresh={refreshData}
              readOnly={!canAccessMeasurements}
            />
          )}
          {activeTab === 'diario' && (
            <DailyLogTab
              projectId={selectedProjectId}
              dailyLogs={dailyLogs}
              onRefresh={refreshData}
              readOnly={!canAccessDailyLog}
            />
          )}
          {activeTab === 'colaboradores' && (
            <CollaboratorsTab
              project={selectedProject}
              onRefresh={refreshData}
            />
          )}
        </div>

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
    <div className="space-y-12 max-w-[1400px] mx-auto pb-24 relative">
      <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16 relative">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div>
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white uppercase group">
            CENTRAL DE <span className="text-primary group-hover:drop-shadow-[0_0_15px_rgba(34,255,136,0.5)] transition-all">PROJETOS</span>
          </h2>
          <div className="flex items-center gap-3 mt-3">
            <div className="h-[1px] w-12 bg-primary/30" />
            <p className="text-on-surface-variant text-[11px] font-display uppercase tracking-[4px]">{projects.length} OPERAÇÕES EM MONITORAMENTO</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={handleNew}
            className="w-full md:w-auto px-8 py-5 bg-primary text-background text-[11px] font-display font-bold rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-[0_0_30px_-5px_rgba(34,255,136,0.4)] uppercase tracking-[3px] active:scale-95"
          >
            <Plus className="h-5 w-5" /> Iniciar Nova Obra
          </button>
        )}
      </div>

      {loadingProjects ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[4px] animate-pulse">Sincronizando Portfólio...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-error/5 border border-error/20 p-8 rounded-[32px] mb-12 flex items-center gap-6">
              <div className="p-4 bg-error/10 rounded-2xl text-error">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-error font-display font-bold uppercase tracking-[2px] mb-1">ERRO DE SINCRONIZAÇÃO</h3>
                <p className="text-sm text-on-surface-variant opacity-80">{error}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="group relative bg-surface-container-low/40 backdrop-blur-xl rounded-[32px] border border-white/5 overflow-hidden flex flex-col hover:border-primary/40 cursor-pointer transition-all duration-500 hover:translate-y-[-8px] shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-20">
                  {project.user_id === user?.id && (
                    <>
                      <button
                        onClick={(e) => handleEdit(e, project)}
                        className="p-3 bg-background/80 text-on-surface-variant hover:text-primary border border-white/10 rounded-xl backdrop-blur-xl transition-all hover:border-primary/50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingProject(project); }}
                        className="p-3 bg-background/80 text-on-surface-variant hover:text-error border border-white/10 rounded-xl backdrop-blur-xl transition-all hover:border-error/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                <div className="p-10 flex-1 relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div className={cn(
                      "px-4 py-1.5 rounded-lg text-[9px] font-display font-bold uppercase tracking-[2px] border",
                      project.status === 'Em andamento' ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(34,255,136,0.2)]' :
                        project.status === 'Finalizada' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-white/5 text-on-surface-variant border-white/10'
                    )}>
                      {project.status}
                    </div>
                  </div>

                  <h3 className="text-2xl font-display font-bold text-white tracking-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[64px] uppercase leading-tight">{project.name}</h3>

                  <div className="mt-8 space-y-5">
                    <div className="flex items-center gap-4 group/item">
                      <div className="p-2 rounded-lg bg-white/5 group-hover/item:bg-primary/10 transition-colors">
                        <MapIcon className="h-4 w-4 text-on-surface-variant group-hover/item:text-primary" />
                      </div>
                      <span className="text-[11px] font-display font-bold text-on-surface-variant uppercase tracking-widest">{project.location || 'LOCAL NÃO DEFINIDO'}</span>
                    </div>
                    <div className="flex items-center gap-4 group/item">
                      <div className="p-2 rounded-lg bg-white/5 group-hover/item:bg-primary/10 transition-colors">
                        <div className="w-4 h-4 flex items-center justify-center font-display font-bold text-[9px] text-on-surface-variant group-hover/item:text-primary uppercase">m²</div>
                      </div>
                      <span className="text-[11px] font-display font-bold text-on-surface-variant uppercase tracking-widest">{project.area || '0'},00 M² DE ÁREA</span>
                    </div>
                    <div className="flex items-center gap-4 group/item">
                      <div className="p-2 rounded-lg bg-white/5 group-hover/item:bg-primary/10 transition-colors">
                        <CalendarIcon className="h-4 w-4 text-on-surface-variant group-hover/item:text-primary" />
                      </div>
                      <span className="text-[11px] font-display font-bold text-on-surface-variant uppercase tracking-widest">ENTREGA: {project.deadline || 'EM ANÁLISE'}</span>
                    </div>
                  </div>
                </div>

                <div className="px-10 py-6 bg-white/2 border-t border-white/5 flex items-center justify-between group-hover:bg-primary/5 transition-all duration-500">
                  <span className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px] group-hover:text-primary transition-colors">Acessar Unidade</span>
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary text-on-surface-variant group-hover:text-background transition-all duration-500 shadow-[0_0_15px_rgba(34,255,136,0)] group-hover:shadow-[0_0_15px_rgba(34,255,136,0.4)]">
                    <ChevronLeft className="h-4 w-4 rotate-180" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#1C232E] rounded-[24px] shadow-2xl border border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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
                <input type="text" placeholder="Ex: Residência Alto do Lago..." value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cliente</label>
                  <input type="text" placeholder="Nome do proprietário" value={formData.client || ''} onChange={e => setFormData({ ...formData, client: e.target.value })} className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Status</label>
                  <select value={formData.status || 'Planejamento'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none appearance-none">
                    <option value="Planejamento">Planejamento</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Finalizada">Finalizada</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Área Total (m²)</label>
                  <input type="number" placeholder="0,00" value={formData.area || ''} onChange={e => setFormData({ ...formData, area: e.target.value === '' ? 0 : Number(e.target.value) })} className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Localização</label>
                  <input type="text" placeholder="Endereço da obra" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data de Início</label>
                  <input type="date" value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Previsão Entrega</label>
                  <input type="date" value={formData.deadline || ''} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" />
                </div>
              </div>
              <textarea placeholder="Observações adicionais sobre o projeto..." rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none resize-none" />
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProject}
                  className="px-8 py-3 bg-[#BCB5AC] text-[#1C232E] text-xs font-bold rounded-xl uppercase tracking-[1.5px] hover:bg-slate-700 transition-all shadow-lg shadow-black/20 active:scale-[0.98]"
                >
                  Salvar Projeto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={confirmDelete}
        title="Excluir Projeto?"
        message={`Tem certeza que deseja excluir o projeto "${deletingProject?.name}"? Esta ação não pode ser desfeita.`}
        requireText="Excluir"
      />

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

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
  Users,
  FileSpreadsheet
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
import { LimitModal } from '../components/ui/LimitModal';
import { ProprietorView } from './ProprietorView';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { useEffect } from 'react';
import * as XLSX from 'xlsx';


interface ProjectsViewProps {
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

export function ProjectsView({ selectedProjectId, onSelectProject }: ProjectsViewProps) {
  const { user } = useAuth();
  const { projects, loading: loadingProjects, error, saveProject, deleteProject, refresh: refreshProjects } = useProjects();
  const { currentPlan, checkProjectLimit } = useSubscription();
  const [activeTab, setActiveTab] = useState<'orcamento' | 'cronograma' | 'financeiro' | 'concorrencia' | 'diario' | 'colaboradores' | 'medicoes'>('orcamento');

  // Modals for Projects
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPciPromptModalOpen, setIsPciPromptModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [pciItems, setPciItems] = useState<any[]>([]);
  const [isCollaboratorsModalOpen, setIsCollaboratorsModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
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
    setPciItems([]);
    setFormData(project);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    if (!checkProjectLimit()) {
      setIsLimitModalOpen(true);
      return;
    }

    setEditingProject(null);
    setPciItems([]);
    setFormData({
      status: 'Planejamento',
      area: 0,
      contract_value: 0,
      start_date: new Date().toISOString().split('T')[0],
      name: '',
      client: '',
      location: '',
      deadline: '',
      description: ''
    });
    setIsPciPromptModalOpen(true);
  };

  const handleSaveProject = async () => {
    try {
      const contractValue = formData.contract_value || 0;
      const itemsToSave = pciItems.map(item => ({
        ...item,
        unit_cost: contractValue * (item.incidence / 100)
      }));

      await saveProject(formData, itemsToSave);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        // Procurar a aba "1 PCI" ou similar
        const sheetName = wb.SheetNames.find(n => n.includes('PCI') || n.includes('Proposta') || n.includes('1'));
        if (!sheetName) {
          setAlertConfig({ isOpen: true, title: 'Erro', message: 'Aba PCI não encontrada na planilha.', type: 'error' });
          return;
        }

        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        
        let headerRowIdx = -1;
        let colItem = -1, colServico = -1, colIncidencia = -1;
        
        // Scan first 200 rows to find headers globally
        for (let i = 0; i < Math.min(data.length, 200); i++) {
          const row = data[i];
          if (!row) continue;
          
          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || '').toLowerCase().trim();
            if ((cell === 'item' || cell === 'código') && colItem === -1) colItem = j;
            if ((cell === 'serviço' || cell === 'serviços' || cell === 'descrição') && colServico === -1) colServico = j;
            if ((cell === 'incidência' || cell === 'incidencia' || cell === 'peso') && colIncidencia === -1) {
              colIncidencia = j;
              headerRowIdx = i; // A tabela começa logo após a linha da Incidência
            }
          }
          
          if (colItem !== -1 && colServico !== -1 && colIncidencia !== -1 && headerRowIdx !== -1) {
            break;
          }
        }

        if (headerRowIdx === -1) {
          setAlertConfig({ isOpen: true, title: 'Erro', message: 'Cabeçalhos (Item, Serviço, Incidência) não encontrados.', type: 'error' });
          return;
        }
        
        const extractedItems = [];

        for (let i = headerRowIdx + 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;
          
          const itemVal = String(row[colItem] || '').trim();
          const servicoVal = String(row[colServico] || '').trim();
          let incVal = row[colIncidencia];
          
          if (!servicoVal && !itemVal) continue;
          
          // Parar se qualquer célula na linha contiver indicadores de total/fim da tabela principal
          const rowText = row.map(cell => String(cell || '').toLowerCase().trim()).join(' ');
          if (
            rowText.includes('custo total') || 
            rowText.includes('totais') || 
            rowText.includes('total de serviços') ||
            rowText.includes('total de servicos') ||
            rowText.includes('resumo dos custos')
          ) {
            break;
          }
          
          let incidence = 0;
          if (typeof incVal === 'number') {
            incidence = incVal < 1 ? incVal * 100 : incVal;
          } else if (typeof incVal === 'string') {
            incidence = parseFloat(incVal.replace(',', '.').replace('%', ''));
            if (isNaN(incidence)) incidence = 0;
          }

          if (itemVal && servicoVal) {
            // A categoria será baseada no próprio nome do serviço (pegando a primeira parte antes dos parênteses)
            let catName = servicoVal.split('(')[0].trim().toUpperCase();
            if (itemVal === '1' || catName.includes('BARRAC')) catName = 'SERVIÇOS PRELIMINARES';
            
            extractedItems.push({
              code: itemVal,
              description: servicoVal,
              incidence: incidence,
              category: catName,
              unit: 'vb',
              quantity: 1
            });
          }
        }

        setPciItems(extractedItems);
        setAlertConfig({ isOpen: true, title: 'Sucesso', message: `${extractedItems.length} itens importados!`, type: 'success' });
        
        setIsPciPromptModalOpen(false);
        setIsModalOpen(true);

        // Clear input so it can be selected again
        e.target.value = '';

      } catch (err) {
        console.error(err);
        setAlertConfig({ isOpen: true, title: 'Erro', message: 'Erro ao ler o arquivo.', type: 'error' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const confirmDelete = async () => {
    if (deletingProject) {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
      refreshProjects();
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (currentPlan && !currentPlan.access_projects) {
    return (
      <div className="flex flex-col items-center justify-center py-32 max-w-lg mx-auto text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center border border-error/20">
          <AlertCircle className="h-10 w-10 text-error" />
        </div>
        <h2 className="text-3xl font-display font-bold uppercase tracking-tight text-on-surface">Módulo Indisponível</h2>
        <p className="text-on-surface-variant leading-relaxed">
          O seu plano atual <strong>({currentPlan.name})</strong> não possui acesso ao módulo de Gestão de Obras. 
          Faça o upgrade do seu plano para gerenciar e cadastrar obras.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'plans' }))}
          className="mt-4 px-8 py-4 bg-primary text-background font-display font-bold uppercase tracking-[2px] rounded-2xl hover:scale-105 transition-all shadow-[0_0_20px_-5px_rgba(34,255,136,0.4)]"
        >
          Fazer Upgrade
        </button>
      </div>
    );
  }

  if (selectedProjectId && selectedProject) {
    // SECURITY FIX: If the user's role for this specific project is 'proprietor',
    // force them into the ProprietorView, preventing access to the financial tabs.
    if (userRole === 'proprietor') {
      return <ProprietorView selectedProjectId={selectedProjectId} onBack={() => onSelectProject(null)} />;
    }

    return (
      <div className="space-y-12 max-w-[1400px] mx-auto pb-24 relative animate-in fade-in slide-in-from-bottom-4 duration-500 print:pb-0 print:space-y-0 print:max-w-none print:w-full print:animate-none print:transform-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 print:hidden">
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
                <div className={cn(
                  "px-4 py-1.5 text-[10px] font-display font-bold rounded-lg border backdrop-blur-xl uppercase tracking-[2px]",
                  selectedProject.status === 'Em andamento' ? 'bg-primary/10 text-primary border-primary/20 shadow-sm border-primary/20' : 'bg-surface-container-low text-on-surface-variant border-outline'
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
                  : "bg-surface-container-high/40 text-on-surface-variant border-outline hover:border-primary/30 hover:text-on-surface"
              )}
            >
              <Users className="h-4 w-4" /> Gestão de Equipe
            </button>
          )}
        </div>

        <div className="flex border-b border-outline mb-10 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 gap-2 print:hidden">
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
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
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
              contractValue={selectedProject.contract_value}
              budgetItems={budgetItems}
              financialItems={financialItems}
              bidGroups={bidGroups}
              measurements={measurements}
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
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-on-surface uppercase group">
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
                onClick={() => {
                  const isOwnerBlocked = ((project as any).owner_status === 'pending' || (project as any).owner_status === 'expired') && project.user_id !== user?.id;
                  if (!isOwnerBlocked) onSelectProject(project.id);
                }}
                className={cn(
                  "group relative bg-surface-container-low/40 backdrop-blur-xl rounded-[32px] border border-outline overflow-hidden flex flex-col transition-all duration-500 shadow-2xl",
                  (((project as any).owner_status === 'pending' || (project as any).owner_status === 'expired') && project.user_id !== user?.id) 
                    ? "opacity-80 grayscale-[50%] cursor-not-allowed" 
                    : "hover:border-primary/40 cursor-pointer hover:translate-y-[-8px]"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Overlay de Bloqueio se o Dono da Conta estiver inativo */}
                {((project as any).owner_status === 'pending' || (project as any).owner_status === 'expired') && project.user_id !== user?.id && (
                  <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="p-3 bg-error/10 rounded-full mb-3">
                      <AlertCircle className="h-6 w-6 text-error" />
                    </div>
                    <p className="text-xs font-display font-bold text-on-surface uppercase tracking-widest mb-1">Acesso Bloqueado</p>
                    <p className="text-[10px] text-on-surface-variant">A assinatura do engenheiro responsável por esta obra está inativa.</p>
                  </div>
                )}
                
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-20">
                  {project.user_id === user?.id && (
                    <>
                      <button
                        onClick={(e) => handleEdit(e, project)}
                        className="p-3 bg-background/80 text-on-surface-variant hover:text-primary border border-outline rounded-xl backdrop-blur-xl transition-all hover:border-primary/50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingProject(project); }}
                        className="p-3 bg-background/80 text-on-surface-variant hover:text-error border border-outline rounded-xl backdrop-blur-xl transition-all hover:border-error/50"
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
                      project.status === 'Em andamento' ? 'bg-primary/10 text-primary border-primary/20 shadow-sm border-primary/20' :
                        project.status === 'Finalizada' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-surface-container-low text-on-surface-variant border-outline'
                    )}>
                      {project.status}
                    </div>
                  </div>

                  <h3 className="text-2xl font-display font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[64px] uppercase leading-tight">{project.name}</h3>

                  <div className="mt-8 space-y-5">
                    <div className="flex items-center gap-4 group/item">
                      <div className="p-2 rounded-lg bg-surface-container-low group-hover/item:bg-primary/10 transition-colors">
                        <MapIcon className="h-4 w-4 text-on-surface-variant group-hover/item:text-primary" />
                      </div>
                      <span className="text-[11px] font-display font-bold text-on-surface-variant uppercase tracking-widest">{project.location || 'LOCAL NÃO DEFINIDO'}</span>
                    </div>
                    <div className="flex items-center gap-4 group/item">
                      <div className="p-2 rounded-lg bg-surface-container-low group-hover/item:bg-primary/10 transition-colors">
                        <div className="w-4 h-4 flex items-center justify-center font-display font-bold text-[9px] text-on-surface-variant group-hover/item:text-primary uppercase">m²</div>
                      </div>
                      <span className="text-[11px] font-display font-bold text-on-surface-variant uppercase tracking-widest">{project.area || '0'},00 M² DE ÁREA</span>
                    </div>
                    <div className="flex items-center gap-4 group/item">
                      <div className="p-2 rounded-lg bg-surface-container-low group-hover/item:bg-primary/10 transition-colors">
                        <CalendarIcon className="h-4 w-4 text-on-surface-variant group-hover/item:text-primary" />
                      </div>
                      <span className="text-[11px] font-display font-bold text-on-surface-variant uppercase tracking-widest">ENTREGA: {project.deadline || 'EM ANÁLISE'}</span>
                    </div>
                  </div>
                </div>

                <div className="px-10 py-6 bg-white/2 border-t border-outline flex items-center justify-between group-hover:bg-primary/5 transition-all duration-500">
                  <span className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px] group-hover:text-primary transition-colors">Acessar Unidade</span>
                  <div className="p-2 rounded-lg bg-surface-container-low group-hover:bg-primary text-on-surface-variant group-hover:text-background transition-all duration-500 shadow-[0_0_15px_rgba(34,255,136,0)] group-hover:shadow-[0_0_15px_rgba(34,255,136,0.4)]">
                    <ChevronLeft className="h-4 w-4 rotate-180" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {isPciPromptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-container-low/90 backdrop-blur-md" onClick={() => setIsPciPromptModalOpen(false)}></div>
          <div className="relative bg-surface rounded-[24px] shadow-2xl border border-outline w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 flex items-center justify-center rounded-2xl mb-6 border border-primary/20">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-display font-bold text-on-surface tracking-tight mb-3 uppercase">Anexar Planilha PCI?</h3>
            <p className="text-on-surface-variant text-sm mb-8">
              Você deseja importar os serviços e itens a partir da planilha padrão da Caixa (PCI)? Opcionalmente, você pode preencher os dados manualmente.
            </p>
            <div className="flex flex-col gap-4">
              <label className="w-full px-6 py-4 bg-primary text-background text-[11px] font-display font-bold rounded-xl uppercase tracking-[2px] hover:scale-105 transition-all shadow-[0_0_20px_-5px_rgba(34,255,136,0.4)] cursor-pointer flex items-center justify-center gap-2 active:scale-95">
                <FileSpreadsheet className="h-4 w-4" />
                Sim, anexar planilha
                <input type="file" accept=".xlsx,.xlsm,.xls,.xlsb" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                onClick={() => {
                  setIsPciPromptModalOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full px-6 py-4 bg-transparent text-on-surface-variant border border-outline text-[11px] font-display font-bold rounded-xl uppercase tracking-[2px] hover:bg-surface-container-low hover:text-on-surface transition-all active:scale-95"
              >
                Não, cadastrar manualmente
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-container-low/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-surface rounded-[24px] shadow-2xl border border-outline w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-on-surface tracking-tight">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-2 hover:bg-surface-container-high rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-8 pb-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nome da Obra</label>
                <input type="text" placeholder="Ex: Residência Alto do Lago..." value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Cliente</label>
                  <input type="text" placeholder="Nome do proprietário" value={formData.client || ''} onChange={e => setFormData({ ...formData, client: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Status</label>
                  <select value={formData.status || 'Planejamento'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none appearance-none">
                    <option value="Planejamento">Planejamento</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Finalizada">Finalizada</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Área Total (m²)</label>
                  <input type="number" placeholder="0,00" value={formData.area || ''} onChange={e => setFormData({ ...formData, area: e.target.value === '' ? 0 : Number(e.target.value) })} className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Localização</label>
                  <input type="text" placeholder="Endereço da obra" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Valor do Contrato (R$)</label>
                  <input 
                    type="text" 
                    placeholder="0,00" 
                    value={formData.contract_value ? formData.contract_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''} 
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, contract_value: value ? Number(value) / 100 : 0 });
                    }} 
                    className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Planilha PCI (Opcional)</label>
                  <div className="flex items-center justify-center w-full bg-surface/50 border border-outline rounded-xl px-4 py-2 text-sm text-on-surface-variant h-[46px]">
                    <span className="truncate">{pciItems.length > 0 ? 'Planilha Importada' : 'Planilha Manual'}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Data de Início</label>
                  <input type="date" value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Previsão Entrega</label>
                  <input type="date" value={formData.deadline || ''} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none" />
                </div>
              </div>
              <textarea placeholder="Observações adicionais sobre o projeto..." rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none resize-none" />
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-widest hover:text-on-surface transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProject}
                  className="px-8 py-3 bg-primary text-on-primary text-xs font-bold rounded-xl uppercase tracking-[1.5px] hover:opacity-90 transition-all shadow-lg shadow-sm active:scale-[0.98]"
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

      <LimitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        title="Limite do Plano Atingido"
        message={currentPlan ? `Seu plano atual (${currentPlan.name}) permite apenas ${currentPlan.max_projects} ${currentPlan.max_projects === 1 ? 'obra ativa' : 'obras ativas'}. Faça upgrade para continuar cadastrando novos projetos.` : 'Limite de obras atingido.'}
        onUpgrade={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'plans' }))}
      />
    </div>
  );
}

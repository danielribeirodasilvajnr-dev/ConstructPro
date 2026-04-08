import React, { useState } from 'react';
import {
  TrendingUp,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Filter,
  Plus,
  Camera,
  FileText,
  HardHat,
  MessageSquare,
  ArrowRight,
  Calendar as CalendarIcon,
  Search,
  MoreVertical,
  Cloud,
  Sun,
  Verified,
  Map as MapIcon,
  ClipboardList,
  ChevronLeft,
  Wallet,
  Edit,
  Trash2,
  X,
  Save,
  Paperclip,
  Calculator as CalculatorIcon,
  RefreshCw,
  ArrowLeft,
  Printer,
  MessageCircle,
  Settings,
  Instagram
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

// --- Projects View ---
export function ProjectsView() {
  const initialProjects = [
    {
      name: 'Grimaldo Tolaini 50',
      client: 'Construtora Horizonte',
      location: 'Marcelino - Jandira',
      area: 155,
      startDate: '10/01/2024',
      deadline: '30/09/2025',
      status: 'Em Andamento',
      description: '',
      budgetItems: [
        { id: 1, category: 'OUTROS', code: '20', description: 'Outros (discriminar em Serviços Adicionais, abaixo)', unit: 'vb', quantity: 1, unitCost: 61814.00 },
        { id: 2, category: 'OUTROS', code: '19', description: 'Complementos (limpeza final e calafete)', unit: 'vb', quantity: 1, unitCost: 1984.00 },
        { id: 3, category: 'OUTROS', code: '18', description: 'Louças e Metais', unit: 'vb', quantity: 1, unitCost: 25916.00 },
        { id: 4, category: 'INST. HIDRÁULICAS', code: '17', description: 'Instalações: Esgoto e Águas Pluviais', unit: 'vb', quantity: 1, unitCost: 23932.00 },
        { id: 5, category: 'INST. HIDRÁULICAS', code: '16', description: 'Instalações Hidráulicas', unit: 'vb', quantity: 1, unitCost: 23932.00 },
      ]
    }
  ];

  const [projectsList, setProjectsList] = React.useState(() => {
    const saved = localStorage.getItem('constructpro_projects');
    if (saved) return JSON.parse(saved);
    return initialProjects;
  });

  React.useEffect(() => {
    localStorage.setItem('constructpro_projects', JSON.stringify(projectsList));
  }, [projectsList]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [formData, setFormData] = React.useState<any>(null);
  const getEmptyProject = () => ({
    name: '', client: '', location: '', area: '', startDate: '', deadline: '', status: 'Planejamento', description: '', budgetItems: [], scheduleItems: [], financialItems: [], dailyLogs: []
  });

  const [selectedProjectIndex, setSelectedProjectIndex] = React.useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = React.useState<number | null>(null);
  const [activeProjectTab, setActiveProjectTab] = React.useState<'orcamento' | 'cronograma' | 'financeiro' | 'diario'>('orcamento');

  // Item Form State
  const [isItemModalOpen, setIsItemModalOpen] = React.useState(false);
  const [editingItemIndex, setEditingItemIndex] = React.useState<number | null>(null);
  const [deletingItemIndex, setDeletingItemIndex] = React.useState<number | null>(null);
  const [itemFormData, setItemFormData] = React.useState<any>(null);
  const getEmptyItem = () => ({
    category: 'OUTROS', code: '', description: '', unit: 'vb', quantity: 1, unitCost: 0
  });

  // Schedule Form State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false);
  const [editingScheduleIndex, setEditingScheduleIndex] = React.useState<number | null>(null);
  const [deletingScheduleIndex, setDeletingScheduleIndex] = React.useState<number | null>(null);
  const [scheduleFormData, setScheduleFormData] = React.useState<any>(null);
  const getEmptyScheduleItem = () => ({
    name: '', dependency: '', startDate: '', endDate: '', progress: 0
  });

  // Finance Form State
  const [isFinanceModalOpen, setIsFinanceModalOpen] = React.useState(false);
  const [editingFinanceIndex, setEditingFinanceIndex] = React.useState<number | null>(null);
  const [deletingFinanceIndex, setDeletingFinanceIndex] = React.useState<number | null>(null);
  const [financeFormData, setFinanceFormData] = React.useState<any>(null);
  const [financeSearchTerm, setFinanceSearchTerm] = React.useState('');
  const [financeCategoryFilter, setFinanceCategoryFilter] = React.useState('Todas');
  const getEmptyFinanceItem = () => ({
    date: new Date().toISOString().split('T')[0], description: '', category: 'Material', supplier: '', amount: 0, budgetItemLinked: '', receiptImage: '', receiptName: '', observations: ''
  });

  // Daily Log Form State (RDO)
  const [isDailyModalOpen, setIsDailyModalOpen] = React.useState(false);
  const [editingDailyIndex, setEditingDailyIndex] = React.useState<number | null>(null);
  const [deletingDailyIndex, setDeletingDailyIndex] = React.useState<number | null>(null);
  const [dailyFormData, setDailyFormData] = React.useState<any>(null);
  const getEmptyDailyLog = () => ({
    date: new Date().toISOString().split('T')[0], weather: 'Ensolarado', workers: 0, activities: '', restrictions: '', photos: []
  });

  const handleDeleteClick = (index: number) => {
    setDeletingIndex(index);
  };

  const confirmDelete = () => {
    if (deletingIndex !== null) {
      const newList = [...projectsList];
      newList.splice(deletingIndex, 1);
      setProjectsList(newList);
      setDeletingIndex(null);
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setFormData(JSON.parse(JSON.stringify(projectsList[index])));
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingIndex(null);
    setFormData(getEmptyProject());
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const updatedForm = { ...formData };
    if (!updatedForm.budgetItems) updatedForm.budgetItems = [];
    const newList = [...projectsList];
    if (editingIndex !== null) {
      newList[editingIndex] = updatedForm;
    } else {
      newList.push(updatedForm);
    }
    setProjectsList(newList);
    setIsModalOpen(false);
  };

  // Funções de Items
  const handleItemSave = () => {
    if (selectedProjectIndex === null) return;
    const project = { ...projectsList[selectedProjectIndex] };
    const items = project.budgetItems ? [...project.budgetItems] : [];

    if (editingItemIndex !== null) {
      items[editingItemIndex] = { ...itemFormData, id: items[editingItemIndex].id };
    } else {
      items.push({ ...itemFormData, id: Date.now() });
    }

    project.budgetItems = items;
    const newList = [...projectsList];
    newList[selectedProjectIndex] = project;
    setProjectsList(newList);
    setIsItemModalOpen(false);
  };

  const handleItemDelete = (e: React.MouseEvent, itemIndex: number) => {
    e.stopPropagation();
    setDeletingItemIndex(itemIndex);
  };

  const confirmItemDelete = () => {
    if (selectedProjectIndex === null || deletingItemIndex === null) return;
    const project = { ...projectsList[selectedProjectIndex] };
    const items = [...project.budgetItems];
    items.splice(deletingItemIndex, 1);
    project.budgetItems = items;
    const newList = [...projectsList];
    newList[selectedProjectIndex] = project;
    setProjectsList(newList);
    setDeletingItemIndex(null);
  };

  // Funções do Cronograma (Gantt)
  const handleScheduleSave = () => {
    if (selectedProjectIndex === null) return;
    const project = { ...projectsList[selectedProjectIndex] };
    const items = project.scheduleItems ? [...project.scheduleItems] : [];

    if (editingScheduleIndex !== null) {
      items[editingScheduleIndex] = { ...scheduleFormData, id: items[editingScheduleIndex].id };
    } else {
      items.push({ ...scheduleFormData, id: Date.now() });
    }

    // Auto sort by startDate just to keep Gantt logical
    items.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    project.scheduleItems = items;
    const newList = [...projectsList];
    newList[selectedProjectIndex] = project;
    setProjectsList(newList);
    setIsScheduleModalOpen(false);
  };

  const handleScheduleDelete = (e: React.MouseEvent, itemIndex: number) => {
    e.stopPropagation();
    setDeletingScheduleIndex(itemIndex);
  };

  const confirmScheduleDelete = () => {
    if (selectedProjectIndex === null || deletingScheduleIndex === null) return;
    const project = { ...projectsList[selectedProjectIndex] };
    const items = project.scheduleItems ? [...project.scheduleItems] : [];
    items.splice(deletingScheduleIndex, 1);
    project.scheduleItems = items;
    const newList = [...projectsList];
    newList[selectedProjectIndex] = project;
    setProjectsList(newList);
    setDeletingScheduleIndex(null);
  };

  // Funções Financeiras
  const handleFinanceSave = () => {
    if (selectedProjectIndex === null) return;
    const project = { ...projectsList[selectedProjectIndex] };
    const items = project.financialItems ? [...project.financialItems] : [];

    if (editingFinanceIndex !== null) {
      items[editingFinanceIndex] = { ...financeFormData, id: items[editingFinanceIndex].id };
    } else {
      items.push({ ...financeFormData, id: Date.now() });
    }

    // Sort by Date descending (newest first like typical extract)
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    project.financialItems = items;
    const newList = [...projectsList];
    newList[selectedProjectIndex] = project;
    setProjectsList(newList);
    setIsFinanceModalOpen(false);
  };

  const handleFinanceDelete = (e: React.MouseEvent, itemIndex: number) => {
    e.stopPropagation();
    setDeletingFinanceIndex(itemIndex);
  };

  const confirmFinanceDelete = () => {
    if (selectedProjectIndex === null || deletingFinanceIndex === null) return;
    const project = { ...projectsList[selectedProjectIndex] };
    const items = project.financialItems ? [...project.financialItems] : [];
    items.splice(deletingFinanceIndex, 1);
    project.financialItems = items;
    const newList = [...projectsList];
    newList[selectedProjectIndex] = project;
    setProjectsList(newList);
    setDeletingFinanceIndex(null);
  };

  const handleFinanceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem da nota deve ter no máximo 2MB para esta demonstração.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFinanceFormData({
          ...financeFormData,
          receiptImage: reader.result as string,
          receiptName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDailySave = () => {
    if (selectedProjectIndex === null) return;
    const project = { ...projectsList[selectedProjectIndex] };
    const logs = project.dailyLogs ? [...project.dailyLogs] : [];

    if (editingDailyIndex !== null) {
      logs[editingDailyIndex] = { ...dailyFormData };
    } else {
      logs.unshift({ ...dailyFormData, id: Date.now().toString() }); // Add strictly at the beginning (newer first layout)
    }

    project.dailyLogs = logs;
    const newList = [...projectsList];
    newList[selectedProjectIndex] = project;
    setProjectsList(newList);
    setIsDailyModalOpen(false);
    setDailyFormData(null);
    setEditingDailyIndex(null);
  };

  const handleDailyDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setDeletingDailyIndex(index);
  };

  const confirmDailyDelete = () => {
    if (selectedProjectIndex === null || deletingDailyIndex === null) return;
    const project = { ...projectsList[selectedProjectIndex] };
    const logs = project.dailyLogs ? [...project.dailyLogs] : [];
    logs.splice(deletingDailyIndex, 1);
    project.dailyLogs = logs;
    const newList = [...projectsList];
    newList[selectedProjectIndex] = project;
    setProjectsList(newList);
    setDeletingDailyIndex(null);
  };

  const handleDailyPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { // Compress limit logically
        alert("Para evitar travamentos de memória na demonstração, anexar imagens até 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhotos = [...(dailyFormData.photos || [])];
        newPhotos.push({ image: reader.result as string, description: '' });
        setDailyFormData({ ...dailyFormData, photos: newPhotos });
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotalBudget = (items: any[]) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((acc, item) => acc + (Number(item.unitCost) * Number(item.quantity)), 0);
  };

  // Se estamos visualizando um projeto específico
  if (selectedProjectIndex !== null) {
    const project = projectsList[selectedProjectIndex];
    const totalBudget = calculateTotalBudget(project.budgetItems);

    // FINANCE HELPER LOGIC
    const financialItems = project.financialItems || [];
    const totalFinanceSpent = financialItems.reduce((acc: number, item: any) => acc + Number(item.amount), 0);
    let financeRealizedPercent = 0;
    if (totalBudget > 0) financeRealizedPercent = (totalFinanceSpent / totalBudget) * 100;

    const getFinanceKpi = (category: string) => {
      return financialItems.filter((i: any) => i.category === category).reduce((acc: number, item: any) => acc + Number(item.amount), 0);
    };

    let filteredFinanceItems = financialItems;
    if (financeCategoryFilter !== 'Todas') {
      filteredFinanceItems = filteredFinanceItems.filter((i: any) => i.category === financeCategoryFilter);
    }
    if (financeSearchTerm) {
      filteredFinanceItems = filteredFinanceItems.filter((i: any) =>
        i.description.toLowerCase().includes(financeSearchTerm.toLowerCase()) ||
        (i.supplier && i.supplier.toLowerCase().includes(financeSearchTerm.toLowerCase()))
      );
    }
    const filteredFinanceSum = filteredFinanceItems.reduce((acc: number, item: any) => acc + Number(item.amount), 0);

    // Group budget items by category
    const itemsByCategory = (project.budgetItems || []).reduce((acc: any, item: any, index: number) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push({ ...item, originalIndex: index });
      return acc;
    }, {});

    // GANTT HELPER & MATH LOGIC
    const scheduleItems = project.scheduleItems || [];

    const getDaysBetween = (startStr: string, endStr: string) => {
      if (!startStr || !endStr) return 0;
      const start = new Date(startStr);
      const end = new Date(endStr);
      // Midnight check
      const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      const diffTime = endMidnight.getTime() - startMidnight.getTime();
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) + 1;
    };

    const getGanttStatus = (item: any) => {
      if (Number(item.progress) >= 100) return 'Concluído';
      const today = new Date();
      const end = new Date(item.endDate);
      const start = new Date(item.startDate);
      today.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);

      if (today > end && Number(item.progress) < 100) return 'Atrasado';
      if (today < start) return 'Pendente';
      return 'No Prazo';
    };

    const getStatusStyles = (status: string) => {
      if (status === 'Concluído') return "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20";
      if (status === 'Atrasado') return "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20";
      if (status === 'Pendente') return "text-slate-400 border-transparent bg-transparent";
      return "text-white border-transparent bg-transparent";
    };

    const getBarColorStatus = (status: string) => {
      if (status === 'Concluído') return { bg: 'bg-[#10B981]', fill: 'bg-emerald-300' };
      if (status === 'Atrasado') return { bg: 'bg-[#78350F]', fill: 'bg-[#F97316]' };
      if (status === 'Pendente') return { bg: 'bg-slate-700', fill: 'bg-slate-500' };
      return { bg: 'bg-[#1E3A8A]', fill: 'bg-[#3B82F6]' };
    };

    let ganttMinDate = new Date();
    let ganttMaxDate = new Date();
    let timelineMonths: any[] = [];
    let ganttTotalDays = 1;

    if (scheduleItems.length > 0) {
      ganttMinDate = new Date(Math.min(...scheduleItems.map((i: any) => new Date(i.startDate).getTime())));
      ganttMaxDate = new Date(Math.max(...scheduleItems.map((i: any) => new Date(i.endDate).getTime())));

      // Shift to the boundaries of the months
      ganttMinDate = new Date(ganttMinDate.getFullYear(), ganttMinDate.getMonth(), 1);
      ganttMaxDate = new Date(ganttMaxDate.getFullYear(), ganttMaxDate.getMonth() + 1, 0);

      ganttTotalDays = getDaysBetween(ganttMinDate.toISOString(), ganttMaxDate.toISOString());

      let curr = new Date(ganttMinDate);
      while (curr <= ganttMaxDate) {
        timelineMonths.push({
          name: curr.toLocaleString('pt-BR', { month: 'long' }),
          year: curr.getFullYear()
        });
        curr.setMonth(curr.getMonth() + 1);
      }
    } else {
      // Mock some months globally if empty to not look weird initially
      let curr = new Date();
      for (let i = 0; i < 4; i++) {
        timelineMonths.push({ name: curr.toLocaleString('pt-BR', { month: 'long' }), year: curr.getFullYear() });
        curr.setMonth(curr.getMonth() + 1);
      }
    }

    const formatGanttDateRange = (startStr: string, endStr: string) => {
      const s = new Date(startStr);
      const e = new Date(endStr);
      const format = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      return `${format(s)} - ${format(e)}`;
    };

    const getBarStyles = (item: any) => {
      if (!item.startDate || !item.endDate) return { left: '0%', width: '0%' };
      const startOffsetDays = getDaysBetween(ganttMinDate.toISOString(), item.startDate) - 1;
      const itemDays = getDaysBetween(item.startDate, item.endDate);
      const leftPercent = (startOffsetDays / ganttTotalDays) * 100;
      const widthPercent = (itemDays / ganttTotalDays) * 100;
      return { left: `${Math.max(0, leftPercent)}%`, width: `${Math.min(100, widthPercent)}%` };
    };

    // Calculate today's vertical line position
    const todayLineOffsetDays = getDaysBetween(ganttMinDate.toISOString(), new Date().toISOString()) - 1;
    let todayLinePercent = (todayLineOffsetDays / ganttTotalDays) * 100;
    const isTodayInView = todayLinePercent >= 0 && todayLinePercent <= 100;

    // KPI Counters
    const scheduleAtrasadas = scheduleItems.filter((i: any) => getGanttStatus(i) === 'Atrasado').length;
    const scheduleGlobalProgress = scheduleItems.length > 0 ? Math.round(scheduleItems.reduce((acc: number, i: any) => acc + Number(i.progress), 0) / scheduleItems.length) : 0;

    // Nearest upcoming item logic
    const futureItems = scheduleItems.filter((i: any) => new Date(i.endDate) >= new Date() && Number(i.progress) < 100)
      .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    const nextDelivery = futureItems.length > 0 ? futureItems[0] : null;

    return (
      <div className="space-y-8 max-w-[1400px] mx-auto pb-24 relative animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedProjectIndex(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold tracking-tight text-white">{project.name}</h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-[#FFF3D6] text-[#C48C00]">
                  {project.status}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">{project.location} • Início: {project.startDate || 'N/D'}</p>
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
              onClick={() => setActiveProjectTab(tab.id as any)}
              className={cn(
                "px-6 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors",
                activeProjectTab === tab.id
                  ? "border-[#3B82F6] text-[#3B82F6]"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeProjectTab === 'orcamento' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#13171f] p-6 rounded-2xl border border-[#3B82F6]/30 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3B82F6] to-transparent opacity-50 text-[#3B82F6]"></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pointer-events-none">Custo da obra</p>
                <h3 className="text-3xl font-black text-white pointer-events-none">R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                <CalculatorIcon className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 text-[#3B82F6]/20 pointer-events-none" />
              </div>

              <div className="bg-[#13171f] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pointer-events-none">Realizado</p>
                <h3 className="text-3xl font-black text-white pointer-events-none">R$ {totalFinanceSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                <p className={`text-xs font-medium mt-1 pointer-events-none ${financeRealizedPercent > 100 ? 'text-error' : 'text-emerald-500'}`}>
                  {financeRealizedPercent.toFixed(1)}% do orçamento
                </p>
                <Wallet className={`absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 pointer-events-none ${financeRealizedPercent > 100 ? 'text-error/10' : 'text-emerald-500/10'}`} />
              </div>
            </div>

            <div className="bg-[#0b0f19] rounded-2xl border border-white/5 shadow-2xl overflow-hidden mt-8">
              <div className="p-6 flex items-center justify-between border-b border-white/5 bg-[#13171f]">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Levantamento Quantitativo / Orçamento</h3>
                <button onClick={() => { setEditingItemIndex(null); setItemFormData(getEmptyItem()); setIsItemModalOpen(true); }} className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-[#2563EB] transition-colors shadow-lg shadow-[#3B82F6]/20">
                  <Plus className="h-4 w-4" /> Adicionar Item
                </button>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 w-24">Código</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500">Descrição</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 w-20 text-center">Unid.</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 w-24 text-right">Qtd.</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 w-32 text-right">Custo Unit.</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 w-32 text-right">Orçado</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#F97316] w-32 text-right">Gasto</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#10B981] w-32 text-right pr-8">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {Object.keys(itemsByCategory).length === 0 ? (
                      <tr><td colSpan={6} className="py-12 text-center text-slate-500">Nenhum item orçamentário listado.</td></tr>
                    ) : (
                      Object.entries(itemsByCategory).map(([category, items]: [string, any]) => {
                        const catTotal = items.reduce((acc: number, cur: any) => acc + (Number(cur.unitCost) * Number(cur.quantity)), 0);
                        return (
                          <React.Fragment key={category}>
                            {/* Category Header */}
                            <tr className="bg-[#13171f]/50 border-y border-white/5">
                              <td colSpan={5} className="py-3 px-6 text-xs font-bold text-[#3B82F6] uppercase tracking-wider">{category}</td>
                              <td className="py-3 px-6 text-xs font-bold text-white text-right">R$ {catTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td colSpan={2}></td>
                            </tr>
                            {/* Area Items */}
                            {items.map((item: any) => {
                              const lineTotal = Number(item.unitCost) * Number(item.quantity);
                              const lineSpent = project.financialItems?.filter((f: any) => String(f.budgetItemLinked) === String(item.id)).reduce((acc: number, cur: any) => acc + Number(cur.amount), 0) || 0;
                              const lineBalance = lineTotal - lineSpent;
                              return (
                                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group relative">
                                  <td className="py-3.5 px-6 text-slate-500 font-medium">{item.code}</td>
                                  <td className="py-3.5 px-6 text-white">{item.description}</td>
                                  <td className="py-3.5 px-6 text-slate-400 text-center">{item.unit}</td>
                                  <td className="py-3.5 px-6 text-slate-300 text-right font-medium">{Number(item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                  <td className="py-3.5 px-6 text-slate-300 text-right font-medium whitespace-nowrap">R$ {Number(item.unitCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                  <td className="py-3.5 px-6 text-white text-right font-bold w-32 whitespace-nowrap">R$ {lineTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                  <td className="py-3.5 px-6 text-[#F97316] text-right font-bold w-32 whitespace-nowrap">- R$ {lineSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                  <td className={`py-3.5 px-6 text-right font-black w-32 pr-8 whitespace-nowrap ${lineBalance < 0 ? 'text-error' : 'text-[#10B981]'}`}>R$ {lineBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                  {/* Hover Actions */}
                                  <td className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0b0f19] px-2 py-1 rounded shadow-lg border border-white/10">
                                    <button onClick={() => { setEditingItemIndex(item.originalIndex); setItemFormData({ ...item }); setIsItemModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Editar"><Edit className="h-3 w-3" /></button>
                                    <button onClick={(e) => handleItemDelete(e, item.originalIndex)} className="p-1.5 text-slate-400 hover:text-error transition-colors" title="Excluir"><Trash2 className="h-3 w-3" /></button>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeProjectTab === 'cronograma' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest mb-1">Cronograma • {project.name}</p>
                <h2 className="text-3xl font-black text-[#3B82F6]">Planejamento Estrutural</h2>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setEditingScheduleIndex(null); setScheduleFormData(getEmptyScheduleItem()); setIsScheduleModalOpen(true); }} className="px-4 py-2 bg-[#10B981] text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-[#059669] transition-colors shadow-lg shadow-[#10B981]/20">
                  <Plus className="h-4 w-4" /> Nova Etapa
                </button>
                <button className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors">
                  <Filter className="h-4 w-4" /> Filtros
                </button>
                <button className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-[#2563EB] transition-colors shadow-lg shadow-[#3B82F6]/20">
                  <Download className="h-4 w-4" /> Exportar
                </button>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[#13171f] p-5 rounded-xl border border-white/5 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Status Global</p>
                <div className="flex items-center gap-2">
                  {scheduleAtrasadas === 0 && scheduleGlobalProgress > 0 ? (
                    <><span className="h-3 w-3 rounded-full bg-[#10B981] animate-pulse"></span>
                      <span className="text-xl font-bold text-[#3B82F6]">No Prazo</span></>
                  ) : scheduleItems.length === 0 ? (
                    <><span className="h-3 w-3 rounded-full bg-slate-500"></span><span className="text-xl font-bold text-slate-400">Pausado</span></>
                  ) : scheduleAtrasadas > 0 ? (
                    <><span className="h-3 w-3 rounded-full bg-[#EF4444] animate-pulse"></span><span className="text-xl font-bold text-[#EF4444]">Atrasado</span></>
                  ) : (
                    <><span className="h-3 w-3 rounded-full bg-[#10B981]"></span><span className="text-xl font-bold text-[#10B981]">Concluído</span></>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{scheduleItems.length === 0 ? 'Sem etapas' : 'Monitoramento ativo'}</p>
              </div>
              <div className="bg-[#13171f] p-5 rounded-xl border border-white/5 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Conclusão</p>
                <span className="text-2xl font-bold text-[#3B82F6] mb-2">{scheduleGlobalProgress}%</span>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#3B82F6] rounded-full transition-all duration-1000" style={{ width: `${scheduleGlobalProgress}%` }}></div>
                </div>
              </div>
              <div className="bg-[#13171f] p-5 rounded-xl border-l-[3px] border-l-[#F97316] relative">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Críticos / Atrasados</p>
                <span className={`text-2xl font-bold mb-1 block ${scheduleAtrasadas > 0 ? 'text-[#F97316]' : 'text-slate-300'}`}>{scheduleAtrasadas < 10 ? `0${scheduleAtrasadas}` : scheduleAtrasadas} Tarefas</span>
                <p className="text-xs text-slate-400">{scheduleAtrasadas > 0 ? 'Atenção necessária imediatamente' : 'Tudo sob controle'}</p>
              </div>
              <div className="bg-[#13171f] p-5 rounded-xl border border-white/5 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Próxima Entrega</p>
                <span className="text-2xl font-bold text-[#3B82F6] mb-1 block truncate" title={nextDelivery ? nextDelivery.name : 'N/A'}>
                  {nextDelivery ? new Date(nextDelivery.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '-- / --'}
                </span>
                <p className="text-xs text-slate-400 truncate">{nextDelivery ? nextDelivery.name : 'Nenhum marco pendente'}</p>
              </div>
            </div>

            {/* Gantt Area */}
            <div className="bg-[#13171f] rounded-xl border border-white/5 flex flex-col lg:flex-row overflow-hidden min-h-[400px]">

              {/* Left Panel (Tasks) */}
              <div className="w-full lg:w-[45%] bg-[#0b0f19] border-r border-white/5 flex flex-col min-w-[340px]">
                <div className="flex items-center gap-2 px-5 h-[56px] border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white shrink-0">
                  <div className="flex-1">Etapa / Tarefa</div>
                  <div className="w-[90px]">Datas</div>
                  <div className="w-[80px]">Status</div>
                  <div className="w-[40px]"></div>
                </div>

                {scheduleItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-b border-white/5">
                    <p className="text-slate-500 text-sm">Nenhuma etapa programada.</p>
                    <button onClick={() => { setEditingScheduleIndex(null); setScheduleFormData(getEmptyScheduleItem()); setIsScheduleModalOpen(true); }} className="mt-4 px-4 py-2 bg-white/5 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors">Cadastrar Primeira Etapa</button>
                  </div>
                ) : (
                  scheduleItems.map((item: any, index: number) => {
                    const status = getGanttStatus(item);
                    return (
                      <div key={item.id} className="flex items-center gap-2 px-5 h-[76px] border-b border-white/5 group hover:bg-white/5 transition-colors shrink-0 relative">
                        <div className="flex-1 truncate pr-2" onClick={() => { setEditingScheduleIndex(index); setScheduleFormData({ ...item }); setIsScheduleModalOpen(true); }} style={{ cursor: 'pointer' }}>
                          <h4 className="text-[13px] font-bold text-white mb-0.5 truncate hover:text-[#3B82F6] transition-colors">{item.name}</h4>
                          <p className="text-[9px] font-bold text-slate-500 uppercase truncate">Dep: {item.dependency || 'Nenhuma'}</p>
                          <div className="w-full max-w-[120px] h-[3px] bg-slate-800 mt-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${getBarColorStatus(status).bg}`} style={{ width: `${item.progress}%` }}></div>
                          </div>
                        </div>
                        <div className="w-[90px] text-[11px] text-slate-300 font-medium leading-tight">
                          {formatGanttDateRange(item.startDate, item.endDate)}<br /><span className="text-slate-500 text-[9px] mt-0.5 block">{getDaysBetween(item.startDate, item.endDate)} dias</span>
                        </div>
                        <div className="w-[80px]">
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase flex items-center justify-center text-center ${getStatusStyles(status)}`}>{status}</span>
                        </div>
                        <div className="w-[40px] flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => handleScheduleDelete(e, index)} className="p-1.5 text-slate-400 hover:text-error transition-colors" title="Excluir Etapa"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Right Panel (Timeline) */}
              <div className="w-full lg:w-[55%] relative flex flex-col bg-[#11151c] overflow-x-auto">
                <div className="flex items-center border-b border-white/5 text-[10px] font-bold uppercase tracking-widest min-w-[500px] h-[56px] shrink-0">
                  {timelineMonths.map((m, i) => (
                    <div key={i} className={`flex-1 px-4 text-center border-r border-dashed ${i === timelineMonths.length - 1 ? 'border-transparent' : 'border-white/5'} flex flex-col justify-center h-full text-white relative`}>
                      {m.name} <span className="text-[8px] text-slate-500">{m.year}</span>
                    </div>
                  ))}
                  {/* Linha do tempo atual laranja - Globally absolute across the timeline area */}
                  {isTodayInView && timelineMonths.length > 0 && (
                    <>
                      <div className="absolute top-[37px] w-[1px] bottom-0 bg-[#F97316] z-20 pointer-events-none" style={{ left: `${todayLinePercent}%` }}></div>
                      <div className="absolute top-[34px] w-2 h-2 rounded-full bg-[#F97316] z-20 pointer-events-none -translate-x-1/2" style={{ left: `${todayLinePercent}%` }}></div>
                      <div className="absolute top-[16px] text-[#F97316] text-[9px] font-black z-20 pointer-events-none -translate-x-1/2 whitespace-nowrap" style={{ left: `${todayLinePercent}%` }}>HOJE</div>
                    </>
                  )}
                </div>

                <div className="relative flex-1 min-w-[500px]">
                  {/* Vertical Grid lines for months */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {timelineMonths.map((_, i) => (
                      <div key={i} className={`flex-1 border-r border-dashed ${i === timelineMonths.length - 1 ? 'border-transparent' : 'border-white/5'}`}></div>
                    ))}
                  </div>

                  {/* Horizontal Grid Lines for empty rows visual fill */}
                  <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to bottom, transparent 75px, rgba(255,255,255,0.02) 75px, rgba(255,255,255,0.02) 76px)', backgroundSize: '100% 76px' }}></div>

                  {/* Databound Bars */}
                  {scheduleItems.length > 0 && scheduleItems.map((item: any, index: number) => {
                    const statusColors = getBarColorStatus(getGanttStatus(item));
                    const barStyle = getBarStyles(item);
                    return (
                      <div key={item.id} className="absolute w-full h-[76px] flex items-center group cursor-pointer" style={{ top: `${index * 76}px` }}>
                        <div className={`h-5 rounded relative overflow-hidden transition-all hover:brightness-110 ${statusColors.bg}`} style={{ left: barStyle.left, width: barStyle.width }}>
                          {/* Progress fill */}
                          <div className={`absolute left-0 top-0 bottom-0 ${statusColors.fill}`} style={{ width: `${item.progress}%` }}></div>
                        </div>
                      </div>
                    )
                  })}

                </div>
              </div>
            </div>

          </div>
        )}

        {activeProjectTab === 'financeiro' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-black text-white">Controle de Custos</h2>
                <p className="text-slate-400 text-sm mt-1">Registre e acompanhe todos os gastos das obras</p>
              </div>
              <button onClick={() => { setEditingFinanceIndex(null); setFinanceFormData(getEmptyFinanceItem()); setIsFinanceModalOpen(true); }} className="px-5 py-2.5 bg-[#3B82F6] text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-[#2563EB] transition-colors shadow-lg shadow-[#3B82F6]/20">
                <Plus className="h-4 w-4" /> Novo Lançamento
              </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['Material', 'Mão de Obra', 'Equipamento', 'Terceirizado', 'Outros'].map(cat => (
                <div key={cat} className="bg-[#13171f] p-4 rounded-xl border border-white/5 flex flex-col">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{cat}</p>
                  <span className="text-lg font-bold text-white">R$ {getFinanceKpi(cat).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mt-8 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input type="text" placeholder="Buscar..." value={financeSearchTerm} onChange={e => setFinanceSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-[#13171f] border border-white/5 text-white rounded-xl focus:outline-none focus:border-[#3B82F6] transition-colors" />
              </div>
              <select value={financeCategoryFilter} onChange={e => setFinanceCategoryFilter(e.target.value)} className="w-full md:w-64 px-4 py-3 bg-[#13171f] border border-white/5 text-white rounded-xl appearance-none focus:outline-none focus:border-[#3B82F6] transition-colors">
                <option value="Todas">Todas</option>
                <option value="Material">Material</option>
                <option value="Mão de Obra">Mão de Obra</option>
                <option value="Equipamento">Equipamento</option>
                <option value="Terceirizado">Terceirizado</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between text-sm mb-4 px-2">
              <span className="text-slate-500 font-medium">{filteredFinanceItems.length} lançamento(s)</span>
              <span className="text-xl font-bold text-white tracking-wide">R$ {filteredFinanceSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Table Area */}
            <div className="bg-[#13171f] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-32">Data</th>
                      <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
                      <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-40">Categoria</th>
                      <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fornecedor</th>
                      <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-44">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredFinanceItems.length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center text-slate-500">Nenhum lançamento financeiro encontrado.</td></tr>
                    ) : (
                      filteredFinanceItems.map((item: any) => {
                        const originalIndex = financialItems.indexOf(item);
                        const baseCat = item.category === 'Mão de Obra' ? 'bg-[#FDE68A]/10 text-[#F59E0B]' : item.category === 'Material' ? 'bg-[#BFDBFE]/10 text-[#3B82F6]' : 'bg-slate-800 text-slate-300';
                        return (
                          <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group relative">
                            <td className="py-4 px-6 text-slate-400 font-medium">{new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                            <td className="py-4 px-6 text-white font-medium">
                              <div className="flex items-center gap-2">
                                {item.description}
                                {item.receiptImage && <Paperclip className="h-3.5 w-3.5 text-emerald-500 shrink-0" title="Possui Anexo" />}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${baseCat}`}>{item.category}</span>
                            </td>
                            <td className="py-4 px-6 text-slate-400">{item.supplier || '—'}</td>
                            <td className="py-4 px-6 text-white font-bold tracking-wide">R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>

                            {/* Hover actions */}
                            <td className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0b0f19] px-2 py-1 rounded shadow-lg border border-white/10">
                              <button onClick={() => { setEditingFinanceIndex(originalIndex); setFinanceFormData({ ...item }); setIsFinanceModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Editar"><Edit className="h-3.5 w-3.5" /></button>
                              <button onClick={(e) => handleFinanceDelete(e, originalIndex)} className="p-1.5 text-slate-400 hover:text-error transition-colors" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {activeProjectTab === 'diario' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-black text-white">Diário de Obra</h2>
                <p className="text-slate-500 mt-1">Registros diários de atividades, clima e equipe por projeto</p>
              </div>
              <button onClick={() => { setEditingDailyIndex(null); setDailyFormData(getEmptyDailyLog()); setIsDailyModalOpen(true); }} className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-[#2563EB] transition-colors shadow-lg shadow-[#3B82F6]/20">
                <Plus className="h-4 w-4" /> Novo Registro
              </button>
            </div>

            <div className="text-sm px-2">
              <span className="text-slate-500 font-medium">{(project.dailyLogs || []).length} registro(s)</span>
            </div>

            <div className="space-y-6">
              {!(project.dailyLogs && project.dailyLogs.length > 0) ? (
                <div className="bg-[#13171f] rounded-2xl border border-white/5 p-12 text-center flex flex-col items-center justify-center">
                  <FileText className="h-16 w-16 text-slate-700 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Nenhum Registro Encontrado</h3>
                  <p className="text-slate-500 max-w-sm">Este projeto ainda não possui relatórios de obra.</p>
                </div>
              ) : (
                project.dailyLogs.map((log: any, index: number) => (
                  <div key={log.id || index} className="bg-[#1e293b]/50 rounded-xl border border-white/5 p-6 hover:bg-[#1e293b]/80 transition-colors group relative">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2 capitalize">{new Date(log.date + 'T12:00:00Z').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}</h4>
                        <div className="flex items-center gap-4 text-sm font-medium">
                          <span className={`flex items-center gap-1.5 ${log.weather === 'Ensolarado' ? 'text-[#F59E0B]' : log.weather === 'Chuvoso' ? 'text-[#3B82F6]' : 'text-slate-400'}`}>
                            {log.weather === 'Ensolarado' ? <Sun className="h-4 w-4" /> : <Cloud className="h-4 w-4" />} {log.weather}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <HardHat className="h-4 w-4" /> {log.workers} trabalhadores
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingDailyIndex(index); setDailyFormData({ ...log }); setIsDailyModalOpen(true); }} className="p-2 text-slate-400 hover:text-white transition-colors" title="Editar"><Edit className="h-4 w-4" /></button>
                        <button onClick={(e) => handleDailyDelete(e, index)} className="p-2 text-slate-400 hover:text-error transition-colors" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Atividades</p>
                      <p className="text-white text-sm whitespace-pre-wrap">{log.activities || 'Nenhuma atividade lançada.'}</p>
                    </div>

                    {log.restrictions && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Ocorrências / Restrições</p>
                        <p className="text-red-400 text-sm whitespace-pre-wrap">{log.restrictions}</p>
                      </div>
                    )}

                    {log.photos && log.photos.length > 0 && (
                      <div className="mt-6">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Camera className="h-3 w-3" /> Fotos ({log.photos.length})
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {log.photos.map((photo: any, pIdx: number) => (
                            <div key={pIdx} className="group/photo relative rounded-lg overflow-hidden border border-white/10 bg-black aspect-square">
                              <img src={photo.image} alt={photo.description || 'Foto da obra'} className="w-full h-full object-cover opacity-80 group-hover/photo:opacity-100 transition-opacity" />
                              {photo.description && (
                                <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm p-3 translate-y-full group-hover/photo:translate-y-0 transition-transform">
                                  <p className="text-xs text-white line-clamp-3">{photo.description}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Item Modal */}
        {isItemModalOpen && itemFormData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsItemModalOpen(false)}></div>
            <div className="relative bg-[#13171f] rounded-xl shadow-2xl border border-[#1e293b] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{editingItemIndex !== null ? 'Editar Item de Orçamento' : 'Novo Item de Orçamento'}</h3>
                <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 pb-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Descrição do Serviço <span className="text-[#3B82F6]">*</span></label>
                  <input type="text" value={itemFormData.description} onChange={e => setItemFormData({ ...itemFormData, description: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Categoria</label>
                    <select value={itemFormData.category} onChange={e => setItemFormData({ ...itemFormData, category: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors appearance-none">
                      <option value="Outros">Outros</option>
                      <option value="Serviços Preliminares">Serviços Preliminares</option>
                      <option value="Infraestrutura">Infraestrutura</option>
                      <option value="Alvenaria">Alvenaria</option>
                      <option value="Inst. Elétricas">Inst. Elétricas</option>
                      <option value="Inst. Hidráulicas">Inst. Hidráulicas</option>
                      <option value="Revestimento">Revestimento</option>
                      <option value="Piso">Piso</option>
                      <option value="Pintura">Pintura</option>
                      <option value="Complementos">Complementos</option>
                      <option value="Louças e Metais">Louças e Metais</option>
                      <option value="Acabamentos">Acabamentos</option>
                      <option value="Revestimentos Externos">Revestimentos Externos</option>
                      <option value="Forros">Forros</option>
                      <option value="Impermeabilização">Impermeabilização</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Código (SINAPI/Interno)</label>
                    <input type="text" value={itemFormData.code} onChange={e => setItemFormData({ ...itemFormData, code: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Unidade</label>
                    <select value={itemFormData.unit} onChange={e => setItemFormData({ ...itemFormData, unit: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors appearance-none">
                      <option value="m²">m²</option>
                      <option value="m³">m³</option>
                      <option value="m">m</option>
                      <option value="un">un</option>
                      <option value="cj">cj</option>
                      <option value="vb">vb</option>
                      <option value="h">h</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Quantidade <span className="text-[#3B82F6]">*</span></label>
                    <input type="number" step="0.01" value={itemFormData.quantity} onChange={e => setItemFormData({ ...itemFormData, quantity: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Custo Unitário (R$) <span className="text-[#3B82F6]">*</span></label>
                    <input type="number" step="0.01" value={itemFormData.unitCost} onChange={e => setItemFormData({ ...itemFormData, unitCost: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Custo Total</label>
                    <div className="w-full bg-[#1e293b]/50 border border-transparent rounded-lg px-3 py-2.5 text-sm font-bold text-white cursor-not-allowed flex items-center">
                      R$ {(Number(itemFormData.quantity || 0) * Number(itemFormData.unitCost || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button onClick={() => setIsItemModalOpen(false)} className="px-5 py-2 text-sm font-bold text-white border border-[#1e293b] rounded-lg hover:bg-white/5 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleItemSave} className="px-5 py-2 bg-[#3B82F6] text-white text-sm font-bold rounded-lg hover:bg-[#2563EB] transition-colors">
                    {editingItemIndex !== null ? 'Salvar' : 'Adicionar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Item Confirmation Modal */}
        {deletingItemIndex !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingItemIndex(null)}></div>
            <div className="relative bg-[#13171f] rounded-2xl shadow-2xl border border-[#1e293b] w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10 mb-5 border border-error/20">
                  <AlertCircle className="h-8 w-8 text-error" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Excluir Item?</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  Tem certeza que deseja excluir o item do orçamento? Esta ação atualizará os valores do seu quantitativo e não poderá ser desfeita.
                </p>
              </div>
              <div className="p-5 bg-[#0b0f19]/80 border-t border-white/5 flex gap-3 justify-center">
                <button onClick={() => setDeletingItemIndex(null)} className="px-6 py-2.5 text-sm font-bold text-slate-300 border border-[#1e293b] rounded-xl hover:bg-white/5 hover:text-white transition-all w-1/2">
                  Cancelar
                </button>
                <button onClick={confirmItemDelete} className="px-6 py-2.5 bg-error text-white text-sm font-bold rounded-xl hover:opacity-90 shadow-lg shadow-error/20 transition-all w-1/2">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Item Modal */}
        {isScheduleModalOpen && scheduleFormData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsScheduleModalOpen(false)}></div>
            <div className="relative bg-[#13171f] rounded-xl shadow-2xl border border-[#1e293b] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{editingScheduleIndex !== null ? 'Editar Etapa' : 'Nova Etapa'}</h3>
                <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 pb-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Nome da Etapa / Tarefa <span className="text-[#3B82F6]">*</span></label>
                  <input type="text" value={scheduleFormData.name} onChange={e => setScheduleFormData({ ...scheduleFormData, name: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors" placeholder="Ex: Fundação e Alicerce" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Dependência</label>
                  <input type="text" value={scheduleFormData.dependency} onChange={e => setScheduleFormData({ ...scheduleFormData, dependency: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors" placeholder="Ex: Terreno Limpo (Deixe em branco se nenhuma)" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Data de Início <span className="text-[#3B82F6]">*</span></label>
                    <input type="date" value={scheduleFormData.startDate} onChange={e => setScheduleFormData({ ...scheduleFormData, startDate: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors [color-scheme:dark]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Data de Término <span className="text-[#3B82F6]">*</span></label>
                    <input type="date" value={scheduleFormData.endDate} onChange={e => setScheduleFormData({ ...scheduleFormData, endDate: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors [color-scheme:dark]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-white">Progresso {scheduleFormData.progress}%</label>
                  </div>
                  <div className="flex items-center gap-4">
                    <input type="range" min="0" max="100" step="5" value={scheduleFormData.progress} onChange={e => setScheduleFormData({ ...scheduleFormData, progress: e.target.value })} className="w-full accent-[#3B82F6]" />
                    <input type="number" min="0" max="100" value={scheduleFormData.progress} onChange={e => setScheduleFormData({ ...scheduleFormData, progress: e.target.value })} className="w-20 bg-[#13171f] border border-[#1e293b] rounded-lg px-2 py-2 text-sm text-center text-white focus:border-[#3B82F6] outline-none transition-colors" />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button onClick={() => setIsScheduleModalOpen(false)} className="px-5 py-2 text-sm font-bold text-white border border-[#1e293b] rounded-lg hover:bg-white/5 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleScheduleSave} className="px-5 py-2 bg-[#3B82F6] text-white text-sm font-bold rounded-lg hover:bg-[#2563EB] transition-colors">
                    {editingScheduleIndex !== null ? 'Salvar' : 'Adicionar Etapa'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Schedule Item Confirmation Modal */}
        {deletingScheduleIndex !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingScheduleIndex(null)}></div>
            <div className="relative bg-[#13171f] rounded-2xl shadow-2xl border border-[#1e293b] w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10 mb-5 border border-error/20">
                  <AlertCircle className="h-8 w-8 text-error" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Excluir Etapa?</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  Tem certeza que deseja excluir esta etapa do cronograma? A visualização do Gantt será recalculada e esta ação não poderá ser desfeita.
                </p>
              </div>
              <div className="p-5 bg-[#0b0f19]/80 border-t border-white/5 flex gap-3 justify-center">
                <button onClick={() => setDeletingScheduleIndex(null)} className="px-6 py-2.5 text-sm font-bold text-slate-300 border border-[#1e293b] rounded-xl hover:bg-white/5 hover:text-white transition-all w-1/2">
                  Cancelar
                </button>
                <button onClick={confirmScheduleDelete} className="px-6 py-2.5 bg-error text-white text-sm font-bold rounded-xl hover:opacity-90 shadow-lg shadow-error/20 transition-all w-1/2">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Finance Item Modal */}
        {isFinanceModalOpen && financeFormData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsFinanceModalOpen(false)}></div>
            <div className="relative bg-[#13171f] rounded-xl shadow-2xl border border-[#1e293b] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="p-5 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-white">{editingFinanceIndex !== null ? 'Editar Lançamento de Custo' : 'Novo Lançamento de Custo'}</h3>
                <button onClick={() => setIsFinanceModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 pb-6 space-y-4 overflow-y-auto">

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Item do Orçamento <span className="text-slate-500 font-normal">(opcional)</span></label>
                  <select value={financeFormData.budgetItemLinked} onChange={e => setFinanceFormData({ ...financeFormData, budgetItemLinked: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:border-[#3B82F6] outline-none transition-colors appearance-none">
                    <option value="">Vincular a um item do levantamento...</option>
                    {projectsList[selectedProjectIndex!].budgetItems?.map((item: any) => (
                      <option key={item.id} value={item.id}>{item.category} - {item.description}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Descrição <span className="text-[#3B82F6]">*</span></label>
                  <input type="text" value={financeFormData.description} onChange={e => setFinanceFormData({ ...financeFormData, description: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Categoria <span className="text-[#3B82F6]">*</span></label>
                    <select value={financeFormData.category} onChange={e => setFinanceFormData({ ...financeFormData, category: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors appearance-none">
                      <option value="Material">Material</option>
                      <option value="Mão de Obra">Mão de Obra</option>
                      <option value="Equipamento">Equipamento</option>
                      <option value="Terceirizado">Terceirizado</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Valor (R$) <span className="text-[#3B82F6]">*</span></label>
                    <input type="number" step="0.01" value={financeFormData.amount || ''} onChange={e => setFinanceFormData({ ...financeFormData, amount: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Data <span className="text-[#3B82F6]">*</span></label>
                    <input type="date" value={financeFormData.date} onChange={e => setFinanceFormData({ ...financeFormData, date: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors [color-scheme:dark]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Fornecedor</label>
                    <input type="text" value={financeFormData.supplier} onChange={e => setFinanceFormData({ ...financeFormData, supplier: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Nº Nota Fiscal (Anexar FOTO)</label>
                  <label className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:border-[#3B82F6] cursor-pointer outline-none transition-colors flex items-center justify-between">
                    <span className="truncate">{financeFormData.receiptName || 'Clique para escolher um arquivo...'}</span>
                    {financeFormData.receiptImage ? <span className="text-emerald-500 font-bold shrink-0">Anexado ✓</span> : <span className="text-slate-500 shrink-0">Nenhum</span>}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFinanceImageUpload} />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Observações</label>
                  <textarea rows={2} value={financeFormData.observations} onChange={e => setFinanceFormData({ ...financeFormData, observations: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors resize-none"></textarea>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
                  <button onClick={() => setIsFinanceModalOpen(false)} className="px-5 py-2 text-sm font-bold text-white border border-[#1e293b] rounded-lg hover:bg-white/5 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleFinanceSave} className="px-5 py-2 bg-[#3B82F6] text-white text-sm font-bold rounded-lg hover:bg-[#2563EB] transition-colors">
                    Lançar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Finance Item Confirmation Modal */}
        {deletingFinanceIndex !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingFinanceIndex(null)}></div>
            <div className="relative bg-[#13171f] rounded-2xl shadow-2xl border border-[#1e293b] w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10 mb-5 border border-error/20">
                  <AlertCircle className="h-8 w-8 text-error" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Excluir Lançamento?</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  Tem certeza que deseja apagar este registro financeiro? Seus balanços serão atualizados imediatamente.
                </p>
              </div>
              <div className="p-5 bg-[#0b0f19]/80 border-t border-white/5 flex gap-3 justify-center">
                <button onClick={() => setDeletingFinanceIndex(null)} className="px-6 py-2.5 text-sm font-bold text-slate-300 border border-[#1e293b] rounded-xl hover:bg-white/5 hover:text-white transition-all w-1/2">
                  Cancelar
                </button>
                <button onClick={confirmFinanceDelete} className="px-6 py-2.5 bg-error text-white text-sm font-bold rounded-xl hover:opacity-90 shadow-lg shadow-error/20 transition-all w-1/2">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Daily Modal */}
        {isDailyModalOpen && dailyFormData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsDailyModalOpen(false)}></div>
            <div className="relative bg-[#13171f] rounded-xl shadow-2xl border border-[#1e293b] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

              {/* Header */}
              <div className="p-5 flex items-center justify-between shrink-0 border-b border-white/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#3B82F6]" />
                  {editingDailyIndex !== null ? 'Editar Diário de Obra' : 'Novo Registro Diário'}
                </h3>
                <button onClick={() => setIsDailyModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Data do Relatório</label>
                    <input type="date" value={dailyFormData.date} onChange={e => setDailyFormData({ ...dailyFormData, date: e.target.value })} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Clima Predominante</label>
                    <select value={dailyFormData.weather} onChange={e => setDailyFormData({ ...dailyFormData, weather: e.target.value })} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors appearance-none">
                      <option value="Ensolarado">Ensolarado</option>
                      <option value="Nublado">Nublado</option>
                      <option value="Chuvoso">Chuvoso</option>
                      <option value="Tempestade">Tempestade</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white">Nº Trabalhadores</label>
                    <input type="number" min="0" value={dailyFormData.workers} onChange={e => setDailyFormData({ ...dailyFormData, workers: Number(e.target.value) })} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Atividades Realizadas</label>
                  <textarea rows={3} placeholder="Descreva os serviços executados neste dia..." value={dailyFormData.activities} onChange={e => setDailyFormData({ ...dailyFormData, activities: e.target.value })} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors placeholder:text-slate-600 resize-none"></textarea>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#F97316]">Restrições / Ocorrências (Opcional)</label>
                  <textarea rows={2} placeholder="Faltou material? Acidente? Atraso por chuva?" value={dailyFormData.restrictions} onChange={e => setDailyFormData({ ...dailyFormData, restrictions: e.target.value })} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-[#F97316] focus:border-[#F97316] outline-none transition-colors placeholder:text-slate-600 resize-none"></textarea>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Camera className="h-4 w-4 text-[#10B981]" />
                      Galeria Fotográfica
                    </h4>
                    <label className="px-3 py-1.5 bg-[#10B981]/10 text-[#10B981] font-bold text-xs rounded hover:bg-[#10B981]/20 cursor-pointer transition-colors border border-[#10B981]/20">
                      + Anexar Foto
                      <input type="file" accept="image/*" className="hidden" onChange={handleDailyPhotoUpload} />
                    </label>
                  </div>

                  <div className="space-y-3">
                    {(!dailyFormData.photos || dailyFormData.photos.length === 0) && (
                      <div className="py-6 text-center border-2 border-dashed border-[#1e293b] rounded-xl bg-[#0b0f19]">
                        <p className="text-sm text-slate-500 font-medium">Nenhuma foto anexada ao relatório.</p>
                      </div>
                    )}

                    {dailyFormData.photos && dailyFormData.photos.map((photo: any, index: number) => (
                      <div key={index} className="flex gap-4 p-3 bg-[#0b0f19] border border-[#1e293b] rounded-xl group/photoItem">
                        <div className="h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-black border border-white/5">
                          <img src={photo.image} className="w-full h-full object-cover" alt="Preview" />
                        </div>
                        <div className="flex-1 flex gap-2">
                          <textarea
                            value={photo.description}
                            onChange={(e) => {
                              const arr = [...dailyFormData.photos];
                              arr[index].description = e.target.value;
                              setDailyFormData({ ...dailyFormData, photos: arr });
                            }}
                            placeholder="Descreva esta imagem (Ex: Início da concretagem no bloco B)..."
                            className="flex-1 bg-transparent border-0 text-sm text-slate-300 resize-none outline-none p-1 placeholder:text-slate-600"
                          />
                          <button onClick={() => {
                            const arr = [...dailyFormData.photos];
                            arr.splice(index, 1);
                            setDailyFormData({ ...dailyFormData, photos: arr });
                          }} className="shrink-0 p-2 text-slate-500 hover:text-error self-start transition-colors rounded-lg hover:bg-error/10" title="Remover Foto">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-5 border-t border-white/5 flex justify-end gap-3 shrink-0 bg-[#0b0f19]/50">
                <button onClick={() => setIsDailyModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button onClick={handleDailySave} className="px-5 py-2.5 bg-[#3B82F6] text-white text-sm font-bold rounded-lg hover:bg-[#2563EB] transition-colors shadow-lg shadow-[#3B82F6]/20">
                  Salvar Registro
                </button>
              </div>
            </div>
          </div>
        )}

        {deletingDailyIndex !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingDailyIndex(null)}></div>
            <div className="relative bg-[#13171f] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10 mb-5">
                  <Trash2 className="h-8 w-8 text-error" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Excluir Relatório?</h3>
                <p className="text-sm text-slate-500 font-medium">Tem certeza que deseja excluir o relato de atividades e todas as fotos atreladas a ele? Esta ação não poderá ser desfeita.</p>
              </div>
              <div className="p-4 bg-[#0b0f15] flex gap-3 border-t border-white/10/50">
                <button onClick={() => setDeletingDailyIndex(null)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-white/10 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmDailyDelete} className="flex-1 py-3 bg-error text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-error/20">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-24 relative">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Projetos</h2>
          <p className="text-slate-500 text-[13px]">{projectsList.length} projeto(s) cadastrado(s)</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleNew} className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Novo Projeto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projectsList.map((project, i) => {
          const totalBudget = calculateTotalBudget(project.budgetItems);

          return (
            <div key={i} onClick={() => setSelectedProjectIndex(i)} className="bg-[#13171f] rounded-xl border border-white/5 overflow-hidden flex flex-col group hover:shadow-lg hover:border-[#3B82F6]/50 cursor-pointer transition-all relative">
              {/* Action Buttons purely visible on hover as requested */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={(e) => { e.stopPropagation(); handleEdit(i); }} className="p-1.5 bg-[#0b0f15]/80 text-slate-400 hover:text-white border border-white/10 rounded-md backdrop-blur-sm transition-all" title="Editar">
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(i); }} className="p-1.5 bg-[#0b0f15]/80 text-slate-400 hover:text-error border border-white/10 rounded-md backdrop-blur-sm transition-all" title="Excluir">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="p-5 flex-1">
                <div className="flex items-center gap-3 mb-4 pr-14">
                  <h3 className="text-[15px] font-bold text-white truncate">{project.name}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#FFF3D6] text-[#C48C00] whitespace-nowrap">
                    {project.status}
                  </span>
                </div>

                <div className="space-y-2 mb-2">
                  <div className="flex items-center gap-2 text-slate-400 mb-4">
                    <MapIcon className="h-3.5 w-3.5" />
                    <span className="text-[13px] font-medium">{project.location || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="h-3.5 w-3.5 flex items-center justify-center font-bold text-[10px] border border-slate-500 rounded-sm">
                      m²
                    </span>
                    <span className="text-[13px]">{project.area ? Number(project.area).toLocaleString('pt-BR') : '0'},00 m²</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span className="text-[13px]">{project.deadline}</span>
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-white/5">
                <h4 className="text-xl font-bold text-[#3B82F6] mb-1">
                  R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Orçamento Total
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && formData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#0b0f19] border border-white/5 shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 flex items-center justify-between border-b border-white/5">
              <h3 className="text-lg font-bold text-white">{editingIndex !== null ? 'Editar Projeto' : 'Novo Projeto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/5 text-slate-400 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-200">Nome do Projeto <span className="text-error">*</span></label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-200">Cliente <span className="text-error">*</span></label>
                  <input type="text" value={formData.client} onChange={e => setFormData({ ...formData, client: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-200">Localização</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-200">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                    <option value="Planejamento">Planejamento</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Finalizada">Finalizada</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-200">Área Total (m²)</label>
                  <input type="number" value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-200">Data de Início</label>
                  <div className="relative">
                    <input type="text" placeholder="dd/mm/aaaa" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-200">Data de Término</label>
                  <div className="relative">
                    <input type="text" placeholder="dd/mm/aaaa" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>



              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-200">Descrição</label>
                <textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#13171f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"></textarea>
              </div>
            </div>

            <div className="p-5 flex justify-end gap-3 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-white border border-white/10 hover:bg-white/5 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-5 py-2.5 bg-[#3B82F6] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                {editingIndex !== null ? 'Salvar Projeto' : 'Criar Projeto'}
              </button>
            </div>
          </div>
        </div>
      )}



      {deletingIndex !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingIndex(null)}></div>
          <div className="relative bg-[#13171f] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10 mb-5">
                <AlertCircle className="h-8 w-8 text-error" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Excluir Projeto?</h3>
              <p className="text-sm text-slate-500 font-medium">Tem certeza que deseja excluir a obra <b className="text-slate-700">{projectsList[deletingIndex].name}</b>? Esta ação não poderá ser desfeita.</p>
            </div>
            <div className="p-4 bg-[#0b0f15] flex gap-3 border-t border-white/10/50">
              <button onClick={() => setDeletingIndex(null)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-white/10 rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-error text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-error/20">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

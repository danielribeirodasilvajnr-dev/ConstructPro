import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Filter, Download, Maximize, Share2, PlusCircle, MinusCircle, Edit, GripVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ScheduleItem } from '../../lib/types';
import { cn, formatDate } from '../../lib/utils';
import { ConfirmModal } from '../ui/ConfirmModal';

interface ScheduleTabProps {
  projectId: string;
  scheduleItems: ScheduleItem[];
  onRefresh: () => void;
  readOnly?: boolean;
}

export function ScheduleTab({ projectId, scheduleItems, onRefresh, readOnly }: ScheduleTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [formData, setFormData] = useState<Partial<ScheduleItem>>({});
  const [zoom, setZoom] = useState(1); // 1: Compact, 2: Regular, 3: Detailed
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const DAY_WIDTH = 20; // 20px per day

  // Timeline Logic
  const timelineConfig = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    let minDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    let maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    if (scheduleItems.length > 0) {
      const dates = scheduleItems.flatMap(i => [
        new Date(i.start_date.split('T')[0] + 'T12:00:00'),
        new Date(i.end_date.split('T')[0] + 'T12:00:00')
      ]);
      const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
      const latest = new Date(Math.max(...dates.map(d => d.getTime())));
      
      minDate = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
      maxDate = new Date(latest.getFullYear(), latest.getMonth() + 1, 0);
      
      if ((maxDate.getTime() - minDate.getTime()) < 30 * 24 * 60 * 60 * 1000) {
         maxDate = new Date(latest.getFullYear(), latest.getMonth() + 2, 0);
      }
    }

    const start = minDate;
    const end = maxDate;
    
    // Adjust start to be a Monday so the first week is complete
    let current = new Date(start);
    while (current.getDay() !== 1) { // 1 = Monday
      current.setDate(current.getDate() - 1);
    }
    const actualStart = new Date(current);
    
    // adjust end to be a Sunday
    let currentEnd = new Date(end);
    while (currentEnd.getDay() !== 0) { // 0 = Sunday
      currentEnd.setDate(currentEnd.getDate() + 1);
    }
    const actualEnd = new Date(currentEnd);
    
    const days = [];
    const weeks = [];
    
    current = new Date(actualStart);
    let daysInCurrentWeek = 0;
    let currentWeekStart = new Date(actualStart);
    
    const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; // Domingo = 0
    
    while (current <= actualEnd) {
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      const isToday = current.getDate() === today.getDate() && current.getMonth() === today.getMonth() && current.getFullYear() === today.getFullYear();
      
      days.push({
        date: new Date(current),
        dayOfMonth: current.getDate(),
        dayOfWeek: dayNames[current.getDay()],
        isWeekend,
        isToday
      });
      
      daysInCurrentWeek++;
      
      if (current.getDay() === 0) { // Sunday, end of week
        // Format label like "21 Jan"
        const monthShort = currentWeekStart.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        const monthCap = monthShort.charAt(0).toUpperCase() + monthShort.slice(1);
        weeks.push({
          startDate: new Date(currentWeekStart),
          label: `${currentWeekStart.getDate()} ${monthCap}`,
          daysCount: daysInCurrentWeek
        });
        
        currentWeekStart = new Date(current);
        currentWeekStart.setDate(currentWeekStart.getDate() + 1);
        daysInCurrentWeek = 0;
      }
      
      current.setDate(current.getDate() + 1);
    }

    return { start: actualStart, end: actualEnd, days, weeks, today };
  }, [scheduleItems]);

  const getPositionPixels = (dateStr: string) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr.split('T')[0] + 'T12:00:00');
    const timelineStart = new Date(timelineConfig.start);
    timelineStart.setHours(12, 0, 0, 0);
    
    const diffDays = Math.round((date.getTime() - timelineStart.getTime()) / (1000 * 3600 * 24));
    return Math.max(0, diffDays * DAY_WIDTH);
  };

  const getWidthPixels = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return DAY_WIDTH;
    const s = new Date(startStr.split('T')[0] + 'T12:00:00');
    const e = new Date(endStr.split('T')[0] + 'T12:00:00');
    let diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1; // inclusive
    return Math.max(DAY_WIDTH, diffDays * DAY_WIDTH);
  };

  const getStatus = (item: ScheduleItem) => {
    if (Number(item.progress) >= 100) return 'Concluído';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pureEnd = item.end_date.split('T')[0];
    const [ey, em, ed] = pureEnd.split('-').map(Number);
    const end = new Date(ey, em - 1, ed, 23, 59, 59);
    
    const pureStart = item.start_date.split('T')[0];
    const [sy, sm, sd] = pureStart.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd, 0, 0, 0);
    
    if (today > end) return 'Atrasado';
    if (today < start) return 'Pendente';
    return 'No Prazo';
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('schedule_items')
        .upsert({
          ...formData,
          project_id: projectId,
          id: editingItem?.id || undefined
        });

      if (error) throw error;
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInlineUpdate = async (id: string, field: 'name' | 'start_date' | 'end_date' | 'duration', value: string, currentItem: ScheduleItem) => {
    let updates: any = {};
    
    if (field === 'name') {
      if (!value.trim()) return;
      updates.name = value;
    } else if (field === 'start_date') {
      updates.start_date = `${value}T12:00:00`;
      if (currentItem.parent_id) {
         const oldStart = new Date(currentItem.start_date).getTime();
         const oldEnd = new Date(currentItem.end_date).getTime();
         const durationDays = Math.max(0, Math.round((oldEnd - oldStart) / (1000 * 3600 * 24)));
         
         const newEnd = new Date(`${value}T12:00:00`);
         newEnd.setDate(newEnd.getDate() + durationDays);
         updates.end_date = newEnd.toISOString();
      }
    } else if (field === 'end_date') {
      updates.end_date = `${value}T12:00:00`;
    } else if (field === 'duration') {
      const durationDays = parseInt(value) || 0;
      const start = new Date(currentItem.start_date);
      const newEnd = new Date(start);
      newEnd.setDate(newEnd.getDate() + durationDays);
      updates.end_date = newEnd.toISOString();
    }

    try {
      const { error } = await supabase
        .from('schedule_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (readOnly) return;
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (readOnly) return;
    e.preventDefault();
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    if (readOnly) return;
    e.preventDefault();
    setDragOverId(null);
    setDraggedId(null);
    
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;

    const sourceItem = scheduleItems.find(i => i.id === sourceId);
    const targetItem = scheduleItems.find(i => i.id === targetId);
    if (!sourceItem || !targetItem) return;

    // We only allow reordering parents with parents, and children with children
    const isSourceParent = !sourceItem.parent_id;
    const isTargetParent = !targetItem.parent_id;
    if (isSourceParent !== isTargetParent) return;

    let siblings = isSourceParent 
      ? scheduleItems.filter(i => !i.parent_id) 
      : scheduleItems.filter(i => i.parent_id === targetItem.parent_id);
    
    if (!isSourceParent && sourceItem.parent_id !== targetItem.parent_id) {
       // Moving to a new category
       siblings = scheduleItems.filter(i => i.parent_id === targetItem.parent_id);
       siblings.push(sourceItem);
    }

    // Sort siblings by their current order
    siblings.sort((a, b) => {
      if (a.order_index !== undefined && b.order_index !== undefined) return a.order_index - b.order_index;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    // Remove source from its old position (if it was in siblings)
    siblings = siblings.filter(i => i.id !== sourceId);
    
    // Find index of target
    const targetIndex = siblings.findIndex(i => i.id === targetId);
    if (targetIndex === -1) return;
    
    // Insert source at targetIndex
    siblings.splice(targetIndex, 0, sourceItem);

    // Reassign order_index
    const updates = siblings.map((item, idx) => ({
      id: item.id,
      project_id: item.project_id,
      name: item.name,
      dependency: item.dependency,
      start_date: item.start_date,
      end_date: item.end_date,
      progress: item.progress,
      budget_item_id: item.budget_item_id,
      parent_id: !isSourceParent ? targetItem.parent_id : item.parent_id,
      order_index: idx
    }));

    try {
      const { error } = await supabase
        .from('schedule_items')
        .upsert(updates);
        
      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase.from('schedule_items').delete().eq('id', deletingId);
      if (error) throw error;
      setDeletingId(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const scheduleAtrasadas = (scheduleItems || []).filter(i => getStatus(i) === 'Atrasado').length;
  const globalProgress = useMemo(() => {
    const children = scheduleItems ? scheduleItems.filter(i => i.parent_id) : [];
    if (children.length === 0) return 0;
    let totalWeight = 0;
    let weightedProgressSum = 0;
    children.forEach((item) => {
      const start = new Date(item.start_date).getTime();
      const end = new Date(item.end_date).getTime();
      const days = Math.max(1, (end - start) / (1000 * 3600 * 24));
      const progress = Number(item.progress || 0);
      totalWeight += days;
      weightedProgressSum += (progress * days);
    });
    return totalWeight > 0 ? Math.round(weightedProgressSum / totalWeight) : 0;
  }, [scheduleItems]);

  const handleImportBudget = async () => {
    setIsImporting(true);
    try {
      const { data: budgetItems, error: budgetError } = await supabase
        .from('budget_items')
        .select('*')
        .eq('project_id', projectId);

      if (budgetError) throw budgetError;
      if (!budgetItems || budgetItems.length === 0) {
        alert('Nenhum item de orçamento encontrado.');
        setIsImporting(false);
        return;
      }

      const displayBudgetItems = budgetItems
        .filter(item => item.category?.localeCompare('Mão de Obra', undefined, { sensitivity: 'base' }) !== 0)
        .sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }));

      if (displayBudgetItems.length === 0) {
        alert('Nenhum item válido encontrado no orçamento.');
        setIsImporting(false);
        return;
      }

      const categories = [...new Set(displayBudgetItems.map(i => i.category || 'Sem Categoria'))];
      
      const today = new Date().toISOString();
      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      let createdCount = 0;

      for (const cat of categories) {
        const catItems = displayBudgetItems.filter(i => (i.category || 'Sem Categoria') === cat);
        if (catItems.length === 0) continue;
        
        const parentName = cat;

        // Procura o pai pelo nome limpo ou caso ele tenha sido criado com o prefixo na versão anterior
        let parentItem = scheduleItems.find(s => (s.name === parentName || s.name.endsWith(`- ${cat}`)) && !s.parent_id);
        
        if (!parentItem) {
          const { data: newParent, error: parentError } = await supabase
            .from('schedule_items')
            .insert({
              project_id: projectId,
              name: parentName,
              start_date: today,
              end_date: in30Days,
              progress: 0,
              dependency: ''
            })
            .select()
            .single();
            
          if (parentError) throw parentError;
          parentItem = newParent;
          createdCount++;
        } else if (parentItem.name !== parentName) {
          // Limpa o nome do pai caso ele esteja com o prefixo antigo
          await supabase.from('schedule_items').update({ name: parentName }).eq('id', parentItem.id);
          parentItem.name = parentName;
        }

        for (const bItem of catItems) {
          const exists = scheduleItems.find(s => s.budget_item_id === bItem.id);
          if (!exists) {
            const childName = bItem.code ? `${bItem.code} - ${bItem.description}` : bItem.description;
            await supabase.from('schedule_items').insert({
              project_id: projectId,
              name: childName,
              start_date: today,
              end_date: in30Days,
              progress: 0,
              dependency: '',
              parent_id: parentItem?.id,
              budget_item_id: bItem.id
            });
            createdCount++;
          }
        }
      }

      if (createdCount > 0) {
        onRefresh();
      } else {
        alert('Todos os itens do orçamento já foram importados!');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao importar orçamento: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const sortedItems = useMemo(() => {
    const parents = scheduleItems.filter(i => !i.parent_id);
    const children = scheduleItems.filter(i => i.parent_id);
    
    // Order children strictly by name/code (WBS order) to prevent jumping when dates are edited
    children.sort((a, b) => {
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
    
    // Order parents by their lowest child code, or by name if no children
    parents.sort((a, b) => {
      if (a.order_index != null && b.order_index != null) return a.order_index - b.order_index;
      
      const childrenA = children.filter(c => c.parent_id === a.id);
      const codeA = childrenA.length > 0 ? parseInt(childrenA[0].name.match(/^(\d+)/)?.[1] || '999999') : 999999;
      
      const childrenB = children.filter(c => c.parent_id === b.id);
      const codeB = childrenB.length > 0 ? parseInt(childrenB[0].name.match(/^(\d+)/)?.[1] || '999999') : 999999;
      
      if (codeA !== codeB) return codeA - codeB;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
    
    const result: ScheduleItem[] = [];
    parents.forEach(parent => {
      result.push(parent);
      const parentChildren = children.filter(c => c.parent_id === parent.id);
      parentChildren.sort((a, b) => {
        if (a.order_index != null && b.order_index != null) return a.order_index - b.order_index;
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });
      result.push(...parentChildren);
    });
    
    return result;
  }, [scheduleItems]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 flex flex-col h-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">Cronograma de Obra</span>
          <h2 className="text-2xl sm:text-4xl font-black text-on-surface tracking-tighter mt-1">Planejamento Estrutural</h2>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {!readOnly && (
            <>
              <button onClick={handleImportBudget} disabled={isImporting} className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-outline bg-surface text-on-surface text-xs sm:text-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                {isImporting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div> : <Download className="h-4 w-4" />} 
                Importar Orçamento
              </button>
              <button onClick={() => { setEditingItem(null); setFormData({ progress: 0 }); setIsModalOpen(true); }} className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-primary text-on-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-sm hover:opacity-90 transition-all active:scale-95 whitespace-nowrap">
                <Plus className="h-4 w-4" /> Nova Etapa
              </button>
            </>
          )}
          <button className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-outline bg-surface text-on-surface text-xs sm:text-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
            <Filter className="h-4 w-4" /> Filtros
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-surface p-4 sm:p-5 rounded-xl border border-outline relative overflow-hidden group">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">Status</p>
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 sm:w-3 sm:h-3 rounded-full animate-pulse", scheduleAtrasadas > 0 ? "bg-orange-500" : "bg-emerald-500")}></span>
            <span className="text-lg sm:text-2xl font-black text-on-surface">{scheduleAtrasadas > 0 ? 'Atraso' : 'Em Dia'}</span>
          </div>
        </div>
        <div className="bg-surface p-4 sm:p-5 rounded-xl border border-outline">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">Conclusão</p>
          <span className="text-lg sm:text-2xl font-black text-on-surface">{globalProgress}%</span>
          <div className="w-full bg-surface-container-high h-1 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${globalProgress}%` }}></div>
          </div>
        </div>
        <div className="bg-surface p-4 sm:p-5 rounded-xl border-l-4 border-l-orange-500">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">Críticos</p>
          <span className="text-lg sm:text-2xl font-black text-on-surface">{scheduleAtrasadas} Tarefas</span>
        </div>
        <div className="bg-surface p-4 sm:p-5 rounded-xl border border-outline">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">Entrega</p>
          <span className="text-lg sm:text-2xl font-black text-on-surface">
            {scheduleItems.filter(i => getStatus(i) === 'Pendente').sort((a,b) => a.end_date.localeCompare(b.end_date))[0]?.end_date 
             ? formatDate(scheduleItems.filter(i => getStatus(i) === 'Pendente').sort((a,b) => a.end_date.localeCompare(b.end_date))[0].end_date, { day: '2-digit', month: 'short' })
             : '--'}
          </span>
        </div>
      </div>

      {/* Main Gantt UI (Desktop Only) */}
      <div className="hidden lg:flex flex-1 overflow-hidden rounded-2xl bg-surface border border-outline min-h-[500px]">
        {/* Left Pane: Task List */}
        <div className="w-[550px] xl:w-[600px] flex flex-col border-r border-outline overflow-hidden shrink-0">
          <div className="h-14 flex items-center px-4 bg-surface-container-high text-on-surface text-[10px] font-bold uppercase tracking-[0.15em] border-b border-outline">
            <div className="flex-1 pr-2">Tarefa</div>
            <div className="w-[95px] px-1 text-center">Início</div>
            <div className="w-[95px] px-1 text-center">Término</div>
            <div className="w-[50px] px-1 text-center">Dias</div>
            {!readOnly && <div className="w-[90px]"></div>}
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedItems.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-sm text-on-surface-variant">Nenhuma etapa cadastrada.</p>
              </div>
            )}
            {sortedItems.map((item) => {
              const startDateValue = item.start_date.split('T')[0];
              const endDateValue = item.end_date.split('T')[0];
              const durationDays = Math.max(0, Math.round((new Date(item.end_date).getTime() - new Date(item.start_date).getTime()) / (1000 * 3600 * 24)));

              return (
              <div 
                key={item.id} 
                draggable={!readOnly}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDrop={(e) => handleDrop(e, item.id)}
                className={cn(
                  "group flex items-center px-2 h-[90px] hover:bg-surface-container-low transition-colors border-b border-outline relative",
                  item.parent_id ? "pl-8" : "bg-surface-container-low/20",
                  dragOverId === item.id ? "border-t-2 border-t-primary" : "",
                  draggedId === item.id ? "opacity-50" : ""
                )}
              >
                {!readOnly && (
                  <div className="w-4 shrink-0 flex items-center justify-center mr-2 cursor-grab active:cursor-grabbing text-on-surface-variant/30 hover:text-on-surface-variant transition-colors">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex-1 pr-2 relative h-full flex flex-col justify-center overflow-hidden">
                  <div
                    contentEditable={!readOnly}
                    suppressContentEditableWarning
                    onBlur={(e) => { 
                      const val = e.currentTarget.textContent || '';
                      if (val !== item.name) handleInlineUpdate(item.id, 'name', val, item);
                    }}
                    className={cn(
                      "w-full bg-transparent border border-transparent hover:border-outline focus:border-primary focus:ring-1 focus:ring-primary rounded px-2 py-1 transition-all outline-none",
                      "font-bold text-on-surface line-clamp-3 leading-snug cursor-text",
                      item.parent_id ? "text-[13px]" : "text-[15px] tracking-tight"
                    )}
                  >
                    {item.name}
                  </div>
                  {item.parent_id && (
                    <div className="px-2 mt-1 flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <div className="flex-1 bg-surface-container-high h-1 rounded-full overflow-hidden">
                        <div className={cn("h-full", 
                          getStatus(item) === 'Concluído' ? "bg-emerald-500" : 
                          getStatus(item) === 'Atrasado' ? "bg-orange-500" : "bg-primary"
                        )} style={{ width: `${item.progress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {item.parent_id ? (
                  <>
                    <div className="w-[95px] px-1 flex flex-col justify-center h-full">
                      <input
                        key={`start-${startDateValue}`}
                        type="date"
                        defaultValue={startDateValue}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                        onBlur={(e) => { if (e.target.value && e.target.value !== startDateValue) handleInlineUpdate(item.id, 'start_date', e.target.value, item) }}
                        className="w-full bg-transparent text-[11px] font-bold text-on-surface border border-transparent hover:border-outline focus:border-primary focus:ring-1 focus:ring-primary rounded p-1 transition-all outline-none [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        readOnly={readOnly}
                      />
                    </div>
                    <div className="w-[95px] px-1 flex flex-col justify-center h-full">
                      <input
                        key={`end-${endDateValue}`}
                        type="date"
                        defaultValue={endDateValue}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                        onBlur={(e) => { if (e.target.value && e.target.value !== endDateValue) handleInlineUpdate(item.id, 'end_date', e.target.value, item) }}
                        className="w-full bg-transparent text-[11px] font-bold text-on-surface border border-transparent hover:border-outline focus:border-primary focus:ring-1 focus:ring-primary rounded p-1 transition-all outline-none [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        readOnly={readOnly}
                      />
                    </div>
                    <div className="w-[50px] px-1 flex flex-col justify-center h-full">
                      <input
                        key={`dur-${durationDays}`}
                        type="number"
                        min="0"
                        defaultValue={durationDays}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                        onBlur={(e) => { if (e.target.value && parseInt(e.target.value) !== durationDays) handleInlineUpdate(item.id, 'duration', e.target.value, item) }}
                        className="w-full bg-transparent text-[11px] font-bold text-on-surface text-center border border-transparent hover:border-outline focus:border-primary focus:ring-1 focus:ring-primary rounded p-1 transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        readOnly={readOnly}
                      />
                    </div>
                  </>
                ) : (
                   <div className="w-[240px] flex items-center justify-end pr-4">
                     <span className="text-[10px] font-bold uppercase text-on-surface-variant/50">Categoria</span>
                   </div>
                )}
                
                {/* Ações de Hover (Nova Subtarefa, Editar Avançado, Excluir) */}
                {!readOnly && (
                  <div className="w-[90px] flex items-center justify-end gap-1 opacity-20 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0 pr-1">
                    {!item.parent_id && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingItem(null); setFormData({ progress: 0, parent_id: item.id }); setIsModalOpen(true); }} 
                        className="p-1.5 text-on-surface-variant hover:text-emerald-500 transition-all rounded hover:bg-emerald-500/10"
                        title="Nova subtarefa"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingItem(item); setFormData(item); setIsModalOpen(true); }} 
                      className="p-1.5 text-on-surface-variant hover:text-primary transition-all rounded hover:bg-primary/10"
                      title="Editar (Avançado)"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeletingId(item.id); }} 
                      className="p-1.5 text-on-surface-variant hover:text-red-500 transition-all rounded hover:bg-red-500/10"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              )
            })}
          </div>
        </div>

        {/* Right Pane: Timeline */}
        <div className="flex-1 overflow-x-auto bg-surface flex flex-col group/timeline relative">
          
          {/* TIMELINE HEADER */}
          <div className="flex flex-col bg-surface-container-high border-b border-outline min-w-max sticky top-0 z-40">
            {/* Weeks Row */}
            <div className="flex h-6 items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter border-b border-outline/50">
              {timelineConfig.weeks.map((w, i) => (
                <div key={i} className="border-r border-outline flex justify-center items-center h-full relative overflow-hidden" style={{ width: `${w.daysCount * DAY_WIDTH}px` }}>
                  {w.label}
                </div>
              ))}
            </div>
            
            {/* Days Row */}
            <div className="flex h-8 items-center border-b border-outline/50">
              {timelineConfig.days.map((d, i) => (
                <div key={i} className={cn(
                  "flex justify-center items-center h-full border-r border-outline shrink-0",
                  d.isWeekend ? "bg-surface-container-highest/30" : "",
                  d.isToday ? "bg-primary/10 text-primary" : "text-on-surface-variant"
                )} style={{ width: `${DAY_WIDTH}px` }}>
                  <span className="text-[9px] font-black uppercase leading-none">{d.dayOfWeek}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TIMELINE BODY */}
          <div className="flex-1 relative min-w-max">
            {/* Vertical Grid Lines (Days) */}
            <div className="absolute inset-0 flex pointer-events-none z-0">
              {timelineConfig.days.map((d, i) => (
                <div key={i} className={cn(
                  "h-full border-r border-outline/30 shrink-0",
                  d.isWeekend ? "bg-surface-container-highest/20" : "",
                  d.isToday ? "bg-primary/5" : ""
                )} style={{ width: `${DAY_WIDTH}px` }}>
                </div>
              ))}
            </div>

            <div className="relative z-10 space-y-0">
              {sortedItems.map((item) => {
                const startPos = getPositionPixels(item.start_date);
                const width = getWidthPixels(item.start_date, item.end_date);

                return (
                  <div key={item.id} className={cn("h-[90px] flex items-center border-b border-outline relative group/row transition-colors hover:bg-surface-container-low", item.parent_id ? "" : "bg-surface-container-low/20")}>
                    {item.parent_id && (
                      <div 
                        className={cn(
                          "h-6 rounded-md flex items-center overflow-hidden transition-all duration-300 shadow-lg relative z-30",
                          getStatus(item) === 'Concluído' ? "bg-emerald-500/20 border-l-4 border-emerald-500 shadow-emerald-500/5" :
                          getStatus(item) === 'Atrasado' ? "bg-orange-500/20 border-l-4 border-orange-500 shadow-orange-500/5" :
                          "bg-primary/20 border-l-4 border-primary shadow-blue-500/5"
                        )}
                        style={{ 
                          marginLeft: `${startPos}px`,
                          width: `${width}px`
                        }}
                      >
                        <div 
                          className={cn("h-full transition-all duration-1000",
                            getStatus(item) === 'Concluído' ? "bg-emerald-500" :
                            getStatus(item) === 'Atrasado' ? "bg-orange-500" : "bg-primary"
                          )} 
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Padding for floating controls */}
            <div className="h-20 w-full" />

            {/* Today Marker */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-red-500/50 z-20 pointer-events-none" 
              style={{ left: `${getPositionPixels(new Date().toISOString()) + (DAY_WIDTH / 2)}px` }}
            >
              <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">
                HOJE
              </div>
            </div>
          </div>

          {/* Floating Controls */}
          <div className="absolute bottom-8 right-8 flex items-center gap-2 z-50">
            <div className="flex bg-surface/80 border border-outline rounded-xl p-1 shadow-2xl backdrop-blur-xl transition-all hover:bg-surface">
              <button 
                onClick={() => setZoom(Math.max(1, zoom - 1))}
                className="p-2.5 text-on-surface-variant hover:text-on-surface transition-colors"
                title="Diminuir Zoom"
              >
                <MinusCircle className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-surface-container-high self-center" />
              <button 
                onClick={() => setZoom(Math.min(5, zoom + 1))}
                className="p-2.5 text-on-surface-variant hover:text-on-surface transition-colors"
                title="Aumentar Zoom"
              >
                <PlusCircle className="h-4 w-4" />
              </button>
            </div>
            <button 
              className="p-3.5 bg-surface/80 border border-outline text-on-surface-variant hover:text-on-surface transition-colors rounded-xl shadow-2xl backdrop-blur-xl"
              title="Expandir"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Timeline View */}
      <div className="lg:hidden flex flex-col gap-4">
        {sortedItems.length === 0 && (
          <div className="p-12 text-center bg-surface rounded-2xl border border-outline">
            <p className="text-on-surface-variant font-bold">Nenhuma etapa cadastrada.</p>
          </div>
        )}
        <div className="space-y-4">
          {sortedItems.map((item) => (
            <div key={item.id} className={cn("bg-surface rounded-2xl border border-outline p-5 relative transition-colors", item.parent_id ? "ml-4 space-y-4 active:bg-surface-container-low border-l-4 border-l-primary" : "bg-surface-container-low/30")}>
              <div className="flex justify-between items-start">
                <div className={cn(item.parent_id ? "pr-0" : "pr-8")}>
                  <h3 className={cn("text-on-surface font-bold leading-tight", item.parent_id ? "text-lg" : "text-xl tracking-tight")}>{item.name}</h3>
                  {item.parent_id && (
                    <p className="text-[10px] text-on-surface-variant uppercase font-black tracking-widest mt-1">
                      Dependência: {item.dependency || 'Nenhuma'}
                    </p>
                  )}
                </div>
                {item.parent_id && (
                  <span className={cn(
                    "px-2 py-1 rounded text-[9px] font-black uppercase",
                    getStatus(item) === 'Concluído' ? "bg-emerald-500/10 text-emerald-500" :
                    getStatus(item) === 'Atrasado' ? "bg-orange-500/10 text-orange-500" :
                    "bg-primary/10 text-primary"
                  )}>
                    {getStatus(item)}
                  </span>
                )}
              </div>

              {item.parent_id && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant">
                    <span>{formatDate(item.start_date)} - {formatDate(item.end_date)}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-500", 
                      getStatus(item) === 'Concluído' ? "bg-emerald-500" : 
                      getStatus(item) === 'Atrasado' ? "bg-orange-500" : "bg-primary"
                    )} style={{ width: `${item.progress}%` }}></div>
                  </div>
                </div>
              )}

              {!readOnly && (
                <div className={cn("flex gap-2", item.parent_id ? "pt-2 border-t border-outline" : "absolute right-4 top-4")}>
                  {!item.parent_id && (
                    <button 
                      onClick={() => { setEditingItem(null); setFormData({ progress: 0, parent_id: item.id }); setIsModalOpen(true); }}
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-all active:scale-95 rounded-lg"
                      title="Nova subtarefa"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => { setEditingItem(item); setFormData(item); setIsModalOpen(true); }}
                    className={item.parent_id 
                      ? "flex-1 py-3 bg-surface-container-high hover:opacity-90 rounded-xl text-on-surface font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                      : "p-2 bg-primary/10 hover:bg-primary/20 text-primary transition-all active:scale-95 rounded-lg"}
                    title="Editar"
                  >
                    <Edit className={item.parent_id ? "h-3 w-3" : "h-4 w-4"} /> {item.parent_id && "Editar"}
                  </button>
                  <button 
                    onClick={() => setDeletingId(item.id)}
                    className={cn("bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all active:scale-95", item.parent_id ? "px-4 py-3 rounded-xl" : "p-2 rounded-lg")}
                  >
                    <Trash2 className={item.parent_id ? "h-4 w-4" : "h-4 w-4"} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Excluir Etapa?"
        message="Tem certeza que deseja excluir esta etapa do cronograma? Esta ação não pode ser desfeita."
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-surface-container-low/95 sm:backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-surface rounded-none sm:rounded-[32px] shadow-2xl border-x-0 sm:border border-outline w-full h-full sm:h-auto sm:max-w-lg overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between border-b border-outline">
              <div>
                <h3 className="text-xl font-bold text-on-surface tracking-tight">Nova Etapa</h3>
                <p className="text-xs text-on-surface-variant font-medium">Configure as datas e o progresso da tarefa.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-on-surface-variant hover:text-on-surface transition-colors p-2 hover:bg-surface-container-low rounded-full"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nome da Tarefa</label>
                <input 
                  type="text" 
                  placeholder="Ex: Fundação e Baldrames..." 
                  value={formData.name || ''} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full bg-surface border border-outline rounded-2xl px-5 py-4 text-sm text-on-surface focus:border-primary outline-none transition-all shadow-inner" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Data Início</label>
                  <input 
                    type="date" 
                    value={formData.start_date || ''} 
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })} 
                    className="w-full bg-surface border border-outline rounded-2xl px-5 py-4 text-sm text-on-surface focus:border-primary outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Prazo Final</label>
                  <input 
                    type="date" 
                    value={formData.end_date || ''} 
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })} 
                    className="w-full bg-surface border border-outline rounded-2xl px-5 py-4 text-sm text-on-surface focus:border-primary outline-none" 
                  />
                </div>
              </div>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Progresso (%)</label>
                  <span className="text-sm font-black text-primary">{formData.progress || 0}%</span>
                </div>
                <div className="relative h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: `${formData.progress || 0}%` }}></div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={formData.progress || 0} 
                    onChange={e => setFormData({ ...formData, progress: Number(e.target.value) })} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                </div>
              </div>
              <div className="pt-8 flex items-center justify-end gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-widest hover:text-on-surface transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave} 
                  className="px-10 py-4 bg-primary text-on-primary text-[11px] font-black rounded-2xl uppercase tracking-[2px] hover:opacity-90 transition-all shadow-xl shadow-sm active:scale-[0.98]"
                >
                  Salvar Tarefa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

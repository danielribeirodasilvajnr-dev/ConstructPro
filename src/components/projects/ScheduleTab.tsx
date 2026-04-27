import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Filter, Download, Maximize, Share2, PlusCircle, MinusCircle, Edit } from 'lucide-react';
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

  // Timeline Logic
  const timelineConfig = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    // Find boundaries from data or fallback to current window
    let minDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    let maxDate = new Date(today.getFullYear(), today.getMonth() + 4, 0);

    if (scheduleItems.length > 0) {
      const dates = scheduleItems.flatMap(i => [
        new Date(i.start_date.split('T')[0] + 'T12:00:00'),
        new Date(i.end_date.split('T')[0] + 'T12:00:00')
      ]);
      const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
      const latest = new Date(Math.max(...dates.map(d => d.getTime())));
      
      // Start of the earliest month - 1 month padding
      minDate = new Date(earliest.getFullYear(), earliest.getMonth() - 1, 1);
      // End of the latest month + 1 month padding
      maxDate = new Date(latest.getFullYear(), latest.getMonth() + 2, 0);
    }

    const start = minDate;
    const end = maxDate;
    const duration = end.getTime() - start.getTime();

    const months = [];
    let current = new Date(start);
    while (current <= end) {
      months.push({
        date: new Date(current),
        name: current.toLocaleString('pt-BR', { month: 'short' }),
        year: current.getFullYear(),
        isCurrent: current.getMonth() === today.getMonth() && current.getFullYear() === today.getFullYear()
      });
      current.setMonth(current.getMonth() + 1);
    }

    return { start, end, duration, months, today };
  }, [scheduleItems]);

  const getPosition = (dateStr: string) => {
    if (!dateStr) return 0;
    const pureDate = dateStr.split('T')[0];
    const [year, month, day] = pureDate.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    const timelineStart = new Date(timelineConfig.start);
    timelineStart.setHours(12, 0, 0, 0);
    
    const pos = ((date.getTime() - timelineStart.getTime()) / timelineConfig.duration) * 100;
    return Math.max(0, Math.min(100, pos));
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
  const globalProgress = (scheduleItems || []).length > 0 ? Math.round(scheduleItems.reduce((acc, i) => acc + Number(i.progress), 0) / scheduleItems.length) : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 flex flex-col h-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#BCB5AC]">Cronograma de Obra</span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter mt-1">Planejamento Estrutural</h2>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {!readOnly && (
            <button onClick={() => { setEditingItem(null); setFormData({ progress: 0 }); setIsModalOpen(true); }} className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-[#BCB5AC] text-[#1C232E] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-black/20 hover:bg-slate-700 transition-all active:scale-95 whitespace-nowrap">
              <Plus className="h-4 w-4" /> Nova Etapa
            </button>
          )}
          <button className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-white/5 bg-[#1C232E] text-white text-xs sm:text-sm font-semibold hover:bg-white/5 transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
            <Filter className="h-4 w-4" /> Filtros
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-[#1C232E] p-4 sm:p-5 rounded-xl border border-white/5 relative overflow-hidden group">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Status</p>
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 sm:w-3 sm:h-3 rounded-full animate-pulse", scheduleAtrasadas > 0 ? "bg-orange-500" : "bg-emerald-500")}></span>
            <span className="text-lg sm:text-2xl font-black text-white">{scheduleAtrasadas > 0 ? 'Atraso' : 'Em Dia'}</span>
          </div>
        </div>
        <div className="bg-[#1C232E] p-4 sm:p-5 rounded-xl border border-white/5">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Conclusão</p>
          <span className="text-lg sm:text-2xl font-black text-white">{globalProgress}%</span>
          <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[#BCB5AC]" style={{ width: `${globalProgress}%` }}></div>
          </div>
        </div>
        <div className="bg-[#1C232E] p-4 sm:p-5 rounded-xl border-l-4 border-l-orange-500">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Críticos</p>
          <span className="text-lg sm:text-2xl font-black text-white">{scheduleAtrasadas} Tarefas</span>
        </div>
        <div className="bg-[#1C232E] p-4 sm:p-5 rounded-xl border border-white/5">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Entrega</p>
          <span className="text-lg sm:text-2xl font-black text-white">
            {scheduleItems.filter(i => getStatus(i) === 'Pendente').sort((a,b) => a.end_date.localeCompare(b.end_date))[0]?.end_date 
             ? formatDate(scheduleItems.filter(i => getStatus(i) === 'Pendente').sort((a,b) => a.end_date.localeCompare(b.end_date))[0].end_date, { day: '2-digit', month: 'short' })
             : '--'}
          </span>
        </div>
      </div>

      {/* Main Gantt UI (Desktop Only) */}
      <div className="hidden lg:flex flex-1 overflow-hidden rounded-2xl bg-[#1C232E] border border-white/5 min-h-[500px]">
        {/* Left Pane: Task List */}
        <div className="w-[400px] sm:w-[450px] flex flex-col border-r border-white/10 overflow-hidden shrink-0">
          <div className="h-12 flex items-center px-6 bg-[#2B3647] text-white text-[10px] font-bold uppercase tracking-[0.15em] border-b border-white/5">
            <div className="w-1/2">Etapa / Tarefa</div>
            <div className="w-1/4 px-2">Datas</div>
            <div className="w-1/4 text-center">Status</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {scheduleItems.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-sm text-slate-500">Nenhuma etapa cadastrada.</p>
              </div>
            )}
            {scheduleItems.map((item) => (
              <div key={item.id} className="group flex items-center px-6 h-[80px] hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5">
                <div className="w-1/2">
                  <p className="text-sm font-bold text-white group-hover:text-[#BCB5AC] transition-colors">{item.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Dep: {item.dependency || 'NENHUMA'}</p>
                  <div className="w-32 bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                    <div className={cn("h-full", 
                      getStatus(item) === 'Concluído' ? "bg-emerald-500" : 
                      getStatus(item) === 'Atrasado' ? "bg-orange-500" : "bg-[#BCB5AC]"
                    )} style={{ width: `${item.progress}%` }}></div>
                  </div>
                </div>
                <div className="w-1/4 px-2">
                  <p className="text-[11px] font-bold text-slate-200">{formatDate(item.start_date, { day: '2-digit', month: 'short' })} - {formatDate(item.end_date, { day: '2-digit', month: 'short' })}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{(new Date(item.end_date).getTime() - new Date(item.start_date).getTime()) / (1000 * 3600 * 24)} dias</p>
                </div>
                <div className="w-1/4 flex flex-col items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded text-[9px] font-black uppercase",
                    getStatus(item) === 'Concluído' ? "bg-emerald-500/10 text-emerald-500" :
                    getStatus(item) === 'Atrasado' ? "bg-orange-500/10 text-orange-500" :
                    "bg-[#BCB5AC]/10 text-[#BCB5AC]"
                  )}>
                    {getStatus(item)}
                  </span>
                  {!readOnly && (
                    <button onClick={(e) => { e.stopPropagation(); setDeletingId(item.id); }} className="md:opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-500 transition-all rounded-lg hover:bg-red-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Timeline */}
        <div className="flex-1 overflow-x-auto bg-[#1C232E] flex flex-col group/timeline relative">
          <div className="h-12 flex items-center bg-[#2B3647] border-b border-white/5 whitespace-nowrap min-w-full sticky top-0 z-40">
            <div className="flex-1 flex h-full items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {timelineConfig.months.map((month, i) => (
                <div key={i} 
                  className={cn(
                    "flex-1 text-center border-r border-white/5 h-full flex flex-col items-center justify-center",
                    month.isCurrent && "bg-[#BCB5AC]/20 text-[#BCB5AC]"
                  )}
                  style={{ minWidth: `${80 * zoom}px` }}
                >
                  <span className="leading-none">{month.name}</span>
                  <span className="text-[8px] opacity-40 mt-0.5">{month.year}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 relative min-w-full">
            {/* Horizontal Grid Lines - Removed separate layer to use row borders */}
            {/* Vertical Grid Lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {timelineConfig.months.map((_, i) => (
                <div key={i} className="flex-1 border-r border-white/5" style={{ minWidth: `${80 * zoom}px` }}></div>
              ))}
            </div>

              {scheduleItems.map((item) => {
                const startPos = getPosition(item.start_date);
                const endPos = getPosition(item.end_date);
                const width = Math.max(2, endPos - startPos);

                return (
                  <div key={item.id} className="h-[80px] flex items-center border-b border-white/5 relative group/row transition-colors hover:bg-white/5">
                    <div 
                      className={cn(
                        "h-6 rounded-md flex items-center overflow-hidden transition-all duration-300 shadow-lg relative z-30",
                        getStatus(item) === 'Concluído' ? "bg-emerald-500/20 border-l-4 border-emerald-500 shadow-emerald-500/5" :
                        getStatus(item) === 'Atrasado' ? "bg-orange-500/20 border-l-4 border-orange-500 shadow-orange-500/5" :
                        "bg-[#BCB5AC]/20 border-l-4 border-[#BCB5AC] shadow-blue-500/5"
                      )}
                      style={{ 
                        marginLeft: `${startPos}%`,
                        width: `${width}%`
                      }}
                    >
                      <div 
                        className={cn("h-full transition-all duration-1000",
                          getStatus(item) === 'Concluído' ? "bg-emerald-500" :
                          getStatus(item) === 'Atrasado' ? "bg-orange-500" : "bg-[#BCB5AC]"
                        )} 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}

            {/* Bottom Padding for floating controls */}
            <div className="h-20 w-full" />

            {/* Today Marker */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-red-500/50 z-20 pointer-events-none" 
              style={{ left: `${getPosition(new Date().toISOString())}%` }}
            >
              <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
              <div className="absolute top-2 -left-[30px] bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg uppercase">Hoje</div>
            </div>
          </div>

          {/* Floating Controls */}
          <div className="absolute bottom-8 right-8 flex items-center gap-2 z-50">
            <div className="flex bg-[#1C232E]/80 border border-white/10 rounded-xl p-1 shadow-2xl backdrop-blur-xl transition-all hover:bg-[#1C232E]">
              <button 
                onClick={() => setZoom(Math.max(1, zoom - 1))}
                className="p-2.5 text-slate-400 hover:text-white transition-colors"
                title="Diminuir Zoom"
              >
                <MinusCircle className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-white/10 self-center" />
              <button 
                onClick={() => setZoom(Math.min(5, zoom + 1))}
                className="p-2.5 text-slate-400 hover:text-white transition-colors"
                title="Aumentar Zoom"
              >
                <PlusCircle className="h-4 w-4" />
              </button>
            </div>
            <button 
              className="p-3.5 bg-[#1C232E]/80 border border-white/10 text-slate-400 hover:text-white transition-colors rounded-xl shadow-2xl backdrop-blur-xl"
              title="Expandir"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Timeline View */}
      <div className="lg:hidden flex flex-col gap-4">
        {scheduleItems.length === 0 && (
          <div className="p-12 text-center bg-[#1C232E] rounded-2xl border border-white/5">
            <p className="text-slate-500 font-bold">Nenhuma etapa cadastrada.</p>
          </div>
        )}
        <div className="space-y-4">
          {scheduleItems.map((item) => (
            <div key={item.id} className="bg-[#1C232E] rounded-2xl border border-white/5 p-5 space-y-4 relative active:bg-white/5 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">{item.name}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">
                    Dependência: {item.dependency || 'Nenhuma'}
                  </p>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded text-[9px] font-black uppercase",
                  getStatus(item) === 'Concluído' ? "bg-emerald-500/10 text-emerald-500" :
                  getStatus(item) === 'Atrasado' ? "bg-orange-500/10 text-orange-500" :
                  "bg-[#BCB5AC]/10 text-[#BCB5AC]"
                )}>
                  {getStatus(item)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>{formatDate(item.start_date)} - {formatDate(item.end_date)}</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className={cn("h-full transition-all duration-500", 
                    getStatus(item) === 'Concluído' ? "bg-emerald-500" : 
                    getStatus(item) === 'Atrasado' ? "bg-orange-500" : "bg-[#BCB5AC]"
                  )} style={{ width: `${item.progress}%` }}></div>
                </div>
              </div>

              {!readOnly && (
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button 
                    onClick={() => { setEditingItem(item); setFormData(item); setIsModalOpen(true); }}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Edit className="h-3 w-3" /> Editar
                  </button>
                  <button 
                    onClick={() => setDeletingId(item.id)}
                    className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-all active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" />
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
          <div className="absolute inset-0 bg-[#0B0F19]/95 sm:backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#1C232E] rounded-none sm:rounded-[32px] shadow-2xl border-x-0 sm:border border-white/5 w-full h-full sm:h-auto sm:max-w-lg overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Nova Etapa</h3>
                <p className="text-xs text-slate-500 font-medium">Configure as datas e o progresso da tarefa.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome da Tarefa</label>
                <input 
                  type="text" 
                  placeholder="Ex: Fundação e Baldrames..." 
                  value={formData.name || ''} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full bg-[#1C232E] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-[#BCB5AC] outline-none transition-all shadow-inner" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data Início</label>
                  <input 
                    type="date" 
                    value={formData.start_date || ''} 
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })} 
                    className="w-full bg-[#1C232E] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-[#BCB5AC] outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Prazo Final</label>
                  <input 
                    type="date" 
                    value={formData.end_date || ''} 
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })} 
                    className="w-full bg-[#1C232E] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-[#BCB5AC] outline-none" 
                  />
                </div>
              </div>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Progresso (%)</label>
                  <span className="text-sm font-black text-[#BCB5AC]">{formData.progress || 0}%</span>
                </div>
                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-[#BCB5AC]" style={{ width: `${formData.progress || 0}%` }}></div>
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
                  className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave} 
                  className="px-10 py-4 bg-[#BCB5AC] text-[#1C232E] text-[11px] font-black rounded-2xl uppercase tracking-[2px] hover:bg-slate-700 transition-all shadow-xl shadow-black/30 active:scale-[0.98]"
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

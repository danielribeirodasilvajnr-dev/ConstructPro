import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Filter, Download, Maximize, Share2, PlusCircle, MinusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ScheduleItem } from '../../lib/types';
import { cn } from '../../lib/utils';

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

  // Timeline Logic
  const timelineConfig = useMemo(() => {
    const today = new Date();
    // Default window: current month +/- 1.5 months
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    const duration = end.getTime() - start.getTime();

    const months = [];
    let current = new Date(start);
    while (current <= end) {
      months.push({
        name: current.toLocaleString('pt-BR', { month: 'long' }),
        isCurrent: current.getMonth() === today.getMonth() && current.getFullYear() === today.getFullYear()
      });
      current.setMonth(current.getMonth() + 1);
    }

    return { start, end, duration, months, today };
  }, []);

  const getPosition = (dateStr: string) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    const pos = ((date.getTime() - timelineConfig.start.getTime()) / timelineConfig.duration) * 100;
    return Math.max(0, Math.min(100, pos));
  };

  const getStatus = (item: ScheduleItem) => {
    if (Number(item.progress) >= 100) return 'Concluído';
    const today = new Date();
    const end = new Date(item.end_date);
    const start = new Date(item.start_date);
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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('schedule_items').delete().eq('id', id);
      if (error) throw error;
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
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4170FF]">Cronograma de Obra</span>
          <h2 className="text-4xl font-black text-white tracking-tighter mt-1">Planejamento Estrutural</h2>
        </div>
        <div className="flex gap-3">
          {!readOnly && (
            <button onClick={() => { setEditingItem(null); setFormData({ progress: 0 }); setIsModalOpen(true); }} className="px-5 py-2.5 rounded-lg bg-[#4170FF] text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/10 hover:bg-blue-600 transition-all active:scale-95">
              <Plus className="h-4 w-4" /> Nova Etapa
            </button>
          )}
          <button className="px-5 py-2.5 rounded-lg border border-white/5 bg-[#181c21] text-white text-sm font-semibold hover:bg-white/5 transition-colors flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </button>
          <button className="px-5 py-2.5 rounded-lg bg-[#181c21] border border-white/5 text-white text-sm font-bold flex items-center gap-2 hover:bg-white/5 transition-all">
            <Download className="h-4 w-4" /> Exportar Relatório
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#181c21] p-5 rounded-xl border border-white/5 relative overflow-hidden group">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Status Global</p>
          <div className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full animate-pulse", scheduleAtrasadas > 0 ? "bg-orange-500" : "bg-emerald-500")}></span>
            <span className="text-2xl font-black text-white">{scheduleAtrasadas > 0 ? 'Atrasado' : 'No Prazo'}</span>
          </div>
          <div className="absolute -right-2 -bottom-2 opacity-5 transform group-hover:scale-110 transition-transform">
            <Maximize className="h-16 w-16 text-white" />
          </div>
        </div>
        <div className="bg-[#181c21] p-5 rounded-xl border border-white/5">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Conclusão</p>
          <span className="text-2xl font-black text-white">{globalProgress}%</span>
          <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[#4170FF]" style={{ width: `${globalProgress}%` }}></div>
          </div>
        </div>
        <div className="bg-[#181c21] p-5 rounded-xl border-l-4 border-l-orange-500">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Críticos</p>
          <span className="text-2xl font-black text-white">{scheduleAtrasadas} Tarefas</span>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Atenção imediata necessária</p>
        </div>
        <div className="bg-[#181c21] p-5 rounded-xl border border-white/5">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Próxima Entrega</p>
          <span className="text-2xl font-black text-white">
            {scheduleItems.filter(i => getStatus(i) === 'Pendente').sort((a,b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())[0]?.end_date 
             ? new Date(scheduleItems.filter(i => getStatus(i) === 'Pendente').sort((a,b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())[0].end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
             : '--'}
          </span>
        </div>
      </div>

      {/* Main Gantt UI */}
      <div className="flex-1 flex overflow-hidden rounded-2xl bg-[#181c21] border border-white/5 min-h-[500px]">
        {/* Left Pane: Task List */}
        <div className="w-[450px] flex flex-col border-r border-white/10 overflow-hidden">
          <div className="h-12 flex items-center px-6 bg-[#0b0f15] text-white text-[10px] font-bold uppercase tracking-[0.15em] border-b border-white/5">
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
              <div key={item.id} className="group flex items-center px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5">
                <div className="w-1/2">
                  <p className="text-sm font-bold text-white group-hover:text-[#4170FF] transition-colors">{item.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Dep: {item.dependency || 'NENHUMA'}</p>
                  <div className="w-32 bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                    <div className={cn("h-full", 
                      getStatus(item) === 'Concluído' ? "bg-emerald-500" : 
                      getStatus(item) === 'Atrasado' ? "bg-orange-500" : "bg-[#4170FF]"
                    )} style={{ width: `${item.progress}%` }}></div>
                  </div>
                </div>
                <div className="w-1/4 px-2">
                  <p className="text-[11px] font-bold text-slate-200">{new Date(item.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {new Date(item.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{(new Date(item.end_date).getTime() - new Date(item.start_date).getTime()) / (1000 * 3600 * 24)} dias</p>
                </div>
                <div className="w-1/4 flex flex-col items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded text-[9px] font-black uppercase",
                    getStatus(item) === 'Concluído' ? "bg-emerald-500/10 text-emerald-500" :
                    getStatus(item) === 'Atrasado' ? "bg-orange-500/10 text-orange-500" :
                    "bg-[#4170FF]/10 text-[#4170FF]"
                  )}>
                    {getStatus(item)}
                  </span>
                  {!readOnly && (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-500 transition-all rounded-lg hover:bg-red-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Timeline */}
        <div className="flex-1 overflow-x-auto bg-[#13171f] flex flex-col group/timeline relative">
          <div className="h-12 flex items-center bg-[#0b0f15] border-b border-white/5 whitespace-nowrap min-w-full">
            <div className="flex-1 flex h-full items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {timelineConfig.months.map((month, i) => (
                <div key={i} className={cn(
                  "flex-1 text-center border-r border-white/5 h-full flex items-center justify-center min-w-[150px]",
                  month.isCurrent && "bg-[#4170FF]/20 text-[#4170FF]"
                )}>
                  {month.name} {month.isCurrent && "(Atual)"}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 relative min-w-full">
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              {scheduleItems.map((_, i) => (
                <div key={i} className="h-[73px] border-b border-white/5"></div>
              ))}
            </div>
            {/* Vertical Grid Lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {timelineConfig.months.map((_, i) => (
                <div key={i} className="flex-1 border-r border-white/5"></div>
              ))}
            </div>

            <div className="relative z-10 flex flex-col h-full overflow-hidden">
              {scheduleItems.map((item) => {
                const startPos = getPosition(item.start_date);
                const endPos = getPosition(item.end_date);
                const width = Math.max(2, endPos - startPos); // Min width for visibility

                return (
                  <div key={item.id} className="h-[73px] flex items-center px-4">
                    <div 
                      className={cn(
                        "h-6 rounded-md flex items-center overflow-hidden transition-all duration-300 shadow-lg",
                        getStatus(item) === 'Concluído' ? "bg-emerald-500/20 border-l-4 border-emerald-500 shadow-emerald-500/5" :
                        getStatus(item) === 'Atrasado' ? "bg-orange-500/20 border-l-4 border-orange-500 shadow-orange-500/5" :
                        "bg-[#4170FF]/20 border-l-4 border-[#4170FF] shadow-blue-500/5"
                      )}
                      style={{ 
                        marginLeft: `${startPos}%`,
                        width: `${width}%`
                      }}
                    >
                      <div 
                        className={cn("h-full transition-all duration-1000",
                          getStatus(item) === 'Concluído' ? "bg-emerald-500" :
                          getStatus(item) === 'Atrasado' ? "bg-orange-500" : "bg-[#4170FF]"
                        )} 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

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
          <div className="absolute bottom-6 right-6 flex items-center gap-2 z-30">
            <div className="flex bg-[#181C21] border border-white/10 rounded-xl p-1 shadow-2xl backdrop-blur-md">
              <button className="p-2 text-slate-400 hover:text-white transition-colors"><MinusCircle className="h-4 w-4" /></button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors"><PlusCircle className="h-4 w-4" /></button>
            </div>
            <button className="p-3 bg-[#181C21] border border-white/10 text-slate-400 hover:text-white transition-colors rounded-xl shadow-2xl backdrop-blur-md">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="p-3 bg-primary text-white transition-colors rounded-xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95">
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B0F19]/95 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#181C21] rounded-[32px] shadow-2xl border border-white/5 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
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
                  className="w-full bg-[#13171f] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-[#4170FF] outline-none transition-all shadow-inner" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data Início</label>
                  <input 
                    type="date" 
                    value={formData.start_date || ''} 
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })} 
                    className="w-full bg-[#13171f] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-[#4170FF] outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Prazo Final</label>
                  <input 
                    type="date" 
                    value={formData.end_date || ''} 
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })} 
                    className="w-full bg-[#13171f] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-[#4170FF] outline-none" 
                  />
                </div>
              </div>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Progresso (%)</label>
                  <span className="text-sm font-black text-[#4170FF]">{formData.progress || 0}%</span>
                </div>
                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-[#4170FF]" style={{ width: `${formData.progress || 0}%` }}></div>
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
                  className="px-10 py-4 bg-[#4170FF] text-white text-[11px] font-black rounded-2xl uppercase tracking-[2px] hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
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

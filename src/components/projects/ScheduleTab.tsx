import React, { useState } from 'react';
import { Plus, Trash2, Filter, Download } from 'lucide-react';
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

  const getDaysBetween = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = end.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) + 1;
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-start justify-between">
        <h2 className="text-3xl font-black text-[#3B82F6]">Planejamento Estrutural</h2>
        <div className="flex gap-3">
          {!readOnly && (
            <button onClick={() => { setEditingItem(null); setFormData({ progress: 0 }); setIsModalOpen(true); }} className="px-4 py-2 bg-[#4170FF] text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/10 active:scale-95">
              <Plus className="h-4 w-4" /> Nova Etapa
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#13171f] p-5 rounded-xl border border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Conclusão</p>
          <span className="text-2xl font-bold text-[#3B82F6]">{globalProgress}%</span>
        </div>
        <div className="bg-[#13171f] p-5 rounded-xl border-l-[3px] border-l-[#F97316]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Atrasados</p>
          <span className="text-2xl font-bold text-[#F97316]">{scheduleAtrasadas} Tarefas</span>
        </div>
      </div>

      <div className="bg-[#13171f] rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 text-[10px] font-bold uppercase text-white bg-[#0b0f19]">
          Lista de Tarefas
        </div>
        { (scheduleItems || []).map(item => (
          <div key={item.id} className="flex items-center gap-4 px-6 py-4 border-b border-white/5 group hover:bg-white/5">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">{item.name}</h4>
              <p className="text-[10px] text-slate-500 uppercase">DEP: {item.dependency || 'NENHUMA'}</p>
            </div>
            <div className="w-32 text-xs text-slate-400">
              {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
            </div>
            <div className="w-24">
              <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded uppercase", 
                getStatus(item) === 'Atrasado' ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
              )}>
                {getStatus(item)}
              </span>
            </div>
            <div className="w-32">
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${item.progress}%` }}></div>
              </div>
            </div>
            {!readOnly && (
              <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#181C21] rounded-[24px] shadow-2xl border border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100 tracking-tight">Etapa do Cronograma</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="px-8 pb-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome da Tarefa/Etapa</label>
                <input 
                  type="text" 
                  placeholder="Ex: Fundação e Baldrames..." 
                  value={formData.name || ''} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#4170FF] outline-none transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data Início</label>
                  <input 
                    type="date" 
                    value={formData.start_date || ''} 
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })} 
                    className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#4170FF] outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Previsão Término</label>
                  <input 
                    type="date" 
                    value={formData.end_date || ''} 
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })} 
                    className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#4170FF] outline-none" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Avanço Físico</label>
                  <span className="text-xs font-bold text-[#4170FF]">{formData.progress || 0}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={formData.progress || 0} 
                  onChange={e => setFormData({ ...formData, progress: Number(e.target.value) })} 
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#4170FF]" 
                />
              </div>
              <div className="pt-6 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave} 
                  className="px-8 py-3 bg-[#4170FF] text-white text-xs font-bold rounded-xl uppercase tracking-[1.5px] hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98]"
                >
                  Salvar Etapa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

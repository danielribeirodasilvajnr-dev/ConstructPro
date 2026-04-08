import React, { useState } from 'react';
import { Plus, Trash2, Filter, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ScheduleItem } from '../../lib/types';
import { cn } from '../../lib/utils';

interface ScheduleTabProps {
  projectId: string;
  scheduleItems: ScheduleItem[];
  onRefresh: () => void;
}

export function ScheduleTab({ projectId, scheduleItems, onRefresh }: ScheduleTabProps) {
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
          <button onClick={() => { setEditingItem(null); setFormData({ progress: 0 }); setIsModalOpen(true); }} className="px-4 py-2 bg-[#10B981] text-white text-sm font-bold rounded-lg flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nova Etapa
          </button>
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
            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#13171f] rounded-xl border border-[#1e293b] w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-white mb-6">Nova Etapa</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Nome" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg p-2.5 text-white" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg p-2.5 text-white" />
                <input type="date" value={formData.end_date || ''} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg p-2.5 text-white" />
              </div>
              <input type="number" placeholder="Progresso %" value={formData.progress || 0} onChange={e => setFormData({ ...formData, progress: Number(e.target.value) })} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg p-2.5 text-white" />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-white border border-[#1e293b] rounded-lg">Cancelar</button>
                <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded-lg">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

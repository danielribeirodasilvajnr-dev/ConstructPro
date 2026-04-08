import React, { useState } from 'react';
import { Plus, Edit, Trash2, Camera, Sun, Cloud, HardHat, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DailyLog, DailyLogPhoto } from '../../lib/types';

interface DailyLogWithPhotos extends DailyLog {
  daily_log_photos?: DailyLogPhoto[];
}

interface DailyLogTabProps {
  projectId: string;
  dailyLogs: DailyLogWithPhotos[];
  onRefresh: () => void;
}

export function DailyLogTab({ projectId, dailyLogs, onRefresh }: DailyLogTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [formData, setFormData] = useState<Partial<DailyLog>>({});
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          ...formData,
          project_id: projectId,
          id: editingLog?.id || undefined
        });

      if (error) throw error;
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este Diário de Obra?')) return;
    try {
      await supabase.from('daily_logs').delete().eq('id', id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, logId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${projectId}/${logId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('daily_logs')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('daily_logs')
        .getPublicUrl(fileName);

      await supabase.from('daily_log_photos').insert({
        log_id: logId,
        image_url: publicUrl,
        description: file.name
      });

      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-black text-white">Diário de Obra (RDO)</h2>
          <p className="text-slate-500 mt-1">Registros diários do canteiro</p>
        </div>
        <button onClick={() => { setEditingLog(null); setFormData({ date: new Date().toISOString().split('T')[0], weather: 'Ensolarado', workers: 0 }); setIsModalOpen(true); }} className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-bold rounded-lg flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo Registro
        </button>
      </div>

      <div className="space-y-6">
        {dailyLogs.length === 0 ? (
          <div className="bg-[#13171f] p-12 text-center rounded-2xl border border-white/5 text-slate-500">
            Nenhum diário de obra registrado.
          </div>
        ) : (
          dailyLogs.map(log => (
            <div key={log.id} className="bg-[#1e293b]/50 p-6 rounded-xl border border-white/5 group relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h4 className="text-lg font-bold text-white capitalize">{new Date(log.date + 'T12:00:00Z').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</h4>
                   <div className="flex gap-4 text-sm mt-1">
                      <span className="flex items-center gap-1.5 text-slate-400"><Sun className="h-4 w-4" /> {log.weather}</span>
                      <span className="flex items-center gap-1.5 text-slate-400"><HardHat className="h-4 w-4" /> {log.workers} trabalhadores</span>
                   </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingLog(log); setFormData(log); setIsModalOpen(true); }} className="p-1 hover:text-white"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(log.id)} className="p-1 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Atividades</p>
                <p className="text-slate-300 text-sm whitespace-pre-wrap">{log.activities}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                 {log.daily_log_photos?.map(photo => (
                    <div key={photo.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                       <img src={photo.image_url} alt={photo.description} className="w-full h-full object-cover" />
                    </div>
                 ))}
                 <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
                    <Camera className="h-6 w-6 text-slate-500" />
                    <span className="text-[10px] text-slate-500 mt-1">Add Foto</span>
                    <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e, log.id)} disabled={uploading} />
                 </label>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#181C21] rounded-[24px] shadow-2xl border border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100 tracking-tight">Registro de Diário de Obra</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-8 pb-8 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data</label>
                  <input type="date" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Clima</label>
                  <select value={formData.weather || 'Ensolarado'} onChange={e => setFormData({ ...formData, weather: e.target.value })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none appearance-none">
                     {['Ensolarado', 'Nublado', 'Chuvoso', 'Tempestade'].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Efetivo</label>
                  <input type="number" placeholder="Qtd. trabalhadores" value={formData.workers || 0} onChange={e => setFormData({ ...formData, workers: Number(e.target.value) })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Atividades Realizadas</label>
                <textarea 
                  placeholder="Descreva o que foi feito no dia..." 
                  rows={4} 
                  value={formData.activities || ''} 
                  onChange={e => setFormData({ ...formData, activities: e.target.value })} 
                  className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none resize-none" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 text-red-400">Restrições / Ocorrências</label>
                <textarea 
                  placeholder="Houve algum problema ou impedimento? (opcional)" 
                  rows={2} 
                  value={formData.restrictions || ''} 
                  onChange={e => setFormData({ ...formData, restrictions: e.target.value })} 
                  className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-red-300 focus:border-red-500 outline-none resize-none" 
                />
              </div>
              
              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave} 
                  className="px-8 py-3 bg-[#4170FF] text-white text-xs font-bold rounded-xl uppercase tracking-[1.5px] hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/10"
                >
                  Salvar RDO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

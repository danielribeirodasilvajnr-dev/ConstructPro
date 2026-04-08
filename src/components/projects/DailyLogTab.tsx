import React, { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Camera, Sun, Cloud, HardHat, X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DailyLog, DailyLogPhoto } from '../../lib/types';
import { cn } from '../../lib/utils';

interface DailyLogWithPhotos extends DailyLog {
  daily_log_photos?: DailyLogPhoto[];
}

interface DailyLogTabProps {
  projectId: string;
  dailyLogs: DailyLogWithPhotos[];
  onRefresh: () => void;
  readOnly?: boolean;
}

export function DailyLogTab({ projectId, dailyLogs, onRefresh, readOnly }: DailyLogTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLogWithPhotos | null>(null);
  const [formData, setFormData] = useState<Partial<DailyLog>>({});
  const [uploading, setUploading] = useState(false);

  // New Photo State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (!photoDescription) setPhotoDescription(file.name);
    }
  };

  const handleSave = async () => {
    try {
      setUploading(true);
      const { data: savedLog, error: logError } = await supabase
        .from('daily_logs')
        .upsert({
          ...formData,
          project_id: projectId,
          id: editingLog?.id || undefined
        })
        .select();

      if (logError) throw logError;

      const logId = savedLog?.[0]?.id;

      if (selectedFile && logId) {
        const fileName = `${projectId}/${logId}/${Date.now()}-${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('daily_logs')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('daily_logs')
          .getPublicUrl(fileName);

        const { error: photoError } = await supabase.from('daily_log_photos').insert({
          log_id: logId,
          image_url: publicUrl,
          description: photoDescription || selectedFile.name
        });

        if (photoError) throw photoError;
      }

      setIsModalOpen(false);
      resetModal();
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o Diário de Obra.');
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setEditingLog(null);
    setFormData({});
    setSelectedFile(null);
    setPhotoDescription('');
    setPreviewUrl(null);
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
        {!readOnly && (
          <button onClick={() => { resetModal(); setFormData({ date: new Date().toISOString().split('T')[0], weather: 'Ensolarado', workers: 0 }); setIsModalOpen(true); }} className="px-5 py-2.5 bg-[#4170FF] text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/10 active:scale-95">
            <Plus className="h-4 w-4" /> Novo Registro
          </button>
        )}
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
                {!readOnly && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingLog(log); setFormData(log); setIsModalOpen(true); }} className="p-1 hover:text-white transition-colors"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(log.id)} className="p-1 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Atividades</p>
                <p className="text-slate-300 text-sm whitespace-pre-wrap">{log.activities}</p>
                {log.restrictions && (
                  <div className="mt-4 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                    <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Restrições / Ocorrências</p>
                    <p className="text-red-300/80 text-xs">{log.restrictions}</p>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Evidências Fotográficas</p>
                <div className="flex flex-wrap gap-4">
                  {log.daily_log_photos?.map(photo => (
                    <div key={photo.id} className="group/photo relative w-32 aspect-square rounded-xl overflow-hidden border border-white/10 shadow-lg transition-transform hover:scale-105">
                        <img src={photo.image_url} alt={photo.description} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                          <p className="text-[9px] text-white font-medium truncate">{photo.description}</p>
                        </div>
                    </div>
                  ))}
                  {!readOnly && (
                    <label className="w-32 aspect-square flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-[#4170FF]/50 hover:bg-[#4170FF]/5 transition-all">
                        <Camera className="h-6 w-6 text-slate-500 group-hover:text-[#4170FF]" />
                        <span className="text-[10px] text-slate-500 mt-1 font-bold">Adicionar Foto</span>
                        <input type="file" className="hidden" onChange={(e) => handleQuickPhotoUpload(e, log.id)} disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#181C21] rounded-[24px] shadow-2xl border border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Registro de Diário de Obra</h3>
                <p className="text-xs text-slate-500 font-medium">Preencha os detalhes do dia e anexe evidências.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
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
              {/* Photo Section */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Anexar Evidência Fotográfica</label>
                <div className="grid grid-cols-2 gap-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative",
                      previewUrl ? "border-[#4170FF]" : "border-white/10 hover:border-[#4170FF]/50 hover:bg-[#4170FF]/5"
                    )}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-slate-500 mb-2" />
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Selecionar Foto</span>
                      </>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descrição da Foto</label>
                    <textarea 
                      placeholder="Ex: Armação da laje L1..." 
                      rows={4}
                      value={photoDescription}
                      onChange={e => setPhotoDescription(e.target.value)}
                      className="w-full bg-[#13171f] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-[#4170FF] outline-none resize-none h-full"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 flex items-center justify-end gap-4 border-t border-white/5">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={uploading}
                  className="px-10 py-4 bg-[#4170FF] text-white text-[11px] font-black rounded-2xl uppercase tracking-[2px] hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Salvando...
                    </>
                  ) : 'Salvar RDO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

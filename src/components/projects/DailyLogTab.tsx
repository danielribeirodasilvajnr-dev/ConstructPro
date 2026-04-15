import React, { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Camera, Sun, Cloud, HardHat, X, Image as ImageIcon, UploadCloud, PlusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DailyLog, DailyLogPhoto } from '../../lib/types';
import { cn, formatDate, sanitizeFileName } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

interface DailyLogWithPhotos extends DailyLog {
  daily_log_photos?: DailyLogPhoto[];
}

interface PhotoUploadItem {
  file: File | null;
  description: string;
  previewUrl: string | null;
  id: string;
  existingId?: string;
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
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'error' | 'success' | 'warning' }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // Multi-photo state
  const [photosToUpload, setPhotosToUpload] = useState<PhotoUploadItem[]>([
    { file: null, description: '', previewUrl: null, id: Math.random().toString(36).slice(2) }
  ]);

  const handleAddPhotoSlot = () => {
    setPhotosToUpload(prev => [
      ...prev, 
      { file: null, description: '', previewUrl: null, id: Math.random().toString(36).slice(2) }
    ]);
  };

  const handleUpdatePhoto = (index: number, updates: Partial<PhotoUploadItem>) => {
    setPhotosToUpload(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleRemovePhotoSlot = (index: number) => {
    if (photosToUpload.length > 1) {
      setPhotosToUpload(prev => prev.filter((_, i) => i !== index));
    } else {
      setPhotosToUpload([{ file: null, description: '', previewUrl: null, id: Math.random().toString(36).slice(2) }]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpdatePhoto(index, {
        file,
        previewUrl: URL.createObjectURL(file),
        description: formData.activities ? formData.activities.slice(0, 50) : file.name
      });
    }
  };

  const handleSave = async () => {
    try {
      setUploading(true);
      // Sanitize formData to only include valid daily_logs columns
      const { daily_log_photos, ...cleanFormData } = formData;

      const { data: savedLog, error: logError } = await supabase
        .from('daily_logs')
        .upsert({
          ...cleanFormData,
          project_id: projectId,
          id: editingLog?.id || undefined
        })
        .select();

      if (logError) {
        console.error('Error saving daily log:', logError);
        throw new Error('Falha ao salvar os dados básicos do diário.');
      }

      const logId = savedLog?.[0]?.id;

      if (logId) {
        // 1. Handle Deletions: find photos that were in editingLog but are not in photosToUpload
        if (editingLog?.daily_log_photos) {
          const currentExistingIds = photosToUpload
            .filter(p => p.existingId)
            .map(p => p.existingId);
          
          const photosToDelete = editingLog.daily_log_photos.filter(
            p => !currentExistingIds.includes(p.id)
          );

          if (photosToDelete.length > 0) {
            const { error: deleteError } = await supabase
              .from('daily_log_photos')
              .delete()
              .in('id', photosToDelete.map(p => p.id));
            
            if (deleteError) console.error('Error deleting photos:', deleteError);
          }
        }

        // 2. Handle Uploads and Updates
        for (const item of photosToUpload) {
          if (item.file) {
            // New photo: upload and insert
            const sanitizedName = sanitizeFileName(item.file.name);
            const fileName = `${projectId}/${logId}/${Date.now()}-${sanitizedName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('daily_logs')
              .upload(fileName, item.file);

            if (uploadError) {
              console.error('Error uploading photo:', uploadError);
              continue;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('daily_logs')
              .getPublicUrl(fileName);

            const { error: photoLogError } = await supabase.from('daily_log_photos').insert({
              log_id: logId,
              image_url: publicUrl,
              description: item.description || item.file.name
            });

            if (photoLogError) console.error('Error linking photo to log:', photoLogError);
          } else if (item.existingId) {
            // Existing photo: update description if it might have changed
            const { error: updateError } = await supabase
              .from('daily_log_photos')
              .update({ description: item.description })
              .eq('id', item.existingId);
            
            if (updateError) console.error('Error updating photo description:', updateError);
          }
        }
      }

      setIsModalOpen(false);
      resetModal();
      onRefresh();
    } catch (err: any) {
      console.error('Detailed save error:', err);
      setAlertConfig({
        isOpen: true,
        title: 'Erro ao Salvar',
        message: err.message || 'Não foi possível salvar o Diário de Obra. Verifique sua conexão ou permissões.',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setEditingLog(null);
    setFormData({});
    setPhotosToUpload([{ file: null, description: '', previewUrl: null, id: Math.random().toString(36).slice(2) }]);
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

  const handleQuickPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, logId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${projectId}/${logId}/${Date.now()}-${sanitizedName}`;
      const { error: uploadError } = await supabase.storage
        .from('daily_logs')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Quick upload storage error:', uploadError);
        throw new Error('Falha ao enviar o arquivo para o servidor.');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('daily_logs')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('daily_log_photos').insert({
        log_id: logId,
        image_url: publicUrl,
        description: file.name
      });

      if (insertError) {
        console.error('Quick upload database error:', insertError);
        throw new Error('Falha ao registrar a foto no diário.');
      }

      onRefresh();
    } catch (err: any) {
      console.error('Detailed quick upload error:', err);
      setAlertConfig({
        isOpen: true,
        title: 'Erro no Upload',
        message: err.message || 'Falha ao enviar foto rápida.',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather?.toLowerCase()) {
      case 'ensolarado': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'nublado': return <Cloud className="h-4 w-4 text-slate-400" />;
      case 'chuva': return <Cloud className="h-4 w-4 text-blue-400" />;
      default: return <Sun className="h-4 w-4 text-yellow-500" />;
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
            <div key={log.id} className="bg-[#1e293b]/50 p-6 rounded-xl border border-white/5 group relative shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h4 className="text-lg font-bold text-white capitalize">{formatDate(log.date, { weekday: 'long', day: '2-digit', month: 'long' })}</h4>
                   <div className="flex gap-4 text-sm mt-1">
                      <span className="flex items-center gap-1.5 text-slate-400"><Sun className="h-4 w-4" /> {log.weather}</span>
                      <span className="flex items-center gap-1.5 text-slate-400"><HardHat className="h-4 w-4" /> {log.workers} trabalhadores</span>
                   </div>
                </div>
                {!readOnly && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { 
                      const { daily_log_photos, ...logData } = log;
                      setEditingLog(log); 
                      setFormData(logData); 
                      
                      // Initialize photos to upload with existing photos if any
                      if (daily_log_photos && daily_log_photos.length > 0) {
                        setPhotosToUpload(daily_log_photos.map(p => ({
                          file: null,
                          description: p.description || '',
                          previewUrl: p.image_url,
                          id: p.id,
                          existingId: p.id
                        })));
                      } else {
                        setPhotosToUpload([{ file: null, description: '', previewUrl: null, id: Math.random().toString(36).slice(2) }]);
                      }
                      
                      setIsModalOpen(true); 
                    }} className="p-1 hover:text-white transition-colors"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(log.id)} className="p-1 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Atividades</p>
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{log.activities}</p>
                </div>
                {log.restrictions && (
                  <div className="mt-4 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                    <p className="text-[10px] font-bold text-red-300 uppercase mb-1">Restrições / Ocorrências</p>
                    <p className="text-red-300/80 text-xs">{log.restrictions}</p>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Evidências Fotográficas</p>
                <div className="flex flex-wrap gap-4">
                  {log.daily_log_photos?.map(photo => (
                    <div key={photo.id} className="group/photo relative w-40 aspect-square rounded-xl overflow-hidden border border-white/10 shadow-lg transition-transform hover:scale-105">
                        <img src={photo.image_url} alt={photo.description} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 p-2 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col justify-end">
                          <p className="text-[10px] text-white font-medium line-clamp-2">{photo.description}</p>
                        </div>
                    </div>
                  ))}
                  {!readOnly && (
                    <label className="w-40 aspect-square flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-[#4170FF]/50 hover:bg-[#4170FF]/5 transition-all text-slate-500 hover:text-[#4170FF]">
                        <Camera className="h-6 w-6" />
                        <span className="text-[10px] mt-1 font-bold">Adicionar Foto</span>
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
          <div className="absolute inset-0 bg-[#0B0F19]/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#181C21] rounded-[32px] shadow-2xl border border-white/5 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 pb-6 flex items-center justify-between border-b border-white/5">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Registro de Diário de Obra</h3>
                <p className="text-sm text-slate-400">Preencha os detalhes do dia e anexe evidências.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-8 py-8 space-y-8 overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data</label>
                  <input type="date" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-[#13171f] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Clima</label>
                  <div className="relative">
                    <select value={formData.weather || 'Ensolarado'} onChange={e => setFormData({ ...formData, weather: e.target.value })} className="w-full bg-[#13171f] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none appearance-none transition-all">
                      {['Ensolarado', 'Nublado', 'Chuvoso', 'Tempestade'].map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Efetivo</label>
                  <input type="number" placeholder="Trabalhadores" value={formData.workers || 0} onChange={e => setFormData({ ...formData, workers: Number(e.target.value) })} className="w-full bg-[#13171f] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none transition-all" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Atividades Realizadas</label>
                <textarea 
                  placeholder="Descreva o que foi feito no dia..." 
                  rows={4} 
                  value={formData.activities || ''} 
                  onChange={e => setFormData({ ...formData, activities: e.target.value })} 
                  className="w-full bg-[#13171f] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none resize-none transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-red-300 uppercase tracking-widest ml-1">Restrições / Ocorrências</label>
                <textarea 
                  placeholder="Houve algum problema ou impedimento? (opcional)" 
                  rows={2} 
                  value={formData.restrictions || ''} 
                  onChange={e => setFormData({ ...formData, restrictions: e.target.value })} 
                  className="w-full bg-[#13171f] border border-white/5 rounded-xl px-4 py-3 text-sm text-red-300/80 placeholder:text-red-900/30 focus:border-red-500/50 outline-none resize-none transition-all" 
                />
              </div>

              <div className="space-y-6 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Evidências Fotográficas</label>
                  <button onClick={handleAddPhotoSlot} className="text-[10px] font-black text-[#4170FF] uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors">
                    <PlusCircle className="h-4 w-4" /> Adicionar Mais
                  </button>
                </div>

                <div className="space-y-6">
                  {photosToUpload.map((item, index) => (
                    <div key={item.id} className="relative bg-black/20 p-6 rounded-3xl border border-white/5 group/slot animate-in slide-in-from-bottom-2 duration-300">
                      {photosToUpload.length > 1 && (
                        <button onClick={() => handleRemovePhotoSlot(index)} className="absolute -top-2 -right-2 h-8 w-8 bg-[#181C21] border border-white/10 rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors shadow-xl z-10">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-[1fr,1.5fr] gap-6">
                        <div className="space-y-2 flex flex-col h-full">
                          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest ml-1">Anexo {index + 1}</label>
                          <label className={cn(
                            "flex-1 min-h-[160px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative",
                            item.previewUrl ? "border-[#4170FF] bg-black/40" : "border-white/5 hover:border-[#4170FF]/50 bg-[#13171f]"
                          )}>
                            {item.previewUrl ? (
                              <img src={item.previewUrl} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                              <>
                                <UploadCloud className="h-6 w-6 text-slate-500 mb-2" />
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Selecionar Foto</span>
                              </>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, index)} />
                          </label>
                        </div>
                        <div className="space-y-2 flex flex-col h-full">
                          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest ml-1">Descrição do Anexo</label>
                          <textarea 
                            placeholder="Legenda para esta evidência..." 
                            value={item.description}
                            onChange={(e) => handleUpdatePhoto(index, { description: e.target.value })}
                            className="flex-1 min-h-[160px] w-full bg-[#13171f] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-[#4170FF] outline-none resize-none transition-all placeholder:text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 bg-[#13171f]/50 border-t border-white/5 flex items-center justify-end gap-6">
              <button onClick={() => setIsModalOpen(false)} className="text-[11px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
              <button 
                onClick={handleSave} 
                disabled={uploading || !formData.date || !formData.activities}
                className="px-12 py-4 bg-[#4170FF] text-white text-[11px] font-black rounded-2xl uppercase tracking-[2px] hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 flex items-center gap-3"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Salvando...
                  </>
                ) : 'Salvar Diário'}
              </button>
            </div>
          </div>
        </div>
      )}

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

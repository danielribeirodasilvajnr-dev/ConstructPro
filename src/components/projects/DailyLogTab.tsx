import React, { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Camera, Sun, Cloud, HardHat, X, Image as ImageIcon, UploadCloud, PlusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DailyLog, DailyLogPhoto } from '../../lib/types';
import { cn, formatDate, sanitizeFileName, compressImage } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';
import { ConfirmModal } from '../ui/ConfirmModal';

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
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const firstFile = files[0];

      // Revoke old preview if exists
      if (photosToUpload[index].previewUrl && !photosToUpload[index].existingId) {
        URL.revokeObjectURL(photosToUpload[index].previewUrl!);
      }

      let firstFileObj: any = firstFile;
      let firstPreviewUrl = URL.createObjectURL(firstFile);

      try {
        const compressedBlob = await compressImage(firstFile);
        firstFileObj = compressedBlob;
        firstPreviewUrl = URL.createObjectURL(compressedBlob);
      } catch (err) {
        console.error('Error compressing image:', err);
      }

      handleUpdatePhoto(index, {
        file: firstFileObj,
        previewUrl: firstPreviewUrl,
        description: photosToUpload[index].description || ''
      });

      // Handle remaining files by creating new slots
      if (files.length > 1) {
        const newSlots: PhotoUploadItem[] = [];
        for (let i = 1; i < files.length; i++) {
          const file = files[i];
          let fileObj: any = file;
          let previewUrl = URL.createObjectURL(file);

          try {
            const compressedBlob = await compressImage(file);
            fileObj = compressedBlob;
            previewUrl = URL.createObjectURL(compressedBlob);
          } catch (err) {
            console.error('Error compressing image:', err);
          }

          newSlots.push({
            file: fileObj,
            previewUrl,
            description: '',
            id: Math.random().toString(36).slice(2)
          });
        }

        setPhotosToUpload(prev => [...prev, ...newSlots]);
      }
    } catch (err) {
      console.error('Error handling multiple files:', err);
    } finally {
      e.target.value = '';
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

        // 2. Handle Uploads and Updates in parallel
        const uploadPromises = photosToUpload.map(async (item) => {
          if (item.file) {
            // New photo: upload and insert
            let sanitizedName = `foto_${Date.now()}.jpg`;
            try {
              const rawFileName = (item.file as any)?.name || '';
              sanitizedName = sanitizeFileName(rawFileName);
            } catch (e) {
              console.error('Inner sanitization error:', e);
            }

            const fileName = `${projectId}/${logId}/${Date.now()}-${sanitizedName}`;

            const { error: uploadError } = await supabase.storage
              .from('daily_logs')
              .upload(fileName, item.file);

            if (uploadError) {
              console.error('Error uploading photo:', uploadError);
              return;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('daily_logs')
              .getPublicUrl(fileName);

            const { error: photoLogError } = await supabase.from('daily_log_photos').insert({
              log_id: logId,
              image_url: publicUrl,
              description: item.description || (item.file as any)?.name || 'Sem descrição'
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
        });

        await Promise.all(uploadPromises);
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

  const confirmDelete = async () => {
    if (!deletingLogId) return;
    try {
      await supabase.from('daily_logs').delete().eq('id', deletingLogId);
      setDeletingLogId(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, logId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const compressedBlob = await compressImage(file);
        const sanitizedName = sanitizeFileName(file.name);
        const fileName = `${projectId}/${logId}/${Date.now()}-${sanitizedName}`;

        const { error: uploadError } = await supabase.storage
          .from('daily_logs')
          .upload(fileName, compressedBlob);

        if (uploadError) {
          console.error('Quick upload storage error:', uploadError);
          throw new Error(`Falha ao enviar o arquivo ${file.name}.`);
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
          throw new Error(`Falha ao registrar a foto ${file.name}.`);
        }
      });

      await Promise.all(uploadPromises);

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
      e.target.value = '';
    }
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather?.toLowerCase()) {
      case 'ensolarado': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'nublado': return <Cloud className="h-4 w-4 text-on-surface-variant" />;
      case 'chuva': return <Cloud className="h-4 w-4 text-blue-400" />;
      default: return <Sun className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-black text-on-surface">Diário de Obra (RDO)</h2>
          <p className="text-on-surface-variant mt-1">Registros diários do canteiro</p>
        </div>
        {!readOnly && (
          <button onClick={() => { resetModal(); setFormData({ date: new Date().toISOString().split('T')[0], weather: 'Ensolarado', workers: 0 }); setIsModalOpen(true); }} className="px-5 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-sm active:scale-95">
            <Plus className="h-4 w-4" /> Novo Registro
          </button>
        )}
      </div>

      <div className="space-y-6">
        {dailyLogs.length === 0 ? (
          <div className="bg-surface p-12 text-center rounded-2xl border border-outline text-on-surface-variant">
            Nenhum diário de obra registrado.
          </div>
        ) : (
          dailyLogs.map(log => (
            <div key={log.id} className="bg-[#1e293b]/50 p-6 rounded-xl border border-outline group relative shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-on-surface capitalize">{formatDate(log.date, { weekday: 'long', day: '2-digit', month: 'long' })}</h4>
                  <div className="flex gap-4 text-sm mt-1">
                    <span className="flex items-center gap-1.5 text-on-surface-variant"><Sun className="h-4 w-4" /> {log.weather}</span>
                    <span className="flex items-center gap-1.5 text-on-surface-variant"><HardHat className="h-4 w-4" /> {log.workers} trabalhadores</span>
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
                    }} className="p-1 hover:text-on-surface transition-colors"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => setDeletingLogId(log.id)} className="p-1 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-2">Atividades</p>
                <div className="bg-surface-container-highest/20 p-4 rounded-xl border border-outline">
                  <p className="text-on-surface-variant text-sm whitespace-pre-wrap">{log.activities}</p>
                </div>
                {log.restrictions && (
                  <div className="mt-4 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                    <p className="text-[10px] font-bold text-red-300 uppercase mb-1">Restrições / Ocorrências</p>
                    <p className="text-red-300/80 text-xs">{log.restrictions}</p>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-3">Evidências Fotográficas</p>
                <div className="flex flex-wrap gap-4">
                  {log.daily_log_photos?.map(photo => (
                    <div key={photo.id} className="group/photo relative w-40 aspect-square rounded-xl overflow-hidden border border-outline shadow-lg transition-transform hover:scale-105">
                      <img src={photo.image_url} alt={photo.description} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 p-2 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col justify-end">
                        <p className="text-[10px] text-on-surface font-medium line-clamp-2">{photo.description}</p>
                      </div>
                    </div>
                  ))}
                  {!readOnly && (
                    <label className="w-40 aspect-square flex flex-col items-center justify-center border-2 border-dashed border-outline rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-on-surface-variant hover:text-primary">
                      <Camera className="h-6 w-6" />
                      <span className="text-[10px] mt-1 font-bold">Adicionar Foto</span>
                      <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleQuickPhotoUpload(e, log.id)} disabled={uploading} />
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
          <div className="absolute inset-0 bg-surface-container-low/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-surface rounded-t-[32px] md:rounded-[32px] shadow-2xl border border-outline w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 flex flex-col h-[95vh] md:max-h-[90vh]">
            <div className="p-5 md:p-8 flex items-center justify-between border-b border-outline">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">Registro de Diário de Obra</h3>
                <p className="text-xs md:text-sm text-on-surface-variant">Preencha os detalhes do dia e anexe evidências.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-2 hover:bg-surface-container-low rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-5 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8 overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Data</label>
                  <input type="date" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Clima</label>
                  <div className="relative">
                    <select value={formData.weather || 'Ensolarado'} onChange={e => setFormData({ ...formData, weather: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none appearance-none transition-all">
                      {['Ensolarado', 'Nublado', 'Chuvoso', 'Tempestade'].map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Efetivo</label>
                  <input type="number" placeholder="Trabalhadores" value={formData.workers || ''} onChange={e => setFormData({ ...formData, workers: e.target.value === '' ? 0 : Number(e.target.value) })} className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Atividades Realizadas</label>
                <textarea
                  placeholder="Descreva o que foi feito no dia..."
                  rows={4}
                  value={formData.activities || ''}
                  onChange={e => setFormData({ ...formData, activities: e.target.value })}
                  className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none resize-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-red-300 uppercase tracking-widest ml-1">Restrições / Ocorrências</label>
                <textarea
                  placeholder="Houve algum problema ou impedimento? (opcional)"
                  rows={2}
                  value={formData.restrictions || ''}
                  onChange={e => setFormData({ ...formData, restrictions: e.target.value })}
                  className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-red-300/80 placeholder:text-red-900/30 focus:border-red-500/50 outline-none resize-none transition-all"
                />
              </div>

              <div className="space-y-6 pt-4 border-t border-outline">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Evidências Fotográficas</label>
                  <button onClick={handleAddPhotoSlot} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 hover:text-on-surface transition-colors">
                    <PlusCircle className="h-4 w-4" /> Adicionar Mais
                  </button>
                </div>

                <div className="space-y-6">
                  {photosToUpload.map((item, index) => (
                    <div key={item.id} className="relative bg-surface-container-highest/20 p-6 rounded-3xl border border-outline group/slot animate-in slide-in-from-bottom-2 duration-300">
                      {photosToUpload.length > 1 && (
                        <button onClick={() => handleRemovePhotoSlot(index)} className="absolute -top-2 -right-2 h-8 w-8 bg-surface border border-outline rounded-full flex items-center justify-center text-on-surface-variant hover:text-red-500 transition-colors shadow-xl z-10">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-[1fr,1.5fr] gap-6">
                        <div className="space-y-2 flex flex-col h-full">
                          <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Anexo {index + 1}</label>
                          <label className={cn(
                            "flex-1 min-h-[160px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative",
                            item.previewUrl ? "border-primary bg-black/40" : "border-outline hover:border-primary/50 bg-surface"
                          )}>
                            {item.previewUrl ? (
                              <img src={item.previewUrl} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                              <>
                                <UploadCloud className="h-6 w-6 text-on-surface-variant mb-2" />
                                <span className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">Selecionar Foto</span>
                              </>
                            )}
                            <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, index)} />
                          </label>
                        </div>
                        <div className="space-y-2 flex flex-col h-full">
                          <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Descrição do Anexo</label>
                          <textarea
                            placeholder="Legenda para esta evidência..."
                            value={item.description}
                            onChange={(e) => handleUpdatePhoto(index, { description: e.target.value })}
                            className="flex-1 min-h-[160px] w-full bg-surface border border-outline rounded-2xl px-5 py-4 text-sm text-on-surface focus:border-primary outline-none resize-none transition-all placeholder:text-on-surface-variant"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8 bg-surface/50 border-t border-outline flex flex-col md:flex-row items-center justify-end gap-4 md:gap-6">
              <button onClick={() => setIsModalOpen(false)} className="order-2 md:order-1 text-[11px] font-black text-on-surface-variant uppercase tracking-widest hover:text-on-surface transition-colors">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={uploading || !formData.date || !formData.activities}
                className="order-1 md:order-2 w-full md:w-auto px-12 py-4 bg-primary text-on-primary text-[11px] font-black rounded-2xl uppercase tracking-[2px] hover:opacity-90 transition-all shadow-2xl shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-outline-variant border-t-white rounded-full animate-spin"></div>
                    Salvando...
                  </>
                ) : 'Salvar Diário'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingLogId}
        onClose={() => setDeletingLogId(null)}
        onConfirm={confirmDelete}
        title="Excluir Diário de Obra?"
        message="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."
      />

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

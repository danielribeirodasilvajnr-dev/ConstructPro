import React, { useState } from 'react';
import {
  Check,
  Download,
  Plus,
  Camera,
  FileText,
  HardHat,
  MessageSquare,
  Calendar as CalendarIcon,
  Cloud,
  Wallet,
  Trash2,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { cn, formatCurrency, formatDate, sanitizeFileName } from '../lib/utils';
import { useProjects } from '../hooks/useProjects';
import { useProjectData } from '../hooks/useProjectData';
import { useAuth } from '../contexts/AuthContext';
import { AlertModal } from '../components/ui/AlertModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ProjectDocument } from '../lib/types';

interface ProprietorViewProps {
  selectedProjectId: string | null;
}

interface NewDocument {
  name: string;
  file: File | null;
}

// --- Proprietor View ---
export function ProprietorView({ selectedProjectId }: ProprietorViewProps) {
  const { user } = useAuth();
  const { projects } = useProjects();
  const project = projects.find(p => p.id === selectedProjectId);
  const { financialItems, budgetItems, scheduleItems, dailyLogs, documents, collaborators, refresh } = useProjectData(selectedProjectId);

  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDoc, setNewDoc] = useState<NewDocument>({ name: '', file: null });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<ProjectDocument | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'error' | 'success' | 'warning' }>({
    isOpen: false,
    title: '',
    message: ''
  });

  if (!selectedProjectId || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#1C232E] rounded-2xl border border-white/5 mx-auto max-w-4xl">
        <HardHat className="h-12 w-12 text-slate-700 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Acesso do Proprietário</h2>
        <p className="text-slate-500 text-center max-w-xs">Selecione uma obra na lista de projetos para visualizar o painel exclusivo do cliente.</p>
      </div>
    );
  }

  // Calculate real progress
  const physicalProgress = scheduleItems.length > 0
    ? Math.round(scheduleItems.reduce((acc, item) => acc + Number(item.progress || 0), 0) / scheduleItems.length)
    : 0;

  const totalInvested = financialItems.reduce((acc, item) => acc + Number(item.amount), 0);
  const totalBudget = budgetItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0);
  const financialProgress = totalBudget > 0 ? Math.round((totalInvested / totalBudget) * 100) : 0;
  
  const handleSaveDocument = async () => {
    if (!newDoc.name || !selectedProjectId || !newDoc.file) return;
    setIsSaving(true);
    try {
      // 1. Upload to Storage
      const fileExt = newDoc.file.name.split('.').pop();
      const fileName = `${selectedProjectId}/${Date.now()}_${sanitizeFileName(newDoc.file.name)}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(fileName, newDoc.file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-documents')
        .getPublicUrl(fileName);

      // 3. Save to Database
      const { error: dbError } = await supabase.from('project_documents').insert({
        project_id: selectedProjectId,
        name: newDoc.name,
        url: publicUrl,
        file_type: newDoc.file.type || 'application/pdf',
        file_size: newDoc.file.size || 0,
        uploaded_by: user?.id
      });

      if (dbError) throw dbError;

      setNewDoc({ name: '', file: null });
      setIsAddingDoc(false);
      refresh();

      setAlertConfig({
        isOpen: true,
        title: 'Sucesso',
        message: 'Documento enviado com sucesso!',
        type: 'success'
      });
    } catch (e: any) {
      console.error(e);
      setAlertConfig({
        isOpen: true,
        title: 'Erro',
        message: e.message || 'Não foi possível salvar o documento.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      const { error } = await supabase.from('project_documents').delete().eq('id', id);
      if (error) throw error;
      setDeletingDoc(null);
      refresh();
    } catch (e) {
      console.error(e);
      setAlertConfig({
        isOpen: true,
        title: 'Erro',
        message: 'Não foi possível excluir o documento.',
        type: 'error'
      });
    }
  };

  const handleDownloadDocument = (doc: ProjectDocument) => {
    if (!doc.url || doc.url === '#') {
      setAlertConfig({
        isOpen: true,
        title: 'Arquivo não disponível',
        message: 'Este documento é apenas um registro e não possui um arquivo anexo para download.',
        type: 'warning'
      });
      return;
    }
    window.open(doc.url, '_blank');
  };

  // Extract real photos from daily logs with enriched data
  const allPhotos = dailyLogs.flatMap(log =>
    (log.daily_log_photos || []).map((photo: any) => ({
      url: photo.image_url,
      desc: photo.description || log.activities || 'Foto da obra',
      date: log.date,
      workers: log.workers,
      weather: log.weather
    }))
  ).slice(0, 6); // Take latest 6

  // Find dynamic support contact (First Editor/Gestor with a phone number)
  const supportContact = collaborators.find(c => c.role === 'editor' && c.profile?.phone) || collaborators.find(c => c.role === 'editor');
  const supportPhone = supportContact?.profile?.phone || '5511977386241';
  const supportName = supportContact?.profile?.full_name || supportContact?.profile?.email || 'Daniel Ribeiro';
  const supportJob = supportContact?.profile?.job_title || 'Gerente de Obras';

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-24">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl p-8 bg-gradient-to-br from-primary to-primary-container text-white min-h-[280px] flex flex-col justify-end"
      >
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSXTwlkIJ2po2lzhvYHkYpNiu8Zk_DwOJw2l53rUcGp10lJqXyv0XuMhldOJFuT_NtQIW9AN7rreILGvKctD0nFmBs9O9tIE_S1AfcVcDAJgckrFbSgnPWL_4WVMGZnBgEFaG-dYNQYyFEIZTfOckeN2lus9T7k65MALihPkP0Av87k_Hh1GLgtrYJ1SQL0Z0K1oOilkUZwYJ2CtPBQZFCZHmE3_QNATf62qpzxfaIK7-ZbgapOTLDeApDVFmoG78IMVK9gV_iGA"
            alt="Construction"
            className="object-cover w-full h-full"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            Bem-vindo de volta, {project.client || 'Proprietário'}
          </h1>
          <div className="flex flex-wrap gap-6 mb-6 opacity-80">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Local:</span>
              <span className="text-sm font-bold text-white">{project.location || 'N/D'}</span>
            </div>
            <div className="flex items-center gap-2 border-l border-white/20 pl-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Área:</span>
              <span className="text-sm font-bold text-white">{project.area || '0'},00 m²</span>
            </div>
            <div className="flex items-center gap-2 border-l border-white/20 pl-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Prazo:</span>
              <span className="text-sm font-bold text-white">{project.deadline || 'N/D'}</span>
            </div>
          </div>

          <p className="text-slate-200 font-medium text-lg mb-6">Sua obra está <span className="text-white font-bold">{physicalProgress}%</span> concluída</p>
          <div className="w-full max-w-md bg-white/10 rounded-full h-3 mb-2">
            <div className="bg-white h-3 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-1000" style={{ width: `${physicalProgress}%` }}></div>
          </div>
          <div className="flex justify-between text-xs font-bold tracking-widest uppercase opacity-70">
            <span>Início</span>
            <span>Entrega</span>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Timeline - Last Daily Logs with Photos */}
          <div className="bg-[#1C232E] rounded-2xl p-8 border border-white/5 shadow-sm">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Progresso Diário
            </h3>
            <div className="relative space-y-12">
              {dailyLogs.length > 0 ? (
                <>
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-white/5"></div>
                  {dailyLogs.slice(0, 5).map((log, i) => (
                    <div key={log.id} className="relative flex gap-8 items-start group">
                      <div className="z-10 bg-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 ring-4 ring-[#1C232E] shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                        <Check className="text-white h-3 w-3" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h4 className="text-lg font-bold text-white capitalize">{formatDate(log.date, { day: '2-digit', month: 'long', weekday: 'long' })}</h4>
                            <div className="flex items-center gap-3 mt-1">
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Cloud className="h-3 w-3" /> {log.weather}</span>
                               <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5"><HardHat className="h-3 w-3" /> Equipe: {log.workers}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                           <p className="text-slate-300 text-sm leading-relaxed italic">"{log.activities || 'Nenhuma atividade registrada.'}"</p>
                        </div>

                        {/* Photos for this log */}
                        {log.daily_log_photos && log.daily_log_photos.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {log.daily_log_photos.map((photo: any) => (
                              <div key={photo.id} className="aspect-square rounded-xl overflow-hidden border border-white/10 group/photo cursor-pointer relative bg-black/20">
                                <img 
                                  src={photo.image_url} 
                                  alt="Daily" 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-110" 
                                />
                                {photo.description && (
                                  <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                                    <p className="text-[9px] text-white line-clamp-1">{photo.description}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-slate-500 italic text-sm">
                  Nenhum diário registrado nos últimos dias.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">

          {/* Documents */}
          <div className="bg-[#1C232E] rounded-xl p-6 border border-white/5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText className="text-primary h-5 w-5" />
                Documentação
              </h3>
              <button 
                onClick={() => setIsAddingDoc(true)}
                className="p-1.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                title="Cadastrar Documento"
              >
                <Plus className="h-4 w-4 text-primary" />
              </button>
            </div>
            
            <div className="space-y-3">
              {documents.length > 0 ? (
                documents.map((doc, i) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg group cursor-pointer hover:bg-slate-800 transition-colors border border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800 rounded-lg">
                        <FileText className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">{doc.name}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">
                          {doc.file_type?.split('/')[1] || 'DOC'} • {(Number(doc.file_size) / 1024 / 1024).toFixed(1)}MB
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeletingDoc(doc); }}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDownloadDocument(doc); }}
                        className="p-1.5 hover:bg-primary/10 rounded-lg text-slate-500 hover:text-primary transition-colors"
                        title="Baixar Arquivo"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 px-4 bg-slate-900/20 rounded-xl border border-dashed border-slate-800/50">
                  <p className="text-xs text-slate-500 italic">Nenhum documento cadastrado.</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="p-6 rounded-xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <HardHat className="text-primary h-6 w-6" />
            </div>
            <h4 className="font-bold">Dúvidas?</h4>
            <p className="text-sm text-on-surface-variant mt-1 mb-4">
              Fale com {supportName}{supportJob ? ` - ${supportJob}` : ''}
            </p>
            <a 
              href={`https://wa.me/${supportPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${supportName.split(' ')[0]}, sou o proprietário da obra ${project.name} e tenho uma dúvida.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <MessageSquare className="h-4 w-4" />
              Abrir Chamado
            </a>
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      {isAddingDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1C232E] border border-slate-800 rounded-[28px] w-full max-w-md shadow-2xl p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Cadastrar Documento
              </h3>
              <button 
                onClick={() => setIsAddingDoc(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nome do Documento</label>
                <input 
                  type="text"
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                  placeholder="Ex: Projeto_Arquitetonico_Rev01.pdf"
                  className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Anexo (Arquivo)</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={(e) => setNewDoc({ ...newDoc, file: e.target.files?.[0] || null })}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="bg-[#1C232E] border border-slate-800 border-dashed rounded-xl px-4 py-6 text-center group-hover:border-primary transition-colors">
                    <Cloud className="h-6 w-6 text-slate-500 mx-auto mb-2 group-hover:text-primary" />
                    <p className="text-xs text-slate-400 font-medium">
                      {newDoc.file ? newDoc.file.name : 'Clique para selecionar ou arraste o arquivo'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setIsAddingDoc(false)}
                  className="flex-1 py-3.5 text-xs font-bold text-slate-400 hover:bg-white/5 rounded-xl transition-colors border border-transparent"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveDocument}
                  disabled={!newDoc.name || isSaving}
                  className="flex-1 bg-primary py-3.5 text-xs font-bold text-white rounded-xl transition-all hover:bg-slate-700 shadow-lg shadow-black/20 disabled:opacity-50 disabled:scale-100 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Confirmar</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        onConfirm={() => deletingDoc && handleDeleteDocument(deletingDoc.id)}
        title="Excluir Documento?"
        message={`Tem certeza que deseja excluir o documento "${deletingDoc?.name}"? Esta ação não pode ser desfeita.`}
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

import React, { useState } from 'react';
import {
  Check,
  ChevronLeft,
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
  X,
  Search,
  Ruler
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
  onBack?: () => void;
}

interface NewDocument {
  name: string;
  file: File | null;
}

// --- Proprietor View ---
export function ProprietorView({ selectedProjectId, onBack }: ProprietorViewProps) {
  const { user } = useAuth();
  const { projects } = useProjects();
  const project = projects.find(p => p.id === selectedProjectId);
  const { financialItems, budgetItems, scheduleItems, dailyLogs, documents, collaborators, refresh } = useProjectData(selectedProjectId);

  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [newDoc, setNewDoc] = useState<NewDocument>({ name: '', file: null });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<ProjectDocument | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'error' | 'success' | 'warning' }>({
    isOpen: false,
    title: '',
    message: ''
  });
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  if (!selectedProjectId || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-2xl border border-outline mx-auto max-w-4xl">
        <HardHat className="h-12 w-12 text-on-surface-variant mb-4" />
        <h2 className="text-xl font-bold text-on-surface mb-2">Acesso do Proprietário</h2>
        <p className="text-on-surface-variant text-center max-w-xs">Selecione uma obra na lista de projetos para visualizar o painel exclusivo do cliente.</p>
      </div>
    );
  }

  // Calculate real progress based on budget items medições
  const calculatePhysicalProgress = () => {
    if (!budgetItems || budgetItems.length === 0) {
      return scheduleItems.length > 0
        ? Math.round(scheduleItems.reduce((acc, item) => acc + Number(item.progress || 0), 0) / scheduleItems.length)
        : 0;
    }
    
    const totalValue = budgetItems.reduce((acc, item) => acc + (item.quantity * item.unit_cost), 0);
    if (totalValue === 0) return 0;

    const executedValue = budgetItems.reduce((acc, item) => {
      const progress = item.quantity > 0 ? (item.executed_quantity / item.quantity) : 0;
      const cappedProgress = Math.min(progress, 1);
      return acc + (cappedProgress * item.quantity * item.unit_cost);
    }, 0);

    return Math.round((executedValue / totalValue) * 100);
  };

  const physicalProgress = calculatePhysicalProgress();

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
  );

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
        className="relative overflow-hidden rounded-xl p-8 bg-gradient-to-br from-primary to-primary-container text-on-surface min-h-[280px] flex flex-col justify-end"
      >
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-6 left-6 z-20 p-2 bg-surface-container-highest/20 hover:bg-black/40 rounded-full transition-colors border border-outline"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
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
              <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Local:</span>
              <span className="text-sm font-bold text-on-surface">{project.location || 'N/D'}</span>
            </div>
            <div className="flex items-center gap-2 border-l border-outline-variant pl-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Área:</span>
              <span className="text-sm font-bold text-on-surface">{project.area || '0'},00 m²</span>
            </div>
            <div className="flex items-center gap-2 border-l border-outline-variant pl-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Prazo:</span>
              <span className="text-sm font-bold text-on-surface">{project.deadline || 'N/D'}</span>
            </div>
          </div>

          <p className="text-on-surface font-medium text-lg mb-6">Sua obra está <span className="text-on-surface font-bold">{physicalProgress}%</span> concluída</p>
          <div className="w-full max-w-md bg-surface-container-high rounded-full h-3 mb-2">
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
          {/* Gallery Trigger Card */}
          {allPhotos.length > 0 && (
            <div className="bg-surface rounded-2xl p-6 border border-outline shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-container-low transition-all" onClick={() => setIsGalleryOpen(true)}>
              <div className="flex items-center gap-6">
                <div className="flex -space-x-4 overflow-hidden p-1">
                  {allPhotos.slice(0, 3).map((photo, i) => (
                    <div key={i} className="inline-block h-14 w-14 rounded-xl ring-4 ring-[#1C232E] overflow-hidden">
                      <img src={photo.url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                  {allPhotos.length > 3 && (
                    <div className="flex items-center justify-center h-14 w-14 rounded-xl ring-4 ring-[#1C232E] bg-surface-container-high text-xs font-bold text-on-surface">
                      +{allPhotos.length - 3}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Galeria de Fotos</h3>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-0.5">Veja a evolução completa da obra</p>
                </div>
              </div>
              <button className="px-5 py-2.5 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest rounded-xl group-hover:bg-primary group-hover:text-on-surface transition-all">
                Ver Galeria
              </button>
            </div>
          )}

          {/* Timeline - Last Daily Logs with Photos */}
          <div className="bg-surface rounded-2xl p-8 border border-outline shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Progresso Diário
              </h3>
              <button
                onClick={() => setShowFullHistory(true)}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
              >
                Ver Tudo
              </button>
            </div>
            <div className="relative space-y-12">
              {dailyLogs.length > 0 ? (
                <>
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-surface-container-low"></div>
                  {dailyLogs.slice(0, 5).map((log, i) => (
                    <div key={log.id} className="relative flex gap-8 items-start group">
                      <div className="z-10 bg-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 ring-4 ring-[#1C232E] shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                        <Check className="text-on-surface h-3 w-3" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h4 className="text-lg font-bold text-on-surface capitalize">{formatDate(log.date, { day: '2-digit', month: 'long', weekday: 'long' })}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5"><Cloud className="h-3 w-3" /> {log.weather}</span>
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5"><HardHat className="h-3 w-3" /> Equipe: {log.workers}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-surface-container-low p-4 rounded-xl border border-outline">
                          <p className="text-on-surface-variant text-sm leading-relaxed italic">"{log.activities || 'Nenhuma atividade registrada.'}"</p>
                        </div>

                        {/* Photos for this log */}
                        {log.daily_log_photos && log.daily_log_photos.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {log.daily_log_photos.map((photo: any) => (
                              <div key={photo.id} className="aspect-square rounded-xl overflow-hidden border border-outline group/photo cursor-pointer relative bg-surface-container-highest/20">
                                <img
                                  src={photo.image_url}
                                  alt="Daily"
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-110"
                                />
                                {photo.description && (
                                  <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                                    <p className="text-[9px] text-on-surface line-clamp-1">{photo.description}</p>
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
                <div className="text-center py-8 text-on-surface-variant italic text-sm">
                  Nenhum diário registrado nos últimos dias.
                </div>
              )}
            </div>
          </div>


        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">

          {/* Documents */}
          <div className="bg-surface rounded-xl p-6 border border-outline shadow-sm">
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
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg group cursor-pointer hover:bg-surface-container-high transition-colors border border-outline/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-surface-container-high rounded-lg">
                        <FileText className="h-4 w-4 text-on-surface-variant" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-on-surface block">{doc.name}</span>
                        <span className="text-[9px] text-on-surface-variant font-bold uppercase">
                          {doc.file_type?.split('/')[1] || 'DOC'} • {(Number(doc.file_size) / 1024 / 1024).toFixed(1)}MB
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingDoc(doc); }}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-on-surface-variant hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadDocument(doc); }}
                        className="p-1.5 hover:bg-primary/10 rounded-lg text-on-surface-variant hover:text-primary transition-colors"
                        title="Baixar Arquivo"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 px-4 bg-surface/20 rounded-xl border border-dashed border-outline/50">
                  <p className="text-xs text-on-surface-variant italic">Nenhum documento cadastrado.</p>
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
            className="bg-surface border border-outline rounded-[28px] w-full max-w-md shadow-2xl p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Cadastrar Documento
              </h3>
              <button
                onClick={() => setIsAddingDoc(false)}
                className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Nome do Documento</label>
                <input
                  type="text"
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                  placeholder="Ex: Projeto_Arquitetonico_Rev01.pdf"
                  className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Anexo (Arquivo)</label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={(e) => setNewDoc({ ...newDoc, file: e.target.files?.[0] || null })}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="bg-surface border border-outline border-dashed rounded-xl px-4 py-6 text-center group-hover:border-primary transition-colors">
                    <Cloud className="h-6 w-6 text-on-surface-variant mx-auto mb-2 group-hover:text-primary" />
                    <p className="text-xs text-on-surface-variant font-medium">
                      {newDoc.file ? newDoc.file.name : 'Clique para selecionar ou arraste o arquivo'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setIsAddingDoc(false)}
                  className="flex-1 py-3.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors border border-transparent"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveDocument}
                  disabled={!newDoc.name || isSaving}
                  className="flex-1 bg-primary py-3.5 text-xs font-bold text-on-surface rounded-xl transition-all hover:opacity-90 shadow-lg shadow-sm disabled:opacity-50 disabled:scale-100 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="h-4 w-4 border-2 border-outline-variant border-t-white rounded-full animate-spin" />
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

      {/* Full History Modal */}
      {showFullHistory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface w-full h-full md:h-[90vh] md:max-w-4xl md:rounded-[32px] border border-outline shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-6 md:p-8 border-b border-outline flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-primary/10 to-transparent shrink-0">
              <div className="flex items-center justify-between w-full md:w-auto">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-on-surface flex items-center gap-3">
                    <Camera className="h-6 w-6 text-primary" />
                    Histórico Completo
                  </h3>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">Trajetória da Obra: {project.name}</p>
                </div>
                <button
                  onClick={() => setShowFullHistory(false)}
                  className="p-3 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant hover:text-on-surface md:hidden"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Date Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">De:</span>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                    className="bg-surface-container-high border border-outline rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Até:</span>
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                    className="bg-surface-container-high border border-outline rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <button
                  onClick={() => setDateFilter({ start: '', end: '' })}
                  className="mt-5 p-2.5 text-on-surface-variant hover:text-on-surface transition-colors"
                  title="Limpar filtros"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowFullHistory(false)}
                  className="hidden md:flex p-3 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant hover:text-on-surface ml-4"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar">
              <div className="relative space-y-16 max-w-2xl mx-auto">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-surface-container-low"></div>
                {dailyLogs
                  .filter(log => {
                    if (!dateFilter.start && !dateFilter.end) return true;
                    const logDateStr = log.date.split('T')[0];
                    if (dateFilter.start && logDateStr < dateFilter.start) return false;
                    if (dateFilter.end && logDateStr > dateFilter.end) return false;
                    return true;
                  })
                  .map((log, i) => (
                    <div key={log.id} className="relative flex gap-8 items-start group">
                      <div className="z-10 bg-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 ring-4 ring-[#1C232E] shadow-lg shadow-primary/20 transition-transform">
                        <Check className="text-on-surface h-3 w-3" />
                      </div>
                      <div className="flex-1 space-y-6">
                        <div className="flex flex-col gap-2">
                          <h4 className="text-xl font-black text-on-surface capitalize">{formatDate(log.date, { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' })}</h4>
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest bg-surface-container-low px-3 py-1 rounded-full flex items-center gap-1.5"><Cloud className="h-3 w-3" /> {log.weather}</span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5"><HardHat className="h-3 w-3" /> Equipe: {log.workers}</span>
                          </div>
                        </div>

                        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline shadow-inner">
                          <p className="text-on-surface text-base leading-relaxed">"{log.activities || 'Nenhuma atividade registrada.'}"</p>
                        </div>

                        {log.daily_log_photos && log.daily_log_photos.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {log.daily_log_photos.map((photo: any) => (
                              <div key={photo.id} className="aspect-video rounded-2xl overflow-hidden border border-outline relative group/photo cursor-pointer bg-black/40">
                                <img
                                  src={photo.image_url}
                                  alt="Daily"
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110"
                                />
                                {photo.description && (
                                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-xs text-on-surface font-medium">{photo.description}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-6 border-t border-outline bg-surface/20 text-center shrink-0">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[3px]">360Pro • Relatório de Progresso</p>
            </div>
          </motion.div>
        </div>
      )}
      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-6 bg-black/90 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface w-full h-full md:rounded-[40px] border border-outline shadow-2xl flex flex-col overflow-hidden max-w-6xl"
          >
            <div className="p-8 border-b border-outline flex items-center justify-between bg-gradient-to-r from-primary/20 to-transparent shrink-0">
              <div>
                <h3 className="text-2xl font-black text-on-surface flex items-center gap-3">
                  <Camera className="h-6 w-6 text-primary" />
                  Galeria de Fotos
                </h3>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">{allPhotos.length} fotos registradas</p>
              </div>
              <button
                onClick={() => setIsGalleryOpen(false)}
                className="p-4 hover:bg-surface-container-low rounded-2xl transition-colors text-on-surface-variant hover:text-on-surface"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {allPhotos.map((photo, i) => (
                  <div key={i} className="group flex flex-col gap-3">
                    <div
                      onClick={() => setSelectedPhoto(photo)}
                      className="aspect-square rounded-3xl overflow-hidden border border-outline bg-black/40 relative cursor-pointer"
                    >
                      <img
                        src={photo.url}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md rounded-full p-4 border border-outline transform scale-90 group-hover:scale-100 transition-transform">
                          <Search className="h-6 w-6 text-on-surface" />
                        </div>
                      </div>
                      <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-on-surface uppercase tracking-widest border border-outline">
                        {formatDate(photo.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-2xl"
          onClick={() => setSelectedPhoto(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative max-w-5xl w-full flex flex-col gap-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute -top-16 right-0 flex items-center gap-4">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-3 bg-surface-container-high hover:bg-white/20 rounded-2xl text-on-surface transition-all border border-outline"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="rounded-[32px] overflow-hidden border border-outline shadow-2xl bg-black/40 aspect-[4/3] md:aspect-video flex items-center justify-center">
              <img
                src={selectedPhoto.url}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <div className="bg-surface-container-low backdrop-blur-md border border-outline rounded-3xl p-6 md:p-8">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-xs text-primary font-black uppercase tracking-[3px] mb-2">Registro de Obra</p>
                  <h4 className="text-xl font-bold text-on-surface leading-tight">{selectedPhoto.desc}</h4>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest mb-1">Data da Foto</p>
                  <p className="text-sm font-bold text-on-surface">{formatDate(selectedPhoto.date, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

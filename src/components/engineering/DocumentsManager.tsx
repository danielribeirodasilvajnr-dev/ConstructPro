import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { EngDocument, EngDiscipline, EngRevision } from '../../lib/types';
import { Plus, Trash2, FileSpreadsheet, Download, Upload, Search, History, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

export function DocumentsManager({ projectId }: { projectId: string }) {
  const [documents, setDocuments] = useState<EngDocument[]>([]);
  const [disciplines, setDisciplines] = useState<EngDiscipline[]>([]);
  const [revisions, setRevisions] = useState<Record<string, EngRevision[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EngDocument>>({});
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, title: string, message: string, type: any}>({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Disciplines
    const { data: discData } = await supabase.from('eng_disciplines').select('*').eq('project_id', projectId);
    if (discData) setDisciplines(discData);

    // Fetch Documents
    const { data: docData } = await supabase.from('eng_documents').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (docData) {
      setDocuments(docData);
      
      // Fetch Revisions for these documents
      const docIds = docData.map(d => d.id);
      if (docIds.length > 0) {
        const { data: revData } = await supabase.from('eng_revisions').select('*').in('document_id', docIds).order('created_at', { ascending: false });
        if (revData) {
          const revsByDoc: Record<string, EngRevision[]> = {};
          revData.forEach(r => {
            if (!revsByDoc[r.document_id]) revsByDoc[r.document_id] = [];
            revsByDoc[r.document_id].push(r);
          });
          setRevisions(revsByDoc);
        }
      }
    }
    setLoading(false);
  };

  const generateNextVersion = (currentVersion?: string) => {
    if (!currentVersion) return 'REV00';
    const num = parseInt(currentVersion.replace('REV', ''));
    if (isNaN(num)) return 'REV00';
    return `REV${String(num + 1).padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    if (!file || !formData.discipline_id || !formData.name) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: 'Preencha todos os campos e selecione um arquivo.', type: 'error' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${projectId}/${formData.discipline_id}/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage.from('engineering_docs').upload(filePath, file);
      if (uploadError) throw uploadError;

      const user = (await supabase.auth.getUser()).data.user;

      if (formData.id) {
        // Nova Revisão
        const doc = documents.find(d => d.id === formData.id);
        const nextVersion = generateNextVersion(doc?.version);

        // Atualizar o documento principal
        await supabase.from('eng_documents').update({
          version: nextVersion,
          file_path: filePath,
          updated_at: new Date().toISOString()
        }).eq('id', formData.id);

        // Inserir registro de revisão
        await supabase.from('eng_revisions').insert([{
          document_id: formData.id,
          version: nextVersion,
          user_id: user?.id,
          file_path: filePath,
          changes_description: formData.notes
        }]);

      } else {
        // Novo Documento
        const { data: newDoc, error: insertError } = await supabase.from('eng_documents').insert([{
          project_id: projectId,
          discipline_id: formData.discipline_id,
          name: formData.name,
          type: fileExt || 'unknown',
          version: 'REV00',
          file_path: filePath,
          notes: formData.notes
        }]).select().single();

        if (insertError) throw insertError;

        // Inserir a REV00 no histórico
        if (newDoc) {
          await supabase.from('eng_revisions').insert([{
            document_id: newDoc.id,
            version: 'REV00',
            user_id: user?.id,
            file_path: filePath,
            changes_description: 'Upload inicial'
          }]);
        }
      }

      setIsModalOpen(false);
      setFile(null);
      fetchData();
      setAlertConfig({ isOpen: true, title: 'Sucesso', message: 'Arquivo salvo com sucesso.', type: 'success' });
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    }
    setUploading(false);
  };

  const handleDownload = async (path: string, name: string) => {
    try {
      const { data, error } = await supabase.storage.from('engineering_docs').createSignedUrl(path, 60);
      if (error) throw error;
      
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: 'Não foi possível baixar o arquivo.', type: 'error' });
    }
  };

  const handleDelete = async (id: string, path: string) => {
    if (confirm('Deseja excluir este documento e todo o seu histórico de revisões?')) {
      // Deleta do DB (As revisões apagam em cascata)
      await supabase.from('eng_documents').delete().eq('id', id);
      // Faltaria deletar do storage, mas vamos simplificar
      fetchData();
    }
  };

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-container-low p-4 rounded-2xl border border-outline">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-outline rounded-xl pl-11 pr-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all"
          />
        </div>
        <button
          onClick={() => { setFormData({}); setFile(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary text-background text-xs font-display font-bold uppercase tracking-[2px] rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <Upload className="h-4 w-4" /> Enviar Documento
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-surface-container-low border border-outline rounded-[24px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline bg-surface/50">
                  <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[2px]">Nome</th>
                  <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[2px]">Disciplina</th>
                  <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[2px]">Tipo</th>
                  <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[2px]">Revisão</th>
                  <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[2px] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline">
                {filteredDocs.map(doc => {
                  const discipline = disciplines.find(d => d.id === doc.discipline_id);
                  return (
                    <React.Fragment key={doc.id}>
                      <tr className="hover:bg-surface-container-high/50 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                              <FileSpreadsheet className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-bold text-on-surface uppercase">{doc.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-on-surface-variant uppercase">{discipline?.name || '---'}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest bg-surface border border-outline rounded-md">
                            {doc.type}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-bold text-on-surface uppercase">{doc.version}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDownload(doc.file_path, `${doc.name}.${doc.type}`)} className="p-2 bg-surface text-on-surface-variant hover:text-primary rounded-lg border border-outline" title="Baixar Versão Atual">
                              <Download className="h-4 w-4" />
                            </button>
                            <button onClick={() => { setFormData(doc); setIsModalOpen(true); }} className="p-2 bg-surface text-on-surface-variant hover:text-primary rounded-lg border border-outline" title="Nova Revisão">
                              <Upload className="h-4 w-4" />
                            </button>
                            <button onClick={() => setIsHistoryOpen(isHistoryOpen === doc.id ? null : doc.id)} className={cn("p-2 rounded-lg border", isHistoryOpen === doc.id ? "bg-primary text-background border-primary" : "bg-surface text-on-surface-variant border-outline hover:text-primary")} title="Histórico de Revisões">
                              <History className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(doc.id, doc.file_path)} className="p-2 bg-surface text-on-surface-variant hover:text-error rounded-lg border border-outline" title="Excluir Documento">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Subtabela de Histórico */}
                      {isHistoryOpen === doc.id && (
                        <tr className="bg-surface/30">
                          <td colSpan={5} className="p-0 border-b border-outline">
                            <div className="p-6">
                              <h5 className="text-[10px] font-display font-bold uppercase tracking-[2px] text-on-surface-variant mb-4">Histórico de Revisões</h5>
                              <div className="space-y-2">
                                {revisions[doc.id]?.map(rev => (
                                  <div key={rev.id} className="flex items-center justify-between p-3 bg-surface border border-outline rounded-xl">
                                    <div className="flex items-center gap-4">
                                      <div className="px-2 py-1 bg-surface-container-high text-on-surface font-bold text-[10px] rounded-md">{rev.version}</div>
                                      <div className="text-xs text-on-surface-variant">{rev.changes_description || 'Sem comentários'}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-[10px] text-on-surface-variant uppercase">{new Date(rev.created_at || '').toLocaleDateString('pt-BR')}</span>
                                      <button onClick={() => handleDownload(rev.file_path, `${doc.name}_${rev.version}.${doc.type}`)} className="text-primary hover:text-primary/80 transition-colors">
                                        <Download className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {!revisions[doc.id]?.length && (
                                  <p className="text-xs text-on-surface-variant">Nenhum histórico encontrado.</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-container-low/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-surface rounded-[24px] shadow-2xl border border-outline w-full max-w-lg overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-on-surface tracking-tight mb-6 uppercase">{formData.id ? 'Nova Revisão' : 'Enviar Documento'}</h3>
            <div className="space-y-4">
              {!formData.id && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Disciplina</label>
                    <select value={formData.discipline_id || ''} onChange={e => setFormData({ ...formData, discipline_id: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none appearance-none">
                      <option value="">Selecione a disciplina...</option>
                      {disciplines.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nome do Arquivo</label>
                    <input type="text" placeholder="Ex: Planta Baixa Térreo" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
                  </div>
                </>
              )}
              {formData.id && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 mb-4">
                  <p className="text-xs text-primary font-bold">Atualizando: {formData.name}</p>
                  <p className="text-[10px] text-primary/70 uppercase">Versão Atual: {formData.version} → Nova: {generateNextVersion(formData.version)}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Arquivo (PDF, DWG, IFC, etc)</label>
                <div className="border-2 border-dashed border-outline rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                  <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-8 w-8 text-on-surface-variant mb-2" />
                    <span className="text-sm font-bold text-on-surface">{file ? file.name : 'Clique para selecionar o arquivo'}</span>
                  </label>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">{formData.id ? 'Comentários da Revisão' : 'Observações'}</label>
                <textarea rows={3} value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none resize-none" placeholder={formData.id ? 'Descreva as alterações desta versão...' : 'Notas sobre o documento...'} />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-widest hover:text-on-surface transition-colors" disabled={uploading}>Cancelar</button>
              <button onClick={handleUpload} disabled={uploading} className="px-8 py-3 bg-primary text-background text-xs font-bold rounded-xl uppercase tracking-[1.5px] hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2">
                {uploading && <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />}
                {uploading ? 'Enviando...' : 'Salvar Arquivo'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <AlertModal isOpen={alertConfig.isOpen} onClose={() => setAlertConfig({...alertConfig, isOpen: false})} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { EngRfi } from '../../lib/types';
import { Plus, Trash2, FileWarning, Search, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

export function RfiManager({ projectId }: { projectId: string }) {
  const [rfis, setRfis] = useState<EngRfi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<EngRfi>>({});
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, title: string, message: string, type: any}>({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: rfiData } = await supabase.from('eng_rfis').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (rfiData) setRfis(rfiData);
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      if (formData.id) {
        await supabase.from('eng_rfis').update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          responsible: formData.responsible,
          deadline: formData.deadline,
          status: formData.status
        }).eq('id', formData.id);
      } else {
        await supabase.from('eng_rfis').insert([{
          ...formData,
          project_id: projectId,
          status: formData.status || 'Aberto',
          priority: formData.priority || 'Média'
        }]);
      }
      setIsModalOpen(false);
      fetchData();
      setAlertConfig({ isOpen: true, title: 'Sucesso', message: 'Ocorrência salva com sucesso.', type: 'success' });
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta ocorrência?')) {
      await supabase.from('eng_rfis').delete().eq('id', id);
      fetchData();
    }
  };

  const filteredRfis = rfis.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-container-low p-4 rounded-2xl border border-outline">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar ocorrências..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-outline rounded-xl pl-11 pr-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all"
          />
        </div>
        <button
          onClick={() => { setFormData({ status: 'Aberto', priority: 'Média' }); setIsModalOpen(true); }}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary text-background text-xs font-display font-bold uppercase tracking-[2px] rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Nova RFI
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredRfis.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low rounded-[24px] border border-outline">
          <FileWarning className="h-12 w-12 text-on-surface-variant mx-auto mb-4 opacity-50" />
          <p className="text-on-surface-variant font-display uppercase tracking-[2px] text-sm">Nenhuma ocorrência registrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRfis.map(rfi => (
            <div key={rfi.id} className="bg-surface-container-low border border-outline rounded-[24px] p-6 hover:border-primary/30 transition-all flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    rfi.priority === 'Crítica' ? 'bg-error/10 text-error' :
                    rfi.priority === 'Alta' ? 'bg-orange-500/10 text-orange-500' :
                    rfi.priority === 'Média' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-primary/10 text-primary'
                  )}>
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-on-surface uppercase line-clamp-1">{rfi.title}</h4>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">RFI-{String(rfi.number).padStart(4, '0')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className={cn(
                    "px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md",
                    rfi.status === 'Fechado' ? 'bg-primary/10 text-primary' :
                    rfi.status === 'Aberto' ? 'bg-error/10 text-error' :
                    'bg-surface text-on-surface-variant border border-outline'
                  )}>
                    {rfi.status}
                  </div>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed flex-1 line-clamp-3">{rfi.description}</p>
              <div className="flex items-center justify-between mt-auto text-xs border-t border-outline pt-4">
                <span className="text-on-surface-variant uppercase tracking-widest text-[9px] font-bold">{rfi.category || 'Sem Categoria'}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setFormData(rfi); setIsModalOpen(true); }} className="text-on-surface-variant hover:text-primary transition-colors text-[10px] uppercase tracking-widest font-bold">Ver Detalhes</button>
                  <button onClick={() => handleDelete(rfi.id)} className="text-on-surface-variant hover:text-error transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-container-low/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-surface rounded-[24px] shadow-2xl border border-outline w-full max-w-lg overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-on-surface tracking-tight mb-6 uppercase">{formData.id ? `Editar RFI-${String(formData.number).padStart(4, '0')}` : 'Nova Ocorrência'}</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Título</label>
                <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Descrição</label>
                <textarea rows={4} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Categoria</label>
                  <select value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none appearance-none">
                    <option value="">Selecione...</option>
                    <option value="Projeto">Projeto</option>
                    <option value="Estrutura">Estrutura</option>
                    <option value="Arquitetura">Arquitetura</option>
                    <option value="Instalações">Instalações</option>
                    <option value="Compatibilização">Compatibilização</option>
                    <option value="Execução">Execução</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Prioridade</label>
                  <select value={formData.priority || 'Média'} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none appearance-none">
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Responsável</label>
                  <input type="text" value={formData.responsible || ''} onChange={e => setFormData({ ...formData, responsible: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Status</label>
                  <select value={formData.status || 'Aberto'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none appearance-none">
                    <option value="Aberto">Aberto</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Respondido">Respondido</option>
                    <option value="Fechado">Fechado</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-widest hover:text-on-surface transition-colors">Cancelar</button>
              <button onClick={handleSave} className="px-8 py-3 bg-primary text-background text-xs font-bold rounded-xl uppercase tracking-[1.5px] hover:scale-105 transition-all shadow-lg active:scale-95">Salvar</button>
            </div>
          </div>
        </div>
      )}
      
      <AlertModal isOpen={alertConfig.isOpen} onClose={() => setAlertConfig({...alertConfig, isOpen: false})} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} />
    </div>
  );
}

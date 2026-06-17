import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { EngClash, EngDiscipline } from '../../lib/types';
import { Plus, Trash2, SplitSquareHorizontal, Search, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

export function ClashDetectionTab({ projectId }: { projectId: string }) {
  const [clashes, setClashes] = useState<EngClash[]>([]);
  const [disciplines, setDisciplines] = useState<EngDiscipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<EngClash>>({});
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, title: string, message: string, type: any}>({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Disciplines
    const { data: discData } = await supabase.from('eng_disciplines').select('*').eq('project_id', projectId);
    if (discData) setDisciplines(discData);

    // Fetch Clashes
    const { data: clashData } = await supabase.from('eng_clashes').select('*, discipline1:discipline1_id(*), discipline2:discipline2_id(*)').eq('project_id', projectId).order('created_at', { ascending: false });
    if (clashData) setClashes(clashData);
    
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      if (formData.id) {
        await supabase.from('eng_clashes').update({
          discipline1_id: formData.discipline1_id,
          discipline2_id: formData.discipline2_id,
          description: formData.description,
          responsible: formData.responsible,
          deadline: formData.deadline,
          status: formData.status
        }).eq('id', formData.id);
      } else {
        await supabase.from('eng_clashes').insert([{
          ...formData,
          project_id: projectId,
          status: formData.status || 'Aberto'
        }]);
      }
      setIsModalOpen(false);
      fetchData();
      setAlertConfig({ isOpen: true, title: 'Sucesso', message: 'Compatibilização salva com sucesso.', type: 'success' });
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este conflito?')) {
      await supabase.from('eng_clashes').delete().eq('id', id);
      fetchData();
    }
  };

  const filteredClashes = clashes.filter(c => 
    c.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.responsible && c.responsible.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-container-low p-4 rounded-2xl border border-outline">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar conflitos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-outline rounded-xl pl-11 pr-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all"
          />
        </div>
        <button
          onClick={() => { setFormData({ status: 'Aberto' }); setIsModalOpen(true); }}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary text-background text-xs font-display font-bold uppercase tracking-[2px] rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Novo Conflito
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredClashes.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low rounded-[24px] border border-outline">
          <SplitSquareHorizontal className="h-12 w-12 text-on-surface-variant mx-auto mb-4 opacity-50" />
          <p className="text-on-surface-variant font-display uppercase tracking-[2px] text-sm">Nenhum conflito registrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClashes.map(clash => (
            <div key={clash.id} className="bg-surface-container-low border border-outline rounded-[24px] p-6 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-1 bg-surface border border-outline rounded-lg text-xs font-bold uppercase">{clash.discipline1?.name}</div>
                  <SplitSquareHorizontal className="h-4 w-4 text-error" />
                  <div className="px-3 py-1 bg-surface border border-outline rounded-lg text-xs font-bold uppercase">{clash.discipline2?.name}</div>
                </div>
                <div className="flex gap-2">
                  <div className={cn(
                    "px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md",
                    clash.status === 'Resolvido' ? 'bg-primary/10 text-primary' :
                    clash.status === 'Aberto' ? 'bg-error/10 text-error' :
                    clash.status === 'Em correção' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-surface text-on-surface-variant border border-outline'
                  )}>
                    {clash.status}
                  </div>
                  <button onClick={() => handleDelete(clash.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-on-surface mb-6 leading-relaxed">{clash.description}</p>
              <div className="flex items-center justify-between text-xs text-on-surface-variant border-t border-outline pt-4">
                <div className="flex items-center gap-2">
                  <span className="uppercase tracking-widest text-[9px] font-bold">Responsável:</span> {clash.responsible || '---'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="uppercase tracking-widest text-[9px] font-bold">Prazo:</span> {clash.deadline ? new Date(clash.deadline).toLocaleDateString('pt-BR') : '---'}
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
            <h3 className="text-xl font-bold text-on-surface tracking-tight mb-6 uppercase">{formData.id ? 'Editar Conflito' : 'Novo Conflito'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Disciplina 1</label>
                  <select value={formData.discipline1_id || ''} onChange={e => setFormData({ ...formData, discipline1_id: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none appearance-none">
                    <option value="">Selecione...</option>
                    {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Disciplina 2</label>
                  <select value={formData.discipline2_id || ''} onChange={e => setFormData({ ...formData, discipline2_id: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none appearance-none">
                    <option value="">Selecione...</option>
                    {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Descrição do Conflito</label>
                <textarea rows={4} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none resize-none" placeholder="Ex: Interferência entre viga estrutural V15 e tubulação de esgoto..." />
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
                    <option value="Em correção">Em correção</option>
                    <option value="Resolvido">Resolvido</option>
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

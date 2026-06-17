import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { EngDiscipline } from '../../lib/types';
import { Plus, Edit, Trash2, HardHat, Building2, User, Phone, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

export function DisciplinesTab({ projectId }: { projectId: string }) {
  const [disciplines, setDisciplines] = useState<EngDiscipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<EngDiscipline>>({});
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, title: string, message: string, type: any}>({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchDisciplines();
  }, [projectId]);

  const fetchDisciplines = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('eng_disciplines')
      .select('*')
      .eq('project_id', projectId)
      .order('name');
    
    if (!error && data) {
      setDisciplines(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      if (formData.id) {
        await supabase.from('eng_disciplines').update({
          name: formData.name,
          responsible_name: formData.responsible_name,
          company: formData.company,
          contact: formData.contact,
          start_date: formData.start_date,
          deadline: formData.deadline,
          status: formData.status
        }).eq('id', formData.id);
      } else {
        await supabase.from('eng_disciplines').insert([{
          ...formData,
          project_id: projectId,
          status: formData.status || 'Não iniciado'
        }]);
      }
      setIsModalOpen(false);
      fetchDisciplines();
      setAlertConfig({ isOpen: true, title: 'Sucesso', message: 'Disciplina salva com sucesso.', type: 'success' });
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta disciplina?')) {
      await supabase.from('eng_disciplines').delete().eq('id', id);
      fetchDisciplines();
    }
  };

  const filteredDisciplines = disciplines.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.responsible_name && d.responsible_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-container-low p-4 rounded-2xl border border-outline">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar disciplinas ou responsáveis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-outline rounded-xl pl-11 pr-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all"
          />
        </div>
        <button
          onClick={() => { setFormData({ status: 'Não iniciado' }); setIsModalOpen(true); }}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary text-background text-xs font-display font-bold uppercase tracking-[2px] rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Nova Disciplina
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredDisciplines.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low rounded-[24px] border border-outline">
          <HardHat className="h-12 w-12 text-on-surface-variant mx-auto mb-4 opacity-50" />
          <p className="text-on-surface-variant font-display uppercase tracking-[2px] text-sm">Nenhuma disciplina cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDisciplines.map(discipline => (
            <div key={discipline.id} className="bg-surface-container-low border border-outline rounded-[24px] p-6 hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <HardHat className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-on-surface uppercase">{discipline.name}</h4>
                    <div className={cn(
                      "text-[9px] font-display font-bold uppercase tracking-[2px] px-2 py-0.5 rounded-full inline-block mt-1",
                      discipline.status === 'Aprovado' ? 'bg-primary/10 text-primary' :
                      discipline.status === 'Em revisão' ? 'bg-orange-500/10 text-orange-500' :
                      discipline.status === 'Em análise' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-surface text-on-surface-variant border border-outline'
                    )}>
                      {discipline.status}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setFormData(discipline); setIsModalOpen(true); }} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(discipline.id)} className="p-2 text-on-surface-variant hover:text-error transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mt-6 pt-6 border-t border-outline">
                {discipline.responsible_name && (
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <User className="h-4 w-4" /> {discipline.responsible_name}
                  </div>
                )}
                {discipline.company && (
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <Building2 className="h-4 w-4" /> {discipline.company}
                  </div>
                )}
                {discipline.contact && (
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <Phone className="h-4 w-4" /> {discipline.contact}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-container-low/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-surface rounded-[24px] shadow-2xl border border-outline w-full max-w-lg overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-on-surface tracking-tight mb-6 uppercase">{formData.id ? 'Editar Disciplina' : 'Nova Disciplina'}</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nome da Disciplina</label>
                <input type="text" placeholder="Ex: Arquitetura, Estrutural..." value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Empresa</label>
                  <input type="text" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Responsável Técnico</label>
                  <input type="text" value={formData.responsible_name || ''} onChange={e => setFormData({ ...formData, responsible_name: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Contato</label>
                  <input type="text" value={formData.contact || ''} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Status</label>
                  <select value={formData.status || 'Não iniciado'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none appearance-none">
                    <option value="Não iniciado">Não iniciado</option>
                    <option value="Em desenvolvimento">Em desenvolvimento</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Em revisão">Em revisão</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Liberado para obra">Liberado para obra</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Data Início</label>
                  <input type="date" value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Previsão Entrega</label>
                  <input type="date" value={formData.deadline || ''} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
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

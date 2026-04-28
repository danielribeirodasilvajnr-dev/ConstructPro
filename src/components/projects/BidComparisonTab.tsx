import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, ChevronRight, Trophy, Briefcase, DollarSign, Clock, FileText, AlertCircle, Trash } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BidGroup, BidQuote } from '../../lib/types';
import { cn, formatCurrency } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

interface BidComparisonTabProps {
  projectId: string;
  bidGroups: BidGroup[];
  onRefresh: () => void;
  readOnly?: boolean;
}

export function BidComparisonTab({ projectId, bidGroups, onRefresh, readOnly }: BidComparisonTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<BidGroup | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<BidGroup>>({ title: '', description: '' });
  const [quoteFormData, setQuoteFormData] = useState<Partial<BidQuote>>({
    supplier_name: '',
    total_amount: 0,
    delivery_time: '',
    payment_terms: '',
    notes: ''
  });
  const [isAddingQuote, setIsAddingQuote] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' as any });

  const handleCreateGroup = async () => {
    if (!formData.title) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('bid_groups')
        .insert([{ project_id: projectId, title: formData.title, description: formData.description }]);

      if (error) throw error;
      setFormData({ title: '', description: '' });
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuote = async () => {
    if (!selectedGroup || !quoteFormData.supplier_name) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('bid_quotes')
        .insert([{
          bid_group_id: selectedGroup.id,
          supplier_name: quoteFormData.supplier_name,
          total_amount: quoteFormData.total_amount,
          delivery_time: quoteFormData.delivery_time,
          payment_terms: quoteFormData.payment_terms,
          notes: quoteFormData.notes
        }]);

      if (error) throw error;
      setQuoteFormData({ supplier_name: '', total_amount: 0, delivery_time: '', payment_terms: '', notes: '' });
      setIsAddingQuote(false);
      onRefresh();
      // Need to refresh selected group quotes too
      const { data } = await supabase.from('bid_groups').select('*, bid_quotes(*)').eq('id', selectedGroup.id).single();
      if (data) setSelectedGroup(data);
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectWinner = async (quote: BidQuote) => {
    if (readOnly) return;
    try {
      // Unselect others
      await supabase.from('bid_quotes').update({ is_selected: false }).eq('bid_group_id', quote.bid_group_id);
      // Select winner
      const { error } = await supabase.from('bid_quotes').update({ is_selected: true }).eq('id', quote.id);
      if (error) throw error;
      onRefresh();
      const { data } = await supabase.from('bid_groups').select('*, bid_quotes(*)').eq('id', quote.bid_group_id).single();
      if (data) setSelectedGroup(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Excluir este quadro de concorrência?')) return;
    try {
      await supabase.from('bid_groups').delete().eq('id', id);
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleDeleteQuote = async (id: string, groupId: string) => {
    if (!confirm('Excluir este orçamento?')) return;
    try {
      await supabase.from('bid_quotes').delete().eq('id', id);
      onRefresh();
      const { data } = await supabase.from('bid_groups').select('*, bid_quotes(*)').eq('id', groupId).single();
      if (data) setSelectedGroup(data);
    } catch (err) { console.error(err); }
  };

  if (selectedGroup) {
    const sortedQuotes = [...(selectedGroup.quotes || [])].sort((a, b) => a.total_amount - b.total_amount);
    const minAmount = sortedQuotes.length > 0 ? sortedQuotes[0].total_amount : 0;

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <button onClick={() => setSelectedGroup(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
          <Plus className="h-4 w-4 rotate-45" /> Voltar para lista
        </button>

        <div className="bg-[#1C232E] p-8 rounded-3xl border border-white/5 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-white">{selectedGroup.title}</h2>
              <p className="text-slate-500 mt-2">{selectedGroup.description || 'Sem descrição'}</p>
            </div>
            {!readOnly && (
              <button 
                onClick={() => setIsAddingQuote(true)}
                className="px-6 py-3 bg-blue-600 text-white text-xs font-black rounded-xl flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest"
              >
                <Plus className="h-4 w-4" /> Adicionar Orçamento
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedQuotes.map((quote) => (
            <div 
              key={quote.id} 
              className={cn(
                "bg-[#1C232E] rounded-[32px] border transition-all p-8 relative overflow-hidden group",
                quote.is_selected ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "border-white/5"
              )}
            >
              {quote.is_selected && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-[#1C232E] px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                  <Trophy className="h-3 w-3" /> Fornecedor Selecionado
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    <Briefcase className="h-3 w-3" /> Fornecedor
                  </div>
                  <h3 className="text-xl font-bold text-white">{quote.supplier_name}</h3>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    <DollarSign className="h-3 w-3" /> Valor Total
                  </div>
                  <div className="flex items-end gap-2">
                    <span className={cn(
                      "text-3xl font-black",
                      quote.total_amount === minAmount ? "text-emerald-500" : "text-white"
                    )}>
                      {formatCurrency(quote.total_amount)}
                    </span>
                    {quote.total_amount === minAmount && sortedQuotes.length > 1 && (
                      <span className="text-[10px] font-bold text-emerald-500/60 uppercase mb-1.5 tracking-tighter">Melhor Preço</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      <Clock className="h-3 w-3" /> Prazo
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{quote.delivery_time || '-'}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      <FileText className="h-3 w-3" /> Pagamento
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{quote.payment_terms || '-'}</p>
                  </div>
                </div>

                {quote.notes && (
                  <div className="bg-[#0b0f19] p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Observações</p>
                    <p className="text-xs text-slate-400 italic line-clamp-3">"{quote.notes}"</p>
                  </div>
                )}

                {!readOnly && (
                  <div className="pt-4 flex gap-3">
                    {!quote.is_selected && (
                      <button 
                        onClick={() => handleSelectWinner(quote)}
                        className="flex-1 py-3 bg-[#BCB5AC] text-[#1C232E] text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-white transition-all shadow-xl"
                      >
                        Selecionar Vencedor
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteQuote(quote.id, selectedGroup.id)}
                      className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {sortedQuotes.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-[#1C232E]/50 rounded-[40px] border border-dashed border-white/10">
              <AlertCircle className="h-10 w-10 text-slate-700 mb-4" />
              <p className="text-slate-500 font-medium">Nenhum orçamento adicionado para este grupo.</p>
              {!readOnly && (
                <button onClick={() => setIsAddingQuote(true)} className="mt-4 text-blue-400 font-bold hover:text-blue-300 transition-colors">Adicionar agora</button>
              )}
            </div>
          )}
        </div>

        {/* Add Quote Modal */}
        {isAddingQuote && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md" onClick={() => setIsAddingQuote(false)}></div>
            <div className="relative bg-[#1C232E] rounded-[32px] shadow-2xl border border-white/5 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 pb-4 flex items-center justify-between">
                <h3 className="text-xl font-black text-white">Adicionar Orçamento</h3>
                <button onClick={() => setIsAddingQuote(false)} className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-full">
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>
              <div className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fornecedor / Empresa</label>
                  <input type="text" value={quoteFormData.supplier_name} onChange={e => setQuoteFormData({...quoteFormData, supplier_name: e.target.value})} className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Valor Total</label>
                  <input type="number" value={quoteFormData.total_amount} onChange={e => setQuoteFormData({...quoteFormData, total_amount: parseFloat(e.target.value)})} className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Prazo de Entrega</label>
                    <input type="text" value={quoteFormData.delivery_time} onChange={e => setQuoteFormData({...quoteFormData, delivery_time: e.target.value})} className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" placeholder="ex: 15 dias" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cond. Pagamento</label>
                    <input type="text" value={quoteFormData.payment_terms} onChange={e => setQuoteFormData({...quoteFormData, payment_terms: e.target.value})} className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" placeholder="ex: 30/60 dias" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Observações Técnicas</label>
                  <textarea value={quoteFormData.notes} onChange={e => setQuoteFormData({...quoteFormData, notes: e.target.value})} className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none h-24 resize-none" />
                </div>
                <div className="pt-4 flex gap-4">
                  <button onClick={() => setIsAddingQuote(false)} className="flex-1 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
                  <button onClick={handleAddQuote} disabled={isSaving} className="flex-1 py-3 bg-blue-600 text-white text-xs font-black rounded-xl uppercase tracking-widest hover:bg-blue-500 transition-all">
                    {isSaving ? 'Salvando...' : 'Salvar Orçamento'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black text-white">Quadro de Concorrência</h2>
          <p className="text-slate-500 text-sm mt-1">Compare orçamentos de diferentes fornecedores para o mesmo serviço</p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-[#BCB5AC] text-[#1C232E] text-xs font-black rounded-xl flex items-center gap-2 hover:bg-white transition-all shadow-xl uppercase tracking-widest"
          >
            <Plus className="h-4 w-4" /> Novo Quadro
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bidGroups.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-[#1C232E] rounded-[40px] border border-dashed border-white/10">
            <Briefcase className="h-12 w-12 text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">Nenhum quadro de concorrência</h3>
            <p className="text-sm text-slate-500">Compare preços e prazos de fornecedores em um só lugar.</p>
          </div>
        ) : (
          bidGroups.map((group) => {
            const quoteCount = group.quotes?.length || 0;
            const selectedQuote = group.quotes?.find(q => q.is_selected);
            const minPrice = group.quotes?.length ? Math.min(...group.quotes.map(q => q.total_amount)) : 0;

            return (
              <div 
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className="bg-[#1C232E] rounded-[32px] border border-white/5 p-8 cursor-pointer hover:border-[#BCB5AC]/50 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-6">
                  <span className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                    selectedQuote ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                  )}>
                    {selectedQuote ? "Concluído" : "Em Cotação"}
                  </span>
                </div>

                <h3 className="text-xl font-black text-white mb-2 line-clamp-1 group-hover:text-[#BCB5AC] transition-colors">{group.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-6">{group.description || 'Compare orçamentos para este serviço.'}</p>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Orçamentos</p>
                    <p className="text-lg font-bold text-white">{quoteCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Melhor Preço</p>
                    <p className="text-lg font-bold text-emerald-500">{minPrice > 0 ? formatCurrency(minPrice) : '-'}</p>
                  </div>
                </div>

                {selectedQuote && (
                  <div className="mt-6 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <Trophy className="h-3 w-3" /> Vencedor Selecionado
                    </p>
                    <p className="text-sm font-bold text-white">{selectedQuote.supplier_name}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#1C232E] rounded-[32px] shadow-2xl border border-white/5 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-xl font-black text-white">Novo Quadro de Concorrência</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-full">
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Título do Serviço / Cotação</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" placeholder="Ex: Fornecimento de Esquadrias" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição (Opcional)</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none h-24 resize-none" />
              </div>
              <div className="pt-4 flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
                <button onClick={handleCreateGroup} disabled={isSaving} className="flex-1 py-3 bg-[#BCB5AC] text-[#1C232E] text-xs font-black rounded-xl uppercase tracking-widest hover:bg-white transition-all shadow-xl">
                  {isSaving ? 'Criando...' : 'Criar Quadro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
}

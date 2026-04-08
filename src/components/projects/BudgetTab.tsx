import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calculator as CalculatorIcon, Wallet, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BudgetItem, FinancialItem } from '../../lib/types';
import { cn } from '../../lib/utils';

interface BudgetTabProps {
  projectId: string;
  budgetItems: BudgetItem[];
  financialItems: FinancialItem[];
  onRefresh: () => void;
}

export function BudgetTab({ projectId, budgetItems, financialItems, onRefresh }: BudgetTabProps) {
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState<Partial<BudgetItem>>({});

  const calculateTotalBudget = (items: BudgetItem[]) => {
    return (items || []).reduce((acc, item) => acc + (Number(item.unit_cost) * Number(item.quantity)), 0);
  };

  const totalBudget = calculateTotalBudget(budgetItems);
  const totalSpent = (financialItems || []).reduce((acc, item) => acc + Number(item.amount), 0);
  const realizedPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const itemsByCategory = (budgetItems || []).reduce((acc: any, item: BudgetItem) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('budget_items')
        .upsert({
          ...formData,
          project_id: projectId,
          id: editingItem?.id || undefined
        });

      if (error) throw error;
      setIsItemModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar item');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', deletingItem.id);

      if (error) throw error;
      setDeletingItem(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#13171f] p-6 rounded-2xl border border-[#3B82F6]/30 relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Custo da obra</p>
          <h3 className="text-3xl font-black text-white">R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <CalculatorIcon className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 text-[#3B82F6]/20" />
        </div>

        <div className="bg-[#13171f] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Realizado</p>
          <h3 className="text-3xl font-black text-white">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className={`text-xs font-medium mt-1 ${realizedPercent > 100 ? 'text-red-500' : 'text-emerald-500'}`}>
            {realizedPercent.toFixed(1)}% do orçamento
          </p>
          <Wallet className={`absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 ${realizedPercent > 100 ? 'text-red-500/10' : 'text-emerald-500/10'}`} />
        </div>
      </div>

      <div className="bg-[#0b0f19] rounded-2xl border border-white/5 shadow-2xl overflow-hidden mt-8">
        <div className="p-6 flex items-center justify-between border-b border-white/5 bg-[#13171f]">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Levantamento Quantitativo / Orçamento</h3>
          <button onClick={() => { setEditingItem(null); setFormData({ category: 'Outros', unit: 'vb', quantity: 1, unit_cost: 0 }); setIsItemModalOpen(true); }} className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-[#2563EB] transition-colors shadow-lg shadow-[#3B82F6]/20">
            <Plus className="h-4 w-4" /> Adicionar Item
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 w-24">Código</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500">Descrição</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 w-20 text-center">Unid.</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 w-24 text-right">Qtd.</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 w-32 text-right">Custo Unit.</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 w-32 text-right">Orçado</th>
                <th className="py-4 px-6 text-xs font-bold text-[#F97316] w-32 text-right">Gasto</th>
                <th className="py-4 px-6 text-xs font-bold text-[#10B981] w-32 text-right pr-8">Saldo</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {Object.keys(itemsByCategory).length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-500">Nenhum item orçamentário listado.</td></tr>
              ) : (
                Object.entries(itemsByCategory).map(([category, items]: [any, any]) => {
                  const catTotal = items.reduce((acc: number, cur: BudgetItem) => acc + (Number(cur.unit_cost) * Number(cur.quantity)), 0);
                  return (
                    <React.Fragment key={category}>
                      <tr className="bg-[#13171f]/50 border-y border-white/5">
                        <td colSpan={5} className="py-3 px-6 text-xs font-bold text-[#3B82F6] uppercase tracking-wider">{category}</td>
                        <td className="py-3 px-6 text-xs font-bold text-white text-right">R$ {catTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td colSpan={2}></td>
                      </tr>
                      {items.map((item: BudgetItem) => {
                        const lineTotal = Number(item.unit_cost) * Number(item.quantity);
                        const lineSpent = financialItems?.filter((f: any) => f.budget_item_linked_id === item.id).reduce((acc: number, cur: any) => acc + Number(cur.amount), 0) || 0;
                        const lineBalance = lineTotal - lineSpent;
                        return (
                          <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group relative">
                            <td className="py-3.5 px-6 text-slate-500 font-medium">{item.code}</td>
                            <td className="py-3.5 px-6 text-white">{item.description}</td>
                            <td className="py-3.5 px-6 text-slate-400 text-center">{item.unit}</td>
                            <td className="py-3.5 px-6 text-slate-300 text-right font-medium">{Number(item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3.5 px-6 text-slate-300 text-right font-medium whitespace-nowrap">R$ {Number(item.unit_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3.5 px-6 text-white text-right font-bold w-32 whitespace-nowrap">R$ {lineTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3.5 px-6 text-[#F97316] text-right font-bold w-32 whitespace-nowrap">- R$ {lineSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className={`py-3.5 px-6 text-right font-black w-32 pr-8 whitespace-nowrap ${lineBalance < 0 ? 'text-red-500' : 'text-[#10B981]'}`}>R$ {lineBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0b0f19] px-2 py-1 rounded shadow-lg border border-white/10">
                              <button onClick={() => { setEditingItem(item); setFormData({ ...item }); setIsItemModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-white transition-colors"><Edit className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setDeletingItem(item)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsItemModalOpen(false)}></div>
          <div className="relative bg-[#13171f] rounded-xl shadow-2xl border border-[#1e293b] w-full max-w-lg overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{editingItem ? 'Editar Item' : 'Novo Item'}</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-white"><Plus className="h-5 w-5 rotate-45" /></button>
            </div>
            <div className="px-6 pb-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-white">Descrição do Serviço</label>
                <input type="text" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Categoria</label>
                  <select value={formData.category || 'Outros'} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none">
                    {['Serviços Preliminares', 'Infraestrutura', 'Alvenaria', 'Inst. Elétricas', 'Inst. Hidráulicas', 'Revestimento', 'Piso', 'Pintura', 'Complementos', 'Louças e Metais', 'Acabamentos', 'Outros'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Código</label>
                  <input type="text" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Unidade</label>
                  <input type="text" value={formData.unit || ''} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Qtd</label>
                  <input type="number" value={formData.quantity || 0} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-white">Custo Unit.</label>
                  <input type="number" value={formData.unit_cost || 0} onChange={e => setFormData({ ...formData, unit_cost: Number(e.target.value) })} className="w-full bg-[#13171f] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white" />
                </div>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3">
                <button onClick={() => setIsItemModalOpen(false)} className="px-5 py-2 text-sm font-bold text-white border border-[#1e293b] rounded-lg hover:bg-white/5">Cancelar</button>
                <button onClick={handleSave} className="px-5 py-2 bg-[#3B82F6] text-white text-sm font-bold rounded-lg hover:bg-[#2563EB]">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingItem(null)}></div>
          <div className="relative bg-[#13171f] rounded-2xl shadow-2xl border border-[#1e293b] w-full max-w-sm p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Excluir Item?</h3>
            <p className="text-sm text-slate-400 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingItem(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-300 border border-[#1e293b] rounded-xl">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

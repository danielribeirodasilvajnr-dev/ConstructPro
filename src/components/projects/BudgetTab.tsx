import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calculator as CalculatorIcon, Wallet, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BudgetItem, FinancialItem } from '../../lib/types';
import { cn, formatCurrency } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

interface BudgetTabProps {
  projectId: string;
  budgetItems: BudgetItem[];
  financialItems: FinancialItem[];
  onRefresh: () => void;
  readOnly?: boolean;
}

export function BudgetTab({ projectId, budgetItems, financialItems, onRefresh, readOnly }: BudgetTabProps) {
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState<Partial<BudgetItem>>({});
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'error' | 'success' | 'warning' }>({
    isOpen: false,
    title: '',
    message: ''
  });

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
    } catch (err: any) {
      console.error(err);
      setAlertConfig({
        isOpen: true,
        title: 'Erro ao Salvar',
        message: 'Não foi possível salvar o item do orçamento.',
        type: 'error'
      });
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
          <h3 className="text-3xl font-black text-white">{formatCurrency(totalBudget)}</h3>
          <CalculatorIcon className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 text-[#3B82F6]/20" />
        </div>

        <div className="bg-[#13171f] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Realizado</p>
          <h3 className="text-3xl font-black text-white">{formatCurrency(totalSpent)}</h3>
          <p className={`text-xs font-medium mt-1 ${realizedPercent > 100 ? 'text-red-500' : 'text-emerald-500'}`}>
            {realizedPercent.toFixed(1)}% do orçamento
          </p>
          <Wallet className={`absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 ${realizedPercent > 100 ? 'text-red-500/10' : 'text-emerald-500/10'}`} />
        </div>
      </div>

      <div className="bg-[#0b0f19] rounded-2xl border border-white/5 shadow-2xl overflow-hidden mt-8">
        <div className="p-6 flex items-center justify-between border-b border-white/5 bg-[#13171f]">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Levantamento Quantitativo / Orçamento</h3>
          {!readOnly && (
            <button onClick={() => { setEditingItem(null); setFormData({ category: 'Outros', unit: 'vb', quantity: 1, unit_cost: 0 }); setIsItemModalOpen(true); }} className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-[#2563EB] transition-colors shadow-lg shadow-[#3B82F6]/20">
              <Plus className="h-4 w-4" /> Adicionar Item
            </button>
          )}
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
                        <td className="py-3 px-6 text-xs font-bold text-white text-right">{formatCurrency(catTotal)}</td>
                        <td colSpan={2}></td>
                      </tr>
                      {items.map((item: BudgetItem) => {
                        const lineTotal = Number(item.unit_cost) * Number(item.quantity);
                        const lineSpent = financialItems?.filter((f: any) => f.budget_item_linked_id === item.id).reduce((acc: number, cur: any) => acc + Number(cur.amount), 0) || 0;
                        const lineBalance = lineTotal - lineSpent;
                        const linePercent = lineTotal > 0 ? (lineSpent / lineTotal) * 100 : 0;
                        
                        return (
                          <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group relative">
                            <td className="py-4 px-6 text-slate-500 font-bold text-[11px]">{item.code}</td>
                            <td className="py-4 px-6 min-w-[300px]">
                              <div className="flex flex-col gap-2">
                                <span className="text-white font-medium">{item.description}</span>
                                {lineTotal > 0 && (
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className={cn(
                                          "h-full rounded-full transition-all duration-500",
                                          linePercent > 100 ? "bg-red-500" : linePercent > 80 ? "bg-amber-500" : "bg-[#4170FF]"
                                        )}
                                        style={{ width: `${Math.min(linePercent, 100)}%` }}
                                      />
                                    </div>
                                    <span className={cn(
                                      "text-[10px] font-bold",
                                      linePercent > 100 ? "text-red-500" : "text-slate-500"
                                    )}>
                                      {linePercent.toFixed(0)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-400 text-center text-xs font-bold">{item.unit}</td>
                            <td className="py-4 px-6 text-slate-300 text-right font-medium">{Number(item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-4 px-6 text-slate-300 text-right font-medium whitespace-nowrap">{formatCurrency(Number(item.unit_cost))}</td>
                            <td className="py-4 px-6 text-white text-right font-bold w-32 whitespace-nowrap">{formatCurrency(lineTotal)}</td>
                            <td className="py-4 px-6 text-[#F97316] text-right font-bold w-32 whitespace-nowrap bg-[#F97316]/5">- {formatCurrency(lineSpent)}</td>
                            <td className={cn(
                              "py-4 px-6 text-right font-black w-32 pr-8 whitespace-nowrap transition-colors",
                              lineBalance < 0 ? 'text-red-500 bg-red-500/5' : 'text-[#10B981] bg-[#10B981]/5'
                            )}>
                              {formatCurrency(lineBalance)}
                            </td>
                            {!readOnly && (
                              <td className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-100 scale-95 z-20">
                                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 shadow-2xl">
                                  <button onClick={() => { setEditingItem(item); setFormData({ ...item }); setIsItemModalOpen(true); }} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-md"><Edit className="h-4 w-4" /></button>
                                  <button onClick={() => setDeletingItem(item)} className="p-2 text-slate-400 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-md"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </td>
                            )}
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
          <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md" onClick={() => setIsItemModalOpen(false)}></div>
          <div className="relative bg-[#181C21] rounded-[24px] shadow-2xl border border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100 tracking-tight">{editingItem ? 'Editar Item' : 'Novo Item'}</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="px-8 pb-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição do Serviço</label>
                <input 
                  type="text" 
                  value={formData.description || ''} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#4170FF] focus:ring-1 focus:ring-[#4170FF] outline-none transition-all placeholder:text-slate-600"
                  placeholder="Ex: Alvenaria de vedação..."
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                  <select 
                    value={formData.category || 'Outros'} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })} 
                    className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#4170FF] outline-none appearance-none cursor-pointer"
                  >
                    {['Serviços Preliminares', 'Infraestrutura', 'Superestrutura', 'Alvenaria', 'Esquadrias', 'Cobertura', 'Impermeabilização', 'Forros', 'Inst. Elétricas', 'Inst. Hidráulicas', 'Revestimento', 'Piso', 'Pintura', 'Complementos', 'Louças e Metais', 'Acabamentos', 'Outros'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Código</label>
                  <input 
                    type="text" 
                    value={formData.code || ''} 
                    onChange={e => setFormData({ ...formData, code: e.target.value })} 
                    className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#4170FF] outline-none transition-all" 
                    placeholder="01.01"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Unidade</label>
                  <input type="text" value={formData.unit || ''} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#4170FF] outline-none" placeholder="m2" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Qtd</label>
                  <input type="number" value={formData.quantity || 0} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#4170FF] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Custo Unit.</label>
                  <input type="number" value={formData.unit_cost || 0} onChange={e => setFormData({ ...formData, unit_cost: Number(e.target.value) })} className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#4170FF] outline-none" />
                </div>
              </div>
              <div className="pt-6 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsItemModalOpen(false)} 
                  className="px-6 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave} 
                  className="px-8 py-3 bg-[#4170FF] text-white text-xs font-bold rounded-xl uppercase tracking-[1.5px] hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98]"
                >
                  Salvar Item
                </button>
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

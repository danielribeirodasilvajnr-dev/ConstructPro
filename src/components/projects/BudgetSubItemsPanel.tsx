import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, Save, Calendar, Receipt } from 'lucide-react';
import { BudgetSubItem, FinancialItem } from '../../lib/types';
import { getSubItems, saveSubItems } from '../../lib/subItemsService';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

interface BudgetSubItemsPanelProps {
  budgetItemId: string;
  totalBudgetItemAmount: number;
  readOnly?: boolean;
  financialItems?: FinancialItem[];
  onClose: () => void;
}

export function BudgetSubItemsPanel({ 
  budgetItemId, 
  totalBudgetItemAmount, 
  readOnly, 
  financialItems = [], 
  onClose 
}: BudgetSubItemsPanelProps) {
  const [subItems, setSubItems] = useState<BudgetSubItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'error' | 'success' | 'warning' }>({
    isOpen: false, title: '', message: ''
  });

  useEffect(() => {
    loadSubItems();
  }, [budgetItemId]);

  const loadSubItems = async () => {
    setIsLoading(true);
    try {
      const items = await getSubItems(budgetItemId);
      setSubItems(items);
    } catch (error) {
      console.error('Error loading sub items', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentTotal = subItems.reduce((acc, item) => acc + Number(item.amount), 0);
  const isOverBudget = currentTotal > totalBudgetItemAmount;
  const remainingBudget = totalBudgetItemAmount - currentTotal;

  const linkedFinancialItems = (financialItems || []).filter(
    item => item.budget_item_linked_id === budgetItemId
  );
  const totalFinancialSpent = linkedFinancialItems.reduce((acc, item) => acc + Number(item.amount), 0);

  const directFinancialItems = linkedFinancialItems.filter(f => {
    if (!f.observations) return true;
    if (!f.observations.startsWith('budget_sub_item_linked_id:')) return true;
    
    const idPart = f.observations.replace('budget_sub_item_linked_id:', '').split('|')[0];
    const subItemExists = subItems.some(s => s.id === idPart);
    return !subItemExists;
  });

  const handleAddSubItem = () => {
    const newItem: BudgetSubItem = {
      id: crypto.randomUUID(),
      budget_item_id: budgetItemId,
      description: '',
      amount: 0,
      percentage: 0
    };
    setSubItems([...subItems, newItem]);
  };

  const handleRemoveSubItem = (id: string) => {
    setSubItems(subItems.filter(item => item.id !== id));
  };

  const handleSubItemChange = (id: string, field: 'description' | 'amount', value: any) => {
    setSubItems(subItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Calculate percentage dynamically based on the parent total
        if (field === 'amount') {
            updated.percentage = totalBudgetItemAmount > 0 ? (Number(value) / totalBudgetItemAmount) * 100 : 0;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (isOverBudget) {
      setAlertConfig({
        isOpen: true,
        title: 'Valor Ultrapassado',
        message: 'A soma dos subitens não pode ser maior que o valor do item principal.',
        type: 'error'
      });
      return;
    }

    // Validation: Description cannot be empty for any item
    if (subItems.some(item => !item.description.trim())) {
        setAlertConfig({
            isOpen: true,
            title: 'Campo Obrigatório',
            message: 'Todos os subitens precisam ter uma descrição.',
            type: 'warning'
        });
        return;
    }

    setIsSaving(true);
    try {
      const itemsToSave = subItems.map(item => ({
        id: item.id,
        budget_item_id: budgetItemId,
        description: item.description,
        amount: item.amount,
        percentage: totalBudgetItemAmount > 0 ? (item.amount / totalBudgetItemAmount) * 100 : 0
      }));
      
      await saveSubItems(budgetItemId, itemsToSave);
      await loadSubItems();
      
      setAlertConfig({
        isOpen: true,
        title: 'Sucesso',
        message: 'Subitens salvos com sucesso.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving sub items', error);
      setAlertConfig({
        isOpen: true,
        title: 'Erro ao Salvar',
        message: 'Não foi possível salvar os subitens.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#151a23] p-5 rounded-xl border border-outline mt-2 mb-4 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" /> Composição Financeira e Realizado
          </h4>
          <p className="text-xs text-on-surface-variant mt-1">Gerencie os subitens e acompanhe os custos reais do financeiro.</p>
        </div>
        <button 
          onClick={onClose} 
          className="text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high px-2.5 py-1 rounded transition-colors"
        >
          Fechar Painel
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-surface-container-low rounded-xl border border-outline/50 mb-6">
        <div>
          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Valor Orçado (Item)</p>
          <p className="text-xs font-black text-on-surface mt-0.5">{formatCurrency(totalBudgetItemAmount)}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Planejado (Subitens)</p>
          <p className={cn("text-xs font-black mt-0.5", isOverBudget ? "text-red-500" : "text-primary")}>
            {formatCurrency(currentTotal)}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Realizado (Gasto)</p>
          <p className="text-xs font-black text-[#F97316] mt-0.5">{formatCurrency(totalFinancialSpent)}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Saldo do Obra</p>
          <p className={cn("text-xs font-black mt-0.5", (totalBudgetItemAmount - totalFinancialSpent) < 0 ? "text-red-500" : "text-success")}>
            {formatCurrency(totalBudgetItemAmount - totalFinancialSpent)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-on-surface-variant text-sm">Carregando subitens...</div>
      ) : (
        <div className="space-y-6">
          {/* Seção de Subitens Planejados */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">Planejamento do Item</h5>

            <div className="space-y-3">
              {subItems.length === 0 ? (
                <div className="py-8 text-center text-on-surface-variant text-sm border border-dashed border-outline-variant rounded-lg bg-surface/10">
                  Nenhum subitem cadastrado. Adicione o primeiro para começar a compor o valor.
                </div>
              ) : (
                subItems.map((item, index) => {
                  const subItemFinancials = linkedFinancialItems.filter(f => {
                    if (!f.observations) return false;
                    if (f.observations.startsWith('budget_sub_item_linked_id:')) {
                      const idPart = f.observations.replace('budget_sub_item_linked_id:', '').split('|')[0];
                      return idPart === item.id;
                    }
                    return false;
                  });
                  const subItemSpent = subItemFinancials.reduce((acc, f) => acc + Number(f.amount), 0);

                  return (
                    <div key={item.id || index} className="space-y-2 bg-surface/30 p-3 rounded-lg border border-outline hover:border-outline-variant transition-all">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleSubItemChange(item.id, 'description', e.target.value)}
                            placeholder="Descrição do subitem..."
                            disabled={readOnly}
                            className="w-full bg-transparent border-none text-sm text-on-surface focus:ring-0 placeholder:text-on-surface-variant outline-none px-2 py-1"
                          />
                        </div>
                        <div className="w-36 relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">R$</span>
                          <input
                            type="text"
                            value={item.amount ? item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '');
                              const numericValue = digits ? Number(digits) / 100 : 0;
                              handleSubItemChange(item.id, 'amount', numericValue);
                            }}
                            placeholder="0,00"
                            disabled={readOnly}
                            className="w-full bg-surface-container-low border border-outline-variant rounded-md pl-7 pr-2.5 py-1 text-sm text-on-surface focus:border-primary outline-none text-right"
                          />
                        </div>
                        <div className="w-16 text-right pr-1">
                          <span className="text-[10px] font-bold text-on-surface-variant">
                            {totalBudgetItemAmount > 0 ? ((item.amount / totalBudgetItemAmount) * 100).toFixed(1) : '0.0'}%
                          </span>
                        </div>
                        {!readOnly && (
                          <button
                            onClick={() => handleRemoveSubItem(item.id)}
                            className="p-1.5 text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Lançamentos vinculados a este subitem */}
                      {subItemFinancials.length > 0 && (
                        <div className="pl-3 pr-3 py-2 bg-surface-container-low/50 rounded-lg border border-outline/30 space-y-2 mt-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#F97316] uppercase tracking-wider px-1">
                            <span className="flex items-center gap-1">
                              <Receipt className="h-3 w-3" /> Custos Vinculados (Financeiro)
                            </span>
                            <span>Subtotal Gasto: {formatCurrency(subItemSpent)}</span>
                          </div>
                          <div className="space-y-1">
                            {subItemFinancials.map(f => (
                              <div key={f.id} className="flex items-center justify-between text-xs bg-surface/40 p-2 rounded border border-outline/20 hover:bg-surface/60 transition-colors">
                                <div className="min-w-0 flex-1 pr-2">
                                  <span className="font-semibold text-on-surface truncate block">{f.description}</span>
                                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-on-surface-variant">
                                    <span className="px-1 bg-surface-container-high rounded text-on-surface-variant uppercase font-bold">{f.category}</span>
                                    <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" /> {formatDate(f.date)}</span>
                                  </div>
                                </div>
                                <span className="font-bold text-on-surface shrink-0">{formatCurrency(Number(f.amount))}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              <div className="flex items-center justify-between pt-2">
                {!readOnly ? (
                  <button
                    onClick={handleAddSubItem}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] transition-colors py-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Subitem
                  </button>
                ) : <div />}

                {!readOnly && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving || isOverBudget}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-high hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-on-surface text-xs font-bold rounded-lg transition-colors border border-outline-variant"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Salvar Subitens'}
                  </button>
                )}
              </div>

              {isOverBudget && (
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Soma ultrapassa o valor total do item principal (R$ {totalBudgetItemAmount.toFixed(2)}).
                </div>
              )}
            </div>
          </div>

          {/* Seção de Custos Gerais (Sem subitem) */}
          {directFinancialItems.length > 0 && (
            <div className="pt-4 border-t border-outline/50 space-y-3">
              <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-[#F97316]" /> Custos Gerais do Item (Sem Vínculo com Subitens)
              </h5>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {directFinancialItems.map((fItem) => (
                  <div key={fItem.id} className="flex items-center justify-between bg-surface/30 p-3 rounded-lg border border-outline/50 hover:bg-surface/50 transition-colors">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-on-surface truncate">{fItem.description}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[9px] text-[#F97316] bg-[#F97316]/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          {fItem.category}
                        </span>
                        <span className="text-[9px] text-on-surface-variant flex items-center gap-0.5">
                          <Calendar className="h-3 w-3" /> {formatDate(fItem.date)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-on-surface">{formatCurrency(Number(fItem.amount))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caso não exista nenhum custo ou subitem planejado */}
          {linkedFinancialItems.length === 0 && subItems.length === 0 && (
            <div className="py-8 text-center text-on-surface-variant text-sm border border-dashed border-outline-variant rounded-lg bg-surface/10">
              Nenhum custo lançado ou associado a este item ainda.
            </div>
          )}
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

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, Save } from 'lucide-react';
import { BudgetSubItem } from '../../lib/types';
import { getSubItems, saveSubItems } from '../../lib/subItemsService';
import { cn, formatCurrency } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

interface BudgetSubItemsPanelProps {
  budgetItemId: string;
  totalBudgetItemAmount: number;
  readOnly?: boolean;
  onClose: () => void;
}

export function BudgetSubItemsPanel({ budgetItemId, totalBudgetItemAmount, readOnly, onClose }: BudgetSubItemsPanelProps) {
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
        description: item.description,
        amount: item.amount,
        percentage: totalBudgetItemAmount > 0 ? (item.amount / totalBudgetItemAmount) * 100 : 0
      }));
      
      const savedItems = await saveSubItems(budgetItemId, itemsToSave);
      setSubItems(savedItems);
      
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
    <div className="bg-[#151a23] p-4 rounded-xl border border-outline mt-2 mb-4 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-on-surface-variant">Composição Financeira (Subitens)</h4>
          <p className="text-xs text-on-surface-variant mt-1">Detalhe os custos deste item. A soma não pode ultrapassar o valor total.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Valor do Item</p>
          <p className="text-sm font-bold text-on-surface">{formatCurrency(totalBudgetItemAmount)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-on-surface-variant text-sm">Carregando subitens...</div>
      ) : (
        <div className="space-y-3">
          {subItems.length === 0 ? (
            <div className="py-6 text-center text-on-surface-variant text-sm border border-dashed border-outline-variant rounded-lg">
              Nenhum subitem cadastrado. Adicione o primeiro para começar a compor o valor.
            </div>
          ) : (
            subItems.map((item, index) => (
              <div key={item.id || index} className="flex items-center gap-3 bg-surface p-2 rounded-lg border border-outline">
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
                <div className="w-40 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">R$</span>
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
                    className="w-full bg-surface-container-low border border-outline-variant rounded-md pl-8 pr-3 py-1.5 text-sm text-on-surface focus:border-primary outline-none text-right"
                  />
                </div>
                <div className="w-20 text-right pr-2">
                  <span className="text-xs font-bold text-on-surface-variant">
                    {totalBudgetItemAmount > 0 ? ((item.amount / totalBudgetItemAmount) * 100).toFixed(2) : '0.00'}%
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
            ))
          )}

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-outline">
            <div className="flex items-center gap-4">
              {!readOnly && (
                <button
                  onClick={handleAddSubItem}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Subitem
                </button>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">Soma dos Subitens</p>
                <p className={cn("text-sm font-bold", isOverBudget ? "text-red-500" : "text-success")}>
                  {formatCurrency(currentTotal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">Saldo a Compor</p>
                <p className={cn("text-sm font-bold", remainingBudget < 0 ? "text-red-500" : "text-on-surface-variant")}>
                  {formatCurrency(remainingBudget)}
                </p>
              </div>
              {!readOnly && (
                <button
                  onClick={handleSave}
                  disabled={isSaving || isOverBudget}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-on-surface text-xs font-bold rounded-lg transition-colors border border-outline-variant"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Salvando...' : 'Salvar Subitens'}
                </button>
              )}
            </div>
          </div>
          
          {isOverBudget && (
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              <AlertCircle className="h-4 w-4" />
              Atenção: A soma dos valores dos subitens (R$ {currentTotal.toFixed(2)}) ultrapassa o valor total do item principal (R$ {totalBudgetItemAmount.toFixed(2)}).
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

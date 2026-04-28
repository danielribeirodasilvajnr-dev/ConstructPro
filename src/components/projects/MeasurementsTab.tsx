import React, { useState, useMemo } from 'react';
import { Ruler, Plus, Printer, CheckCircle2, AlertCircle, Trash2, Calendar, FileText, ChevronRight, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BudgetItem, Measurement, MeasurementItem } from '../../lib/types';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';
import { ConfirmModal } from '../ui/ConfirmModal';

interface MeasurementsTabProps {
  projectId: string;
  budgetItems: BudgetItem[];
  measurements: Measurement[];
  onRefresh: () => void;
  readOnly?: boolean;
}

export function MeasurementsTab({ projectId, budgetItems, measurements, onRefresh, readOnly }: MeasurementsTabProps) {
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItems, setEditingItems] = useState<{ [key: string]: number }>({});
  const [formData, setFormData] = useState<Partial<Measurement>>({
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [newItemFormData, setNewItemFormData] = useState<Partial<BudgetItem>>({
    category: 'Mão de Obra',
    unit: 'vb',
    quantity: 1,
    unit_cost: 0,
    description: ''
  });

  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'error' | 'success' | 'warning' }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Excluir',
    onConfirm: () => {}
  });

  // Organize budget items by category
  const itemsByCategory = useMemo(() => {
    return (budgetItems || []).reduce((acc: any, item: BudgetItem) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [budgetItems]);

  // Calculate totals for each budget item across all previous measurements
  const accumulatedQuantities = useMemo(() => {
    const totals: { [key: string]: number } = {};
    (measurements || []).forEach(m => {
      if (selectedMeasurement && m.id === selectedMeasurement.id) return; // Skip current measurement
      // Check if this measurement was before or at same date but different ID to be safe? 
      // Actually, if we are editing a measurement, we want all OTHER measurements' totals.
      (m.items || []).forEach(mi => {
        totals[mi.budget_item_id] = (totals[mi.budget_item_id] || 0) + Number(mi.quantity);
      });
    });
    return totals;
  }, [measurements, selectedMeasurement]);

  const handleOpenNew = () => {
    setFormData({
      description: `Medição - ${formatDate(new Date().toISOString())}`,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    });
    setEditingItems({});
    setIsModalOpen(true);
  };

  const handleOpenDetail = (m: Measurement) => {
    setSelectedMeasurement(m);
    const items: { [key: string]: number } = {};
    (m.items || []).forEach(item => {
      items[item.budget_item_id] = item.quantity;
    });
    setEditingItems(items);
    setIsDetailOpen(true);
  };

  const handleSaveMeasurement = async () => {
    setIsSaving(true);
    try {
      // 1. Create/Update Measurement
      const { data: measurementData, error: mError } = await supabase
        .from('measurements')
        .upsert({
          id: selectedMeasurement?.id || undefined,
          project_id: projectId,
          description: formData.description,
          date: formData.date,
          status: selectedMeasurement?.status || 'pending'
        })
        .select()
        .single();

      if (mError) throw mError;

      // 2. Save Items
      const measurementId = measurementData.id;
      
      // Delete old items if updating
      if (selectedMeasurement?.id) {
        await supabase.from('measurement_items').delete().eq('measurement_id', measurementId);
      }

      const itemsToSave = Object.entries(editingItems)
        .filter(([_, qty]) => qty > 0)
        .map(([budgetItemId, qty]) => ({
          measurement_id: measurementId,
          budget_item_id: budgetItemId,
          quantity: qty
        }));

      if (itemsToSave.length > 0) {
        const { error: itemsError } = await supabase.from('measurement_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }

      setAlertConfig({
        isOpen: true,
        title: 'Sucesso',
        message: 'Medição salva com sucesso.',
        type: 'success'
      });
      
      setIsModalOpen(false);
      setIsDetailOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setAlertConfig({
        isOpen: true,
        title: 'Erro ao Salvar',
        message: err.message || 'Não foi possível salvar a medição.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewItem = async () => {
    if (!newItemFormData.description || !newItemFormData.category) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('budget_items')
        .insert([{
          ...newItemFormData,
          project_id: projectId,
          executed_quantity: 0
        }]);

      if (error) throw error;
      
      setNewItemFormData({
        category: 'Mão de Obra',
        unit: 'vb',
        quantity: 1,
        unit_cost: 0,
        description: ''
      });
      setIsNewItemModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setAlertConfig({
        isOpen: true,
        title: 'Erro ao criar item',
        message: err.message || 'Não foi possível criar o item.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Medição',
      message: 'Tem certeza que deseja excluir esta medição? Todos os registros de quantidades executadas serão removidos.',
      confirmText: 'Excluir',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('measurements').delete().eq('id', id);
          if (error) throw error;
          onRefresh();
          setIsDetailOpen(false);
        } catch (err: any) {
          setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
        }
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateStatus = async (m: Measurement, status: Measurement['status']) => {
    try {
      const { error } = await supabase
        .from('measurements')
        .update({ status })
        .eq('id', m.id);

      if (error) throw error;

      // If status is 'paid', we should probably create a financial item
      if (status === 'paid') {
        // Calculate total value of measurement
        const totalValue = (m.items || []).reduce((acc, mi) => {
          const budgetItem = budgetItems.find(bi => bi.id === mi.budget_item_id);
          return acc + (Number(mi.quantity) * Number(budgetItem?.unit_cost || 0));
        }, 0);

        await supabase.from('financial_items').insert({
          project_id: projectId,
          date: new Date().toISOString().split('T')[0],
          description: `Pagamento: ${m.description}`,
          category: 'Mão de Obra',
          amount: totalValue,
          observations: `Gerado automaticamente via Medição #${m.id.slice(0, 5)}`
        });
      }

      onRefresh();
      if (selectedMeasurement?.id === m.id) {
        setSelectedMeasurement({ ...m, status });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isDetailOpen && selectedMeasurement) {
    const totalMeasurement = (selectedMeasurement.items || []).reduce((acc, mi) => {
      const budgetItem = budgetItems.find(bi => bi.id === mi.budget_item_id);
      return acc + (Number(mi.quantity) * Number(budgetItem?.unit_cost || 0));
    }, 0);

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300 print:bg-white print:p-0">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <button onClick={() => setIsDetailOpen(false)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <Plus className="h-4 w-4 rotate-45" /> Voltar para lista
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-colors">
              <Printer className="h-4 w-4" /> Imprimir p/ Pagamento
            </button>
            {!readOnly && selectedMeasurement.status === 'pending' && (
              <button onClick={() => handleUpdateStatus(selectedMeasurement, 'authorized')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-500 transition-colors">
                <CheckCircle2 className="h-4 w-4" /> Autorizar
              </button>
            )}
            {!readOnly && selectedMeasurement.status === 'authorized' && (
              <button onClick={() => handleUpdateStatus(selectedMeasurement, 'paid')} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-500 transition-colors">
                <FileText className="h-4 w-4" /> Marcar como Pago
              </button>
            )}
          </div>
        </div>

        {/* Print Header */}
        <div className="bg-[#1C232E] p-8 rounded-3xl border border-white/5 mb-8 print:border-black print:text-black print:bg-transparent">
          <div className="flex justify-between items-start">
            <div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block",
                selectedMeasurement.status === 'paid' ? 'bg-blue-500/10 text-blue-500' :
                selectedMeasurement.status === 'authorized' ? 'bg-emerald-500/10 text-emerald-500' :
                'bg-amber-500/10 text-amber-500'
              )}>
                {selectedMeasurement.status === 'paid' ? 'Pago' : selectedMeasurement.status === 'authorized' ? 'Autorizado' : 'Pendente'}
              </span>
              <h2 className="text-3xl font-black text-white print:text-black">{selectedMeasurement.description}</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Data da Medição: {formatDate(selectedMeasurement.date)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Total desta Medição</p>
              <h3 className="text-4xl font-black text-emerald-500 print:text-black">{formatCurrency(totalMeasurement)}</h3>
            </div>
          </div>
        </div>

        {/* Measurement Table */}
        <div className="bg-[#0b0f19] rounded-[32px] border border-white/5 shadow-2xl overflow-hidden print:border-black print:bg-transparent">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 print:border-black">
                  <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest print:text-black">Item</th>
                  <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right print:text-black">Orçado</th>
                  <th className="py-5 px-8 text-[10px] font-black text-white uppercase tracking-widest text-right print:text-black">Esta Medição</th>
                  <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right print:text-black">Acumulado</th>
                  <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right print:text-black">Restante</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {Object.entries(itemsByCategory).map(([category, items]: [any, any]) => {
                  const filteredItems = items.filter((bi: BudgetItem) => {
                    const currentQty = editingItems[bi.id] || 0;
                    const prevQty = accumulatedQuantities[bi.id] || 0;
                    return currentQty > 0 || prevQty > 0;
                  });

                  if (filteredItems.length === 0) return null;

                  return (
                    <React.Fragment key={category}>
                      <tr className="bg-[#1C232E]/30 print:bg-gray-100">
                        <td colSpan={5} className="py-4 px-8 text-[11px] font-black text-[#3B82F6] uppercase tracking-[2px] print:text-black">{category}</td>
                      </tr>
                      {filteredItems.map((item: BudgetItem) => {
                        const currentQty = editingItems[item.id] || 0;
                        const prevQty = accumulatedQuantities[item.id] || 0;
                        const totalQty = prevQty + currentQty;
                        const remainingQty = Math.max(0, item.quantity - totalQty);
                        
                        const currentValue = currentQty * item.unit_cost;
                        const totalValue = totalQty * item.unit_cost;
                        const budgetedValue = item.quantity * item.unit_cost;
                        const remainingValue = Math.max(0, budgetedValue - totalValue);

                        const progress = item.quantity > 0 ? (totalQty / item.quantity) * 100 : 0;

                        return (
                          <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors print:border-black">
                            <td className="py-6 px-8">
                              <div className="flex flex-col">
                                <span className="text-slate-200 font-bold text-sm print:text-black">{item.description}</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 print:text-black">{item.unit} • Unit: {formatCurrency(item.unit_cost)}</span>
                              </div>
                            </td>
                            <td className="py-6 px-8 text-right">
                              <div className="flex flex-col">
                                <span className="text-slate-400 font-bold print:text-black">{item.quantity.toLocaleString()} {item.unit}</span>
                                <span className="text-[11px] text-slate-500 print:text-black">{formatCurrency(budgetedValue)}</span>
                              </div>
                            </td>
                            <td className="py-6 px-8 text-right bg-emerald-500/5 print:bg-transparent">
                              <div className="flex flex-col">
                                <span className="text-white font-black print:text-black">{currentQty.toLocaleString()} {item.unit}</span>
                                <span className="text-emerald-500 font-black print:text-black">{formatCurrency(currentValue)}</span>
                              </div>
                            </td>
                            <td className="py-6 px-8 text-right">
                              <div className="flex flex-col">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-slate-300 font-bold print:text-black">{totalQty.toLocaleString()} {item.unit}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded print:text-black">{progress.toFixed(0)}%</span>
                                </div>
                                <span className="text-[11px] text-slate-500 print:text-black">{formatCurrency(totalValue)}</span>
                              </div>
                            </td>
                            <td className="py-6 px-8 text-right">
                              <div className="flex flex-col">
                                <span className="text-slate-500 font-bold print:text-black">{remainingQty.toLocaleString()} {item.unit}</span>
                                <span className="text-amber-500/50 text-[11px] font-bold print:text-black">{formatCurrency(remainingValue)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 hidden print:block border-t border-black pt-8">
          <div className="grid grid-cols-2 gap-20">
            <div className="text-center">
              <div className="border-b border-black w-full mb-2"></div>
              <p className="text-sm font-bold uppercase">Responsável pela Medição</p>
            </div>
            <div className="text-center">
              <div className="border-b border-black w-full mb-2"></div>
              <p className="text-sm font-bold uppercase">Autorização de Pagamento</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black text-white">Medições de Obra</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie as medições e autorizações de pagamento de mão de obra</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {measurements.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-[#1C232E] rounded-[32px] border border-dashed border-white/10">
            <Ruler className="h-12 w-12 text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">Nenhuma medição registrada</h3>
            <p className="text-sm text-slate-500">As medições aparecerão aqui conforme forem registradas no sistema.</p>
          </div>
        ) : (
          measurements.map((m) => {
            const totalValue = (m.items || []).reduce((acc: number, mi: any) => {
              const budgetItem = budgetItems.find(bi => bi.id === mi.budget_item_id);
              return acc + (Number(mi.quantity) * Number(budgetItem?.unit_cost || 0));
            }, 0);

            return (
              <div
                key={m.id}
                onClick={() => handleOpenDetail(m)}
                className="bg-[#1C232E] rounded-[24px] border border-white/5 p-6 cursor-pointer hover:border-[#BCB5AC]/50 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteMeasurement(m.id); }}
                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                    m.status === 'paid' ? 'bg-blue-500/10 text-blue-500' :
                    m.status === 'authorized' ? 'bg-emerald-500/10 text-emerald-500' :
                    'bg-amber-500/10 text-amber-500'
                  )}>
                    {m.status === 'paid' ? 'Pago' : m.status === 'authorized' ? 'Autorizado' : 'Pendente'}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">{formatDate(m.date)}</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[#BCB5AC] transition-colors">{m.description}</h3>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor Medido</p>
                  <p className="text-2xl font-black text-white">{formatCurrency(totalValue)}</p>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.items?.length || 0} itens medidos</span>
                  <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-white transform group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Measurement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#1C232E] rounded-[32px] shadow-2xl border border-white/5 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between shrink-0">
              <h3 className="text-2xl font-black text-white tracking-tight">Nova Medição de Obra</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsNewItemModalOpen(true)}
                  className="px-4 py-2 bg-blue-600/20 text-blue-400 text-[10px] font-black rounded-lg flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest border border-blue-600/30"
                >
                  <Plus className="h-3 w-3" /> Novo Item / Mão de Obra
                </button>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
                  <Plus className="h-6 w-6 rotate-45" />
                </button>
              </div>
            </div>
            
            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição / Referência</label>
                  <input 
                    type="text" 
                    value={formData.description || ''} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none"
                    placeholder="Ex: Medição Quinzenal - Abril/2024"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data da Medição</label>
                  <input 
                    type="date" 
                    value={formData.date || ''} 
                    onChange={e => setFormData({ ...formData, date: e.target.value })} 
                    className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Ruler className="h-4 w-4" /> Selecione os itens e informe as quantidades
                </h4>
                <div className="space-y-8">
                  {Object.entries(itemsByCategory).map(([category, items]: [any, any]) => (
                    <div key={category} className="space-y-3">
                      <h5 className="text-[11px] font-black text-[#3B82F6] uppercase tracking-wider bg-[#3B82F6]/5 px-3 py-1 rounded-md inline-block">{category}</h5>
                      <div className="grid grid-cols-1 gap-3">
                        {items.map((item: BudgetItem) => {
                          const accQty = accumulatedQuantities[item.id] || 0;
                          const remaining = Math.max(0, item.quantity - accQty);
                          
                          return (
                            <div key={item.id} className="bg-[#0b0f19] p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-6 group hover:border-[#BCB5AC]/30 transition-all">
                              <div className="flex-1">
                                <p className="text-sm font-bold text-white mb-1">{item.description}</p>
                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                  <span>Total: {item.quantity} {item.unit}</span>
                                  <span className="text-emerald-500">Medido: {accQty} {item.unit}</span>
                                  <span className="text-amber-500">Restante: {remaining} {item.unit}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-400">Qtd Atual:</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingItems[item.id] === undefined ? '' : editingItems[item.id]}
                                  onChange={(e) => setEditingItems({ ...editingItems, [item.id]: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                  className="w-24 bg-[#1C232E] border border-white/10 rounded-lg px-3 py-2 text-right text-sm font-bold text-white focus:border-[#BCB5AC] outline-none"
                                  placeholder="0,00"
                                />
                                <span className="text-xs font-bold text-slate-500 w-8">{item.unit}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/5 flex items-center justify-end gap-4 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
              <button 
                onClick={handleSaveMeasurement} 
                disabled={isSaving}
                className="px-8 py-3 bg-[#BCB5AC] text-[#1C232E] text-xs font-black rounded-xl uppercase tracking-widest hover:bg-white transition-all shadow-xl disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Medição'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Item Quick Add Modal */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md" onClick={() => setIsNewItemModalOpen(false)}></div>
          <div className="relative bg-[#1C232E] rounded-[32px] shadow-2xl border border-white/5 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-xl font-black text-white">Novo Item / Serviço</h3>
              <button onClick={() => setIsNewItemModalOpen(false)} className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-full">
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição do Serviço</label>
                <input 
                  type="text" 
                  value={newItemFormData.description || ''} 
                  onChange={e => setNewItemFormData({ ...newItemFormData, description: e.target.value })} 
                  className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none"
                  placeholder="Ex: Instalação de porcelanato 60x60..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                  <select 
                    value={newItemFormData.category || 'Mão de Obra'} 
                    onChange={e => setNewItemFormData({ ...newItemFormData, category: e.target.value })} 
                    className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none appearance-none"
                  >
                    {['Mão de Obra', 'Serviços Preliminares', 'Infraestrutura', 'Alvenaria', 'Inst. Elétricas', 'Inst. Hidráulicas', 'Acabamentos', 'Outros'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Unidade</label>
                  <input type="text" value={newItemFormData.unit || ''} onChange={e => setNewItemFormData({ ...newItemFormData, unit: e.target.value })} className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" placeholder="m2, vb, un..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Qtd Contratada</label>
                  <input type="number" value={newItemFormData.quantity || ''} onChange={e => setNewItemFormData({ ...newItemFormData, quantity: parseFloat(e.target.value) })} className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Custo Unitário</label>
                  <input type="number" value={newItemFormData.unit_cost || ''} onChange={e => setNewItemFormData({ ...newItemFormData, unit_cost: parseFloat(e.target.value) })} className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none" placeholder="0.00" />
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button onClick={() => setIsNewItemModalOpen(false)} className="flex-1 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
                <button onClick={handleAddNewItem} disabled={isSaving} className="flex-1 py-3 bg-blue-600 text-white text-xs font-black rounded-xl uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                  {isSaving ? 'Criando...' : 'Criar Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        requireText="Excluir"
      />

      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, onClose: () => setAlertConfig({ ...alertConfig, isOpen: false }), isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type as any}
      />
    </div>
  );
}

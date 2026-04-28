import React, { useState, useMemo } from 'react';
import { Ruler, Plus, Printer, CheckCircle2, AlertCircle, Trash2, Calendar, FileText, ChevronRight, Save, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BudgetItem, Measurement, MeasurementItem } from '../../lib/types';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

interface MeasurementsTabProps {
  projectId: string;
  budgetItems: BudgetItem[];
  measurements: Measurement[];
  bidGroups: any[];
  onRefresh: () => void;
  readOnly?: boolean;
}

export function MeasurementsTab({ projectId, budgetItems, measurements, bidGroups, onRefresh, readOnly }: MeasurementsTabProps) {
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

  const [filterBidGroupId, setFilterBidGroupId] = useState<string | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'error' | 'success' | 'warning' }>({
    isOpen: false,
    title: '',
    message: ''
  });
  
  // Get relevant previous measurements for columns
  const previousMeasurements = useMemo(() => {
    return (measurements || [])
      .filter(m => m.id !== selectedMeasurement?.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [measurements, selectedMeasurement]);

  const currentMeasurementNumber = previousMeasurements.length + 1;

  const itemsByCategory = useMemo(() => {
    let filtered = budgetItems || [];
    if (filterBidGroupId) {
      filtered = filtered.filter(item => (item as any).bid_group_id === filterBidGroupId);
    }
    return filtered.reduce((acc: any, item: BudgetItem) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [budgetItems, filterBidGroupId]);

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

  const handleOpenNew = (bidGroupId?: string) => {
    const group = bidGroups.find(bg => bg.id === bidGroupId);
    setFormData({
      description: `Medição - ${group?.title || formatDate(new Date().toISOString())}`,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    });
    setEditingItems({});
    setFilterBidGroupId(bidGroupId || null);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (m: Measurement) => {
    setSelectedMeasurement(m);
    const items: { [key: string]: number } = {};
    (m.items || []).forEach(item => {
      items[item.budget_item_id] = item.quantity;
    });
    setEditingItems(items);
    setFilterBidGroupId(null); // Reset filter when viewing details
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
    if (!confirm('Tem certeza que deseja excluir esta medição?')) return;
    try {
      const { error } = await supabase.from('measurements').delete().eq('id', id);
      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error(err);
    }
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

      {/* Contratos Ativos / Quadros Fechados */}
      <div className="mb-12">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[3px] mb-6 flex items-center gap-2">
           <FileText className="h-4 w-4" /> Contratos Ativos (Quadros Fechados)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bidGroups.filter(bg => bg.status === 'closed').length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-[#1C232E]/30 rounded-[32px] border border-dashed border-white/5">
              <p className="text-slate-500 text-sm italic">Nenhum contrato fechado para medição ainda.</p>
            </div>
          ) : (
            bidGroups.filter(bg => bg.status === 'closed').map(group => (
              <div 
                key={group.id} 
                onClick={() => handleOpenNew(group.id)}
                className="bg-[#1C232E] rounded-[24px] border border-emerald-500/20 p-6 cursor-pointer hover:border-emerald-500/50 transition-all group relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-md text-[10px] font-black uppercase tracking-widest">Contrato Ativo</span>
                  <Trophy className="h-4 w-4 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 uppercase group-hover:text-emerald-400 transition-colors">{group.title}</h3>
                <p className="text-xs text-slate-500 mb-6 line-clamp-1">{group.description || 'Contrato para medição'}</p>
                <button className="w-full py-3 bg-emerald-600/10 text-emerald-500 text-[10px] font-black rounded-xl uppercase tracking-widest group-hover:bg-emerald-600 group-hover:text-white transition-all">
                   Iniciar Nova Medição
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <h3 className="text-xs font-black text-slate-500 uppercase tracking-[3px] mb-6 flex items-center gap-2">
         <Ruler className="h-4 w-4" /> Histórico de Medições
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {measurements.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-[#1C232E] rounded-[32px] border border-dashed border-white/10">
            <Ruler className="h-12 w-12 text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">Nenhuma medição registrada</h3>
            <p className="text-sm text-slate-500">Selecione um contrato acima para iniciar o controle físico e financeiro.</p>
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
            {/* Header Style like Bid Matrix */}
            <div className="bg-white text-black border-b border-black shrink-0 font-sans p-0">
               <div className="grid grid-cols-12 border-b border-black">
                  <div className="col-span-4 bg-[#E5E1DB] p-4 border-r border-black flex items-center justify-center">
                    <h1 className="text-2xl font-black text-[#1C232E]">AevumPro</h1>
                  </div>
                  <div className="col-span-6 p-4 border-r border-black flex items-center justify-center">
                    <h2 className="text-xl font-black uppercase tracking-tight">Medição de Obra</h2>
                  </div>
                  <div className="col-span-2 bg-[#F3F4F6] p-4 flex flex-col items-center justify-center">
                    <span className="text-[8px] font-black opacity-30">PROJETO</span>
                    <span className="text-sm font-black uppercase">#MOD-{projectId.slice(0, 4).toUpperCase()}</span>
                  </div>
               </div>
               
               <div className="grid grid-cols-12 bg-[#F9FAFB]">
                  <div className="col-span-6 p-3 border-r border-black flex flex-col justify-center">
                    <span className="text-[9px] font-black uppercase opacity-40">Descrição da Medição:</span>
                    <input 
                      type="text" 
                      value={formData.description || ''} 
                      onChange={e => setFormData({ ...formData, description: e.target.value })} 
                      className="bg-transparent border-none outline-none font-bold text-sm uppercase w-full"
                      placeholder="EX: MEDIÇÃO QUINZENAL 01..."
                    />
                  </div>
                  <div className="col-span-3 p-3 border-r border-black flex flex-col justify-center">
                    <span className="text-[9px] font-black uppercase opacity-40">Data Base:</span>
                    <input 
                      type="date" 
                      value={formData.date || ''} 
                      onChange={e => setFormData({ ...formData, date: e.target.value })} 
                      className="bg-transparent border-none outline-none font-bold text-sm w-full"
                    />
                  </div>
                  <div className="col-span-3 p-3 flex flex-col justify-center items-end pr-8">
                     <button
                        onClick={() => setIsNewItemModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-lg flex items-center gap-2 hover:bg-blue-500 transition-all uppercase tracking-widest"
                      >
                        <Plus className="h-3 w-3" /> Adicionar Item Extra
                      </button>
                  </div>
               </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-white text-black font-sans text-[10px]">
              <div className="min-w-max">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#E5E7EB] border-b border-black h-10 sticky top-0 z-10">
                      <th className="border-r border-black font-black uppercase text-[7px] text-center w-10">ITM</th>
                      <th className="border-r border-black px-3 font-black uppercase text-left min-w-[250px]">Descrição do Serviço</th>
                      <th className="border-r border-black font-black uppercase text-[7px] text-center w-14">UNID</th>
                      <th className="border-r border-black font-black uppercase text-[7px] text-center w-24">QUANT. TOTAL</th>
                      
                      {/* Previous Measurements Columns */}
                      {previousMeasurements.map((pm, idx) => (
                        <th key={pm.id} className="border-r border-black font-black uppercase text-[7px] text-center w-24 bg-blue-50/30">
                          MEDIÇÃO {idx + 1}
                          <div className="text-[6px] opacity-40">{formatDate(pm.date)}</div>
                        </th>
                      ))}

                      <th className="border-r border-black font-black uppercase text-[7px] text-center w-24 bg-emerald-500/10">
                        MEDIÇÃO {currentMeasurementNumber} (ATUAL)
                      </th>
                      <th className="font-black uppercase text-[7px] text-center w-24 bg-amber-500/5">RESTANTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(itemsByCategory).map(([category, items]: [any, any]) => (
                      <React.Fragment key={category}>
                        <tr className="bg-[#BDBDBD] border-b border-black h-8">
                          <td colSpan={5 + previousMeasurements.length} className="px-4 font-black uppercase tracking-[3px] text-[9px]">{category}</td>
                        </tr>
                        {items.map((item: BudgetItem, idx: number) => {
                          const currentVal = editingItems[item.id] || 0;
                          
                          // Calculate total from previous measurements
                          const totalPrevious = previousMeasurements.reduce((acc, pm) => {
                            const mItem = (pm.items || []).find((i: any) => i.budget_item_id === item.id);
                            return acc + (mItem?.quantity || 0);
                          }, 0);

                          const totalMeasured = totalPrevious + currentVal;
                          const remaining = Math.max(0, item.quantity - totalMeasured);

                          return (
                            <tr key={item.id} className="border-b border-black h-10 group hover:bg-gray-50">
                              <td className="border-r border-black text-center font-bold opacity-30">{idx + 1}</td>
                              <td className="border-r border-black px-3 font-bold uppercase">{item.description}</td>
                              <td className="border-r border-black text-center font-bold uppercase">{item.unit}</td>
                              <td className="border-r border-black text-center font-bold">{item.quantity.toLocaleString()}</td>
                              
                              {/* Previous Values */}
                              {previousMeasurements.map((pm) => {
                                const mItem = (pm.items || []).find((i: any) => i.budget_item_id === item.id);
                                return (
                                  <td key={pm.id} className="border-r border-black text-center font-bold text-blue-600 bg-blue-50/10">
                                    {mItem?.quantity ? mItem.quantity.toLocaleString() : '-'}
                                  </td>
                                );
                              })}

                              <td className="border-r border-black p-0 bg-emerald-500/5">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingItems[item.id] === undefined ? '' : editingItems[item.id]}
                                  onChange={(e) => setEditingItems({ ...editingItems, [item.id]: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                  className="w-full h-full bg-transparent text-center font-black text-emerald-700 outline-none no-spinners text-[11px]"
                                  placeholder="0,00"
                                />
                              </td>
                              <td className="text-center font-bold text-amber-600 bg-amber-50/5">{remaining.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-8 bg-[#E5E1DB] border-t border-black flex items-center justify-between shrink-0">
               <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black opacity-40 uppercase">Total Geral Medido (R$)</span>
                    <span className="text-xl font-black">
                      {formatCurrency(Object.entries(editingItems).reduce((acc, [id, qty]) => {
                        const item = budgetItems.find(bi => bi.id === id);
                        return acc + (qty * (item?.unit_cost || 0));
                      }, 0))}
                    </span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-black transition-colors">Cancelar</button>
                <button 
                  onClick={handleSaveMeasurement} 
                  disabled={isSaving}
                  className="px-10 py-4 bg-[#1C232E] text-white text-[11px] font-black rounded-none uppercase tracking-[2px] hover:bg-black transition-all shadow-xl disabled:opacity-50 border border-black"
                >
                  {isSaving ? 'SALVANDO...' : 'FINALIZAR MEDIÇÃO'}
                </button>
               </div>
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

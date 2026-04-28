import React, { useState, useEffect } from 'react';
import { Ruler, CheckCircle2, AlertCircle, Save, Percent } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BudgetItem } from '../../lib/types';
import { cn } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

interface MeasurementsTabProps {
  projectId: string;
  budgetItems: BudgetItem[];
  onRefresh: () => void;
  readOnly?: boolean;
}

export function MeasurementsTab({ projectId, budgetItems, onRefresh, readOnly }: MeasurementsTabProps) {
  const [editingQuantities, setEditingQuantities] = useState<{ [key: string]: number }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'error' | 'success' | 'warning' }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // Initialize editing quantities from budgetItems
  useEffect(() => {
    const initialQuantities: { [key: string]: number } = {};
    budgetItems.forEach(item => {
      initialQuantities[item.id] = item.executed_quantity || 0;
    });
    setEditingQuantities(initialQuantities);
  }, [budgetItems]);

  const itemsByCategory = (budgetItems || []).reduce((acc: any, item: BudgetItem) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const calculateOverallProgress = () => {
    if (budgetItems.length === 0) return 0;
    
    // Weighted progress by budget value
    const totalValue = budgetItems.reduce((acc, item) => acc + (item.quantity * item.unit_cost), 0);
    if (totalValue === 0) {
      // Fallback to simple average if no values defined
      const totalProgress = budgetItems.reduce((acc, item) => {
        const progress = item.quantity > 0 ? (item.executed_quantity / item.quantity) : 0;
        return acc + Math.min(progress, 1);
      }, 0);
      return (totalProgress / budgetItems.length) * 100;
    }

    const executedValue = budgetItems.reduce((acc, item) => {
      const progress = item.quantity > 0 ? (item.executed_quantity / item.quantity) : 0;
      const cappedProgress = Math.min(progress, 1);
      return acc + (cappedProgress * item.quantity * item.unit_cost);
    }, 0);

    return (executedValue / totalValue) * 100;
  };

  const handleQuantityChange = (id: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setEditingQuantities(prev => ({ ...prev, [id]: numValue }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(editingQuantities).map(([id, executed_quantity]) => ({
        id,
        executed_quantity,
        project_id: projectId // Required for RLS usually
      }));

      // We need to fetch the rest of the fields to avoid overwriting them if using upsert with partial data
      // Or use a custom RPC/multiple updates. Since supabase upsert requires all non-nullable fields.
      // Better: Update each item individually or use a single query if possible.
      
      const { error } = await supabase
        .from('budget_items')
        .upsert(
          budgetItems.map(item => ({
            ...item,
            executed_quantity: editingQuantities[item.id] ?? item.executed_quantity
          }))
        );

      if (error) throw error;

      setAlertConfig({
        isOpen: true,
        title: 'Medição Salva',
        message: 'As medições físicas foram atualizadas com sucesso.',
        type: 'success'
      });
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setAlertConfig({
        isOpen: true,
        title: 'Erro ao Salvar',
        message: 'Não foi possível salvar as medições.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const overallProgress = calculateOverallProgress();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-[#1C232E] p-8 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Progresso Físico Global</p>
              <h3 className="text-4xl font-black text-white">{overallProgress.toFixed(1)}%</h3>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Percent className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-3 font-medium uppercase tracking-tight italic">
            * Cálculo baseado no valor orçado de cada serviço
          </p>
          <Ruler className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5 rotate-12" />
        </div>

        <div className="bg-[#1C232E] p-8 rounded-3xl border border-[#BCB5AC]/20 flex flex-col items-center justify-center text-center group">
          {!readOnly ? (
            <>
              <div className="h-14 w-14 rounded-2xl bg-[#BCB5AC]/10 border border-[#BCB5AC]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Save className="h-6 w-6 text-[#BCB5AC]" />
              </div>
              <h4 className="text-white font-bold mb-2">Salvar Medições</h4>
              <p className="text-xs text-slate-500 mb-6">Atualize o progresso físico da obra</p>
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="w-full py-3 bg-[#BCB5AC] text-[#1C232E] text-xs font-black rounded-xl uppercase tracking-widest hover:bg-white transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Salvando...' : 'Confirmar Medição'}
              </button>
            </>
          ) : (
            <>
              <div className="h-14 w-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-slate-500" />
              </div>
              <h4 className="text-white font-bold mb-2">Modo Visualização</h4>
              <p className="text-xs text-slate-500">Você não tem permissão para editar medições</p>
            </>
          )}
        </div>
      </div>

      <div className="bg-[#0b0f19] rounded-[32px] border border-white/5 shadow-2xl overflow-hidden">
        <div className="p-8 flex items-center justify-between border-b border-white/5 bg-[#1C232E]/50">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Controle de Medições Físicas</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">Acompanhamento de execução por item</p>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest w-24">Código</th>
                <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Serviço / Atividade</th>
                <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest w-20 text-center">Unid.</th>
                <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest w-32 text-right">Qtd. Orçada</th>
                <th className="py-5 px-8 text-[10px] font-black text-[#BCB5AC] uppercase tracking-widest w-40 text-right">Qtd. Executada</th>
                <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest w-48 text-right">Progresso</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {Object.keys(itemsByCategory).length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-500 font-medium italic">Nenhum item disponível para medição.</td></tr>
              ) : (
                Object.entries(itemsByCategory).map(([category, items]: [any, any]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-[#1C232E]/30">
                      <td colSpan={6} className="py-4 px-8 text-[11px] font-black text-[#3B82F6] uppercase tracking-[2px]">{category}</td>
                    </tr>
                    {items.map((item: BudgetItem) => {
                      const currentExec = editingQuantities[item.id] ?? item.executed_quantity ?? 0;
                      const progress = item.quantity > 0 ? (currentExec / item.quantity) * 100 : 0;
                      
                      return (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <td className="py-6 px-8 text-slate-500 font-bold text-[11px] tracking-wider">{item.code}</td>
                          <td className="py-6 px-8">
                            <span className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors">{item.description}</span>
                          </td>
                          <td className="py-6 px-8 text-slate-500 text-center text-xs font-black uppercase">{item.unit}</td>
                          <td className="py-6 px-8 text-slate-400 text-right font-bold tabular-nums">
                            {Number(item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-6 px-8 text-right">
                            {!readOnly ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editingQuantities[item.id] === undefined ? '' : editingQuantities[item.id]}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                className="w-28 bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-2 text-right text-sm font-bold text-white focus:border-[#BCB5AC] focus:ring-1 focus:ring-[#BCB5AC] outline-none transition-all"
                              />
                            ) : (
                              <span className="text-white font-bold tabular-nums">
                                {Number(item.executed_quantity || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </td>
                          <td className="py-6 px-8">
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[11px] font-black tabular-nums",
                                  progress >= 100 ? "text-emerald-500" : progress > 0 ? "text-[#BCB5AC]" : "text-slate-600"
                                )}>
                                  {progress.toFixed(1)}%
                                </span>
                                {progress >= 100 && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                              </div>
                              <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    progress >= 100 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-[#BCB5AC]"
                                  )}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

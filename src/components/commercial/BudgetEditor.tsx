import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ComBudget, ComBudgetItem, ComComposition } from '../../lib/types';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Download, FileSignature, Edit } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmModal } from '../ui/ConfirmModal';

interface BudgetEditorProps {
  budget: ComBudget;
  onBack: () => void;
}

export function BudgetEditor({ budget, onBack }: BudgetEditorProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<ComBudgetItem[]>([]);
  const [compositions, setCompositions] = useState<ComComposition[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State para Novo Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [useComposition, setUseComposition] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [compositionSearch, setCompositionSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ComBudgetItem | null>(null);

  const [itemType, setItemType] = useState<'service' | 'material' | 'equipment'>('service');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('un');
  const [quantity, setQuantity] = useState('1');
  const [materialCost, setMaterialCost] = useState('0');
  const [laborCost, setLaborCost] = useState('0');
  const [equipmentCost, setEquipmentCost] = useState('0');
  const [thirdPartyCost, setThirdPartyCost] = useState('0');

  useEffect(() => {
    fetchItems();
    fetchCompositions();
  }, [budget]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('com_budget_items')
      .select('*')
      .eq('budget_id', budget.id)
      .order('code');
    if (error) console.error(error);
    else setItems(data || []);
    setLoading(false);
  };

  const fetchCompositions = async () => {
    if (!user) return;
    const { data } = await supabase.from('com_compositions').select('*').eq('user_id', user.id).order('description');
    if (data) setCompositions(data);
  };

  const handleCompositionSelect = (comp: ComComposition) => {
    setSelectedCompId(comp.id);
    setCompositionSearch(comp.code ? `${comp.code} - ${comp.description}` : comp.description);
    setIsDropdownOpen(false);
    setDescription(comp.description);
    setUnit(comp.unit);
    setMaterialCost(comp.material_cost.toString());
    setLaborCost(comp.labor_cost.toString());
    setEquipmentCost(comp.equipment_cost.toString());
    setThirdPartyCost(comp.third_party_cost.toString());
  };

  const filteredModalCompositions = compositions
    .filter(c => (c.code + ' ' + c.description).toLowerCase().includes(compositionSearch.toLowerCase()))
    .sort((a, b) => {
      const searchLower = compositionSearch.toLowerCase();
      const aDesc = a.description.toLowerCase();
      const bDesc = b.description.toLowerCase();
      // Prioriza itens que COMEÇAM com o texto digitado
      const aStarts = aDesc.startsWith(searchLower);
      const bStarts = bDesc.startsWith(searchLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      // Ordem alfabética normal para o resto
      return aDesc.localeCompare(bDesc);
    })
    .slice(0, 50); // Limit rendered items for performance

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      budget_id: budget.id,
      composition_id: useComposition ? selectedCompId : null,
      code,
      description,
      unit,
      quantity: parseFloat(quantity.toString().replace(',', '.')) || 1,
      material_cost: itemType === 'material' ? (parseFloat(materialCost.toString().replace(',', '.')) || 0) : 0,
      labor_cost: itemType === 'service' ? (parseFloat(laborCost.toString().replace(',', '.')) || 0) : 0,
      equipment_cost: itemType === 'equipment' ? (parseFloat(equipmentCost.toString().replace(',', '.')) || 0) : 0,
      third_party_cost: 0,
    };

    if (editingItem) {
      const { error } = await supabase.from('com_budget_items').update(payload).eq('id', editingItem.id);
      if (error) alert('Erro ao atualizar item: ' + error.message);
      else {
        setIsModalOpen(false);
        fetchItems();
      }
    } else {
      const { error } = await supabase.from('com_budget_items').insert([payload]);
      if (error) alert('Erro ao adicionar item: ' + error.message);
      else {
        setIsModalOpen(false);
        fetchItems();
      }
    }
  };

  const openEditModal = (item: ComBudgetItem) => {
    setEditingItem(item);
    setUseComposition(!!item.composition_id);
    setSelectedCompId(item.composition_id || '');
    setCompositionSearch(item.description);

    if (!item.composition_id) {
      setItemType(item.material_cost > 0 && item.labor_cost === 0 ? 'material' : item.equipment_cost > 0 ? 'equipment' : 'service');
    }

    setCode(item.code || '');
    setDescription(item.description);
    setUnit(item.unit);
    setQuantity(item.quantity.toString());
    setMaterialCost(item.material_cost.toString());
    setLaborCost(item.labor_cost.toString());
    setEquipmentCost(item.equipment_cost.toString());

    setIsModalOpen(true);
  };

  const updateItemQuantity = async (id: string, newQuantityStr: string) => {
    const parsedQty = parseFloat(newQuantityStr.toString().replace(',', '.')) || 0;
    // Atualiza apenas no banco, pois o local state já foi atualizado pelo onChange
    await supabase.from('com_budget_items').update({ quantity: parsedQty }).eq('id', id);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { error } = await supabase.from('com_budget_items').delete().eq('id', itemToDelete);
    if (error) alert('Erro ao excluir: ' + error.message);
    else fetchItems();
    setItemToDelete(null);
  };

  const handleChangeStatus = async (newStatus: string) => {
    const { error } = await supabase.from('com_budgets').update({ status: newStatus }).eq('id', budget.id);
    if (error) alert('Erro: ' + error.message);
    else onBack(); // Voltar para recarregar com o novo status
  };

  // Cálculos
  let totalCustoDireto = 0;
  items.forEach(item => {
    const itemTotalCusto = (item.material_cost + item.labor_cost + item.equipment_cost + item.third_party_cost) * item.quantity;
    totalCustoDireto += itemTotalCusto;
  });

  const bdiValor = totalCustoDireto * (budget.bdi_percent / 100);
  const lucroValor = totalCustoDireto * (budget.profit_percent / 100);
  const precoVendaSemImposto = totalCustoDireto + bdiValor + lucroValor;
  const impostosValor = precoVendaSemImposto * (budget.taxes_percent / 100);
  const precoVendaFinal = precoVendaSemImposto + impostosValor;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-3 bg-surface-container-low hover:bg-surface-container-highest rounded-xl text-on-surface-variant transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-on-surface flex items-center gap-3">
            Orçamento {budget.number}
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[2px] rounded-full border border-primary/20">
              {budget.status}
            </span>
          </h2>
          <p className="text-sm font-display text-on-surface-variant mt-1 uppercase tracking-[1px]">{budget.title} • {budget.client?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-surface-container-low border border-outline rounded-[32px] overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-6 border-b border-outline flex justify-between items-center bg-background/20">
            <h3 className="font-display font-bold text-on-surface text-sm uppercase tracking-[2px]">Itens do Orçamento (EAP)</h3>
            <button
              onClick={() => {
                setEditingItem(null);
                setUseComposition(false);
                setSelectedCompId('');
                setCompositionSearch('');
                setCode('');
                setDescription('');
                setQuantity('1');
                setMaterialCost('0');
                setLaborCost('0');
                setEquipmentCost('0');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 font-bold text-[10px] uppercase tracking-[2px] rounded-xl transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar Item
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-20"><div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm font-display text-on-surface-variant uppercase tracking-[2px]">Planilha Vazia</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline bg-background/10">
                    <th className="py-3 px-4 text-[10px] font-display text-on-surface-variant uppercase tracking-[2px]">Item</th>
                    <th className="py-3 px-4 text-[10px] font-display text-on-surface-variant uppercase tracking-[2px]">Descrição</th>
                    <th className="py-3 px-4 text-[10px] font-display text-on-surface-variant uppercase tracking-[2px] text-center">Unid</th>
                    <th className="py-3 px-4 text-[10px] font-display text-on-surface-variant uppercase tracking-[2px] text-center">Qtd</th>
                    <th className="py-3 px-4 text-[10px] font-display text-on-surface-variant uppercase tracking-[2px] text-right">Custo Unitário</th>
                    <th className="py-3 px-4 text-[10px] font-display text-on-surface-variant uppercase tracking-[2px] text-right">Custo Total</th>
                    <th className="py-3 px-4 text-[10px] font-display text-on-surface-variant uppercase tracking-[2px] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const unitCost = item.material_cost + item.labor_cost + item.equipment_cost + item.third_party_cost;
                    const totalCost = unitCost * item.quantity;
                    return (
                      <tr key={item.id} className="border-b border-outline/50 hover:bg-surface-container-highest transition-colors group">
                        <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant">{item.code || '-'}</td>
                        <td className="py-3 px-4 font-display text-sm text-on-surface">{item.description}</td>
                        <td className="py-3 px-4 font-display text-xs text-on-surface-variant uppercase text-center">{item.unit}</td>
                        <td className="py-3 px-4 font-display text-sm text-on-surface text-center font-bold">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, quantity: parseFloat(e.target.value) || 0 } : i))}
                            onBlur={(e) => updateItemQuantity(item.id, e.target.value)}
                            className="w-20 bg-surface-container hover:bg-surface-container-high border border-outline hover:border-primary/50 rounded-lg px-2 py-1 text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                          />
                        </td>
                        <td className="py-3 px-4 font-display text-xs text-on-surface-variant text-right">{formatCurrency(unitCost)}</td>
                        <td className="py-3 px-4 font-display text-sm font-bold text-on-surface text-right">{formatCurrency(totalCost)}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(item)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteClick(item.id)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-low border border-outline rounded-[32px] p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-blue-500/50" />
            <h3 className="font-display font-bold text-sm text-on-surface uppercase tracking-[2px] mb-6">Resumo Financeiro</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Custo Direto Total:</span>
                <span className="font-display font-bold text-on-surface">{formatCurrency(totalCustoDireto)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">BDI ({budget.bdi_percent}%):</span>
                <span className="font-display text-on-surface-variant">{formatCurrency(bdiValor)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Lucro Bruto ({budget.profit_percent}%):</span>
                <span className="font-display text-primary">{formatCurrency(lucroValor)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Impostos ({budget.taxes_percent}%):</span>
                <span className="font-display text-error">{formatCurrency(impostosValor)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-outline">
              <div className="flex justify-between items-center">
                <span className="font-display font-bold text-xs uppercase tracking-[2px] text-on-surface-variant">Preço de Venda</span>
                <span className="text-2xl font-display font-bold text-primary">{formatCurrency(precoVendaFinal)}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline rounded-[32px] p-6 space-y-3">
            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-surface-container-highest hover:bg-outline/50 border border-outline text-on-surface font-bold text-xs uppercase tracking-[2px] rounded-2xl transition-all group">
              <Download className="h-4 w-4 group-hover:-translate-y-1 transition-transform" />
              Exportar Proposta (PDF)
            </button>

            {budget.status !== 'Aprovado' && (
              <button onClick={() => handleChangeStatus('Aprovado')} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-background font-bold text-xs uppercase tracking-[2px] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_-5px_rgba(34,255,136,0.4)]">
                <CheckCircle2 className="h-5 w-5" />
                Aprovar Orçamento
              </button>
            )}

            {budget.status === 'Aprovado' && (
              <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 text-white font-bold text-xs uppercase tracking-[2px] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_-5px_rgba(59,130,246,0.4)]">
                <FileSignature className="h-5 w-5" />
                Gerar Contrato
              </button>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface border border-outline rounded-[32px] p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-xl font-display font-bold text-on-surface mb-6">
              {editingItem ? 'Editar Item da EAP' : 'Adicionar Item à EAP'}
            </h2>

            <form onSubmit={handleAddItem} className="space-y-6">
              <div className="flex gap-4 p-1 bg-surface-container-low rounded-xl w-max mb-6">
                <button type="button" onClick={() => setUseComposition(false)} className={cn("px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[2px] transition-all", !useComposition ? "bg-primary text-background" : "text-on-surface-variant")}>
                  Digitação Manual
                </button>
                <button type="button" onClick={() => setUseComposition(true)} className={cn("px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[2px] transition-all", useComposition ? "bg-primary text-background" : "text-on-surface-variant")}>
                  Usar Banco de Composições
                </button>
              </div>

              {useComposition && (
                <div className="relative">
                  <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">Buscar Composição Base</label>
                  <input
                    type="text"
                    placeholder="Digite para buscar (ex: Alvenaria)..."
                    value={compositionSearch}
                    onChange={e => {
                      setCompositionSearch(e.target.value);
                      setIsDropdownOpen(true);
                      setSelectedCompId(''); // Reset selection if typing
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} // Delay for click event
                    className="w-full bg-surface-container-lowest border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                  />
                  {isDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-surface-container-highest border border-outline rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                      {filteredModalCompositions.length === 0 ? (
                        <div className="p-4 text-sm text-on-surface-variant text-center">Nenhuma composição encontrada.</div>
                      ) : (
                        filteredModalCompositions.map(c => (
                          <div
                            key={c.id}
                            onMouseDown={() => handleCompositionSelect(c)} // onMouseDown fires before onBlur
                            className="p-3 text-xs text-on-surface hover:bg-primary/10 hover:text-primary cursor-pointer border-b border-outline last:border-0 leading-relaxed transition-colors"
                          >
                            <strong className="text-primary">{c.code ? `${c.code} - ` : ''}</strong> {c.description}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {!useComposition && (
                <div className="mb-4">
                  <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2">Tipo do Item</label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as any)}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="service">Serviço</option>
                    <option value="material">Material</option>
                    <option value="equipment">Equipamento</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2">Código</label>
                  <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="01.01" className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-2.5 text-sm outline-none" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2">
                    Descrição do {itemType === 'service' ? 'Serviço' : itemType === 'material' ? 'Material' : 'Equipamento'}
                  </label>
                  <input type="text" required value={description} onChange={e => setDescription(e.target.value)} disabled={useComposition} className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 border-t border-outline pt-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2">Quantidade</label>
                  <input type="text" required value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-2.5 text-sm outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2">Unidade</label>
                  <input type="text" required value={unit} onChange={e => setUnit(e.target.value)} disabled={useComposition} className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                {itemType === 'material' && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2">Custo Material</label>
                    <input type="text" value={materialCost} onChange={e => setMaterialCost(e.target.value)} disabled={useComposition} className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50" />
                  </div>
                )}
                {itemType === 'service' && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2">Custo M. Obra</label>
                    <input type="text" value={laborCost} onChange={e => setLaborCost(e.target.value)} disabled={useComposition} className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50" />
                  </div>
                )}
                {itemType === 'equipment' && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2">Custo Equip.</label>
                    <input type="text" value={equipmentCost} onChange={e => setEquipmentCost(e.target.value)} disabled={useComposition} className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-outline">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-xs uppercase tracking-[2px] text-on-surface-variant hover:text-on-surface transition-colors">Cancelar</button>
                <button type="submit" className="px-8 py-3 bg-primary text-background font-bold text-xs uppercase tracking-[2px] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                  {editingItem ? 'Salvar Alterações' : 'Adicionar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Item da EAP"
        message="Tem certeza que deseja excluir este item do orçamento? O preço final de venda será recalculado."
      />
    </div>
  );
}

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Paperclip, X, ChevronUp, ChevronDown, Filter as FilterIcon, FilterX, Calendar, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { FinancialItem, BudgetItem } from '../../lib/types';
import { cn, formatCurrency, formatDate, sanitizeFileName } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

interface FinanceTabProps {
  projectId: string;
  financialItems: FinancialItem[];
  budgetItems: BudgetItem[];
  onRefresh: () => void;
  readOnly?: boolean;
}

export function FinanceTab({ projectId, financialItems, budgetItems, onRefresh, readOnly }: FinanceTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);
  const [formData, setFormData] = useState<Partial<FinancialItem>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const VALID_CATEGORIES = ['Material', 'Mão de Obra', 'Equipamento', 'Terceirizado', 'Outros'];
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'error' | 'success' }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [filters, setFilters] = useState({
    dateStart: '',
    dateEnd: '',
    category: 'Todas',
    minAmount: '',
    maxAmount: '',
    budgetItemId: ''
  });

  const categories = VALID_CATEGORIES;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${projectId}/${Date.now()}-${sanitizedName}`;
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      setFormData({ ...formData, receipt_url: publicUrl });
    } catch (err: any) {
      console.error(err);
      setAlertConfig({
        isOpen: true,
        title: 'Erro no Upload',
        message: err.message || 'Não foi possível enviar o arquivo.',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.budget_item_linked_id) {
      setAlertConfig({
        isOpen: true,
        title: 'Atenção',
        message: 'Por favor, selecione um item do orçamento para vincular este lançamento.',
        type: 'warning' as any
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('financial_items')
        .upsert({
          ...formData,
          project_id: projectId,
          id: editingItem?.id || undefined
        });

      if (error) throw error;
      setAlertConfig({
        isOpen: true,
        title: 'Sucesso',
        message: 'Lançamento salvo com sucesso!',
        type: 'success'
      });
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return;
    try {
      await supabase.from('financial_items').delete().eq('id', id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    const headers = ['Data', 'Descricao', 'Categoria', 'Vinculo', 'Valor'];
    const rows = sortedItems.map(item => [
      formatDate(item.date),
      item.description.replace(/;/g, ','), // Evitar quebra do CSV
      item.category,
      (budgetItems.find(bi => bi.id === item.budget_item_linked_id)?.description || '').replace(/;/g, ','),
      Number(item.amount).toFixed(2).replace('.', ',')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Financeiro_EquipePro_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = (financialItems || []).filter(i => {
    const matchesSearch = 
      i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.supplier && i.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = (!filters.dateStart || i.date >= filters.dateStart) &&
                        (!filters.dateEnd || i.date <= filters.dateEnd);
    
    const matchesCategory = filters.category === 'Todas' || i.category === filters.category;
    
    const matchesAmount = (!filters.minAmount || Number(i.amount) >= Number(filters.minAmount)) &&
                          (!filters.maxAmount || Number(i.amount) <= Number(filters.maxAmount));

    const matchesBudgetItem = !filters.budgetItemId || i.budget_item_linked_id === filters.budgetItemId;
    
    return matchesSearch && matchesDate && matchesCategory && matchesAmount && matchesBudgetItem;
  });

  const activeFiltersCount = [
    filters.dateStart,
    filters.dateEnd,
    filters.category !== 'Todas',
    filters.minAmount,
    filters.maxAmount,
    filters.budgetItemId
  ].filter(Boolean).length;

  const sortedItems = [...filteredItems].sort((a, b) => {
    let valA: any = a[sortConfig.key as keyof FinancialItem];
    let valB: any = b[sortConfig.key as keyof FinancialItem];

    if (sortConfig.key === 'amount') {
      valA = Number(valA);
      valB = Number(valB);
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const totalFiltered = filteredItems.reduce((acc, i) => acc + Number(i.amount), 0);

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-start justify-between">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          Controle de Custos
          <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-600 font-mono">v2.1</span>
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportExcel}
            title="Exportar para Excel"
            className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all border border-emerald-500/20 group"
          >
            <FileDown className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
          {!readOnly && (
            <button onClick={() => {
              setEditingItem(null);
              const now = new Date();
              const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
              setFormData({ date: localDate, category: 'Material' }); 
              setIsModalOpen(true); 
            }} className="px-5 py-2.5 bg-[#BCB5AC] text-[#1C232E] text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-all shadow-lg shadow-black/20 active:scale-95">
              <Plus className="h-4 w-4" /> Novo Lançamento
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-[#BCB5AC] transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por descrição, fornecedor ou categoria..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-4 bg-[#1C232E] border border-white/5 text-white rounded-2xl focus:border-[#BCB5AC]/50 outline-none transition-all placeholder:text-slate-600 focus:bg-[#1C232E]" 
            />
          </div>
          <button 
            onClick={() => setIsFilterExpanded(!isFilterExpanded)} 
            className={cn(
              "px-6 rounded-2xl border border-white/5 flex items-center gap-2 font-bold text-xs uppercase tracking-widest transition-all relative",
              isFilterExpanded || activeFiltersCount > 0 ? "bg-[#BCB5AC]/10 border-[#BCB5AC]/30 text-[#BCB5AC]" : "bg-[#1C232E] text-slate-400 hover:text-[#1C232E]"
            )}
          >
            {isFilterExpanded ? <X className="h-4 w-4" /> : <FilterIcon className="h-4 w-4" />}
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-slate-700 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center border-2 border-[#0B0F19]">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence>
          {isFilterExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-[#1C232E] rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="space-y-3 min-w-0">
                  <label className="text-[10px] font-black text-[#BCB5AC] uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Período
                  </label>
                  <div className="flex items-center gap-2 min-w-0">
                    <input 
                      type="date" 
                      value={filters.dateStart} 
                      onChange={e => setFilters({ ...filters, dateStart: e.target.value })} 
                      className="flex-1 min-w-0 bg-[#1C232E] border border-white/5 rounded-xl px-2 py-2 text-[10px] text-white focus:border-[#BCB5AC]/50 outline-none transition-all" 
                    />
                    <span className="text-slate-600 font-bold text-[10px]">à</span>
                    <input 
                      type="date" 
                      value={filters.dateEnd} 
                      onChange={e => setFilters({ ...filters, dateEnd: e.target.value })} 
                      className="flex-1 bg-[#1C232E] border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white focus:border-[#BCB5AC]/50 outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-3 min-w-0">
                  <label className="text-[10px] font-black text-[#BCB5AC] uppercase tracking-widest ml-1 flex items-center gap-2">
                    <FilterIcon className="h-3 w-3" /> Categoria
                  </label>
                  <select 
                    value={filters.category} 
                    onChange={e => setFilters({ ...filters, category: e.target.value })} 
                    className="w-full bg-[#1C232E] border border-white/5 rounded-xl px-3 py-2.5 text-[10px] text-white focus:border-[#BCB5AC]/50 outline-none appearance-none cursor-pointer truncate"
                  >
                    <option value="Todas">Todas</option>
                    {VALID_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-3 min-w-0">
                  <label className="text-[10px] font-black text-[#BCB5AC] uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Paperclip className="h-3 w-3" /> Vínculo
                  </label>
                  <select 
                    value={filters.budgetItemId} 
                    onChange={e => setFilters({ ...filters, budgetItemId: e.target.value })} 
                    className="w-full bg-[#1C232E] border border-white/5 rounded-xl px-3 py-2.5 text-[10px] text-white focus:border-[#BCB5AC]/50 outline-none appearance-none cursor-pointer truncate"
                  >
                    <option value="">Todos os itens</option>
                    {budgetItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 min-w-0">
                  <label className="text-[10px] font-black text-[#BCB5AC] uppercase tracking-widest ml-1 flex items-center gap-2">
                    <span className="text-[8px] border border-current rounded px-1">R$</span> Valor
                  </label>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={filters.minAmount} 
                      onChange={e => setFilters({ ...filters, minAmount: e.target.value })} 
                      className="w-full min-w-0 bg-[#1C232E] border border-white/5 rounded-xl px-2 py-2 text-[10px] text-white focus:border-[#BCB5AC]/50 outline-none placeholder:text-slate-700 transition-all" 
                    />
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={filters.maxAmount} 
                      onChange={e => setFilters({ ...filters, maxAmount: e.target.value })} 
                      className="w-full min-w-0 bg-[#1C232E] border border-white/5 rounded-xl px-2 py-2 text-[10px] text-white focus:border-[#BCB5AC]/50 outline-none placeholder:text-slate-700 transition-all" 
                    />
                  </div>
                </div>

                <div className="flex items-end min-w-0">
                  <button 
                    onClick={() => {
                      setFilters({ dateStart: '', dateEnd: '', category: 'Todas', minAmount: '', maxAmount: '', budgetItemId: '' });
                      setSearchTerm('');
                    }}
                    className="w-full h-[38px] bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-red-500/20 shadow-lg shadow-red-500/5 group"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <X className="h-3 w-3 group-hover:rotate-90 transition-transform" />
                      Limpar
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2">
          {VALID_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilters({ ...filters, category: filters.category === cat ? 'Todas' : cat })}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all active:scale-95",
                filters.category === cat 
                  ? "bg-[#BCB5AC] border-[#BCB5AC] text-[#1C232E] shadow-lg shadow-black/30" 
                  : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10"
              )}
            >
              {cat}
            </button>
          ))}
          {activeFiltersCount > 0 && (
            <button 
              onClick={() => {
                setFilters({ dateStart: '', dateEnd: '', category: 'Todas', minAmount: '', maxAmount: '', budgetItemId: '' });
                setSearchTerm('');
              }}
              className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#BCB5AC] flex items-center gap-1 hover:bg-[#BCB5AC]/5 transition-all"
            >
              <X className="h-3 w-3" /> Limpar Filtros
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#1C232E] rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('date')}>
                <div className="flex items-center gap-2">Data {getSortIcon('date')}</div>
              </th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('description')}>
                <div className="flex items-center gap-2">Descrição {getSortIcon('description')}</div>
              </th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Categoria</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('amount')}>
                <div className="flex items-center gap-2">Valor {getSortIcon('amount')}</div>
              </th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(item => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 text-slate-400">{formatDate(item.date)}</td>
                <td className="p-4 text-white">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 font-medium">
                      {item.description}
                      {item.receipt_url && <Paperclip className="h-3.5 w-3.5 text-emerald-500 cursor-pointer hover:scale-110 transition-transform" onClick={() => window.open(item.receipt_url, '_blank')} />}
                    </div>
                    {item.budget_item_linked_id && (
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-[#BCB5AC]" />
                        Vínculo: {budgetItems.find(bi => bi.id === item.budget_item_linked_id)?.description || 'Item não encontrado'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4"><span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">{item.category}</span></td>
                <td className="p-4 text-white font-bold">{formatCurrency(Number(item.amount))}</td>
                {!readOnly && (
                  <td className="p-4 flex gap-2">
                    <button onClick={() => { 
                      setEditingItem(item); 
                      // Se a categoria atual não estiver na lista permitida, força 'Material'
                      const sanitizedCategory = VALID_CATEGORIES.includes(item.category) ? item.category : 'Material';
                      setFormData({ ...item, category: sanitizedCategory }); 
                      setIsModalOpen(true); 
                    }} className="p-1 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#1C232E] rounded-[24px] shadow-2xl border border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100 tracking-tight">Lançamento Financeiro</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-8 pb-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Compra de cimento..."
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#BCB5AC] outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-100 uppercase tracking-widest ml-1 flex items-center gap-2">
                  Vincular Item do Orçamento <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.budget_item_linked_id || ''}
                  required
                  onChange={e => {
                    const itemId = e.target.value;
                    const item = budgetItems.find(i => i.id === itemId);
                    setFormData({
                      ...formData,
                      budget_item_linked_id: itemId,
                      description: !formData.description ? (item ? item.description : '') : formData.description
                    });
                  }}
                  className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#BCB5AC] outline-none appearance-none cursor-pointer"
                >
                  <option value="">Selecione um item do orçamento...</option>
                  {Array.from(new Set(budgetItems.map(i => i.category))).map(cat => (
                    <optgroup key={cat} label={cat} className="bg-[#1C232E]">
                      {budgetItems.filter(i => i.category === cat).map(item => (
                        <option key={item.id} value={item.id}>
                          {item.code ? `${item.code} - ` : ''}{item.description}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                  <select
                    value={formData.category || 'Material'} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })} 
                    className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#BCB5AC] outline-none appearance-none"
                  >
                    {VALID_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Valor (R$)</label>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={formData.amount || 0}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#BCB5AC] outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data do Gasto</label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-[#1C232E] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-[#BCB5AC] outline-none"
                />
              </div>

              <div className="bg-[#1C232E] border border-slate-800 rounded-2xl p-6 space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Paperclip className="h-3 w-3" /> Anexo (Recibo/Nota)
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full border-2 border-dashed border-slate-800 rounded-xl py-6 flex flex-col items-center justify-center gap-2 group-hover:border-[#BCB5AC]/50 transition-colors">
                    <Paperclip className="h-6 w-6 text-slate-600 group-hover:text-[#BCB5AC]" />
                    <span className="text-xs text-slate-500">Clique ou arraste para anexar</span>
                  </div>
                </div>
                {uploading && <p className="text-center text-xs text-[#BCB5AC] font-black animate-pulse">Enviando arquivo...</p>}
                {formData.receipt_url && <p className="text-center text-xs text-emerald-500 font-bold flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Comprovante anexado!</p>}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-8 py-3 bg-[#BCB5AC] text-[#1C232E] text-xs font-bold rounded-xl uppercase tracking-[1.5px] hover:bg-slate-700 transition-all shadow-lg shadow-black/20 active:scale-[0.98]"
                >
                  Confirmar Lançamento
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

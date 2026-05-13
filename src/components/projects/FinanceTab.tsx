import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Paperclip, X, ChevronUp, ChevronDown, Filter as FilterIcon, FilterX, Calendar, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { FinancialItem, BudgetItem } from '../../lib/types';
import { cn, formatCurrency, formatDate, sanitizeFileName } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';
import { ConfirmModal } from '../ui/ConfirmModal';

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
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FinancialItem>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const VALID_CATEGORIES = ['Material', 'Equipamento', 'Terceirizado', 'Entrada', 'Outros'];
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check how many slots are free
    const currentUrls = [formData.receipt_url, formData.receipt_url_2, formData.receipt_url_3].filter(Boolean);
    if (currentUrls.length + files.length > 3) {
      setAlertConfig({
        isOpen: true,
        title: 'Limite atingido',
        message: 'Você pode enviar no máximo 3 anexos por lançamento.',
        type: 'warning' as any
      });
      return;
    }

    setUploading(true);
    try {
      const newUrls = { ...formData };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          throw new Error(`O arquivo ${file.name} excede o limite de 5MB.`);
        }

        const sanitizedName = sanitizeFileName(file.name);
        const fileName = `${projectId}/${Date.now()}-${sanitizedName}`;
        const { error } = await supabase.storage
          .from('receipts')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);

        // Find next empty slot
        if (!newUrls.receipt_url) newUrls.receipt_url = publicUrl;
        else if (!newUrls.receipt_url_2) newUrls.receipt_url_2 = publicUrl;
        else if (!newUrls.receipt_url_3) newUrls.receipt_url_3 = publicUrl;
      }

      setFormData(newUrls);
    } catch (err: any) {
      console.error(err);
      setAlertConfig({
        isOpen: true,
        title: 'Erro no Upload',
        message: err.message || 'Não foi possível enviar os arquivos.',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (slot: 1 | 2 | 3) => {
    if (slot === 1) setFormData({ ...formData, receipt_url: undefined });
    if (slot === 2) setFormData({ ...formData, receipt_url_2: undefined });
    if (slot === 3) setFormData({ ...formData, receipt_url_3: undefined });
  };

  const handleSave = async () => {
    const isEntrada = formData.category?.toLowerCase() === 'entrada';
    if (!formData.budget_item_linked_id && !isEntrada) {
      setAlertConfig({
        isOpen: true,
        title: 'Atenção',
        message: 'Por favor, selecione um item do orçamento para vincular este lançamento (exceto para Entradas).',
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

  const handleDelete = (id: string) => {
    setDeletingItemId(id);
  };

  const confirmDelete = async () => {
    if (!deletingItemId) return;
    try {
      const { error } = await supabase.from('financial_items').delete().eq('id', deletingItemId);
      if (error) throw error;
      setDeletingItemId(null);
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
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
          Controle de Custos
          <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-600 font-mono">v2.1</span>
        </h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            title="Exportar para Excel"
            className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all border border-emerald-500/20 group flex-1 sm:flex-none justify-center flex"
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
            }} className="flex-2 sm:flex-none px-4 sm:px-5 py-2.5 bg-[#BCB5AC] text-[#1C232E] text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-slate-700 transition-all shadow-lg shadow-black/20 active:scale-95 whitespace-nowrap">
              <Plus className="h-4 w-4" /> <span>Novo Lançamento</span>
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

      {/* Desktop Table View */}
      <div className="hidden md:block bg-[#1C232E] rounded-2xl border border-white/5 overflow-hidden">
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
              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(item => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 group">
                <td className="p-4 text-slate-400 text-sm">{formatDate(item.date)}</td>
                <td className="p-4 text-white">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 font-medium">
                      {item.description}
                      <div className="flex gap-1.5">
                        {[item.receipt_url, item.receipt_url_2, item.receipt_url_3].filter(Boolean).map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => window.open(url, '_blank')}
                            title={`Ver anexo ${idx + 1}`}
                            className="p-1 hover:bg-emerald-500/10 rounded transition-colors"
                          >
                            <Paperclip className="h-3.5 w-3.5 text-emerald-500 hover:scale-110 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                    {item.budget_item_linked_id && (
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-[#BCB5AC]" />
                        Vínculo: {budgetItems.find(bi => bi.id === item.budget_item_linked_id)?.description || 'Item não encontrado'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4"><span className="px-2 py-1 bg-slate-800 rounded text-[10px] uppercase font-bold text-slate-400">{item.category}</span></td>
                <td className="p-4 text-white font-bold">{formatCurrency(Number(item.amount))}</td>
                {!readOnly && (
                  <td className="p-4">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => {
                        setEditingItem(item);
                        const sanitizedCategory = VALID_CATEGORIES.includes(item.category) ? item.category : 'Material';
                        setFormData({ ...item, category: sanitizedCategory });
                        setIsModalOpen(true);
                      }} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-all"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedItems.map(item => (
          <div key={item.id} className="bg-[#1C232E] rounded-2xl border border-white/5 p-5 space-y-4 relative overflow-hidden group active:bg-white/5 transition-colors">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-[#BCB5AC] uppercase tracking-widest block">
                  {formatDate(item.date)}
                </span>
                <h3 className="text-white font-bold text-lg leading-tight">
                  {item.description}
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-black uppercase text-slate-400">
                    {item.category}
                  </span>
                  {[item.receipt_url, item.receipt_url_2, item.receipt_url_3].filter(Boolean).map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => window.open(url, '_blank')}
                      className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase"
                    >
                      <Paperclip className="h-3 w-3" /> Anexo {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-white">
                  {formatCurrency(Number(item.amount))}
                </div>
              </div>
            </div>

            {item.budget_item_linked_id && (
              <div className="pt-3 border-t border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#BCB5AC] mt-1 shrink-0" />
                  <span className="leading-relaxed">
                    Vínculo: <span className="text-slate-400">{budgetItems.find(bi => bi.id === item.budget_item_linked_id)?.description || 'Item não encontrado'}</span>
                  </span>
                </span>
              </div>
            )}

            {!readOnly && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    const sanitizedCategory = VALID_CATEGORIES.includes(item.category) ? item.category : 'Material';
                    setFormData({ ...item, category: sanitizedCategory });
                    setIsModalOpen(true);
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Edit className="h-4 w-4" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-all active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        {sortedItems.length === 0 && (
          <div className="p-12 bg-[#1C232E] rounded-2xl border border-white/5 text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Search className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-slate-500 font-bold">Nenhum lançamento encontrado para os filtros selecionados.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-[#0B0F19]/95 sm:backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#1C232E] rounded-none sm:rounded-[24px] shadow-2xl border-x-0 sm:border border-slate-800 w-full h-full sm:h-auto sm:max-w-lg overflow-y-auto animate-in zoom-in-95 duration-200">
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
                  Vincular Item do Orçamento {formData.category !== 'Entrada' && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={formData.budget_item_linked_id || ''}
                  required={formData.category !== 'Entrada'}
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
                  {(() => {
                    const sortedItems = [...budgetItems]
                      .filter(item => item.category.localeCompare('Mão de Obra', undefined, { sensitivity: 'base' }) !== 0)
                      .sort((a, b) => 
                        (a.code || '').localeCompare(b.code || '', undefined, { numeric: true })
                      );
                    
                    const groups: { category: string, items: any[] }[] = [];
                    let currentGroup: { category: string, items: any[] } | null = null;

                    sortedItems.forEach(item => {
                      if (!currentGroup || currentGroup.category !== item.category) {
                        currentGroup = { category: item.category, items: [] };
                        groups.push(currentGroup);
                      }
                      currentGroup.items.push(item);
                    });

                    return groups.map((group, idx) => (
                      <optgroup key={`${group.category}-${idx}`} label={group.category} className="bg-[#1C232E]">
                        {group.items.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.code ? `${item.code} - ` : ''}{item.description}
                          </option>
                        ))}
                      </optgroup>
                    ));
                  })()}
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
                    value={formData.amount || ''}
                    onChange={e => setFormData({ ...formData, amount: e.target.value === '' ? undefined : Number(e.target.value) })}
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

              <div className="bg-[#1C232E] border border-slate-800 rounded-2xl p-6 space-y-4">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-3 w-3" /> Anexos (Máx: 3)
                  </div>
                  <span className="text-[9px] text-slate-600 font-mono">
                    {[formData.receipt_url, formData.receipt_url_2, formData.receipt_url_3].filter(Boolean).length}/3
                  </span>
                </label>

                {/* Lista de Anexos já enviados */}
                <div className="space-y-2">
                  {[
                    { url: formData.receipt_url, slot: 1 },
                    { url: formData.receipt_url_2, slot: 2 },
                    { url: formData.receipt_url_3, slot: 3 }
                  ].filter(a => a.url).map((anexo, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-900/50 rounded-xl px-4 py-2 border border-slate-800 group">
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs text-slate-400 font-medium">Anexo {i + 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => window.open(anexo.url, '_blank')} className="text-[10px] font-bold text-emerald-500 hover:underline">Ver</button>
                        <button onClick={() => removeAttachment(anexo.slot as 1 | 2 | 3)} className="p-1.5 text-slate-600 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botão de Upload se houver vaga */}
                {[formData.receipt_url, formData.receipt_url_2, formData.receipt_url_3].filter(Boolean).length < 3 && (
                  <div className="relative group">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full border-2 border-dashed border-slate-800 rounded-xl py-6 flex flex-col items-center justify-center gap-2 group-hover:border-[#BCB5AC]/50 transition-colors bg-slate-900/20">
                      <Plus className="h-5 w-5 text-slate-600 group-hover:text-[#BCB5AC]" />
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Adicionar comprovante</span>
                    </div>
                  </div>
                )}

                {uploading && (
                  <div className="flex items-center justify-center gap-3 py-2">
                    <div className="w-3 h-3 border-2 border-[#BCB5AC] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-[#BCB5AC] font-black uppercase tracking-widest">Enviando arquivos...</p>
                  </div>
                )}
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

      <ConfirmModal
        isOpen={!!deletingItemId}
        onClose={() => setDeletingItemId(null)}
        onConfirm={confirmDelete}
        title="Excluir Lançamento?"
        message="Tem certeza que deseja excluir este registro financeiro? Esta ação não pode ser desfeita."
      />

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

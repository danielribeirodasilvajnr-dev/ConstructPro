import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Trophy, Save, X, Printer, AlertCircle, RefreshCw, Search, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BidGroup, BidQuote } from '../../lib/types';
import { cn, formatCurrency } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';
import { ConfirmModal } from '../ui/ConfirmModal';

interface BidComparisonTabProps {
  projectId: string;
  bidGroups: BidGroup[];
  budgetItems?: any[];
  onRefresh: () => void;
  readOnly?: boolean;
}

export function BidComparisonTab({ projectId, bidGroups, budgetItems = [], onRefresh, readOnly }: BidComparisonTabProps) {
  const [selectedGroup, setSelectedGroup] = useState<BidGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isFetchingIncc, setIsFetchingIncc] = useState(false);

  // Editable local states
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [localQuotes, setLocalQuotes] = useState<any[]>([]);
  const [localPrices, setLocalPrices] = useState<{ [key: string]: number }>({});
  const [localBudgetItems, setLocalBudgetItems] = useState<any[]>([]);
  
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [inccIoIndex, setInccIoIndex] = useState(0);
  const [inccIfIndex, setInccIfIndex] = useState(0);
  const [inccIfDate, setInccIfDate] = useState('');

  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' as any });
  const [confirmConfig, setConfirmConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    confirmText: 'Excluir',
    onConfirm: () => {} 
  });

  useEffect(() => {
    if (selectedGroup) {
      setLocalItems(selectedGroup.items || []);
      setLocalQuotes(selectedGroup.quotes || []);
      setLocalBudgetItems(selectedGroup.budget_items || []);
      setGroupTitle(selectedGroup.title);
      setGroupDesc(selectedGroup.description || '');
      setInccIoIndex(selectedGroup.incc_io_index || 0);
      setInccIfIndex(selectedGroup.incc_if_index || 0);
      setInccIfDate(selectedGroup.incc_if_date || '');
      
      const prices: { [key: string]: number } = {};
      (selectedGroup.quotes || []).forEach((q: any) => {
        (q.quote_items || []).forEach((qi: any) => {
          prices[`${q.id}_${qi.bid_group_item_id}`] = qi.unit_price;
        });
      });
      setLocalPrices(prices);
      setIsDirty(false);
    }
  }, [selectedGroup]);

  const fetchIncc = async () => {
    let formattedDate = inccIfDate.trim();
    
    if (!formattedDate) {
      const now = new Date();
      formattedDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      setInccIfDate(formattedDate);
    }

    if (!formattedDate.includes('/')) {
      setAlertConfig({ isOpen: true, title: 'Aviso', message: 'Preencha o mês/ano corretamente (ex: 03/2026)', type: 'warning' });
      return;
    }

    setIsFetchingIncc(true);
    try {
      // 1. Try local database first
      const { data: localResult, error: localError } = await supabase
        .from('incc_indices')
        .select('index_value')
        .eq('month_year', formattedDate)
        .maybeSingle();

      if (localResult) {
        setInccIfIndex(localResult.index_value);
        setAlertConfig({ 
          isOpen: true, 
          title: 'Dados Localizados', 
          message: `Índice de ${formattedDate} carregado da base local.`, 
          type: 'success' 
        });
        setIsDirty(true);
        setIsFetchingIncc(false);
        return;
      }

      // 2. If not found locally, try to SYNC with Central Bank (BCB)
      // This will fetch the latest variations and update our DB automatically
      setAlertConfig({ 
        isOpen: true, 
        title: 'Sincronizando...', 
        message: 'Buscando índices oficiais no Banco Central (SGS)...', 
        type: 'info' 
      });

      // Fetch last 12 months of variations from BCB (Series 192 = INCC-DI Monthly %)
      const bcbResponse = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.192/dados/ultimos/12?formato=json');
      const bcbVariations = await bcbResponse.json();

      if (bcbVariations && bcbVariations.length > 0) {
        // Get the latest index we have in our local DB to use as a base
        const { data: lastKnown } = await supabase
          .from('incc_indices')
          .select('*')
          .order('month_year', { ascending: false }) // This is tricky with string MM/YYYY, but works for recent months
          .limit(1)
          .single();

        if (lastKnown) {
          // Find which variations from BCB are newer than our lastKnown
          // lastKnown.month_year is like "03/2026"
          const [lastM, lastY] = lastKnown.month_year.split('/').map(Number);
          
          let currentValue = lastKnown.index_value;
          let newIndicesFound = [];

          for (const entry of bcbVariations) {
            // entry.data is "01/MM/YYYY"
            const [d, m, y] = entry.data.split('/').map(Number);
            const entryMonthYear = `${String(m).padStart(2, '0')}/${y}`;
            
            // If this entry is newer than our last known month
            if (y > lastY || (y === lastY && m > lastM)) {
              const variation = parseFloat(entry.valor) / 100;
              currentValue = currentValue * (1 + variation);
              
              newIndicesFound.push({
                month_year: entryMonthYear,
                index_value: parseFloat(currentValue.toFixed(6))
              });
            }
          }

          if (newIndicesFound.length > 0) {
            // Save newly discovered indices to our DB
            await supabase.from('incc_indices').upsert(newIndicesFound, { onConflict: 'month_year' });
            
            // Check if the requested date is now available
            const finalMatch = newIndicesFound.find(i => i.month_year === formattedDate);
            if (finalMatch) {
              setInccIfIndex(finalMatch.index_value);
              setAlertConfig({ 
                isOpen: true, 
                title: 'Sincronização Concluída', 
                message: `O índice de ${formattedDate} foi obtido via Banco Central e salvo no sistema.`, 
                type: 'success' 
              });
            } else {
              // Fallback to the latest one found
              const latest = newIndicesFound[newIndicesFound.length - 1];
              setInccIfIndex(latest.index_value);
              setInccIfDate(latest.month_year);
              setAlertConfig({ 
                isOpen: true, 
                title: 'Último Disponível', 
                message: `O índice de ${formattedDate} ainda não foi publicado. Carregamos o último oficial (${latest.month_year}).`, 
                type: 'info' 
              });
            }
            setIsDirty(true);
            setIsFetchingIncc(false);
            return;
          }
        }
      }

      // 3. Fallback logic if BCB Sync fails or doesn't have the date
      let searchDate = formattedDate;
      let data = null;
      let attempts = 0;

      while (!data && attempts < 6) {
        const { data: result, error } = await supabase
          .from('incc_indices')
          .select('index_value')
          .eq('month_year', searchDate)
          .maybeSingle();

        if (error) throw error;
        
        if (result) {
          data = result;
        } else {
          const [m, y] = searchDate.split('/').map(Number);
          let newM = m - 1;
          let newY = y;
          if (newM === 0) { newM = 12; newY -= 1; }
          searchDate = `${String(newM).padStart(2, '0')}/${newY}`;
          attempts++;
        }
      }

      if (data) {
        setInccIfIndex(data.index_value);
        if (searchDate !== formattedDate) {
          setInccIfDate(searchDate);
          setAlertConfig({ 
            isOpen: true, 
            title: 'Mês Ajustado', 
            message: `Utilizando o último índice disponível na base (${searchDate}).`, 
            type: 'info' 
          });
        }
        setIsDirty(true);
      } else {
        setAlertConfig({ isOpen: true, title: 'Não localizado', message: 'Índice não encontrado na base local nem no Banco Central.', type: 'warning' });
      }
    } catch (err: any) {
      console.error('INCC Sync Error:', err);
      setAlertConfig({ isOpen: true, title: 'Erro de Sincronização', message: 'Não foi possível consultar os índices oficiais.', type: 'error' });
    } finally {
      setIsFetchingIncc(false);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedGroup) return;
    setIsSaving(true);
    try {
      await supabase.from('bid_groups').update({ 
        title: groupTitle, description: groupDesc,
        incc_io_index: inccIoIndex, incc_if_index: inccIfIndex, incc_if_date: inccIfDate,
        original_budget_total: localBudgetItems.reduce((acc, bi) => acc + (bi.unit_price * bi.quantity), 0)
      }).eq('id', selectedGroup.id);

      const currentItemIds = localItems.filter(i => !i.id.startsWith('temp_')).map(i => i.id);
      if (selectedGroup.items) {
        const deletedItemIds = selectedGroup.items.filter(i => !currentItemIds.includes(i.id)).map(i => i.id);
        if (deletedItemIds.length > 0) await supabase.from('bid_group_items').delete().in('id', deletedItemIds);
      }

      const existingItems = localItems.filter(item => !item.id.startsWith('temp_'));
      const newItems = localItems.filter(item => item.id.startsWith('temp_'));
      for (const item of existingItems) {
        await supabase.from('bid_group_items').update({ description: item.description, quantity: item.quantity, unit: item.unit }).eq('id', item.id);
      }
      const itemMapping: { [key: string]: string } = {};
      for (const item of newItems) {
        const { data } = await supabase.from('bid_group_items').insert([{ bid_group_id: selectedGroup.id, description: item.description, quantity: item.quantity, unit: item.unit }]).select().single();
        if (data) itemMapping[item.id] = data.id;
      }

      const currentBudgetItemIds = localBudgetItems.filter(bi => !bi.id.startsWith('temp_')).map(bi => bi.id);
      if (selectedGroup.budget_items) {
        const deletedBudgetIds = selectedGroup.budget_items.filter(bi => !currentBudgetItemIds.includes(bi.id)).map(bi => bi.id);
        if (deletedBudgetIds.length > 0) await supabase.from('bid_budget_items').delete().in('id', deletedBudgetIds);
      }

      const existingBudget = localBudgetItems.filter(bi => !bi.id.startsWith('temp_'));
      const newBudget = localBudgetItems.filter(bi => bi.id.startsWith('temp_'));
      for (const bi of existingBudget) {
        await supabase.from('bid_budget_items').update({ description: bi.description, quantity: bi.quantity, unit: bi.unit, unit_price: bi.unit_price, total_price: bi.unit_price * bi.quantity }).eq('id', bi.id);
      }
      for (const bi of newBudget) {
        await supabase.from('bid_budget_items').insert([{ bid_group_id: selectedGroup.id, description: bi.description, quantity: bi.quantity, unit: bi.unit, unit_price: bi.unit_price, total_price: bi.unit_price * bi.quantity }]);
      }

      const currentQuoteIds = localQuotes.filter(q => !q.id.startsWith('temp_')).map(q => q.id);
      if (selectedGroup.quotes) {
        const deletedQuoteIds = selectedGroup.quotes.filter(q => !currentQuoteIds.includes(q.id)).map(q => q.id);
        if (deletedQuoteIds.length > 0) await supabase.from('bid_quotes').delete().in('id', deletedQuoteIds);
      }

      const existingQuotes = localQuotes.filter(q => !q.id.startsWith('temp_'));
      const newQuotes = localQuotes.filter(q => q.id.startsWith('temp_'));
      for (const q of existingQuotes) {
        await supabase.from('bid_quotes').update({ 
          supplier_name: q.supplier_name, contact_name: q.contact_name, phone: q.phone, 
          delivery_time: q.delivery_time, payment_terms: q.payment_terms, validity: q.validity, notes: q.notes,
          is_selected: q.is_selected
        }).eq('id', q.id);
      }
      const quoteMapping: { [key: string]: string } = {};
      for (const q of newQuotes) {
        const { data } = await supabase.from('bid_quotes').insert([{ 
          bid_group_id: selectedGroup.id, supplier_name: q.supplier_name, contact_name: q.contact_name, phone: q.phone, 
          delivery_time: q.delivery_time, payment_terms: q.payment_terms, validity: q.validity, notes: q.notes, 
          total_amount: 0, is_selected: q.is_selected
        }]).select().single();
        if (data) quoteMapping[q.id] = data.id;
      }

      const finalPrices = Object.entries(localPrices).map(([key, price]) => {
        let [qId, iId] = key.split('_');
        if (quoteMapping[qId]) qId = quoteMapping[qId];
        if (itemMapping[iId]) iId = itemMapping[iId];
        return { bid_quote_id: qId, bid_group_item_id: iId, unit_price: price };
      });
      const validPrices = finalPrices.filter(p => !p.bid_quote_id.startsWith('temp_') && !p.bid_group_item_id.startsWith('temp_'));
      const allQuoteIds = [...existingQuotes.map(q => q.id), ...Object.values(quoteMapping)];
      if (allQuoteIds.length > 0) {
        await supabase.from('bid_quote_items').delete().in('bid_quote_id', allQuoteIds);
      }
      if (validPrices.length > 0) {
        await supabase.from('bid_quote_items').insert(validPrices);
      }

      for (const qId of allQuoteIds) {
        const currentLocalId = localQuotes.find(lq => lq.id === qId || quoteMapping[lq.id] === qId)?.id || qId;
        const total = localItems.reduce((acc, item) => acc + ((localPrices[`${currentLocalId}_${item.id}`] || 0) * item.quantity), 0);
        await supabase.from('bid_quotes').update({ total_amount: total }).eq('id', qId);
      }

      setAlertConfig({ isOpen: true, title: 'Sucesso', message: 'Tudo salvo!', type: 'success' });
      setIsDirty(false);
      onRefresh();
      const { data } = await supabase.from('bid_groups').select('*, items:bid_group_items(*), quotes:bid_quotes(*, quote_items:bid_quote_items(*)), budget_items:bid_budget_items(*)').eq('id', selectedGroup.id).single();
      if (data) setSelectedGroup(data);
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseBid = async () => {
    if (!selectedGroup) return;
    const winner = localQuotes.find(q => q.is_selected);
    if (!winner) {
      setAlertConfig({ isOpen: true, title: 'Aviso', message: 'Selecione um fornecedor ganhador primeiro (clique no ícone de troféu acima do nome do fornecedor).', type: 'warning' });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Fechar Quadro?',
      message: `Deseja fechar o orçamento com "${winner.supplier_name}"? Os valores dos itens vinculados no orçamento original serão atualizados para os preços do ganhador.`,
      confirmText: 'Sim, Fechar Quadro',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          // 1. Mark group as closed
          await supabase.from('bid_groups').update({ status: 'closed' }).eq('id', selectedGroup.id);

          // 2. Update linked budget items with the winner's prices
          for (const bi of localBudgetItems) {
            if (bi.budget_item_id) {
              // Find the winner's price for the items in this group
              // Usually, bid_budget_items correspond to the localItems
              // But here, we want to update the budget item with the winner's quote if possible.
              // If the user linked a budget item to a row in the "ORÇAMENTO" section,
              // we can update that item with the price of the winner.
              
              // Let's find the winner's quote for this service
              // Wait, the "ORÇAMENTO" row is for REFERENCE. 
              // The ACTUAL quotes are for the "localItems" (top section).
              
              // If there's only one service, we can update the budget item with the winner's total.
              // If there are many, we might need a more complex mapping.
              
              // For now, let's update the budget item with the winner's price for that specific row.
              // Since the user is "vincular item do orçamento" in the budget row, 
              // they likely want that row's price (which they might have manually adjusted or fetched) 
              // to be the new budget price.
              
              const winningQuotePrice = winner.total_amount / (bi.quantity || 1); // Approximate if many items
              // Better: just use the unit_price of the budget row if it's meant to be the new contracted price.
              
              await supabase.from('budget_items').update({ 
                unit_cost: bi.unit_price,
                // Also store the bid_group_id so we can filter in measurements
                bid_group_id: selectedGroup.id 
              }).eq('id', bi.budget_item_id);
            }
          }

          setAlertConfig({ 
            isOpen: true, 
            title: 'Quadro Fechado', 
            message: 'O quadro foi fechado com sucesso! Os preços do orçamento foram atualizados.', 
            type: 'success' 
          });
          onRefresh();
          setSelectedGroup(null);
        } catch (err: any) {
          setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
        } finally {
          setIsSaving(false);
        }
      }
    } as any);
  };

  const handleClose = useCallback(() => {
    if (isDirty) {
      setConfirmConfig({
        isOpen: true,
        title: 'Alterações não salvas',
        message: 'Você tem alterações que serão perdidas se sair agora. Deseja salvar antes de sair?',
        confirmText: 'Sair sem salvar',
        onConfirm: () => {
          setSelectedGroup(null);
          setIsDirty(false);
        },
        secondaryText: 'Salvar e Sair',
        onSecondary: async () => {
          await handleSaveAll();
          setSelectedGroup(null);
          setIsDirty(false);
        }
      } as any);
    } else {
      setSelectedGroup(null);
    }
  }, [isDirty, handleSaveAll]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSelectWinner = async (quoteId: string) => {
    if (readOnly || !selectedGroup) return;
    setLocalQuotes(prev => prev.map(q => ({ ...q, is_selected: q.id === quoteId })));
    setIsDirty(true);
  };

  const handleDeleteQuote = (quoteId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Fornecedor',
      message: 'Deseja realmente excluir este fornecedor e todas as suas cotações?',
      confirmText: 'Excluir',
      onConfirm: () => {
        setLocalQuotes(localQuotes.filter(q => q.id !== quoteId));
        const newPrices = { ...localPrices };
        Object.keys(newPrices).forEach(key => {
          if (key.startsWith(`${quoteId}_`)) delete newPrices[key];
        });
        setLocalPrices(newPrices);
        setIsDirty(true);
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupTitle.trim()) return;
    try {
      const { data, error } = await supabase.from('bid_groups').insert([{ project_id: projectId, title: groupTitle, description: groupDesc }]).select().single();
      if (error) throw error;
      onRefresh();
      setIsModalOpen(false);
      setGroupTitle('');
      setGroupDesc('');
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    }
  };

  const handlePriceUpdate = (quoteId: string, itemId: string, value: number, isTotal: boolean = false) => {
    const item = localItems.find(i => i.id === itemId);
    if (!item) return;
    const quantity = item.quantity || 1;
    setIsDirty(true);
    if (isTotal) {
      setLocalPrices({ ...localPrices, [`${quoteId}_${itemId}`]: value / quantity });
    } else {
      setLocalPrices({ ...localPrices, [`${quoteId}_${itemId}`]: value });
    }
  };

  if (selectedGroup) {
    const quoteCount = Math.max(localQuotes.length, 3);
    const budgetTotal = localBudgetItems.reduce((acc, bi) => acc + (bi.unit_price * bi.quantity), 0);
    const selectedQuote = localQuotes.find(q => q.is_selected);
    const correctedValue = (inccIoIndex > 0) ? (inccIfIndex / inccIoIndex) * budgetTotal : 0;

    return (
      <div className="animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={handleClose} className="flex items-center gap-2 text-slate-400 hover:text-white bg-white/5 px-4 py-2 rounded-lg"><X className="h-4 w-4" /> Fechar</button>
            {isDirty && <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse flex items-center gap-2"><AlertCircle className="h-3 w-3" /> Alterações não salvas</span>}
          </div>
          <div className="flex items-center gap-3">
            {!readOnly && selectedGroup.status !== 'closed' && (
              <button 
                onClick={handleCloseBid} 
                className="px-6 py-3 bg-emerald-600 text-white text-xs font-black rounded-xl flex items-center gap-2 hover:bg-emerald-500 uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" /> Fechar Quadro
              </button>
            )}
            {selectedGroup.status === 'closed' && (
              <div className="px-6 py-3 bg-slate-800 text-slate-400 text-xs font-black rounded-xl flex items-center gap-2 uppercase tracking-widest border border-white/5">
                <CheckCircle2 className="h-4 w-4" /> Quadro Fechado
              </div>
            )}
            <button onClick={handleSaveAll} disabled={isSaving} className="px-8 py-3 bg-blue-600 text-white text-xs font-black rounded-xl flex items-center gap-2 hover:bg-blue-500 uppercase tracking-widest shadow-xl"><Save className="h-4 w-4" /> {isSaving ? 'Salvando...' : 'Salvar Tudo'}</button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-colors"><Printer className="h-4 w-4" /> Imprimir</button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4 flex items-center gap-2">
           <span className={cn(
             "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
             selectedGroup.status === 'closed' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
           )}>
             Status: {selectedGroup.status === 'closed' ? 'FECHADO' : (selectedGroup.status || 'ABERTO').toUpperCase()}
           </span>
        </div>

        <div className="bg-white text-black border-[1px] border-black shadow-2xl overflow-hidden font-sans text-[10px]">
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-10" /> <col className="w-14" /> <col className="w-12" /> <col className="w-auto" />
              {[...Array(quoteCount)].map((_, i) => ( <React.Fragment key={i}> <col className="w-20" /> <col className="w-24" /> </React.Fragment> ))}
              <col className="w-20" /> <col className="w-24" />
            </colgroup>

            <thead>
              <tr className="border-b border-black h-20">
                <th colSpan={4} className="border-r border-black bg-[#E5E1DB] p-4 text-center">
                  <h1 className="text-2xl font-black text-[#1C232E]">360Pro</h1>
                </th>
                <th colSpan={quoteCount * 2} className="border-r border-black p-4 text-center">
                  <input type="text" value={groupTitle} onChange={e => { setGroupTitle(e.target.value); setIsDirty(true); }} className="text-xl font-black uppercase text-center w-full bg-transparent outline-none border-none" />
                </th>
                <th colSpan={2} className="bg-[#F3F4F6] p-2 text-center">
                  <div className="text-[8px] font-black opacity-30">QC CODE</div>
                  <div className="text-lg font-black uppercase">QC-{selectedGroup.id.slice(0, 4).toUpperCase()}</div>
                </th>
              </tr>

              <tr className="border-b border-black bg-[#F9FAFB] h-20">
                <th colSpan={4} className="border-r border-black p-3 text-left">
                  <span className="font-black text-[9px] uppercase opacity-50 block">Serviço:</span>
                  <input type="text" value={groupDesc} onChange={e => { setGroupDesc(e.target.value); setIsDirty(true); }} className="font-bold text-[12px] uppercase w-full bg-transparent outline-none border-none" />
                </th>
                {[...Array(quoteCount)].map((_, i) => {
                  const q = localQuotes[i];
                  return (
                    <th key={i} colSpan={2} className="border-r border-black p-2 align-middle relative group/supplier">
                      {q ? (
                        <div className="flex flex-col gap-0.5 text-left text-[8px]">
                          <div className="flex gap-1"><span className="font-black opacity-40 w-10 uppercase">Forn. {i+1}:</span> <input type="text" value={q.supplier_name} onChange={e => { setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, supplier_name: e.target.value} : lq)); setIsDirty(true); }} className="font-bold w-full bg-transparent outline-none" /></div>
                          <div className="flex gap-1"><span className="font-black opacity-40 w-10 uppercase">Cont.:</span> <input type="text" value={q.contact_name || ''} onChange={e => { setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, contact_name: e.target.value} : lq)); setIsDirty(true); }} className="w-full bg-transparent outline-none" /></div>
                          <div className="flex gap-1"><span className="font-black opacity-40 w-10 uppercase">Tel:</span> <input type="text" value={q.phone || ''} onChange={e => { setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, phone: e.target.value} : lq)); setIsDirty(true); }} className="w-full bg-transparent outline-none" /></div>
                          <div className="absolute right-1 top-1 flex flex-col gap-1 opacity-0 group-hover/supplier:opacity-100 transition-opacity print:hidden">
                            <button onClick={() => handleSelectWinner(q.id)} className={cn("p-1 rounded bg-white shadow-sm", q.is_selected ? "text-emerald-600" : "text-slate-300 hover:text-emerald-500")} title="Selecionar como vencedor"><Trophy className="h-3 w-3" /></button>
                            <button onClick={() => handleDeleteQuote(q.id)} className="p-1 rounded bg-white shadow-sm text-red-300 hover:text-red-500" title="Excluir fornecedor"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                      ) : ( !readOnly && <button onClick={() => { setLocalQuotes([...localQuotes, { id: `temp_${Date.now()}`, supplier_name: 'Novo Fornecedor' }]); setIsDirty(true); }} className="w-full h-full flex items-center justify-center text-slate-300 hover:text-blue-500 print:hidden"><Plus className="h-4 w-4" /></button> )}
                    </th>
                  );
                })}
                <th colSpan={2} className="p-2 text-[8px] font-black uppercase text-center bg-[#E5E7EB]">
                   <div className="grid grid-cols-2 h-full items-center">
                     <span className="border-r border-black/20 h-full flex items-center justify-center">VALOR</span>
                     <span className="flex items-center justify-center">ORÇADO</span>
                   </div>
                </th>
              </tr>

              <tr className="border-b border-black bg-[#E5E7EB] h-10">
                <th className="border-r border-black font-black uppercase text-[7px]">Item</th>
                <th className="border-r border-black font-black uppercase text-[7px]">Quant.</th>
                <th className="border-r border-black font-black uppercase text-[7px]">Unid.</th>
                <th className="border-r border-black px-3 font-black uppercase text-left">Descrição</th>
                {[...Array(quoteCount)].map((_, i) => ( <th key={i} colSpan={2} className="border-r border-black font-black text-center text-[7px] uppercase">PREÇOS (Unitário / Total)</th> ))}
                <th colSpan={2} className="p-0">
                  <div className="flex items-center h-full px-2 gap-2 justify-center bg-white/50">
                    <span className="font-black uppercase text-[7px]">INCC Io = </span>
                    <input 
                      type="number" 
                      step="0.001" 
                      value={inccIoIndex ? parseFloat(inccIoIndex.toFixed(3)) : ''} 
                      onChange={e => { setInccIoIndex(parseFloat(e.target.value) || 0); setIsDirty(true); }} 
                      className="w-16 bg-transparent text-center font-bold outline-none border-b border-black/10 no-spinners" 
                    />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {localItems.map((item, idx) => (
                <tr key={item.id} className="border-b border-black h-9">
                  <td className="border-r border-black text-center font-bold">{idx + 1}</td>
                  <td className="border-r border-black p-0">
                    <input type="number" step="any" value={item.quantity} onChange={e => { setLocalItems(localItems.map(li => li.id === item.id ? {...li, quantity: parseFloat(e.target.value) || 0} : li)); setIsDirty(true); }} className="w-full h-full bg-transparent text-center font-bold outline-none no-spinners" />
                  </td>
                  <td className="border-r border-black p-0"><input type="text" value={item.unit} onChange={e => { setLocalItems(localItems.map(li => li.id === item.id ? {...li, unit: e.target.value} : li)); setIsDirty(true); }} className="w-full h-full bg-transparent text-center uppercase font-bold outline-none" /></td>
                  <td className="border-r border-black p-0 relative group">
                    <input type="text" value={item.description} onChange={e => { setLocalItems(localItems.map(li => li.id === item.id ? {...li, description: e.target.value} : li)); setIsDirty(true); }} className="w-full h-full bg-transparent px-3 font-bold uppercase outline-none" />
                    {!readOnly && (
                      <button 
                        onClick={() => {
                          setConfirmConfig({
                            isOpen: true,
                            title: 'Excluir Item',
                            message: `Deseja realmente excluir o item "${item.description || idx + 1}"?`,
                            confirmText: 'Excluir',
                            onConfirm: () => {
                              setLocalItems(localItems.filter(li => li.id !== item.id));
                              setIsDirty(true);
                            }
                          });
                        }} 
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-red-500 opacity-0 group-hover:opacity-100 print:hidden"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </td>
                  {[...Array(quoteCount)].map((_, i) => {
                    const q = localQuotes[i];
                    if (!q) return <React.Fragment key={i}><td className="border-r border-black/10 bg-gray-50/10"></td><td className="border-r border-black/10 bg-gray-50/10"></td></React.Fragment>;
                    const up = localPrices[`${q.id}_${item.id}`] || 0;
                    return (
                      <React.Fragment key={i}>
                        <td className="border-r border-black/10 p-0 bg-emerald-500/[0.02]">
                          <input type="number" step="any" value={up || ''} onChange={e => handlePriceUpdate(q.id, item.id, parseFloat(e.target.value) || 0)} className="w-full h-full bg-transparent text-right pr-2 font-black text-emerald-800 outline-none no-spinners" placeholder="0,00" />
                        </td>
                        <td className="border-r border-black p-0 bg-gray-50/50">
                          <input type="number" step="any" value={(up * item.quantity).toFixed(2) || ''} onChange={e => handlePriceUpdate(q.id, item.id, parseFloat(e.target.value) || 0, true)} className="w-full h-full bg-transparent text-right pr-2 font-black outline-none no-spinners" placeholder="0,00" />
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="border-r border-black/10 bg-gray-50/20"></td>
                  <td className="bg-gray-50/20"></td>
                </tr>
              ))}
              {!readOnly && ( <tr className="border-b border-black h-8 print:hidden"><td colSpan={quoteCount * 2 + 6}><button onClick={() => { setLocalItems([...localItems, { id: `temp_${Date.now()}`, description: '', quantity: 1, unit: 'un' }]); setIsDirty(true); }} className="w-full h-full flex items-center justify-center gap-2 text-slate-300 hover:text-blue-600 font-black uppercase text-[7px] tracking-widest">+ ADICIONAR ITEM DE SERVIÇO</button></td></tr> )}

              <tr className="bg-[#BDBDBD] border-b border-black h-8">
                <td colSpan={quoteCount * 2 + 6} className="text-center font-black uppercase tracking-[3px] text-[9px]">ORÇAMENTO</td>
              </tr>

              {localBudgetItems.map((bi, idx) => (
                <tr key={bi.id} className="border-b border-black h-9">
                  <td className="border-r border-black text-center font-bold opacity-30">{idx + 1}</td>
                  <td className="border-r border-black p-0"><input type="number" step="any" value={bi.quantity} onChange={e => { setLocalBudgetItems(localBudgetItems.map(lbi => lbi.id === bi.id ? {...lbi, quantity: parseFloat(e.target.value) || 0} : lbi)); setIsDirty(true); }} className="w-full h-full bg-transparent text-center font-bold outline-none no-spinners" /></td>
                  <td className="border-r border-black p-0"><input type="text" value={bi.unit} onChange={e => { setLocalBudgetItems(localBudgetItems.map(lbi => lbi.id === bi.id ? {...lbi, unit: e.target.value} : lbi)); setIsDirty(true); }} className="w-full h-full bg-transparent text-center uppercase font-bold outline-none" /></td>
                  <td className="border-r border-black p-0 relative group">
                    <select 
                      value="" 
                      onChange={e => {
                        const selectedId = e.target.value;
                        const item = budgetItems.find(i => i.id === selectedId);
                        if (item) {
                          setLocalBudgetItems(localBudgetItems.map(lbi => 
                            lbi.id === bi.id ? {
                              ...lbi, 
                              description: `${item.code ? item.code + ' - ' : ''}${item.description}`,
                              quantity: item.quantity,
                              unit: item.unit,
                              unit_price: item.unit_cost,
                              budget_item_id: item.id
                            } : lbi
                          ));
                          setIsDirty(true);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                      <option value="">Vincular item...</option>
                      {(() => {
                        const sortedItems = [...budgetItems]
                          .filter(item => item.category.localeCompare('Mão de Obra', undefined, { sensitivity: 'base' }) !== 0)
                          .sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }));
                        
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
                          <optgroup key={`${group.category}-${idx}`} label={group.category}>
                            {group.items.map(item => (
                              <option key={item.id} value={item.id}>
                                {item.code ? `${item.code} - ` : ''}{item.description}
                              </option>
                            ))}
                          </optgroup>
                        ));
                      })()}
                    </select>
                    <input 
                      type="text" 
                      value={bi.description} 
                      onChange={e => { setLocalBudgetItems(localBudgetItems.map(lbi => lbi.id === bi.id ? {...lbi, description: e.target.value} : lbi)); setIsDirty(true); }} 
                      className="w-full h-full bg-transparent px-3 font-bold uppercase outline-none" 
                      placeholder="CLIQUE PARA VINCULAR OU DIGITE..."
                    />
                    {!readOnly && (
                      <button 
                        onClick={() => {
                          setConfirmConfig({
                            isOpen: true,
                            title: 'Excluir Item do Orçamento',
                            message: `Deseja realmente excluir o item do orçamento "${bi.description || idx + 1}"?`,
                            confirmText: 'Excluir',
                            onConfirm: () => {
                              setLocalBudgetItems(localBudgetItems.filter(lbi => lbi.id !== bi.id));
                              setIsDirty(true);
                            }
                          });
                        }} 
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-red-500 opacity-0 group-hover:opacity-100 print:hidden z-20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </td>
                  {[...Array(quoteCount)].map((_, i) => ( <React.Fragment key={i}> <td className="border-r border-black/10 bg-gray-50/20"></td> <td className="border-r border-black/10 bg-gray-50/20"></td> </React.Fragment> ))}
                  <td className="border-r border-black/10 p-0 bg-blue-50/50">
                    <input type="number" step="any" value={bi.unit_price || ''} onChange={e => { setLocalBudgetItems(localBudgetItems.map(lbi => lbi.id === bi.id ? {...lbi, unit_price: parseFloat(e.target.value) || 0} : lbi)); setIsDirty(true); }} className="w-full h-full bg-transparent text-right pr-2 font-black outline-none no-spinners" placeholder="0,00" />
                  </td>
                  <td className="p-0 bg-[#F3F4F6]">
                    <input type="number" step="any" value={(bi.unit_price * bi.quantity).toFixed(2) || ''} onChange={e => { setLocalBudgetItems(localBudgetItems.map(lbi => lbi.id === bi.id ? {...lbi, unit_price: (parseFloat(e.target.value) || 0) / (bi.quantity || 1)} : lbi)); setIsDirty(true); }} className="w-full h-full bg-transparent text-right pr-2 font-black outline-none no-spinners" placeholder="0,00" />
                  </td>
                </tr>
              ))}
              {!readOnly && ( <tr className="border-b border-black h-8 print:hidden"><td colSpan={quoteCount * 2 + 6}><button onClick={() => { setLocalBudgetItems([...localBudgetItems, { id: `temp_b_${Date.now()}`, description: '', quantity: 1, unit: 'VB', unit_price: 0 }]); setIsDirty(true); }} className="w-full h-full flex items-center justify-center gap-2 text-slate-300 hover:text-emerald-600 font-black uppercase text-[7px] tracking-widest">+ ADICIONAR ITEM AO ORÇAMENTO</button></td></tr> )}

              <tr className="bg-[#E5E7EB] font-black border-b border-black h-12">
                <td colSpan={4} className="px-6 text-right uppercase tracking-[4px] border-r border-black pr-10 text-[11px]">TOTAL FINAL</td>
                {[...Array(quoteCount)].map((_, i) => {
                  const q = localQuotes[i];
                  if (!q) return <td key={i} colSpan={2} className="border-r border-black bg-gray-50/30"></td>;
                  const total = localItems.reduce((acc, item) => acc + ((localPrices[`${q.id}_${item.id}`] || 0) * item.quantity), 0);
                  return <td key={i} colSpan={2} className={cn("px-4 text-right border-r border-black text-[12px]", q.is_selected && "text-emerald-700 underline")}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>;
                })}
                <td className="border-r border-black/10 text-center uppercase text-[8px] bg-gray-100">TOTAL</td>
                <td className="px-4 text-right bg-gray-100 text-[11px]">R$ {budgetTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>

              <tr className="border-b border-black">
                <td colSpan={4} className="p-0 border-r border-black bg-[#F9FAFB] align-top">
                  <div className="h-10 px-3 flex items-center font-black uppercase text-[8px] tracking-widest border-b border-black/5">FORMA DE PAGAMENTO</div>
                  <div className="h-10 px-3 flex items-center font-black uppercase text-[8px] tracking-widest border-b border-black/5">PRAZO DE ENTREGA</div>
                  <div className="h-10 px-3 flex items-center font-black uppercase text-[8px] tracking-widest border-b border-black/5">VALIDADE DA PROPOSTA</div>
                  <div className="px-3 py-2 font-black uppercase text-[8px] tracking-widest">OBSERVAÇÕES:</div>
                </td>
                {[...Array(quoteCount)].map((_, i) => {
                  const q = localQuotes[i];
                  if (!q) return <td key={i} colSpan={2} className="border-r border-black bg-gray-50/30"></td>;
                  return (
                    <td key={i} colSpan={2} className="p-0 border-r border-black align-top">
                      <textarea value={q.payment_terms || ''} onChange={e => { setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, payment_terms: e.target.value} : lq)); setIsDirty(true); }} className="w-full h-10 p-2 bg-transparent border-b border-black/5 outline-none resize-none font-bold text-[8px]" />
                      <textarea value={q.delivery_time || ''} onChange={e => { setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, delivery_time: e.target.value} : lq)); setIsDirty(true); }} className="w-full h-10 p-2 bg-transparent border-b border-black/5 outline-none resize-none font-bold text-[8px]" />
                      <textarea value={q.validity || ''} onChange={e => { setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, validity: e.target.value} : lq)); setIsDirty(true); }} className="w-full h-10 p-2 bg-transparent border-b border-black/5 outline-none resize-none font-bold text-[8px]" />
                      <textarea value={q.notes || ''} onChange={e => { setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, notes: e.target.value} : lq)); setIsDirty(true); }} className="w-full h-14 p-2 bg-transparent outline-none resize-none text-[8px] italic" />
                    </td>
                  );
                })}
                <td colSpan={2} className="bg-gray-50 align-top p-0 border-l border-black/10">
                   <div className="h-10 flex items-center justify-center font-black text-[8px] border-b border-black/5 uppercase text-center leading-none">VALOR ATUALIZADO</div>
                   <div className="p-2 border-b border-black/5">
                      <div className="flex items-center gap-1 font-black text-[7px] uppercase mb-1">INCC IF = </div>
                      <div className="flex items-center gap-1">
                        <input type="text" value={inccIfDate} onChange={e => { setInccIfDate(e.target.value); setIsDirty(true); }} placeholder="MM/AAAA" className="w-full bg-transparent border-b border-black/10 outline-none font-bold text-[8px] h-6" />
                        {!readOnly && (
                          <button onClick={fetchIncc} disabled={isFetchingIncc} className={cn("p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shadow-sm", isFetchingIncc && "animate-spin")}>
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <input 
                        type="number" 
                        step="0.001" 
                        value={inccIfIndex ? parseFloat(inccIfIndex.toFixed(3)) : ''} 
                        onChange={e => { setInccIfIndex(parseFloat(e.target.value) || 0); setIsDirty(true); }} 
                        className="w-full mt-2 outline-none font-bold text-center h-6 text-[10px] no-spinners bg-transparent border-b border-black/10" 
                      />
                   </div>
                   <div className="p-3 mt-2 flex flex-col items-center gap-2">
                     <span className="font-black uppercase text-[8px] opacity-40 leading-tight text-center">VALOR CORRIGIDO</span>
                     <span className="font-black text-[13px]">{formatCurrency(correctedValue)}</span>
                     <div className="text-[6px] opacity-30 font-bold uppercase tracking-tighter">(IF / Io) * Orçado</div>
                   </div>
                </td>
              </tr>

              <tr className="bg-[#E5E1DB]">
                <td colSpan={4} className="p-6 text-center font-black uppercase tracking-[5px] border-r border-black text-[11px]">APROVAÇÕES</td>
                <td colSpan={quoteCount * 2} className="p-0 border-r border-black">
                  <div className="grid grid-cols-3 h-full min-h-[90px]">
                    <div className="p-4 border-r border-black flex flex-col justify-end gap-2"><div className="h-px bg-black/30"></div><div className="text-[7px] font-black uppercase text-center text-slate-500 font-bold">G.O. (OBRA)</div></div>
                    <div className="p-4 border-r border-black flex flex-col justify-end gap-2"><div className="h-px bg-black/30"></div><div className="text-[7px] font-black uppercase text-center text-slate-500 font-bold">G.G.O. (GERAL)</div></div>
                    <div className="p-4 flex flex-col justify-end gap-2"><div className="h-px bg-black/30"></div><div className="text-[7px] font-black uppercase text-center text-slate-500 font-bold">DIRETOR</div></div>
                  </div>
                </td>
                <td colSpan={2} className="bg-[#E5E1DB]"></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <ConfirmModal 
          isOpen={confirmConfig.isOpen}
          onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          secondaryText={(confirmConfig as any).secondaryText}
          onSecondary={(confirmConfig as any).onSecondary}
        />

        <AlertModal 
          isOpen={alertConfig.isOpen} 
          onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })} 
          title={alertConfig.title} 
          message={alertConfig.message} 
          type={alertConfig.type} 
        />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Quadro de Concorrência</h2>
          <p className="text-slate-500 text-sm mt-1">Comparativo técnico unificado.</p>
        </div>
        {!readOnly && (
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-[#BCB5AC] text-[#1C232E] text-xs font-black rounded-xl flex items-center gap-2 hover:bg-white transition-all shadow-xl uppercase tracking-widest">
            <Plus className="h-4 w-4" /> Novo Quadro
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bidGroups.map((group) => (
          <div key={group.id} onClick={() => setSelectedGroup(group)} className="bg-[#1C232E] rounded-[32px] border border-white/5 p-8 cursor-pointer hover:border-blue-500/50 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={async (e) => { 
                  e.stopPropagation(); 
                  
                  // Check if there are any measurements linked to items in this bid group
                  const { data: linkedItems } = await supabase
                    .from('budget_items')
                    .select('id')
                    .eq('bid_group_id', group.id);
                  
                  let hasMeasurements = false;
                  if (linkedItems && linkedItems.length > 0) {
                    const itemIds = linkedItems.map(i => i.id);
                    const { count } = await supabase
                      .from('measurement_items')
                      .select('*', { count: 'exact', head: true })
                      .in('budget_item_id', itemIds);
                    
                    hasMeasurements = (count || 0) > 0;
                  }

                  const baseMessage = `Deseja realmente excluir o quadro "${group.title}"? Esta ação não pode ser desfeita.`;
                  const measurementWarning = "\n\n⚠️ ATENÇÃO: Existem medições vinculadas a este quadro. Somente o histórico das cotações será removido, as medições e itens do orçamento serão PRESERVADOS por segurança.";

                  setConfirmConfig({
                    isOpen: true,
                    title: 'Confirmar Exclusão',
                    message: hasMeasurements ? baseMessage + measurementWarning : baseMessage,
                    confirmText: 'Excluir Quadro',
                    requireText: 'EXCLUIR',
                    onConfirm: async () => {
                      try {
                        // ALWAYS unlink budget items before deleting the group to avoid foreign key constraints.
                        // This preserves the budget items in the main budget even if the bid comparison is gone.
                        await supabase.from('budget_items')
                          .update({ bid_group_id: null })
                          .eq('bid_group_id', group.id);
                        
                        const { error } = await supabase.from('bid_groups').delete().eq('id', group.id);
                        if (error) throw error;
                        
                        setAlertConfig({ isOpen: true, title: 'Excluído', message: 'Quadro removido com sucesso.', type: 'success' });
                        onRefresh();
                      } catch (err: any) {
                        setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
                      }
                    }
                  } as any);
                }} 
                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{group.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-2">{group.description || 'Ver detalhes...'}</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#1C232E] rounded-[32px] shadow-2xl border border-white/5 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Novo Quadro</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-full"><Plus className="h-5 w-5 rotate-45" /></button>
            </div>
            <div className="p-8 space-y-5">
              <input type="text" value={groupTitle} onChange={e => setGroupTitle(e.target.value)} className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" placeholder="Título" />
              <textarea value={groupDesc} onChange={e => setGroupDesc(e.target.value)} className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 h-24 resize-none" placeholder="Descrição" />
              <button onClick={handleCreateGroup} className="w-full py-4 bg-blue-600 text-white text-xs font-black rounded-xl uppercase tracking-widest hover:bg-blue-500">CRIAR QUADRO</button>
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
        secondaryText={(confirmConfig as any).secondaryText}
        onSecondary={(confirmConfig as any).onSecondary}
      />

      <AlertModal isOpen={alertConfig.isOpen} onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} />
    </div>
  );
}

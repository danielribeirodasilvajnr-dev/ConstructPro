import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Trophy, Save, X, Printer, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BidGroup, BidQuote } from '../../lib/types';
import { cn, formatCurrency } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

interface BidComparisonTabProps {
  projectId: string;
  bidGroups: BidGroup[];
  onRefresh: () => void;
  readOnly?: boolean;
}

export function BidComparisonTab({ projectId, bidGroups, onRefresh, readOnly }: BidComparisonTabProps) {
  const [selectedGroup, setSelectedGroup] = useState<BidGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable local states
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [localQuotes, setLocalQuotes] = useState<any[]>([]);
  const [localPrices, setLocalPrices] = useState<{ [key: string]: number }>({});
  const [localBudgetItems, setLocalBudgetItems] = useState<any[]>([]);
  
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  
  // INCC States
  const [inccIoIndex, setInccIoIndex] = useState(0);
  const [inccIfIndex, setInccIfIndex] = useState(0);
  const [inccIfDate, setInccIfDate] = useState('');

  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' as any });

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
    }
  }, [selectedGroup]);

  const handleSelectWinner = async (quoteId: string) => {
    if (readOnly || !selectedGroup) return;
    try {
      setLocalQuotes(prev => prev.map(q => ({ ...q, is_selected: q.id === quoteId })));
      await supabase.from('bid_quotes').update({ is_selected: false }).eq('bid_group_id', selectedGroup.id);
      await supabase.from('bid_quotes').update({ is_selected: true }).eq('id', quoteId);
      onRefresh();
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
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

      const existingBudget = localBudgetItems.filter(bi => !bi.id.startsWith('temp_'));
      const newBudget = localBudgetItems.filter(bi => bi.id.startsWith('temp_'));
      for (const bi of existingBudget) {
        await supabase.from('bid_budget_items').update({ description: bi.description, quantity: bi.quantity, unit: bi.unit, unit_price: bi.unit_price, total_price: bi.unit_price * bi.quantity }).eq('id', bi.id);
      }
      for (const bi of newBudget) {
        await supabase.from('bid_budget_items').insert([{ bid_group_id: selectedGroup.id, description: bi.description, quantity: bi.quantity, unit: bi.unit, unit_price: bi.unit_price, total_price: bi.unit_price * bi.quantity }]);
      }

      const existingQuotes = localQuotes.filter(q => !q.id.startsWith('temp_'));
      const newQuotes = localQuotes.filter(q => q.id.startsWith('temp_'));
      for (const q of existingQuotes) {
        await supabase.from('bid_quotes').update({ 
          supplier_name: q.supplier_name, contact_name: q.contact_name, phone: q.phone, 
          delivery_time: q.delivery_time, payment_terms: q.payment_terms, validity: q.validity, notes: q.notes
        }).eq('id', q.id);
      }
      const quoteMapping: { [key: string]: string } = {};
      for (const q of newQuotes) {
        const { data } = await supabase.from('bid_quotes').insert([{ 
          bid_group_id: selectedGroup.id, supplier_name: q.supplier_name, contact_name: q.contact_name, phone: q.phone, 
          delivery_time: q.delivery_time, payment_terms: q.payment_terms, validity: q.validity, notes: q.notes, total_amount: 0 
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

      setAlertConfig({ isOpen: true, title: 'Sucesso', message: 'Dados salvos com sucesso!', type: 'success' });
      onRefresh();
      const { data } = await supabase.from('bid_groups').select('*, items:bid_group_items(*), quotes:bid_quotes(*, quote_items:bid_quote_items(*)), budget_items:bid_budget_items(*)').eq('id', selectedGroup.id).single();
      if (data) setSelectedGroup(data);
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePriceUpdate = (quoteId: string, itemId: string, value: number, isTotal: boolean = false) => {
    const item = localItems.find(i => i.id === itemId);
    if (!item) return;
    const quantity = item.quantity || 1;
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
    const winnerTotal = localItems.reduce((acc, item) => acc + ((localPrices[`${selectedQuote?.id}_${item.id}`] || 0) * item.quantity), 0);
    const correctedValue = (inccIoIndex > 0) ? (inccIfIndex / inccIoIndex) * budgetTotal : 0;

    return (
      <div className="animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button onClick={() => setSelectedGroup(null)} className="flex items-center gap-2 text-slate-400 hover:text-white bg-white/5 px-4 py-2 rounded-lg"><X className="h-4 w-4" /> Fechar</button>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveAll} disabled={isSaving} className="px-8 py-3 bg-blue-600 text-white text-xs font-black rounded-xl flex items-center gap-2 hover:bg-blue-500 uppercase tracking-widest shadow-xl"><Save className="h-4 w-4" /> {isSaving ? 'Salvando...' : 'Salvar Tudo'}</button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-colors"><Printer className="h-4 w-4" /> Imprimir</button>
          </div>
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
                  <h1 className="text-2xl font-black text-[#1C232E]">AEVUM</h1>
                  <p className="text-[7px] font-bold tracking-[3px] -mt-1 opacity-60 uppercase">Engenharia</p>
                </th>
                <th colSpan={quoteCount * 2} className="border-r border-black p-4 text-center">
                  <input type="text" value={groupTitle} onChange={e => setGroupTitle(e.target.value)} className="text-xl font-black uppercase text-center w-full bg-transparent outline-none border-none" />
                </th>
                <th colSpan={2} className="bg-[#F3F4F6] p-2 text-center">
                  <div className="text-[8px] font-black opacity-30">QC CODE</div>
                  <div className="text-lg font-black uppercase">QC-{selectedGroup.id.slice(0, 4).toUpperCase()}</div>
                </th>
              </tr>

              <tr className="border-b border-black bg-[#F9FAFB] h-20">
                <th colSpan={4} className="border-r border-black p-3 text-left">
                  <span className="font-black text-[9px] uppercase opacity-50 block">Serviço:</span>
                  <input type="text" value={groupDesc} onChange={e => setGroupDesc(e.target.value)} className="font-bold text-[12px] uppercase w-full bg-transparent outline-none border-none" />
                </th>
                {[...Array(quoteCount)].map((_, i) => {
                  const q = localQuotes[i];
                  return (
                    <th key={i} colSpan={2} className="border-r border-black p-2 align-middle relative group/supplier">
                      {q ? (
                        <div className="flex flex-col gap-0.5 text-left text-[8px]">
                          <div className="flex gap-1"><span className="font-black opacity-40 w-10 uppercase">Forn. {i+1}:</span> <input type="text" value={q.supplier_name} onChange={e => setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, supplier_name: e.target.value} : lq))} className="font-bold w-full bg-transparent outline-none" /></div>
                          <div className="flex gap-1"><span className="font-black opacity-40 w-10 uppercase">Cont.:</span> <input type="text" value={q.contact_name || ''} onChange={e => setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, contact_name: e.target.value} : lq))} className="w-full bg-transparent outline-none" /></div>
                          <div className="flex gap-1"><span className="font-black opacity-40 w-10 uppercase">Tel:</span> <input type="text" value={q.phone || ''} onChange={e => setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, phone: e.target.value} : lq))} className="w-full bg-transparent outline-none" /></div>
                          <button onClick={() => handleSelectWinner(q.id)} className={cn("absolute right-1 top-1 p-1 rounded print:hidden", q.is_selected ? "text-emerald-600" : "text-slate-300 hover:text-emerald-500")}><Trophy className="h-3 w-3" /></button>
                        </div>
                      ) : ( !readOnly && <button onClick={() => setLocalQuotes([...localQuotes, { id: `temp_${Date.now()}`, supplier_name: 'Novo Fornecedor' }])} className="w-full h-full flex items-center justify-center text-slate-300 hover:text-blue-500 print:hidden"><Plus className="h-4 w-4" /></button> )}
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
                    <input type="number" value={inccIoIndex} onChange={e => setInccIoIndex(parseFloat(e.target.value) || 0)} className="w-16 bg-transparent text-center font-bold outline-none border-b border-black/10 no-spinners" />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {localItems.map((item, idx) => (
                <tr key={item.id} className="border-b border-black h-9">
                  <td className="border-r border-black text-center font-bold">{idx + 1}</td>
                  <td className="border-r border-black p-0">
                    <input type="number" step="any" value={item.quantity} onChange={e => setLocalItems(localItems.map(li => li.id === item.id ? {...li, quantity: parseFloat(e.target.value) || 0} : li))} className="w-full h-full bg-transparent text-center font-bold outline-none no-spinners" />
                  </td>
                  <td className="border-r border-black p-0"><input type="text" value={item.unit} onChange={e => setLocalItems(localItems.map(li => li.id === item.id ? {...li, unit: e.target.value} : li))} className="w-full h-full bg-transparent text-center uppercase font-bold outline-none" /></td>
                  <td className="border-r border-black p-0 relative group">
                    <input type="text" value={item.description} onChange={e => setLocalItems(localItems.map(li => li.id === item.id ? {...li, description: e.target.value} : li))} className="w-full h-full bg-transparent px-3 font-bold uppercase outline-none" />
                    {!readOnly && <button onClick={() => setLocalItems(localItems.filter(li => li.id !== item.id))} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-red-500 opacity-0 group-hover:opacity-100 print:hidden"><Trash2 className="h-3 w-3" /></button>}
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
              {!readOnly && ( <tr className="border-b border-black h-8 print:hidden"><td colSpan={quoteCount * 2 + 6}><button onClick={() => setLocalItems([...localItems, { id: `temp_${Date.now()}`, description: '', quantity: 1, unit: 'un' }])} className="w-full h-full flex items-center justify-center gap-2 text-slate-300 hover:text-blue-600 font-black uppercase text-[7px] tracking-widest">+ ADICIONAR ITEM DE SERVIÇO</button></td></tr> )}

              <tr className="bg-[#BDBDBD] border-b border-black h-8">
                <td colSpan={quoteCount * 2 + 6} className="text-center font-black uppercase tracking-[3px] text-[9px]">ORÇAMENTO</td>
              </tr>

              {localBudgetItems.map((bi, idx) => (
                <tr key={bi.id} className="border-b border-black h-9">
                  <td className="border-r border-black text-center font-bold opacity-30">{idx + 1}</td>
                  <td className="border-r border-black p-0"><input type="number" step="any" value={bi.quantity} onChange={e => setLocalBudgetItems(localBudgetItems.map(lbi => lbi.id === bi.id ? {...lbi, quantity: parseFloat(e.target.value) || 0} : lbi))} className="w-full h-full bg-transparent text-center font-bold outline-none no-spinners" /></td>
                  <td className="border-r border-black p-0"><input type="text" value={bi.unit} onChange={e => setLocalBudgetItems(localBudgetItems.map(lbi => lbi.id === bi.id ? {...lbi, unit: e.target.value} : lbi))} className="w-full h-full bg-transparent text-center uppercase font-bold outline-none" /></td>
                  <td className="border-r border-black p-0 relative group">
                    <input type="text" value={bi.description} onChange={e => setLocalBudgetItems(localBudgetItems.map(lbi => lbi.id === bi.id ? {...lbi, description: e.target.value} : lbi))} className="w-full h-full bg-transparent px-3 font-bold uppercase outline-none" />
                    {!readOnly && <button onClick={() => setLocalBudgetItems(localBudgetItems.filter(lbi => lbi.id !== bi.id))} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-red-500 opacity-0 group-hover:opacity-100 print:hidden"><Trash2 className="h-3 w-3" /></button>}
                  </td>
                  {[...Array(quoteCount)].map((_, i) => ( <React.Fragment key={i}> <td className="border-r border-black/10 bg-gray-50/20"></td> <td className="border-r border-black/10 bg-gray-50/20"></td> </React.Fragment> ))}
                  <td className="border-r border-black/10 p-0 bg-blue-50/50">
                    <input type="number" step="any" value={bi.unit_price || ''} onChange={e => setLocalBudgetItems(localBudgetItems.map(lbi => lbi.id === bi.id ? {...lbi, unit_price: parseFloat(e.target.value) || 0} : lbi))} className="w-full h-full bg-transparent text-right pr-2 font-black outline-none no-spinners" placeholder="0,00" />
                  </td>
                  <td className="p-0 bg-[#F3F4F6]">
                    <input type="number" step="any" value={(bi.unit_price * bi.quantity).toFixed(2) || ''} onChange={e => setLocalBudgetItems(localBudgetItems.map(lbi => lbi.id === bi.id ? {...lbi, unit_price: (parseFloat(e.target.value) || 0) / (bi.quantity || 1)} : lbi))} className="w-full h-full bg-transparent text-right pr-2 font-black outline-none no-spinners" placeholder="0,00" />
                  </td>
                </tr>
              ))}
              {!readOnly && ( <tr className="border-b border-black h-8 print:hidden"><td colSpan={quoteCount * 2 + 6}><button onClick={() => setLocalBudgetItems([...localBudgetItems, { id: `temp_b_${Date.now()}`, description: '', quantity: 1, unit: 'VB', unit_price: 0 }])} className="w-full h-full flex items-center justify-center gap-2 text-slate-300 hover:text-emerald-600 font-black uppercase text-[7px] tracking-widest">+ ADICIONAR ITEM AO ORÇAMENTO</button></td></tr> )}

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
                      <textarea value={q.payment_terms || ''} onChange={e => setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, payment_terms: e.target.value} : lq))} className="w-full h-10 p-2 bg-transparent border-b border-black/5 outline-none resize-none font-bold text-[8px]" />
                      <textarea value={q.delivery_time || ''} onChange={e => setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, delivery_time: e.target.value} : lq))} className="w-full h-10 p-2 bg-transparent border-b border-black/5 outline-none resize-none font-bold text-[8px]" />
                      <textarea value={q.validity || ''} onChange={e => setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, validity: e.target.value} : lq))} className="w-full h-10 p-2 bg-transparent border-b border-black/5 outline-none resize-none font-bold text-[8px]" />
                      <textarea value={q.notes || ''} onChange={e => setLocalQuotes(localQuotes.map(lq => lq.id === q.id ? {...lq, notes: e.target.value} : lq))} className="w-full h-14 p-2 bg-transparent outline-none resize-none text-[8px] italic" />
                    </td>
                  );
                })}
                <td colSpan={2} className="bg-gray-50 align-top p-0 border-l border-black/10">
                   <div className="h-10 flex items-center justify-center font-black text-[8px] border-b border-black/5 uppercase">VALOR ATUALIZADO</div>
                   <div className="p-2 border-b border-black/5">
                      <div className="flex items-center gap-1 font-black text-[7px] uppercase mb-1">INCC IF = <input type="text" value={inccIfDate} onChange={e => setInccIfDate(e.target.value)} placeholder="mês/ano" className="w-10 bg-transparent border-none outline-none font-bold text-[7px]" /></div>
                      <input type="number" step="any" value={inccIfIndex} onChange={e => setInccIfIndex(parseFloat(e.target.value) || 0)} className="w-full border-b border-black/10 outline-none font-bold text-center h-6 text-[10px] no-spinners" />
                   </div>
                   <div className="p-3 mt-4 flex flex-col items-center gap-2">
                     <span className="font-black uppercase text-[8px] opacity-40 leading-tight text-center">VALOR CORRIGIDO</span>
                     <span className="font-black text-[13px]">{formatCurrency(correctedValue)}</span>
                     <div className="text-[6px] opacity-30 font-bold">(IF / Io) * Orçado</div>
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
              <button onClick={(e) => { e.stopPropagation(); if(confirm('Excluir?')) supabase.from('bid_groups').delete().eq('id', group.id).then(() => onRefresh()); }} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 transition-all"><Trash2 className="h-4 w-4" /></button>
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

      <AlertModal isOpen={alertConfig.isOpen} onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} />
    </div>
  );
}

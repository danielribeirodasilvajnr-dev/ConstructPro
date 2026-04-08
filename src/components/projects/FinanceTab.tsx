import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Paperclip, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FinancialItem, BudgetItem } from '../../lib/types';

interface FinanceTabProps {
  projectId: string;
  financialItems: FinancialItem[];
  budgetItems: BudgetItem[];
  onRefresh: () => void;
}

export function FinanceTab({ projectId, financialItems, budgetItems, onRefresh }: FinanceTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);
  const [formData, setFormData] = useState<Partial<FinancialItem>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${projectId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      setFormData({ ...formData, receipt_url: publicUrl });
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('financial_items')
        .upsert({
          ...formData,
          project_id: projectId,
          id: editingItem?.id || undefined
        });

      if (error) throw error;
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

  const filteredItems = (financialItems || []).filter(i => 
    i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.supplier && i.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalFiltered = filteredItems.reduce((acc, i) => acc + Number(i.amount), 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-start justify-between">
        <h2 className="text-3xl font-black text-white">Controle de Custos</h2>
        <button onClick={() => { setEditingItem(null); setFormData({ date: new Date().toISOString().split('T')[0], category: 'Material' }); setIsModalOpen(true); }} className="px-5 py-2.5 bg-[#3B82F6] text-white text-sm font-bold rounded-lg flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo Lançamento
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input type="text" placeholder="Buscar lançamentos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-[#13171f] border border-white/5 text-white rounded-xl focus:outline-none" />
        </div>
      </div>

      <div className="bg-[#13171f] rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Data</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Descrição</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Categoria</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Valor</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 text-slate-400">{new Date(item.date).toLocaleDateString()}</td>
                <td className="p-4 text-white">
                  <div className="flex items-center gap-2">
                    {item.description}
                    {item.receipt_url && <Paperclip className="h-4 w-4 text-emerald-500 cursor-pointer" onClick={() => window.open(item.receipt_url, '_blank')} />}
                  </div>
                </td>
                <td className="p-4"><span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">{item.category}</span></td>
                <td className="p-4 text-white font-bold">R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => { setEditingItem(item); setFormData(item); setIsModalOpen(true); }} className="p-1 hover:text-blue-500"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#13171f] rounded-xl border border-[#1e293b] w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-white mb-6">Lançamento Financeiro</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Descrição" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg p-2.5 text-white" />
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.category || 'Material'} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg p-2.5 text-white">
                  {['Material', 'Mão de Obra', 'Equipamento', 'Terceirizado', 'Outros'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" placeholder="Valor R$" value={formData.amount || 0} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg p-2.5 text-white" />
              </div>
              <input type="date" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg p-2.5 text-white" />
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-white">Anexo (Recibo/Nota)</label>
                <input type="file" onChange={handleFileUpload} disabled={uploading} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
                {uploading && <p className="text-xs text-blue-500">Enviando...</p>}
                {formData.receipt_url && <p className="text-xs text-emerald-500">Arquivo pronto!</p>}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-white border border-[#1e293b] rounded-lg">Cancelar</button>
                <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded-lg">Lançar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

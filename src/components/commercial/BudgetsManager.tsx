import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ComBudget, ComClient } from '../../lib/types';
import { Plus, Search, FileText, Edit, Trash2, ChevronRight, Calculator, FileDown } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { BudgetEditor } from './BudgetEditor';
import { ConfirmModal } from '../ui/ConfirmModal';

export function BudgetsManager() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<ComBudget[]>([]);
  const [clients, setClients] = useState<ComClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create / Edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<ComBudget | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<ComBudget | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

  // Form State
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [validityDays, setValidityDays] = useState('15');
  const [executionPrazo, setExecutionPrazo] = useState('');
  const [responsibleTech, setResponsibleTech] = useState('');
  const [bdiPercent, setBdiPercent] = useState('0');
  const [taxesPercent, setTaxesPercent] = useState('0');
  const [profitPercent, setProfitPercent] = useState('0');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    // Fetch Clients
    const { data: clientsData } = await supabase
      .from('com_clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    setClients(clientsData || []);

    // Fetch Budgets
    const { data: budgetsData, error } = await supabase
      .from('com_budgets')
      .select('*, client:client_id(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) console.error(error);
    else setBudgets(budgetsData || []);
    
    setLoading(false);
  };

  const openNewModal = () => {
    setEditingBudget(null);
    setClientId('');
    setTitle('');
    setValidityDays('15');
    setExecutionPrazo('');
    setResponsibleTech('');
    setBdiPercent('0');
    setTaxesPercent('0');
    setProfitPercent('0');
    setIsModalOpen(true);
  };

  const openEditModal = (budget: ComBudget) => {
    setEditingBudget(budget);
    setClientId(budget.client_id);
    setTitle(budget.title);
    setValidityDays(budget.validity_days.toString());
    setExecutionPrazo(budget.execution_prazo || '');
    setResponsibleTech(budget.responsible_tech || '');
    setBdiPercent(budget.bdi_percent.toString());
    setTaxesPercent(budget.taxes_percent.toString());
    setProfitPercent(budget.profit_percent.toString());
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      user_id: user.id,
      client_id: clientId,
      title,
      validity_days: parseInt(validityDays) || 15,
      execution_prazo: executionPrazo,
      responsible_tech: responsibleTech,
      bdi_percent: parseFloat(bdiPercent.replace(',', '.')) || 0,
      taxes_percent: parseFloat(taxesPercent.replace(',', '.')) || 0,
      profit_percent: parseFloat(profitPercent.replace(',', '.')) || 0,
      updated_at: new Date().toISOString()
    };

    if (editingBudget) {
      const { error } = await supabase
        .from('com_budgets')
        .update(payload)
        .eq('id', editingBudget.id);
      if (error) alert('Erro ao atualizar: ' + error.message);
    } else {
      // Generate a budget number (e.g., ORC-YYYYMMDD-XXXX)
      const number = `ORC-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      const { error } = await supabase
        .from('com_budgets')
        .insert([{ ...payload, number, created_at: new Date().toISOString() }]);
      if (error) alert('Erro ao criar: ' + error.message);
    }

    setIsModalOpen(false);
    fetchData();
  };

  const handleDeleteClick = (id: string) => {
    setBudgetToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!budgetToDelete) return;
    const { error } = await supabase.from('com_budgets').delete().eq('id', budgetToDelete);
    if (error) alert('Erro ao excluir: ' + error.message);
    else fetchData();
    setBudgetToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Rascunho': return 'bg-surface-container-highest text-on-surface-variant';
      case 'Enviado': return 'bg-blue-500/10 text-blue-500';
      case 'Em negociação': return 'bg-orange-500/10 text-orange-500';
      case 'Aprovado': return 'bg-primary/10 text-primary';
      case 'Reprovado': return 'bg-error/10 text-error';
      case 'Cancelado': return 'bg-error/10 text-error opacity-50';
      default: return 'bg-surface-container-highest text-on-surface-variant';
    }
  };

  if (selectedBudget) {
    return (
      <BudgetEditor 
        budget={selectedBudget} 
        onBack={() => { setSelectedBudget(null); fetchData(); }} 
      />
    );
  }

  const filteredBudgets = budgets.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant/50" />
          <input
            type="text"
            placeholder="Buscar por cliente, título ou Nº..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low border border-outline rounded-2xl pl-12 pr-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-bold text-xs uppercase tracking-[2px] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low border border-outline rounded-[32px]">
          <FileText className="h-12 w-12 text-on-surface-variant/50 mx-auto mb-4" />
          <p className="text-on-surface-variant font-display">Nenhum orçamento encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBudgets.map(budget => (
            <div key={budget.id} className="bg-surface-container-low border border-outline rounded-[24px] p-6 flex flex-col group hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[1px]", getStatusColor(budget.status))}>
                    {budget.status}
                  </span>
                  <p className="text-xs text-on-surface-variant mt-3 font-mono">{budget.number}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(budget)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteClick(budget.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-display font-bold text-on-surface mb-1 line-clamp-1">{budget.title}</h3>
              <p className="text-sm text-on-surface-variant mb-6 line-clamp-1">{budget.client?.name}</p>

              <div className="mt-auto border-t border-outline pt-4">
                <button
                  onClick={() => setSelectedBudget(budget)}
                  className="w-full flex items-center justify-between text-xs font-display font-bold text-on-surface hover:text-primary transition-colors group/btn uppercase tracking-[1px]"
                >
                  <span className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Abrir Planilha
                  </span>
                  <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo/Editar Orçamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface border border-outline rounded-[32px] p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300 my-8">
            <h2 className="text-2xl font-display font-bold text-on-surface mb-6">
              {editingBudget ? 'Editar Dados' : 'Novo Orçamento'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                    Cliente
                  </label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                    Título do Orçamento
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Reforma Residencial - Casa 42"
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                    Prazo de Execução
                  </label>
                  <input
                    type="text"
                    value={executionPrazo}
                    onChange={(e) => setExecutionPrazo(e.target.value)}
                    placeholder="Ex: 6 Meses"
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                    Validade da Proposta (Dias)
                  </label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {/* Taxas Base */}
                <div className="md:col-span-2 border-t border-outline pt-6">
                  <p className="text-sm font-display font-bold text-on-surface mb-4">Taxas e Margens Padrão (%)</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                        BDI
                      </label>
                      <input
                        type="text"
                        value={bdiPercent}
                        onChange={(e) => setBdiPercent(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface text-center focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                        Impostos
                      </label>
                      <input
                        type="text"
                        value={taxesPercent}
                        onChange={(e) => setTaxesPercent(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface text-center focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                        Lucro
                      </label>
                      <input
                        type="text"
                        value={profitPercent}
                        onChange={(e) => setProfitPercent(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface text-center focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-outline">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 font-display font-bold text-xs uppercase tracking-[2px] text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-primary text-background font-display font-bold text-xs uppercase tracking-[2px] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {editingBudget ? 'Salvar Alterações' : 'Continuar'}
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
        title="Excluir Orçamento"
        message="Tem certeza que deseja excluir este orçamento? Todos os itens da EAP e contratos associados serão perdidos. Esta ação não pode ser desfeita."
      />
    </div>
  );
}

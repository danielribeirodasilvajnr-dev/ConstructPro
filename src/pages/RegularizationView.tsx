import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { INSSRegularization } from '../lib/types';
import { INSSRegularizationTab } from '../components/projects/INSSRegularizationTab';
import { Search, ArrowRight, Calculator as CalculatorIcon, Plus, UserPlus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function RegularizationView() {
  const { user } = useAuth();
  const [regularizations, setRegularizations] = useState<INSSRegularization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    return sessionStorage.getItem('selectedRegularizationId');
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedId) {
      sessionStorage.setItem('selectedRegularizationId', selectedId);
    } else {
      sessionStorage.removeItem('selectedRegularizationId');
    }
  }, [selectedId]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newClient, setNewClient] = useState('');

  const fetchRegularizations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inss_regularizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegularizations(data || []);
    } catch (err) {
      console.error('Error fetching regularizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegularizations();
  }, []);
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newClient || !user) return;

    try {
      const { data, error } = await supabase
        .from('inss_regularizations')
        .insert({
          name: newName,
          client: newClient,
          user_id: user.id,
          responsavel: 'pessoa física',
          destinacao: 'Residencial unifamiliar',
          tipo_obra: 'Alvenaria',
          concreto_usinado: 'Sim',
          uf: 'SP',
          area_construcao: 0,
          area_reforma: 0,
          area_demolicao: 0,
          area_piscina: 0
        })
        .select()
        .single();

      if (error) throw error;

      setRegularizations([data, ...regularizations]);
      setSelectedId(data.id);
      setIsModalOpen(false);
      setNewName('');
      setNewClient('');
    } catch (err) {
      console.error('Error creating regularization:', err);
      alert('Erro ao criar registro.');
    }
  };

  const filtered = regularizations.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.client?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItem = regularizations.find(r => r.id === selectedId);

  // Se houver ID selecionado mas a lista ainda estiver carregando, mostra loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-blue-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Sincronizando Dados...</p>
      </div>
    );
  }

  if (selectedId && selectedItem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setSelectedId(null)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ArrowRight className="h-6 w-6 rotate-180" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">{selectedItem.name}</h2>
            <p className="text-slate-500 text-sm">Cliente: {selectedItem.client}</p>
          </div>
        </div>

        <INSSRegularizationTab 
          projectId={selectedId} // Using ID as projectId here for simplicity in the tab
          inssRegularization={selectedItem}
          onRefresh={fetchRegularizations}
          readOnly={false}
          isStandalone={true}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Regularização INSS</h2>
          <p className="text-slate-500 text-sm mt-1">Gestão independente de regularizações e clientes (SERO).</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-[#BCB5AC] text-[#1C232E] text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-white transition-all shadow-lg"
        >
          <Plus className="h-5 w-5" /> Novo Cliente/Obra
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por obra ou cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1C232E] border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-[#BCB5AC] outline-none transition-all shadow-xl"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className="bg-[#1C232E] rounded-3xl border border-slate-800 p-6 hover:border-[#BCB5AC]/50 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CalculatorIcon className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#BCB5AC] transition-colors">{item.name}</h3>
              <p className="text-slate-500 text-sm mb-4">{item.client}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Abrir Aferição</span>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center bg-[#1C232E] rounded-3xl border border-dashed border-slate-800">
              <UserPlus className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum registro encontrado. Clique em "Novo Cliente/Obra" para começar.</p>
            </div>
          )}
        </div>
      )}

      {/* New Regularization Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C232E] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Novo Cliente/Obra</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome da Obra</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#BCB5AC] outline-none transition-all"
                  placeholder="Ex: Residência Vila Nova"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome do Cliente</label>
                <input
                  required
                  type="text"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#BCB5AC] outline-none transition-all"
                  placeholder="Ex: João da Silva"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-[#BCB5AC] text-[#1C232E] font-black rounded-xl hover:bg-white transition-all mt-4 uppercase tracking-[2px]"
              >
                Criar Registro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ComClient } from '../../lib/types';
import { Plus, Search, Building2, User, Users, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmModal } from '../ui/ConfirmModal';

export function ClientsManager() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ComClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ComClient | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<'PF' | 'PJ'>('PF');
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [responsible, setResponsible] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetchClients();
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('com_clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
      
    if (error) {
      console.error('Error fetching clients:', error);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const openNewModal = () => {
    setEditingClient(null);
    setType('PF');
    setName('');
    setTradeName('');
    setDocument('');
    setEmail('');
    setPhone('');
    setResponsible('');
    setAddress('');
    setIsModalOpen(true);
  };

  const openEditModal = (client: ComClient) => {
    setEditingClient(client);
    setType(client.type);
    setName(client.name);
    setTradeName(client.trade_name || '');
    setDocument(client.document);
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setResponsible(client.responsible || '');
    setAddress(client.address || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      user_id: user.id,
      type,
      name,
      trade_name: type === 'PJ' ? tradeName : null,
      document,
      email,
      phone,
      responsible: type === 'PJ' ? responsible : null,
      address,
      updated_at: new Date().toISOString()
    };

    if (editingClient) {
      const { error } = await supabase
        .from('com_clients')
        .update(payload)
        .eq('id', editingClient.id);
      if (error) alert('Erro ao atualizar cliente: ' + error.message);
    } else {
      const { error } = await supabase
        .from('com_clients')
        .insert([{ ...payload, created_at: new Date().toISOString() }]);
      if (error) alert('Erro ao criar cliente: ' + error.message);
    }

    setIsModalOpen(false);
    fetchClients();
  };

  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    const { error } = await supabase.from('com_clients').delete().eq('id', clientToDelete);
    if (error) alert('Erro ao excluir: ' + error.message);
    else fetchClients();
    setClientToDelete(null);
  };

  const filteredClients = clients.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.document || '').includes(searchTerm) ||
    (c.trade_name && c.trade_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant/50" />
          <input
            type="text"
            placeholder="Buscar clientes por nome, CPF/CNPJ..."
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
          Novo Cliente
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low border border-outline rounded-[32px]">
          <Users className="h-12 w-12 text-on-surface-variant/50 mx-auto mb-4" />
          <p className="text-on-surface-variant font-display">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-surface-container-low border border-outline rounded-[24px] p-6 group hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl",
                    client.type === 'PJ' ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"
                  )}>
                    {client.type === 'PJ' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-on-surface text-lg line-clamp-1">
                      {client.name}
                    </h3>
                    {client.trade_name && (
                      <p className="text-xs text-on-surface-variant">{client.trade_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(client)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteClick(client.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <div className="w-6 flex justify-center"><span className="text-[10px] font-bold uppercase">{client.type}</span></div>
                  <span>{client.document}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <Mail className="h-4 w-4 text-on-surface-variant/50" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <Phone className="h-4 w-4 text-on-surface-variant/50" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-3 text-sm text-on-surface-variant">
                    <MapPin className="h-4 w-4 text-on-surface-variant/50 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{client.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface border border-outline rounded-[32px] p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-display font-bold text-on-surface mb-6">
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex gap-4 p-1 bg-surface-container-low rounded-xl w-max">
                <button
                  type="button"
                  onClick={() => setType('PF')}
                  className={cn(
                    "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-[2px] transition-all",
                    type === 'PF' ? "bg-primary text-background shadow-md" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  Pessoa Física
                </button>
                <button
                  type="button"
                  onClick={() => setType('PJ')}
                  className={cn(
                    "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-[2px] transition-all",
                    type === 'PJ' ? "bg-blue-500 text-white shadow-md" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  Pessoa Jurídica
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                    {type === 'PJ' ? 'Razão Social' : 'Nome Completo'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {type === 'PJ' && (
                  <div>
                    <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                    {type === 'PJ' ? 'CNPJ' : 'CPF'}
                  </label>
                  <input
                    type="text"
                    required
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {type === 'PJ' && (
                  <div>
                    <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                      Responsável
                    </label>
                    <input
                      type="text"
                      value={responsible}
                      onChange={(e) => setResponsible(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                    Endereço Completo
                  </label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  />
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
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
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
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente? Todos os orçamentos e contratos vinculados a ele podem ser afetados. Esta ação não pode ser desfeita."
      />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Search, AlertCircle, Mail, Phone, Crown, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Subscriber {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  company: string;
  plan_id: string;
  subscription_status: 'pending' | 'active' | 'expired';
  subscription_expires_at: string | null;
  created_at: string;
}

export function SubscribersView() {
  const { isSuperAdmin } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSubscribers();
    }
  }, [isSuperAdmin]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: sbError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (sbError) throw sbError;
      setSubscribers(data || []);
    } catch (err: any) {
      console.error('Error fetching subscribers:', err);
      setError('Não foi possível carregar a lista de assinantes. Verifique suas permissões de Super Admin.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = 
      (sub.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (sub.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (sub.company?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || sub.subscription_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: CheckCircle2, label: 'Ativo' };
      case 'expired':
        return { color: 'text-error', bg: 'bg-error/10', border: 'border-error/20', icon: AlertCircle, label: 'Vencido' };
      default:
        return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', icon: Clock, label: 'Pendente' };
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center border border-error/20 mb-6">
          <AlertCircle className="h-10 w-10 text-error" />
        </div>
        <h2 className="text-3xl font-display font-bold uppercase tracking-tight text-on-surface">Acesso Negado</h2>
        <p className="text-on-surface-variant mt-2">Esta área é restrita aos administradores do sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-12">
        <div>
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-on-surface uppercase flex items-center gap-4">
            <div className="p-4 bg-primary/20 rounded-2xl">
              <Users className="w-10 h-10 text-primary" />
            </div>
            Assinantes
          </h2>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-[1px] w-12 bg-primary/30" />
            <p className="text-on-surface-variant text-[11px] font-display uppercase tracking-[4px]">
              {subscribers.length} Usuários Cadastrados
            </p>
          </div>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80 bg-surface border border-outline rounded-2xl pl-12 pr-4 py-4 text-sm text-on-surface focus:border-primary outline-none transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-outline rounded-2xl px-6 py-4 text-sm text-on-surface focus:border-primary outline-none appearance-none cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="pending">Pendentes</option>
            <option value="expired">Vencidos</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-6 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-4 text-error mb-8">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSubscribers.map((sub, i) => {
            const statusConfig = getStatusConfig(sub.subscription_status || 'pending');
            const isElite = sub.plan_id === 'elite';
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={sub.id}
                className="bg-surface-container-low border border-outline rounded-[32px] p-8 relative overflow-hidden group hover:border-primary/30 transition-all hover:-translate-y-1"
              >
                {/* Status Badge */}
                <div className={cn(
                  "absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-display font-bold uppercase tracking-[2px] border backdrop-blur-md",
                  statusConfig.bg, statusConfig.color, statusConfig.border
                )}>
                  <statusConfig.icon className="w-3 h-3" />
                  {statusConfig.label}
                </div>

                <div className="mb-6 pr-24">
                  <h3 className="text-xl font-display font-bold text-on-surface uppercase truncate" title={sub.full_name}>
                    {sub.full_name || 'Sem Nome'}
                  </h3>
                  {sub.company && (
                    <p className="text-sm text-on-surface-variant mt-1 truncate">{sub.company}</p>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{sub.email}</span>
                  </div>
                  {sub.phone && (
                    <div className="flex items-center gap-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{sub.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-outline/50 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px] mb-2">Plano Atual</p>
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider",
                      isElite ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-surface border border-outline text-on-surface"
                    )}>
                      {isElite && <Crown className="w-3 h-3" />}
                      {sub.plan_id || 'START'}
                    </div>
                  </div>

                  {sub.subscription_status === 'active' && sub.subscription_expires_at && (
                    <div className="text-right">
                      <p className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px] mb-2">Vencimento</p>
                      <p className="text-sm text-on-surface font-mono">
                        {new Date(sub.subscription_expires_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filteredSubscribers.length === 0 && (
            <div className="col-span-full py-24 text-center">
              <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 border border-outline">
                <Search className="w-10 h-10 text-on-surface-variant" />
              </div>
              <h3 className="text-xl font-display font-bold text-on-surface uppercase tracking-tight mb-2">Nenhum assinante encontrado</h3>
              <p className="text-on-surface-variant">Tente ajustar seus filtros de busca.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

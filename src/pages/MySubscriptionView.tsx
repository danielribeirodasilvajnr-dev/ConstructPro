import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, Calendar, Clock, ArrowRight, Zap, Building, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { cn } from '../lib/utils';

export function MySubscriptionView() {
  const { profile } = useAuth();
  const { currentPlan, usedProjects, usedRegularizations, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isPending = profile?.subscription_status === 'pending';
  const isExpired = profile?.subscription_status === 'expired';
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateDaysLeft = (expiryDate?: string) => {
    if (!expiryDate) return 0;
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-on-surface uppercase">Minha Assinatura</h1>
          <p className="text-on-surface-variant text-sm font-display tracking-widest uppercase">Gerencie seu plano e pagamentos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="lg:col-span-2 bg-surface-container-low border border-outline rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
              <p className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px] mb-2">Status Atual</p>
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-display font-bold text-on-surface uppercase tracking-tight">
                  {isPending ? 'PENDENTE' : isExpired ? 'VENCIDA' : 'ATIVA'}
                </h2>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-display font-bold uppercase tracking-[2px]",
                  isPending ? "bg-warning/20 text-warning border border-warning/30" : 
                  isExpired ? "bg-error/20 text-error border border-error/30" :
                  "bg-primary/20 text-primary border border-primary/30"
                )}>
                  {profile?.subscription_status || 'pendente'}
                </div>
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px] mb-2">Plano Contratado</p>
              <h3 className="text-2xl font-display font-bold text-primary uppercase">{currentPlan?.name || 'Nenhum'}</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-outline/50">
            <div>
              <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-[10px] font-display font-bold uppercase tracking-[2px]">Vencimento</span>
              </div>
              <p className="text-sm text-on-surface font-mono">{formatDate(profile?.subscription_expires_at)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-display font-bold uppercase tracking-[2px]">Dias Restantes</span>
              </div>
              <p className="text-sm text-on-surface font-mono">{calculateDaysLeft(profile?.subscription_expires_at)} dias</p>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-surface-container-low border border-outline rounded-3xl p-8 flex flex-col justify-center gap-4">
          <h3 className="font-display font-bold text-on-surface uppercase tracking-wider mb-4">Ações</h3>
          
          <button 
            disabled={isPending}
            className="w-full flex items-center justify-between p-4 bg-background border border-outline rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-display font-bold text-[11px] uppercase tracking-[2px] text-on-surface group-hover:text-primary transition-colors">
              Fazer Upgrade
            </span>
            <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
          </button>

          <button 
            disabled={isPending}
            className="w-full flex items-center justify-between p-4 bg-background border border-outline rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-display font-bold text-[11px] uppercase tracking-[2px] text-on-surface group-hover:text-primary transition-colors">
              Renovar Plano
            </span>
            <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-low border border-outline rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display font-bold text-on-surface uppercase tracking-wider">Uso de Obras</h3>
            <div className="p-3 bg-surface rounded-xl">
              <Building className="w-5 h-5 text-on-surface-variant" />
            </div>
          </div>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-4xl font-display font-bold text-on-surface">{usedProjects}</span>
            <span className="text-sm text-on-surface-variant mb-1 font-mono">/ {currentPlan?.max_projects === 0 ? '0' : currentPlan?.max_projects}</span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${currentPlan?.max_projects ? Math.min(100, (usedProjects / currentPlan.max_projects) * 100) : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display font-bold text-on-surface uppercase tracking-wider">Uso de Regularizações</h3>
            <div className="p-3 bg-surface rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-on-surface-variant" />
            </div>
          </div>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-4xl font-display font-bold text-on-surface">{usedRegularizations}</span>
            <span className="text-sm text-on-surface-variant mb-1 font-mono">/ {currentPlan?.max_regularizations > 1000 ? 'Ilimitado' : currentPlan?.max_regularizations}</span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${currentPlan?.max_regularizations ? Math.min(100, (usedRegularizations / currentPlan.max_regularizations) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { LayoutDashboard, Users, Calculator, FileText, FileSignature } from 'lucide-react';

import { ClientsManager } from '../components/commercial/ClientsManager';
import { CompositionsManager } from '../components/commercial/CompositionsManager';
import { BudgetsManager } from '../components/commercial/BudgetsManager';

// Placeholders para os subcomponentes
const CommercialDashboard = () => <div className="p-8 text-center text-on-surface-variant">Dashboard em construção...</div>;
const ContractsManager = () => <div className="p-8 text-center text-on-surface-variant">Gestor de Contratos em construção...</div>;

export function CommercialView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'compositions' | 'budgets' | 'contracts'>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'compositions', label: 'Composições', icon: Calculator },
    { id: 'budgets', label: 'Orçamentos', icon: FileText },
    { id: 'contracts', label: 'Contratos', icon: FileSignature },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header and Tabs */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-surface">Comercial</h1>
          <p className="text-sm font-display text-on-surface-variant mt-2 uppercase tracking-[2px]">
            Gestão de Orçamentos, Propostas e Contratos
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-outline">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 font-display text-xs uppercase tracking-[2px] transition-all whitespace-nowrap border-b-2",
              activeTab === tab.id
                ? "border-primary text-primary font-bold"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-surface border border-outline rounded-[32px] overflow-hidden min-h-[600px]">
        {activeTab === 'dashboard' && <CommercialDashboard />}
        {activeTab === 'clients' && <ClientsManager />}
        {activeTab === 'compositions' && <CompositionsManager />}
        {activeTab === 'budgets' && <BudgetsManager />}
        {activeTab === 'contracts' && <ContractsManager />}
      </div>
    </div>
  );
}

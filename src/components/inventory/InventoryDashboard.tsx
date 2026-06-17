import React from 'react';
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertCircle, RefreshCw } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { cn } from '../../lib/utils';

interface InventoryDashboardProps {
  projectId: string;
}

export function InventoryDashboard({ projectId }: InventoryDashboardProps) {
  const { materials, movements, loading, error, refresh } = useInventory(projectId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[4px] animate-pulse">Carregando Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/5 border border-error/20 p-8 rounded-[32px] flex items-center gap-6">
        <div className="p-4 bg-error/10 rounded-2xl text-error">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-error font-display font-bold uppercase tracking-[2px] mb-1">Erro ao carregar dados</h3>
          <p className="text-sm text-on-surface-variant opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  const lowStockMaterials = materials.filter(m => m.current_stock <= m.min_stock && m.min_stock > 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyMovements = movements.filter(m => {
    const d = new Date(m.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const estimatedValue = materials.reduce((acc, m) => {
    // Busca a ultima entrada deste material para ter o preco unitário
    const lastIn = movements.find(mov => mov.material_id === m.id && mov.type === 'in' && mov.unit_price);
    const unitPrice = lastIn ? (lastIn.unit_price || 0) : 0;
    return acc + (m.current_stock * unitPrice);
  }, 0);

  const stats = [
    {
      title: 'Itens Cadastrados',
      value: materials.length.toString(),
      icon: Package,
      color: 'primary'
    },
    {
      title: 'Movimentações no Mês',
      value: monthlyMovements.length.toString(),
      icon: RefreshCw,
      color: 'blue-500'
    },
    {
      title: 'Valor Estimado',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedValue),
      icon: ArrowDownToLine,
      color: 'emerald-500'
    },
    {
      title: 'Estoque Baixo/Zerado',
      value: lowStockMaterials.length.toString(),
      icon: AlertCircle,
      color: lowStockMaterials.length > 0 ? 'error' : 'emerald-500'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface-container-low border border-outline rounded-[24px] p-6 flex flex-col justify-between group hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
              <stat.icon className={`h-24 w-24 text-${stat.color}`} />
            </div>
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", `bg-${stat.color}/10 text-${stat.color}`)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="relative z-10 mt-auto">
              <h3 className="text-[11px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-2">{stat.title}</h3>
              <p className="text-3xl font-display font-bold text-on-surface">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Materiais com Estoque Baixo */}
        <div className="bg-surface-container-low border border-outline rounded-[32px] p-8">
          <h3 className="text-sm font-display font-bold text-on-surface uppercase tracking-[2px] mb-6 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-error" />
            Atenção: Estoque Baixo
          </h3>
          <div className="space-y-4">
            {lowStockMaterials.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Nenhum material com estoque baixo.</p>
            ) : (
              lowStockMaterials.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-outline">
                  <div>
                    <p className="text-sm font-bold text-on-surface">{m.description}</p>
                    <p className="text-xs text-on-surface-variant">{m.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-display font-bold text-error">{m.current_stock} {m.unit}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Mínimo: {m.min_stock}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimas Movimentações */}
        <div className="bg-surface-container-low border border-outline rounded-[32px] p-8">
          <h3 className="text-sm font-display font-bold text-on-surface uppercase tracking-[2px] mb-6 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            Últimas Movimentações
          </h3>
          <div className="space-y-4">
            {movements.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Nenhuma movimentação registrada.</p>
            ) : (
              movements.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-outline">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      m.type === 'in' ? "bg-emerald-500/10 text-emerald-500" :
                      m.type === 'out' ? "bg-orange-500/10 text-orange-500" :
                      m.type === 'cautela' ? "bg-purple-500/10 text-purple-500" :
                      "bg-blue-500/10 text-blue-500"
                    )}>
                      {m.type === 'in' ? <ArrowDownToLine className="h-4 w-4" /> : 
                       m.type === 'out' ? <ArrowUpFromLine className="h-4 w-4" /> : 
                       m.type === 'cautela' ? <Package className="h-4 w-4" /> :
                       <RefreshCw className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{m.material?.description || 'Desconhecido'}</p>
                      <p className="text-xs text-on-surface-variant uppercase">{m.type === 'in' ? 'Entrada' : m.type === 'out' ? 'Saída' : m.type === 'cautela' ? 'Cautela' : 'Ajuste'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-on-surface">{m.quantity} {m.material?.unit}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase">{new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

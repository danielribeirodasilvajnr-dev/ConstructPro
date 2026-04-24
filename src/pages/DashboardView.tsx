import React from 'react';
import {
  TrendingUp,
  AlertCircle,
  Clock,
  Wallet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useDashboardData } from '../hooks/useDashboardData';
import { cn, formatCurrency } from '../lib/utils';

export function DashboardView() {
  const { data: dashboardProjects, loading } = useDashboardData();

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-24">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">Visão geral dos seus projetos e custos</p>
      </div>

      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Resumo por Obra</h3>

      <div className="space-y-12">
        {dashboardProjects.length === 0 ? (
          <div className="bg-[#1C232E] p-12 text-center rounded-2xl border border-slate-800 text-slate-500">
            Nenhum projeto encontrado para gerar o dashboard.
          </div>
        ) : (
          dashboardProjects.map((project, i) => (
            <div key={i} className="bg-[#1C232E] rounded-[24px] overflow-hidden shadow-xl border border-slate-800">
              <div className="p-8 pb-6 border-b border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                  <h4 className="text-[22px] font-bold text-slate-100 tracking-tight">{project.name}</h4>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <p className="text-slate-500 text-[13px] font-medium flex items-center gap-1.5">
                      <span className="text-slate-600">Local:</span> {project.location || 'N/D'}
                    </p>
                    <p className="text-slate-500 text-[13px] font-medium flex items-center gap-1.5 border-l border-slate-800 pl-4">
                      <span className="text-slate-600">Área:</span> {project.area || '0'},00 m²
                    </p>
                    <p className="text-slate-500 text-[13px] font-medium flex items-center gap-1.5 border-l border-slate-800 pl-4">
                      <span className="text-slate-600">Prazo:</span> {project.deadline || 'N/D'}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap",
                  project.status === 'Em Andamento' ? 'bg-[#FFF3D6] text-[#C48C00]' :
                    project.status.includes('Atenção') ? 'bg-red-500/10 text-red-500' :
                      'bg-emerald-500/10 text-emerald-500'
                )}>
                  {project.status}
                </span>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-8">
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                        <Wallet className="h-[14px] w-[14px]" />
                        <span className="text-[11px] font-medium">Orçado</span>
                      </div>
                      <p className="text-sm font-bold text-slate-100">{formatCurrency(project.ordained)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                        <TrendingUp className="h-[14px] w-[14px]" />
                        <span className="text-[11px] font-medium">Gasto</span>
                      </div>
                      <p className="text-sm font-bold text-[#FF8A00]">{formatCurrency(project.spent)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                        <AlertCircle className="h-[14px] w-[14px]" />
                        <span className="text-[11px] font-medium">Saldo</span>
                      </div>
                      <p className="text-sm font-bold text-[#00E57A]">{formatCurrency(project.balance)}</p>
                    </div>
                  </div>

                  <div className="space-y-6 pt-2">
                    <div>
                      <div className="flex justify-between items-end mb-2.5">
                        <span className="text-xs font-medium text-slate-400">Execução financeira</span>
                        <span className="text-xs font-semibold text-slate-300">{project.financialProgress}%</span>
                      </div>
                      <div className="h-[6px] w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#BCB5AC] rounded-full" style={{ width: `${project.financialProgress}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2.5">
                        <span className="text-xs font-medium text-slate-400">Avanço físico</span>
                        <span className="text-xs font-semibold text-slate-300">{project.physicalProgress}%</span>
                      </div>
                      <div className="h-[6px] w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FFE299] rounded-full" style={{ width: `${project.physicalProgress}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 mt-4">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                      <Clock className="h-3 w-3" /> Últimas Atividades
                    </h5>
                    <div className="space-y-4">
                      {project.logs.map((log: any, j: number) => (
                        <div key={j} className="flex gap-4 items-start relative before:absolute before:left-1 before:top-4 before:bottom-[-20px] before:w-[2px] before:bg-slate-800 last:before:hidden">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#BCB5AC] mt-1 relative z-10 shrink-0"></div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500">{log.date}</p>
                            <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">{log.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 flex flex-col justify-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col">
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Evolução (%)</h5>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={project.evolutionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                            <XAxis dataKey="month" stroke="#64748B" fontSize={10} />
                            <YAxis stroke="#64748B" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="real" stroke="#FFE299" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="previsto" stroke="#BCB5AC" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col">
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Custos (R$)</h5>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={project.costData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                            <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                            <YAxis stroke="#64748B" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} />
                            <Bar dataKey="previsto" fill="#BCB5AC" opacity={0.5} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="realizado" fill="#FF8A00" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

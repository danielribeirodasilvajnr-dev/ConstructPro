import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
import { useAuth } from '../contexts/AuthContext';

export function DashboardView() {
  const { isProprietor, isAdmin, user } = useAuth();
  const { data: dashboardProjects, loading, error: dashError, debugInfo: hookDebug } = useDashboardData();
  const [rawDiagnostic, setRawDiagnostic] = useState<string>('Not run');

  useEffect(() => {
    const runDiagnostic = async () => {
      const sessionStr = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (!sessionStr) return setRawDiagnostic('No token key');
      
      const sessionData = JSON.parse(localStorage.getItem(sessionStr) || '{}');
      const token = sessionData?.access_token;
      if (!token) return setRawDiagnostic('No access token');

      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/projects?select=*,budget_items(*),schedule_items(*),financial_items(*),daily_logs(*)&order=created_at.desc`;
        const res = await fetch(url, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`
          }
        });
        const text = await res.text();
        setRawDiagnostic(`Status: ${res.status}, Body: ${text.substring(0, 50)}, URL: ${url.substring(0, 30)}`);
      } catch (err: any) {
        setRawDiagnostic(`Error: ${err.message}`);
      }
    };
    runDiagnostic();
  }, []);

  if (isProprietor || !isAdmin) return null;

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-24">
      {dashError && (
        <div className="bg-red-500 text-white p-4 font-mono text-sm mb-4">
          DASHBOARD ERROR: {String(dashError)}
        </div>
      )}
      


      <div className="mb-12 relative">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white uppercase group">
          SISTEMA <span className="text-primary group-hover:drop-shadow-[0_0_15px_rgba(34,255,136,0.5)] transition-all">CENTRAL</span>
        </h2>
        <div className="flex items-center gap-3 mt-3">
          <div className="h-[1px] w-12 bg-primary/30" />
          <p className="text-on-surface-variant text-[11px] font-display uppercase tracking-[4px]">Monitoramento de Performance e Custos</p>
        </div>
      </div>

      <div className="space-y-20">
        {dashboardProjects.length === 0 ? (
          <div className="glass-panel p-24 text-center rounded-[32px] border-white/5 text-on-surface-variant font-display uppercase tracking-widest animate-pulse">
            SISTEMA AGUARDANDO DADOS DE PROJETOS...
          </div>
        ) : (
          dashboardProjects.map((project, i) => (
            <div key={i} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 rounded-[40px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative bg-surface/60 backdrop-blur-2xl rounded-[32px] overflow-hidden border border-white/5 shadow-2xl transition-all duration-500 group-hover:translate-y-[-4px]">
                {/* Project Header - Glassmorphic Bento Header */}
                <div className="p-10 pb-8 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-gradient-to-br from-white/5 to-transparent">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                      <span className="text-[10px] font-display font-bold text-primary uppercase tracking-[3px]">PROJETO ATIVO</span>
                    </div>
                    <h4 className="text-3xl font-display font-bold text-white tracking-wide uppercase">{project.name}</h4>
                    <div className="flex flex-wrap gap-6 mt-4">
                      <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3 group/info">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover/info:bg-primary transition-colors group-hover/info:text-background">
                          <TrendingUp className="h-3 w-3" />
                        </div>
                        <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">{project.location || 'N/D'}</p>
                      </div>
                      <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                        <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider"><span className="text-white/40 mr-2">ÁREA:</span> {project.area || '0'} m²</p>
                      </div>
                      <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                        <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider"><span className="text-white/40 mr-2">ENTREGA:</span> {project.deadline || 'N/D'}</p>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "px-6 py-3 rounded-2xl text-[10px] font-display font-bold uppercase tracking-[3px] border backdrop-blur-xl",
                    project.status === 'Em Andamento' ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(34,255,136,0.2)]' :
                      project.status.includes('Atenção') ? 'bg-error/10 text-error border-error/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  )}>
                    {project.status}
                  </div>
                </div>

                <div className="p-10">
                  {/* Bento Grid Layout */}
                  {/* Key Metrics - Full Width Row */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
                    {[
                      { label: 'VALOR DO CONTRATO', value: formatCurrency(project.ordained), icon: Wallet, color: 'text-white' },
                      { label: 'APORTE TOTAL (ENTRADAS)', value: formatCurrency(project.totalIncome), icon: TrendingUp, color: 'text-primary' },
                      { label: 'VALOR A RECEBER', value: formatCurrency(project.balanceDue), icon: AlertCircle, color: 'text-error' },
                      { label: 'REALIZADO (OBRAS)', value: formatCurrency(project.budgetSpent || 0), icon: Wallet, color: 'text-white' },
                      { label: 'SALDO EM CAIXA', value: formatCurrency(project.cashBalance), icon: TrendingUp, color: project.cashBalance >= 0 ? 'text-primary' : 'text-error', highlight: true }
                    ].map((stat, idx) => (
                      <div key={idx} className={cn(
                        "p-8 rounded-[28px] border border-white/5 backdrop-blur-xl transition-all duration-500 hover:border-primary/40 group/card relative overflow-hidden",
                        stat.highlight ? "bg-primary/5 border-primary/10" : "bg-surface-container-low/40"
                      )}>
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                          <stat.icon className={cn("h-12 w-12", stat.color)} />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">{stat.label}</span>
                        </div>
                        <p className={cn("text-2xl font-display font-bold tracking-tight", stat.color)}>{stat.value}</p>
                        {stat.label === 'SALDO EM CAIXA' && (
                          <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-widest">Aporte - Gastos</p>
                        )}
                        {stat.label === 'REALIZADO (OBRAS)' && (
                          <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-widest">{project.physicalProgress}% do orçamento</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Progress & Timeline - Left Bento Column */}
                    <div className="lg:col-span-4 space-y-12">
                      {/* Progress Sections */}
                      <div className="space-y-8 bg-surface-container-low/40 p-10 rounded-[32px] border border-white/5 backdrop-blur-xl">
                        <h5 className="text-[10px] font-display font-bold text-white uppercase tracking-[4px] mb-2">Monitoramento de Fluxo</h5>
                        <div>
                          <div className="flex justify-between items-end mb-4">
                            <span className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest">Execução Financeira</span>
                            <span className="text-sm font-display font-bold text-primary">{project.financialProgress}%</span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${project.financialProgress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(34,255,136,0.6)]" 
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-end mb-4">
                            <span className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest">Avanço Físico</span>
                            <span className="text-sm font-display font-bold text-white">{project.physicalProgress}%</span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${project.physicalProgress}%` }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              className="h-full bg-white/40 rounded-full" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Timeline Bento Card */}
                      <div className="bg-surface-container-low/20 rounded-[32px] border border-white/5 p-10 relative overflow-hidden group/timeline backdrop-blur-xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl opacity-0 group-hover/timeline:opacity-100 transition-opacity" />
                        <h5 className="text-[10px] font-display font-bold text-white uppercase tracking-[4px] mb-8 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" /> Histórico Operacional
                        </h5>
                        <div className="space-y-8">
                          {project.logs.slice(0, 3).map((log: any, j: number) => (
                            <div key={j} className="flex gap-6 items-start group/log">
                              <div className="relative">
                                <div className="w-2 h-2 rounded-full bg-primary/30 group-hover/log:bg-primary group-hover/log:scale-125 transition-all duration-300 mt-1.5 relative z-10" />
                                {j !== 2 && <div className="absolute left-[3.5px] top-5 w-[1px] h-12 bg-white/5" />}
                              </div>
                              <div>
                                <p className="text-[10px] font-display font-bold text-primary tracking-widest uppercase mb-1.5">{log.date}</p>
                                <p className="text-xs text-on-surface-variant font-medium leading-relaxed group-hover:text-white transition-colors">{log.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Data Visualization - Right Bento Column */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Evolution Chart */}
                      <div className="md:col-span-2 bg-background/30 border border-white/5 rounded-[40px] p-8 flex flex-col hover:border-primary/20 transition-all duration-500">
                        <div className="flex items-center justify-between mb-10">
                          <h5 className="text-[10px] font-display font-bold text-white uppercase tracking-[4px]">ANÁLISE DE EVOLUÇÃO TEMPORAL</h5>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-4 rounded-full bg-primary" />
                              <span className="text-[9px] text-on-surface-variant uppercase font-bold tracking-widest">Real</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-4 rounded-full bg-white/20 border-dashed border-white/40" />
                              <span className="text-[9px] text-on-surface-variant uppercase font-bold tracking-widest">Meta</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={project.evolutionData}>
                              <defs>
                                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#22ff88" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#22ff88" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.03} vertical={false} />
                              <XAxis dataKey="month" stroke="#64748B" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                              <YAxis stroke="#64748B" fontSize={10} axisLine={false} tickLine={false} dx={-10} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropBlur: '12px' }}
                                itemStyle={{ color: '#22ff88', fontSize: '12px', fontWeight: 'bold' }}
                                labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '10px' }}
                              />
                              <Line type="monotone" dataKey="real" stroke="#22ff88" strokeWidth={4} dot={{ r: 4, fill: '#22ff88', strokeWidth: 2, stroke: '#050505' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                              <Line type="monotone" dataKey="previsto" stroke="#64748b" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Cost Bar Chart */}
                      <div className="md:col-span-2 bg-background/30 border border-white/5 rounded-[40px] p-8 flex flex-col hover:border-primary/20 transition-all duration-500">
                        <h5 className="text-[10px] font-display font-bold text-white uppercase tracking-[4px] mb-10">DISTRIBUIÇÃO DE CUSTOS OPERACIONAIS</h5>
                        <div className="flex-1 min-h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={project.costData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.03} vertical={false} />
                              <XAxis dataKey="name" stroke="#64748B" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                              <YAxis stroke="#64748B" fontSize={10} axisLine={false} tickLine={false} dx={-10} />
                              <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                              />
                              <Bar dataKey="previsto" fill="rgba(255,255,255,0.05)" radius={[12, 12, 0, 0]} />
                              <Bar dataKey="realizado" fill="#22ff88" radius={[12, 12, 0, 0]} shadow="0 0 20px rgba(34,255,136,0.2)" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
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

import React, { useState } from 'react';
import {
  TrendingUp,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Filter,
  Plus,
  Camera,
  FileText,
  HardHat,
  MessageSquare,
  ArrowRight,
  Calendar as CalendarIcon,
  Search,
  MoreVertical,
  Cloud,
  Sun,
  Verified,
  Map as MapIcon,
  ClipboardList,
  ChevronLeft,
  Wallet,
  Edit,
  Trash2,
  X,
  Save,
  Paperclip,
  Calculator as CalculatorIcon,
  RefreshCw,
  ArrowLeft,
  Printer,
  MessageCircle,
  Settings,
  Instagram
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

// --- Dashboard View ---
export function DashboardView() {
  const [dashboardProjects, setDashboardProjects] = React.useState<any[]>([]);

  React.useEffect(() => {
    const saved = localStorage.getItem('constructpro_projects');
    if (saved) {
      try {
        const parsedProjects = JSON.parse(saved);
        const mappedProjects = parsedProjects.map((p: any) => {
          // Calculate Budget (Ordained)
          const ordained = (p.budgetItems || []).reduce((acc: number, item: any) => acc + (Number(item.quantity) * Number(item.unitCost)), 0);

          // Calculate Spent (Realized)
          const spent = (p.financialItems || []).reduce((acc: number, item: any) => acc + Number(item.amount), 0);

          const balance = ordained - spent;
          const financialProgress = ordained > 0 ? (spent / ordained) * 100 : 0;

          // Calculate Physical Progress
          const scheduleItems = p.scheduleItems || [];
          const totalPhysical = scheduleItems.reduce((acc: number, item: any) => acc + Number(item.progress || 0), 0);
          const physicalProgress = scheduleItems.length > 0 ? totalPhysical / scheduleItems.length : 0;

          // Map Logs (Top 3)
          const sortedLogs = [...(p.dailyLogs || [])].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
          const logs = sortedLogs.map((log: any) => {
            let desc = log.activities || '';
            if (desc.length > 70) desc = desc.substring(0, 70) + '...';
            const dateObj = new Date(log.date + 'T12:00:00Z');
            const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
            return { date: dateStr, desc };
          });

          // Compute CostData (Aggregated by Category)
          const categoriesRaw = [...new Set([
            ...(p.budgetItems || []).map((i: any) => i.category),
            ...(p.financialItems || []).map((i: any) => i.category)
          ])].filter(c => c && c !== 'Todas');

          let costData = categoriesRaw.map(cat => {
            const previsto = (p.budgetItems || []).filter((i: any) => i.category === cat).reduce((acc: number, item: any) => acc + (Number(item.quantity) * Number(item.unitCost)), 0);
            const realizado = (p.financialItems || []).filter((i: any) => i.category === cat).reduce((acc: number, item: any) => acc + Number(item.amount), 0);
            let shortName = String(cat).substring(0, 8);
            return { name: shortName, previsto, realizado };
          });

          if (costData.length === 0) costData = [{ name: 'Sem Custo', previsto: 0, realizado: 0 }];

          // Mock evolution data based on physical progress
          const evolutionData = [
            { month: 'Sem 1', real: Number((physicalProgress * 0.2).toFixed(1)), previsto: Number((physicalProgress * 0.3).toFixed(1)) },
            { month: 'Sem 2', real: Number((physicalProgress * 0.5).toFixed(1)), previsto: Number((physicalProgress * 0.6).toFixed(1)) },
            { month: 'Sem 3', real: Number((physicalProgress * 0.8).toFixed(1)), previsto: Number((physicalProgress * 0.9).toFixed(1)) },
            { month: 'Atual', real: Number(physicalProgress.toFixed(1)), previsto: Number((physicalProgress + 5).toFixed(1)) },
          ];

          return {
            name: p.name || 'Projeto Sem Nome',
            location: p.location || 'Local Não Informado',
            status: p.status || 'Planejamento',
            ordained,
            spent,
            balance,
            financialProgress: Number(financialProgress.toFixed(1)),
            physicalProgress: Number(physicalProgress.toFixed(1)),
            logs,
            evolutionData,
            costData
          };
        });

        setDashboardProjects(mappedProjects);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">Visão geral dos seus projetos e custos</p>
      </div>

      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Resumo por Obra</h3>

      <div className="space-y-12">
        {dashboardProjects.map((project, i) => (
          <div key={i} className="bg-[#181C21] rounded-[24px] overflow-hidden shadow-xl border border-slate-800">
            {/* Top Project Badge Area */}
            <div className="p-8 pb-6 border-b border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <h4 className="text-[22px] font-bold text-slate-100 tracking-tight">{project.name}</h4>
                <p className="text-slate-500 text-[13px] font-medium mt-1">{project.location}</p>
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

              {/* Central KPIs & Progress */}
              <div className="lg:col-span-4 space-y-8">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                      <Wallet className="h-[14px] w-[14px]" />
                      <span className="text-[11px] font-medium">Orçado</span>
                    </div>
                    <p className="text-base font-bold text-slate-100">R$ {project.ordained.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                      <TrendingUp className="h-[14px] w-[14px]" />
                      <span className="text-[11px] font-medium">Gasto</span>
                    </div>
                    <p className="text-base font-bold text-[#FF8A00]">R$ {project.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                      <AlertCircle className="h-[14px] w-[14px]" />
                      <span className="text-[11px] font-medium">Saldo</span>
                    </div>
                    <p className="text-base font-bold text-[#00E57A]">R$ {project.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="space-y-6 pt-2">
                  <div>
                    <div className="flex justify-between items-end mb-2.5">
                      <span className="text-xs font-medium text-slate-400">Execução financeira</span>
                      <span className="text-xs font-semibold text-slate-300">{project.financialProgress}%</span>
                    </div>
                    <div className="h-[6px] w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#4170FF] rounded-full" style={{ width: `${project.financialProgress}%` }}></div>
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

                {/* Logs */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 mt-4">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Últimas Atividades do Diário
                  </h5>
                  <div className="space-y-4">
                    {project.logs.map((log, j) => (
                      <div key={j} className="flex gap-4 items-start relative before:absolute before:left-1 before:top-4 before:bottom-[-20px] before:w-[2px] before:bg-slate-800 last:before:hidden">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4170FF] mt-1 relative z-10 shrink-0 shadow-[0_0_8px_rgba(65,112,255,0.4)]"></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500">{log.date}</p>
                          <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">{log.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="lg:col-span-8 flex flex-col justify-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                  {/* Line Chart */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Evolução Físico/Financeiro (%)</h5>
                    <div className="flex-1 min-h-0 -ml-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={project.evolutionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                          <XAxis dataKey="month" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                          <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                            itemStyle={{ color: '#F1F5F9', fontSize: '12px' }}
                            labelStyle={{ color: '#94A3B8', fontSize: '10px', marginBottom: '4px' }}
                          />
                          <Line type="monotone" name="Realizado" dataKey="real" stroke="#FFE299" strokeWidth={3} dot={{ r: 4, fill: '#1E293B', stroke: '#FFE299', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#FFE299' }} />
                          <Line type="monotone" name="Previsto" dataKey="previsto" stroke="#4170FF" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Custos por Etapa (R$) </h5>
                    <div className="flex-1 min-h-0 -ml-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={project.costData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                          <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                          <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} dx={-10} tickFormatter={(value) => `${value / 1000}k`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                            itemStyle={{ fontSize: '12px' }}
                            labelStyle={{ color: '#94A3B8', fontSize: '10px', marginBottom: '4px' }}
                            formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`}
                          />
                          <Bar dataKey="previsto" name="Orçado" fill="#4170FF" opacity={0.5} radius={[4, 4, 0, 0]} barSize={20} />
                          <Bar dataKey="realizado" name="Gasto" fill="#FF8A00" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

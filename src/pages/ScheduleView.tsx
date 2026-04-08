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

// --- Schedule View ---
export function ScheduleView() {
  const [activeIdx, setActiveIdx] = useState(0);
  const projects = [
    {
      name: 'Grimaldo Tolaini 50',
      title: 'Planejamento Estrutural',
      tasks: [
        { name: 'Fundação e Alicerce', dep: 'Terreno Limpo', start: '01 Set', end: '15 Set', days: 14, progress: 100, status: 'Concluído', color: 'bg-emerald-500' },
        { name: 'Estrutura de Aço (L1)', dep: 'Fundação', start: '16 Set', end: '10 Out', days: 25, progress: 45, status: 'No Prazo', color: 'bg-[#4170FF]' },
        { name: 'Alvenaria Térreo', dep: 'Estrutura', start: '05 Out', end: '30 Out', days: 25, progress: 10, status: 'Atrasado', color: 'bg-[#FF8A00]' },
        { name: 'Instalações Hidráulicas', dep: 'Alvenaria', start: '20 Out', end: '15 Nov', days: 26, progress: 0, status: 'Pendente', color: 'bg-slate-300' },
      ],
      stats: [
        { label: 'Status Global', value: 'No Prazo', sub: 'Em conformidade', color: 'bg-emerald-500' },
        { label: 'Conclusão', value: '64%', sub: 'Progresso total', progress: 64 },
        { label: 'Críticos', value: '02 Tarefas', sub: 'Atenção necessária', border: 'border-l-4 border-amber-500' },
        { label: 'Próxima Entrega', value: '12 Out', sub: 'Laje L1' }
      ]
    },
    {
      name: 'Residencial Alphaville',
      title: 'Fase de Acabamentos',
      tasks: [
        { name: 'Revestimentos Externos', dep: 'Emboço', start: '01 Out', end: '20 Out', days: 20, progress: 80, status: 'No Prazo', color: 'bg-emerald-500' },
        { name: 'Instalação de Esquadrias', dep: 'Revestimentos', start: '15 Out', end: '30 Out', days: 15, progress: 10, status: 'Atrasado', color: 'bg-red-500' },
        { name: 'Pintura Interna', dep: 'Massa', start: '20 Out', end: '10 Nov', days: 21, progress: 0, status: 'Pendente', color: 'bg-slate-300' },
      ],
      stats: [
        { label: 'Status Global', value: 'Atrasado', sub: 'Risco alto', color: 'bg-red-500' },
        { label: 'Conclusão', value: '48%', sub: 'Progresso total', progress: 48 },
        { label: 'Críticos', value: '04 Tarefas', sub: 'Atenção imediata', border: 'border-l-4 border-red-500' },
        { label: 'Próxima Entrega', value: '30 Out', sub: 'Esquadrias' }
      ]
    }
  ];

  const active = projects[activeIdx];

  return (
    <div className="space-y-8 flex flex-col h-full">
      <div className="flex gap-2 w-max bg-white/5 p-1.5 rounded-xl">
        {projects.map((p, i) => (
          <button key={i} onClick={() => setActiveIdx(i)} className={cn("px-5 py-2 text-sm font-bold rounded-lg transition-all", activeIdx === i ? "bg-[#13171f] text-white shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            {p.name}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-end">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-secondary">Cronograma • {active.name}</span>
          <h2 className="text-4xl font-black text-primary tracking-tighter mt-1">{active.title}</h2>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-lg border border-outline-variant text-sm font-semibold hover:bg-surface-container transition-colors flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </button>
          <button className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/10">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {active.stats.map((stat, i) => (
          <div key={i} className={cn("bg-[#181c21] p-5 rounded-xl", stat.border)}>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <div className="flex items-center gap-2">
              {stat.color && <span className={cn("w-3 h-3 rounded-full animate-pulse", stat.color)}></span>}
              <span className="text-2xl font-black text-primary">{stat.value}</span>
            </div>
            {stat.progress && (
              <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${stat.progress}%` }}></div>
              </div>
            )}
            {!stat.progress && <p className="text-[10px] text-slate-400 font-medium mt-1">{stat.sub}</p>}
          </div>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden rounded-xl bg-[#181c21] border border-white/5">
        <div className="w-[550px] flex flex-col border-r border-outline-variant/30 overflow-hidden">
          <div className="h-12 flex items-center px-6 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.15em]">
            <div className="w-1/2">Etapa / Tarefa</div>
            <div className="w-1/4 px-2">Datas</div>
            <div className="w-1/4 text-center">Status</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {active.tasks.map((task, i) => (
              <div key={i} className="group flex items-center px-6 py-4 hover:bg-[#13171f] transition-colors cursor-pointer border-b border-white/5">
                <div className="w-1/2">
                  <p className="text-sm font-bold text-white">{task.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Dep: {task.dep}</p>
                  <div className="w-32 bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                    <div className={cn("h-full", task.color)} style={{ width: `${task.progress}%` }}></div>
                  </div>
                </div>
                <div className="w-1/4 px-2">
                  <p className="text-[11px] font-bold text-slate-200">{task.start} - {task.end}</p>
                  <p className="text-[10px] text-slate-500">{task.days} dias</p>
                </div>
                <div className="w-1/4 flex justify-center">
                  <span className={cn(
                    "px-2 py-1 rounded text-[9px] font-black uppercase",
                    task.status === 'Concluído' ? "bg-emerald-100 text-emerald-700" :
                      task.status === 'Atrasado' ? "bg-error-container text-error" :
                        "bg-primary-fixed text-primary-fixed-variant"
                  )}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto bg-[#13171f] flex flex-col">
          <div className="h-12 flex items-center bg-[#0b0f15] border-b border-white/5 whitespace-nowrap px-4">
            <div className="flex-1 grid grid-cols-4 gap-0 h-full items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              <div className="text-center border-r border-white/5">Setembro</div>
              <div className="text-center border-r border-white/5 bg-primary-fixed/30 text-primary">Outubro (Atual)</div>
              <div className="text-center border-r border-white/5">Novembro</div>
              <div className="text-center">Dezembro</div>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
              <div className="border-r border-white/5"></div>
              <div className="border-r border-white/5 bg-primary-fixed/5"></div>
              <div className="border-r border-white/5"></div>
              <div></div>
            </div>
            <div className="relative z-10 p-0 flex flex-col h-full">
              {/* Gantt Bars Placeholder */}
              <div className="h-[73px] flex items-center px-4">
                <div className="h-6 bg-emerald-500/20 border-l-4 border-emerald-500 w-[20%] rounded-r flex items-center px-2">
                  <div className="w-full h-full bg-emerald-500"></div>
                </div>
              </div>
              <div className="h-[73px] flex items-center px-4">
                <div className="h-6 bg-primary-container/20 border-l-4 border-primary-container w-[40%] ml-[15%] rounded-r flex items-center">
                  <div className="w-[45%] h-full bg-primary-container"></div>
                </div>
              </div>
              <div className="h-[73px] flex items-center px-4">
                <div className="h-6 bg-secondary-container/20 border-l-4 border-secondary-container w-[35%] ml-[30%] rounded-r flex items-center">
                  <div className="w-[10%] h-full bg-secondary-container"></div>
                </div>
              </div>
              <div className="h-[73px] flex items-center px-4">
                <div className="h-6 bg-white/10/50 border-l-4 border-slate-300 w-[30%] ml-[45%] rounded-r"></div>
              </div>
            </div>
            <div className="absolute top-0 bottom-0 left-[38%] w-px bg-secondary-container z-20">
              <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-secondary-container"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

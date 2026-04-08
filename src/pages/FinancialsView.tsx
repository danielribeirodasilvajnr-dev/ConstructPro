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

// --- Financials View ---
export function FinancialsView() {
  const [activeIdx, setActiveIdx] = useState(0);
  const projects = [
    {
      name: 'Grimaldo Tolaini 50',
      lucro: '482.300,00',
      status: 'Saudável',
      data: [
        { name: 'Fundação', previsto: 40, realizado: 35 },
        { name: 'Estrutura', previsto: 70, realizado: 75 },
        { name: 'Alvenaria', previsto: 50, realizado: 48 },
        { name: 'Elétrica', previsto: 30, realizado: 20 },
        { name: 'Acabamento', previsto: 90, realizado: 100 },
      ]
    },
    {
      name: 'Residencial Alphaville',
      lucro: '124.500,00',
      status: 'Atenção',
      data: [
        { name: 'Fundação', previsto: 80, realizado: 80 },
        { name: 'Estrutura', previsto: 150, realizado: 180 },
        { name: 'Acabamento', previsto: 60, realizado: 30 },
      ]
    }
  ];

  const active = projects[activeIdx];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex gap-2 w-max bg-white/5 p-1.5 rounded-xl">
        {projects.map((p, i) => (
          <button key={i} onClick={() => setActiveIdx(i)} className={cn("px-5 py-2 text-sm font-bold rounded-lg transition-all", activeIdx === i ? "bg-[#13171f] text-white shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            {p.name}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Financeiro • {active.name}</h2>
          <p className="text-on-surface-variant font-medium">Análise de custos e fluxo de caixa.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-surface-container rounded-lg p-1">
            <button className="px-4 py-1.5 text-xs font-bold rounded bg-[#13171f] shadow-sm text-primary">Mensal</button>
            <button className="px-4 py-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors">Anual</button>
          </div>
          <button className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-secondary/20">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 bg-primary text-white p-6 rounded-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="z-10">
            <p className="text-slate-400 text-sm font-semibold mb-1">Lucro Projetado (Final da Obra)</p>
            <h3 className="text-4xl font-extrabold tracking-tighter">R$ {active.lucro}</h3>
            <div className={cn("mt-4 flex items-center gap-2", active.status === "Saudável" ? "text-emerald-400" : "text-amber-400")}>
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold">{active.status === "Saudável" ? "+12.4% vs. Viabilidade" : "-5.2% vs. Viabilidade"}</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="h-32 w-32" />
          </div>
          <div className="mt-8 pt-4 border-t border-white/10 z-10 flex justify-between items-center">
            <span className="text-xs text-white/60">Status de Rentabilidade</span>
            <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">Saudável</span>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-[#181c21] p-6 rounded-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="font-bold text-primary tracking-tight">Comparativo: Orçado vs. Realizado</h4>
              <p className="text-xs text-on-surface-variant font-medium">Visão acumulada por fase da obra</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-container"></div>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">Previsto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">Realizado</span>
              </div>
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={active.data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#45474d' }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="previsto" fill="#1b263b" radius={[2, 2, 0, 0]} barSize={24} />
                <Bar dataKey="realizado" fill="#fe7a34" radius={[2, 2, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 w-full md:w-auto">
            {['Todas Categorias', 'Materiais', 'Mão de Obra', 'Equipamentos', 'Encargos'].map((cat, i) => (
              <button key={i} className={cn(
                "flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-colors",
                i === 0 ? "bg-primary text-white" : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
              )}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-2">Visualizar:</span>
            <div className="flex border border-outline-variant/30 rounded-lg overflow-hidden">
              <button className="p-2 bg-surface-container-highest"><Search className="h-4 w-4" /></button>
              <button className="p-2 hover:bg-surface-container-high transition-colors border-l border-outline-variant/30"><Filter className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        <div className="bg-[#181c21] rounded-xl overflow-hidden border border-white/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high">
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Data</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant text-right">Valor</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant text-center">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {[
                { date: '12 Mai 2024', cat: 'Materiais', desc: 'Cimento CP-II (500 sacos) - Votoran', val: '14.500,00', status: 'Pago', color: 'bg-green-100 text-green-700' },
                { date: '15 Mai 2024', cat: 'Mão de Obra', desc: 'Folha de Pagamento - Equipe Civil', val: '28.750,00', status: 'Pendente', color: 'bg-amber-100 text-amber-700' },
                { date: '18 Mai 2024', cat: 'Equipamentos', desc: 'Aluguel de Grua T1 - Mensalidade', val: '5.200,00', status: 'Pago', color: 'bg-green-100 text-green-700' },
                { date: '20 Mai 2024', cat: 'Materiais', desc: 'Vergalhão CA-50 10.0mm (2t)', val: '18.200,00', status: 'Pendente', color: 'bg-amber-100 text-amber-700' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-surface-container transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium">{row.date}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-white/5 text-slate-700 uppercase">{row.cat}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">{row.desc}</td>
                  <td className="px-6 py-4 text-sm font-bold text-primary text-right">R$ {row.val}</td>
                  <td className="px-6 py-4 text-center">
                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", row.color)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", row.status === 'Pago' ? 'bg-green-600' : 'bg-amber-600')}></span>
                      {row.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <MoreVertical className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

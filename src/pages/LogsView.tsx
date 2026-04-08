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

// --- Logs View ---
export function LogsView() {
  const [activeIdx, setActiveIdx] = useState(0);
  const projects = [
    {
      name: 'Grimaldo Tolaini 50',
      logs: [
        { date: '10 OUT 2023', title: 'Fundação Bloco B', sub: '12 atividades • Concluído', color: 'bg-slate-300' },
        { date: '09 OUT 2023', title: 'Nivelamento de Terreno', sub: 'Impacto no cronograma', color: 'bg-[#FF8A00]', error: true },
        { date: '08 OUT 2023', title: 'Preparação de Armadura', sub: '8 atividades • Concluído', color: 'bg-emerald-500' }
      ]
    },
    {
      name: 'Residencial Alphaville',
      logs: [
        { date: '08 MAI 2024', title: 'Revestimento Fachada', sub: 'Massa concluída', color: 'bg-emerald-500' },
        { date: '07 MAI 2024', title: 'Chuva Forte', sub: 'Trabalho interrompido', color: 'bg-red-500', error: true },
      ]
    }
  ];

  const active = projects[activeIdx];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex gap-2 w-max bg-white/5 p-1.5 rounded-xl mb-4">
        {projects.map((p, i) => (
          <button key={i} onClick={() => setActiveIdx(i)} className={cn("px-5 py-2 text-sm font-bold rounded-lg transition-all", activeIdx === i ? "bg-[#13171f] text-white shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-3 space-y-8 sticky top-24">
          <section className="bg-[#181c21] p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold tracking-tight uppercase text-on-surface-variant">Data da Obra</h3>
              <CalendarIcon className="text-secondary h-4 w-4" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold">Outubro 2023</span>
                <div className="flex gap-2">
                  <ChevronLeft className="h-4 w-4 cursor-pointer" />
                  <ArrowRight className="h-4 w-4 cursor-pointer rotate-180" />
                </div>
              </div>
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 text-center text-xs gap-y-2">
                {Array.from({ length: 31 }).map((_, i) => (
                  <div key={i} className={cn(
                    "p-1 rounded-md cursor-pointer",
                    i + 1 === 11 ? "bg-secondary text-white font-bold" : "hover:bg-surface-container-highest"
                  )}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold tracking-widest uppercase text-on-surface-variant ml-2">Histórico Recente</h3>
            <div className="relative ml-4 border-l-2 border-white/10 pl-6 space-y-8">
              {active.logs.map((item, i) => (
                <div key={i} className="relative">
                  <div className={cn("absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-surface", item.color)}></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500">{item.date}</span>
                    <span className="text-sm font-semibold">{item.title}</span>
                    <span className={cn("text-[11px] mt-1 flex items-center gap-1", item.error ? "text-error" : "text-slate-400")}>
                      {item.error && <AlertCircle className="h-3 w-3" />}
                      {item.sub}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-9 space-y-8">
          <div className="bg-primary-container text-white p-8 rounded-xl flex justify-between items-center relative overflow-hidden">
            <div className="z-10">
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">Quarta-feira, 11 de Outubro</h2>
              <p className="text-slate-400 text-sm">Diário de Obras • <span className="text-white font-bold">{active.name}</span></p>
            </div>
            <div className="z-10 bg-[#13171f]/10 p-5 rounded-xl border border-white/10 backdrop-blur-md min-w-[280px]">
              <p className="text-xs font-bold uppercase tracking-wider mb-4">Impacto no cronograma?</p>
              <div className="flex gap-4">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#13171f]/10 hover:bg-error transition-colors font-bold text-sm">
                  <AlertCircle className="h-4 w-4" /> Sim
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-secondary text-white font-bold text-sm shadow-lg shadow-secondary/20">
                  <CheckCircle2 className="h-4 w-4" /> Não
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-secondary/20 to-transparent"></div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold tracking-tight">Atividades do Dia</h3>
              <button className="flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary transition-colors">
                <Plus className="h-4 w-4" /> Adicionar Atividade
              </button>
            </div>
            <div className="bg-[#181c21] rounded-xl overflow-hidden border border-white/5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Atividade Executada</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Responsável</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-on-surface-variant tracking-widest text-center">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {[
                    { title: 'Concretagem da Laje L1', sub: 'Volume: 45m³ • Bombeamento contínuo', resp: 'Eng. Ricardo M.', status: 'Executado', color: 'bg-green-100 text-green-700' },
                    { title: 'Instalação Elétrica - Prumada 3', sub: 'Passagem de cabos de força', resp: 'Mestre João Silva', status: 'Em andamento', color: 'bg-amber-100 text-amber-700' },
                    { title: 'Alvenaria de Vedação - 4º Pav.', sub: 'Fase final de fechamento externo', resp: 'Engª. Beatriz L.', status: 'Atrasado', color: 'bg-red-100 text-red-700' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-surface-container-high transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{row.title}</span>
                          <span className="text-xs text-slate-500">{row.sub}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-300"></div>
                          <span className="text-xs font-medium">{row.resp}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <span className={cn("px-3 py-1 text-[10px] font-bold rounded-full uppercase", row.color)}>{row.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <MoreVertical className="h-4 w-4 text-slate-400 cursor-pointer hover:text-primary" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold tracking-tight">Galeria do Dia</h3>
                <span className="bg-surface-container-highest px-2 py-0.5 rounded text-[10px] font-bold">4 FOTOS</span>
              </div>
              <button className="flex items-center gap-2 text-sm font-bold text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary-container transition-colors">
                <Camera className="h-4 w-4" /> Carregar Fotos
              </button>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[
                { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_uXHp1KWVKXOZcmbXqlalnu8XjHVaZkas0heifAJFwcVAt8KgEswlxsMLBQekJ30HZdjUd6zLywAWvyctXAb8BEbN-3oZ3_x1H27ZAxk4NEUoIysby063-sSUdxDXjPypcQDiKPrIIOTDRSzd0kzVwjhjcK0Fp8_gBfONVc9w4JUwvu9iDUTOpoNs6lAUoAjhzs5X_7Az4tO987earg1j0Au_VGizAdzop70nCTy4bpGzvKp4PqlmlDXCFKyKSUqhnvF8auEIQg', time: '14:32', desc: 'Vista panorâmica do concretagem da laje L1, setor norte.' },
                { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqRikr2de3z2-OrSSxlUvUdOt1Jcpf2zVE2qXvCDcis25svD70AH3Cn23a7xDJDBVlT2-VsVpPoVQXdnYXoqlU4wpkDnls9VSEOTvn3kS-a58cN2Z-fQkL1pbVjznyZecHkzALjHM7lt_syYjkZGb7qqcAwDWHPaIKMGwqOw84r_2UtATE_-uc8lu4bC4FO69DmaFTPHbxrXn3He3gU4d_kg_sjVklht0EaydVdmpB5qJfs2nTxIN_7KjueZG3FxDyU4NLpdroVQ', time: '10:15', desc: 'Detalhamento da instalação de cabos na prumada principal.' },
                { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvm7TaUvVQmFeW--ac0OGBxzQdN7-TVmSLhjFlvmsZZ7tqy9-QsT8DkbjKYt4z0ehwIkjU5GRUli0g_IwnqvYUBZQOfH80C5k-dQQ-d0sNGNiWoiv3Jb9QojkdW5foSW1qZsfEoTJECUXnQHBG5q7G9AaqLmuuM1GP7rEPXc6LGY-z7svUNqCeJQm8N3Sp5pCBuC59emrShPzPWLdhPRIrVoBv0mlV0vJyQ1S2EfsJAHHwux9AXBvjlFuHevIIF1JVjO2Rwqf4Bw', time: '09:45', desc: 'Reunião matinal com a equipe de engenharia para revisão.' },
              ].map((photo, i) => (
                <div key={i} className="group flex flex-col gap-3">
                  <div className="aspect-video rounded-xl overflow-hidden relative shadow-lg">
                    <img
                      src={photo.img}
                      alt="Gallery"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
                      <span className="text-white text-[10px] font-bold">{photo.time} • GEO-TAGGED</span>
                    </div>
                  </div>
                  <div className="bg-[#181c21] p-4 rounded-xl border-l-4 border-secondary">
                    <p className="text-xs font-bold uppercase text-secondary mb-1">Descrição Obrigatória</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{photo.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="glass-panel p-6 rounded-2xl border border-white/20 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-300"></div>)}
              </div>
              <div>
                <p className="text-sm font-bold">5 Profissionais Ativos</p>
                <p className="text-xs text-slate-500">Última atualização: há 12 minutos</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-2.5 rounded-lg border border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all">Exportar PDF</button>
              <button className="px-6 py-2.5 rounded-lg bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 transition-transform active:scale-95">Finalizar Diário</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { cn, formatCurrency } from '../lib/utils';

interface ProprietorViewProps {
  selectedProjectId: string | null;
}

// --- Proprietor View ---
export function ProprietorView({ selectedProjectId }: ProprietorViewProps) {
  if (!selectedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#13171f] rounded-2xl border border-white/5">
        <h2 className="text-2xl font-bold text-white mb-2">Acesso do Proprietário</h2>
        <p className="text-slate-500">Selecione uma de suas obras para acompanhar o progresso em tempo real.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-24">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl p-8 bg-gradient-to-br from-primary to-primary-container text-white min-h-[280px] flex flex-col justify-end"
      >
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSXTwlkIJ2po2lzhvYHkYpNiu8Zk_DwOJw2l53rUcGp10lJqXyv0XuMhldOJFuT_NtQIW9AN7rreILGvKctD0nFmBs9O9tIE_S1AfcVcDAJgckrFbSgnPWL_4WVMGZnBgEFaG-dYNQYyFEIZTfOckeN2lus9T7k65MALihPkP0Av87k_Hh1GLgtrYJ1SQL0Z0K1oOilkUZwYJ2CtPBQZFCZHmE3_QNATf62qpzxfaIK7-ZbgapOTLDeApDVFmoG78IMVK9gV_iGA"
            alt="Construction"
            className="object-cover w-full h-full"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Bem-vindo de volta, Sr. Ricardo</h1>
          <p className="text-slate-300 font-medium text-lg mb-6">Sua obra está 65% concluída</p>
          <div className="w-full max-w-md bg-[#13171f]/10 rounded-full h-3 mb-2">
            <div className="bg-secondary-container h-3 rounded-full shadow-[0_0_12px_rgba(254,122,52,0.5)]" style={{ width: '65%' }}></div>
          </div>
          <div className="flex justify-between text-xs font-bold tracking-widest uppercase opacity-70">
            <span>Fundação</span>
            <span>Acabamento</span>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Visual Progress */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="text-2xl font-bold tracking-tight">Progresso Visual</h2>
              <button className="text-secondary font-semibold text-sm hover:underline">Ver álbum completo</button>
            </div>
            <div className="grid grid-cols-3 gap-4 h-[400px]">
              <div className="col-span-2 rounded-xl overflow-hidden group cursor-pointer relative">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuACOW9VJpcpE2yXaSuzg_Aj8tmDEQW5zFZcTSNBgCk2jUYT2UdvVUlT1kSlJuTw-JczyXBV3R6xzpQjOv8nltYlcJ7X_GtDqXVCYlzkB8026SY9Y8iteO9SPHEV_q9r_YxoYpLb46pFs8mSwdNTKRkPD8GBmQ_sGB6CF4jHmISaxhokjMoUjMXt8Uivlr_8wK3s0NQgq2wnjVAYf4yXO7s3nhDBfWouMQ0r0PIutvzvoGHFQh6_-yjZm3jhEEtDzFCLqlUgRmAp0A"
                  alt="Progress"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                  <p className="text-white font-medium">Instalação Hidráulica - Setor B</p>
                  <p className="text-white/70 text-sm">Atualizado há 2 dias</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="h-1/2 rounded-xl overflow-hidden group cursor-pointer">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAewzwvJZ1OvO_PkwrMcfqeGEZ9VpHG7NPYze47OSADD5ApqL0n0cCkkpsjB58NymaesQhqeGyoEtvjt6vNcWdfZ1RlEwskZ-b1LbT9StEEi-Y82Dsd8k1i0RY1rmjm56dd9mcmqmJ2qcQG9f12AlC0vEt5dRWmGru0djphBcBl3rGhGcee4FV5xiPrkgxm7J0B44c4nhzxYmpwYOvTxyJVwtaKqqE5JDRSfLmjsyT4XltrjIBcRDmbCA6K6y2_qduZJpxq_HOKPg"
                    alt="Detail"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="h-1/2 rounded-xl overflow-hidden relative group cursor-pointer">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGb-Y6so1gnLYVHXbQP18g4YDGEP7XRBmDa2uUMhUIP3vwlnLkkwm3DU-J5q5MS7UqViyNjBojorhy6qLs6ZAgBCBor04JHKdbAq_AXzqvqGV2OJ9PW1JTxK88Fa5VpW8iIff5EQle2R1mqIXqlQMTEb-HsIqf7Dson1Li663-_8WKWtF-XSXFo7maX49VUBlsX1eWt32_yGDiPzj50I-O8qp5zgwLxeDy4Gal1jdO4SdNMxrKbbtE26r-8mb-GrsZ7a8_n5kGmw"
                    alt="More"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">+14 fotos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[#181c21] rounded-xl p-8 border border-white/5 shadow-sm">
            <h3 className="text-xl font-bold mb-8">Etapas da Obra</h3>
            <div className="relative space-y-8">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-outline-variant opacity-30"></div>

              <div className="relative flex gap-6 items-start">
                <div className="z-10 bg-primary w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-surface-container-low">
                  <CheckCircle2 className="text-white h-3 w-3" />
                </div>
                <div>
                  <h4 className="font-bold">Estrutura finalizada</h4>
                  <p className="text-sm text-on-surface-variant">Lajes, vigas e pilares concluídos.</p>
                  <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded">12 Out, 2023</span>
                </div>
              </div>

              <div className="relative flex gap-6 items-start">
                <div className="z-10 bg-secondary-container w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-surface-container-low shadow-[0_0_8px_rgba(254,122,52,0.4)]">
                  <div className="w-2 h-2 bg-[#13171f] rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-bold">Instalações em andamento</h4>
                  <p className="text-sm text-on-surface-variant">Execução de pontos elétricos.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-secondary text-xs font-bold px-2 py-1 bg-orange-100 rounded uppercase">Em Execução</span>
                    <span className="text-xs text-on-surface-variant italic">Previsão: 20 Nov</span>
                  </div>
                </div>
              </div>

              <div className="relative flex gap-6 items-start opacity-50">
                <div className="z-10 bg-outline-variant w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-surface-container-low"></div>
                <div>
                  <h4 className="font-bold">Revestimentos e Pintura</h4>
                  <p className="text-sm text-on-surface-variant">Próxima etapa programada.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Financial Summary */}
          <div className="bg-[#13171f] rounded-xl p-6 border border-white/5 shadow-sm border-t-4 border-t-secondary">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="text-secondary h-5 w-5" />
              Resumo Financeiro
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-on-surface-variant mb-1 font-medium">Total Investido</p>
                <p className="text-3xl font-extrabold tracking-tight text-primary">{formatCurrency(485200)}</p>
              </div>
              <div className="p-4 bg-[#181c21] rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-bold uppercase text-on-surface-variant tracking-wider">Próxima Parcela</p>
                  <span className="text-xs font-bold text-secondary">Vence em 5 dias</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(12450)}</p>
                <button className="w-full mt-4 bg-primary text-white py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
                  Pagar Agora
                </button>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-surface-container rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="text-primary h-5 w-5" />
              Documentação
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Contrato.pdf' },
                { name: 'Planta_Baixa_RevA.dwg' },
                { name: 'Memorial.pdf' }
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#13171f] rounded-lg group cursor-pointer hover:bg-primary-container hover:text-white transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 opacity-60" />
                    <span className="text-sm font-medium">{doc.name}</span>
                  </div>
                  <Download className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="p-6 rounded-xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <HardHat className="text-primary h-6 w-6" />
            </div>
            <h4 className="font-bold">Dúvidas?</h4>
            <p className="text-sm text-on-surface-variant mt-1 mb-4">Fale com seu engenheiro.</p>
            <button className="bg-secondary-container text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform">
              <MessageSquare className="h-4 w-4" />
              Abrir Chamado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

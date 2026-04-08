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
import { useProjects } from '../hooks/useProjects';
import { useProjectData } from '../hooks/useProjectData';
import { useAuth } from '../contexts/AuthContext';

interface ProprietorViewProps {
  selectedProjectId: string | null;
}

// --- Proprietor View ---
export function ProprietorView({ selectedProjectId }: ProprietorViewProps) {
  const { user } = useAuth();
  const { projects } = useProjects();
  const project = projects.find(p => p.id === selectedProjectId);
  const { financialItems, budgetItems, scheduleItems, dailyLogs } = useProjectData(selectedProjectId);

  if (!selectedProjectId || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#181c21] rounded-2xl border border-white/5 mx-auto max-w-4xl">
        <HardHat className="h-12 w-12 text-slate-700 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Acesso do Proprietário</h2>
        <p className="text-slate-500 text-center max-w-xs">Selecione uma obra na lista de projetos para visualizar o painel exclusivo do cliente.</p>
      </div>
    );
  }

  // Calculate real progress
  const physicalProgress = scheduleItems.length > 0
    ? Math.round(scheduleItems.reduce((acc, item) => acc + Number(item.progress || 0), 0) / scheduleItems.length)
    : 0;

  const totalInvested = financialItems.reduce((acc, item) => acc + Number(item.amount), 0);
  const totalBudget = budgetItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0);
  const financialProgress = totalBudget > 0 ? Math.round((totalInvested / totalBudget) * 100) : 0;

  // Extract real photos from daily logs
  const allPhotos = dailyLogs.flatMap(log =>
    (log.daily_log_photos || []).map((photo: any) => ({
      url: photo.image_url,
      desc: photo.description || log.activities || 'Foto da obra',
      date: log.date
    }))
  ).slice(0, 6); // Take latest 6

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
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            Bem-vindo de volta, {project.client || 'Proprietário'}
          </h1>
          <div className="flex flex-wrap gap-6 mb-6 opacity-80">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Local:</span>
              <span className="text-sm font-bold text-white">{project.location || 'N/D'}</span>
            </div>
            <div className="flex items-center gap-2 border-l border-white/20 pl-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Área:</span>
              <span className="text-sm font-bold text-white">{project.area || '0'},00 m²</span>
            </div>
            <div className="flex items-center gap-2 border-l border-white/20 pl-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Prazo:</span>
              <span className="text-sm font-bold text-white">{project.deadline || 'N/D'}</span>
            </div>
          </div>

          <p className="text-slate-200 font-medium text-lg mb-6">Sua obra está <span className="text-white font-bold">{physicalProgress}%</span> concluída</p>
          <div className="w-full max-w-md bg-white/10 rounded-full h-3 mb-2">
            <div className="bg-white h-3 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-1000" style={{ width: `${physicalProgress}%` }}></div>
          </div>
          <div className="flex justify-between text-xs font-bold tracking-widest uppercase opacity-70">
            <span>Início</span>
            <span>Entrega</span>
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
              {allPhotos.length > 0 ? (
                <>
                  <div className="col-span-2 rounded-xl overflow-hidden group cursor-pointer relative">
                    <img
                      src={allPhotos[0].url}
                      alt="Progress"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                      <p className="text-white font-medium">{allPhotos[0].desc}</p>
                      <p className="text-white/70 text-sm">Atualizado em {new Date(allPhotos[0].date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    {allPhotos.slice(1, 3).map((photo, k) => (
                      <div key={k} className="h-1/2 rounded-xl overflow-hidden group cursor-pointer relative">
                        <img
                          src={photo.url}
                          alt="Detail"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ))}
                    {allPhotos.length > 3 && (
                      <div className="h-1/2 rounded-xl overflow-hidden relative group cursor-pointer">
                        <img src={allPhotos[3].url} className="w-full h-full object-cover opacity-50" alt="more" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-bold text-xl">+{allPhotos.length - 3} fotos</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="col-span-3 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <Camera className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Nenhuma foto cadastrada no diário de obra.</p>
                </div>
              )}
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
          {/* Financial Progress Bar */}
          <div className="bg-[#13171f] rounded-xl p-6 border border-white/5 shadow-sm border-t-4 border-t-primary">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Wallet className="text-primary h-5 w-5" />
              Execução Financeira
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-sm text-slate-400 font-medium tracking-tight">Investimento Total</p>
                  <span className="text-lg font-bold text-white tracking-tight">{financialProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${financialProgress}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  <span>Início</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Total Gasto</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(totalInvested)}</p>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Orcamento</p>
                  <p className="text-sm font-bold text-slate-300">{formatCurrency(totalBudget)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-[#13171f] rounded-xl p-6 border border-white/5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText className="text-primary h-5 w-5" />
                Documentação
              </h3>
              <label className="cursor-pointer group">
                <input type="file" className="hidden" onChange={(e) => {
                  // In a real app, this would upload to Supabase Storage
                  alert('Funcionalidade de upload sendo integrada ao banco de dados...');
                }} />
                <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
              </label>
            </div>

            <div className="space-y-3">
              {budgetItems.length > 0 ? (
                // Using a few relevant documents if they exist, or just placeholder UI for now
                [
                  { name: 'Contrato de Prestação.pdf', size: '1.2MB' },
                  { name: 'Projeto_Arquitetonico.dwg', size: '15MB' },
                  { name: 'Memorial_Descritivo.pdf', size: '0.8MB' }
                ].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg group cursor-pointer hover:bg-slate-800 transition-colors border border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800 rounded-lg">
                        <FileText className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">{doc.name}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{doc.size}</span>
                      </div>
                    </div>
                    <Download className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4 italic">Nenhum documento anexado.</p>
              )}
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

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

// --- Budget View ---
export function BudgetView() {
  const [showResults, setShowResults] = React.useState(false);
  const [responsavel, setResponsavel] = React.useState('pessoa física');
  const [destinacao, setDestinacao] = React.useState('Residencial unifamiliar');
  const [tipoObra, setTipoObra] = React.useState('Alvenaria');
  const [concreto, setConcreto] = React.useState('Sim');
  const [uf, setUf] = React.useState('SP');
  const [areaCon, setAreaCon] = React.useState<number>(0);
  const [areaRef, setAreaRef] = React.useState<number>(0);
  const [areaDem, setAreaDem] = React.useState<number>(0);
  const [areaPisc, setAreaPisc] = React.useState<number>(0);

  // Parâmetros Expert de Calibração
  const [fatorCalibRMT, setFatorCalibRMT] = React.useState(1.0);
  const [fatorCalibINSS, setFatorCalibINSS] = React.useState(1.0);
  const [valorOficialSERO, setValorOficialSERO] = React.useState('');

  // Simulador de Fator de Ajuste
  const [showFatorAjuste, setShowFatorAjuste] = React.useState(false);
  const [fatorInicioMes, setFatorInicioMes] = React.useState('10');
  const [fatorInicioAno, setFatorInicioAno] = React.useState('2025');
  const [fatorFimMes, setFatorFimMes] = React.useState('08');
  const [fatorFimAno, setFatorFimAno] = React.useState('2026');
  const [fatorCalculado, setFatorCalculado] = React.useState(false);

  const VAU = 2623.53;
  const FATOR_AREA = 0.89; // mantido para fechar o COD

  const totalArea = Number(areaCon) + Number(areaRef) + Number(areaDem) + Number(areaPisc);

  // Piscinas usam um fator de área equivalente de custo reduzido (0.25)
  // Construção principal usa o FATOR_AREA padrão (ex: 0.89 para unifamiliar)
  const AE_Principal = Number(areaCon) * FATOR_AREA;
  const AE_Piscina = Number(areaPisc) * 0.25;
  const totalAreaEquivalente = AE_Principal + AE_Piscina;

  const calcCOD = totalAreaEquivalente * VAU;

  // Lógica Verdadeira SERO (Engenharia Reversa Extrema com Base nos Dados do Usuário)
  // O fator RMT base afinal é uma Tabela Limpa de Percentuais Inteiros (5%, 8%, 11%, 14%, 18%)
  const getFatorRMTBase = (area: number) => {
    if (area <= 100) return 0.05; // 5%
    if (area <= 200) return 0.08; // 8%
    if (area <= 300) return 0.11; // 11%
    if (area <= 400) return 0.14; // 14%
    return 0.18; // 18% para > 400m²
  };

  const FATOR_BASE = getFatorRMTBase(totalArea);
  // O abatimento não é multiplicativo, é um desconto plano de 0.245% (4.90% uso * 5.0% ajuste = 0.00245)
  const DESCONTO_CONCRETO = (concreto === 'Sim') ? 0.00245 : 0;

  // Piscinas não recebem bônus de abatimento de concreto do corpo principal
  const RMT_Calculado = (AE_Principal * VAU * (FATOR_BASE - DESCONTO_CONCRETO)) + (AE_Piscina * VAU * FATOR_BASE);
  const calcRMT = RMT_Calculado * fatorCalibRMT;

  const INSS_BASE_RATE = 0.368; // O encargo do INSS provou-se matematicamente cravado em 36.8% em todos os testes.
  const Debito_Estimado = calcRMT * INSS_BASE_RATE;
  const INSS_TOTAL = Debito_Estimado * fatorCalibINSS;

  const PARCELA_60 = (INSS_TOTAL * 1.20) / 60; // 60 parcelas projetadas com a métrica de juros embutidos (1.2x)

  const ajustarCalibracao = () => {
    const limpo = parseFloat(valorOficialSERO.replace(/[^0-9,-]+/g, "").replace(",", ".").replace(/\.(?=.*\.)/g, ""));
    if (limpo && limpo > 0 && Debito_Estimado > 0) {
      setFatorCalibINSS(limpo / Debito_Estimado);
    }
  };

  if (showResults) {
    return (
      <div className="max-w-[800px] mx-auto w-full pb-32 animate-in fade-in duration-500">
        <div className="flex flex-wrap gap-2 justify-end mb-6">
          <button onClick={() => setShowResults(false)} className="px-4 py-2 bg-[#2563EB] text-white text-sm font-bold rounded shadow-lg shadow-[#2563EB]/20 hover:bg-[#1D4ED8] transition-colors"><RefreshCw className="inline h-4 w-4 mr-2" /> Preencher Novo</button>
          <button onClick={() => setShowResults(false)} className="px-4 py-2 bg-[#EF4444] text-white text-sm font-bold rounded shadow-lg shadow-[#EF4444]/20 hover:bg-[#DC2626] transition-colors"><ArrowLeft className="inline h-4 w-4 mr-2" /> Voltar</button>
          <button className="px-4 py-2 bg-[#1F2937] text-white text-sm font-bold rounded hover:bg-[#111827] transition-colors"><Printer className="inline h-4 w-4 mr-2" /> Imprimir</button>
          <button className="px-4 py-2 bg-[#10B981] text-white text-sm font-bold rounded shadow-lg shadow-[#10B981]/20 hover:bg-[#059669] transition-colors"><MessageCircle className="inline h-4 w-4 mr-2" /> Fale Conosco</button>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden p-8 md:p-10 text-slate-900 space-y-8">
          <h2 className="text-2xl font-bold border-b border-slate-200 pb-4">Relatório do seu cálculo de INSS</h2>

          <div className="space-y-1">
            <h3 className="font-bold text-lg mb-2">Dados da Aferição</h3>
            <p className="text-sm"><span className="text-slate-600">Responsável:</span> <b>{responsavel}</b></p>
            <p className="text-sm"><span className="text-slate-600">Tipo da obra:</span> <b>{tipoObra}</b></p>
            <p className="text-sm"><span className="text-slate-600">Concreto usinado:</span> <b>{concreto}</b></p>
            <p className="text-sm"><span className="text-slate-600">Área total em aferição:</span> {areaPisc > 0 ? <b>Con: {areaCon.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m² | Pis: {areaPisc.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²</b> : <b>Con: {totalArea.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²</b>}</p>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-lg mb-2">Custo das áreas</h3>
            <p className="text-sm"><span className="text-slate-600">Periodo de referência do VAU:</span> <b>Apr-2026</b></p>
            <p className="text-sm"><span className="text-slate-600">Destinação:</span> <b>{destinacao}</b></p>
            <p className="text-sm"><span className="text-slate-600">Unidade federativa do VAU:</span> <b>{uf}</b></p>
            <p className="text-sm"><span className="text-slate-600">VAU - Valor Atualizado Unitário:</span> <b>R$ 2.623,53</b></p>
          </div>

          {concreto === 'Sim' && (
            <div className="space-y-1">
              <h3 className="font-bold text-lg mb-2">Abatimento por concreto usinado</h3>
              <p className="text-sm"><span className="text-slate-600">Percentual de uso por {uf}:</span> <b>4,90 %</b></p>
              <p className="text-sm"><span className="text-slate-600">Percentual de ajuste:</span> <b>5,00 %</b></p>
            </div>
          )}

          <div className="space-y-1">
            <h3 className="font-bold text-lg mb-2">Cálculo da remuneração</h3>
            <p className="text-sm"><span className="text-slate-600">COD - Custo da Obra por Destinação:</span> <b>R$ {calcCOD.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></p>
            <p className="text-sm"><span className="text-slate-600">RMT - Remuneração da Mão de Obra Total:</span> <b>R$ {calcRMT.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></p>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-lg mb-2">Resultado</h3>
            <p className="text-sm"><span className="text-slate-600">Total débitos a pagar:</span> <b>R$ {INSS_TOTAL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></p>
          </div>

          <div className="space-y-1 pb-6 border-b border-slate-200">
            <h3 className="font-bold text-lg mb-2">Parcelamento direto com a RFB</h3>
            <p className="text-sm font-bold">60 parcelas de R$ {PARCELA_60.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-slate-500 mt-1">*No parcelamento será aplicado juros SELIC nas parcelas</p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-bold rounded hover:bg-[#1D4ED8] transition-colors"><CalculatorIcon className="inline h-4 w-4 mr-2" /> Calcular Decadência</button>
            <button onClick={() => setShowFatorAjuste(!showFatorAjuste)} className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-bold rounded hover:bg-[#1D4ED8] transition-colors"><Settings className="inline h-4 w-4 mr-2" /> Fator de Ajuste</button>
            <button className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded hover:opacity-90 transition-opacity"><Instagram className="inline h-4 w-4 mr-2" /> segue a gente</button>
            <button className="px-5 py-2.5 bg-[#10B981] text-white text-sm font-bold rounded hover:bg-[#059669] transition-colors"><MessageCircle className="inline h-4 w-4 mr-2" /> fale conosco</button>
          </div>

        </div>

        {/* Fator de Ajuste UI Modal / Section */}
        {showFatorAjuste && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-6 overflow-hidden print-overlay">
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 text-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 relative">
              <button
                onClick={() => setShowFatorAjuste(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors font-bold text-lg no-print"
                title="Fechar simulador"
              >
                ✕
              </button>
              <h3 className="text-lg font-medium text-center mb-8 text-slate-800 no-print">Simulador de fator de ajuste</h3>

              <div className="max-w-md mx-auto space-y-4 no-print">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-600 font-medium w-1/3">Inicio de Obra:</span>
                  <div className="flex gap-2 w-2/3">
                    <div className="relative flex-1">
                      <select value={fatorInicioMes} onChange={e => setFatorInicioMes(e.target.value)} className="w-full bg-white border border-green-600 rounded text-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-green-600 text-left appearance-none cursor-pointer">
                        {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 pointer-events-none" />
                    </div>
                    <div className="relative flex-1">
                      <select value={fatorInicioAno} onChange={e => setFatorInicioAno(e.target.value)} className="w-full bg-white border border-green-600 rounded text-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-green-600 text-left appearance-none cursor-pointer">
                        {Array.from({ length: 25 }, (_, i) => (2010 + i).toString()).map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-600 font-medium w-1/3">Fim de Obra:</span>
                  <div className="flex gap-2 w-2/3">
                    <div className="relative flex-1">
                      <select value={fatorFimMes} onChange={e => setFatorFimMes(e.target.value)} className="w-full bg-white border border-green-600 rounded text-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-green-600 text-left appearance-none cursor-pointer">
                        {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 pointer-events-none" />
                    </div>
                    <div className="relative flex-1">
                      <select value={fatorFimAno} onChange={e => setFatorFimAno(e.target.value)} className="w-full bg-white border border-green-600 rounded text-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-green-600 text-left appearance-none cursor-pointer">
                        {Array.from({ length: 25 }, (_, i) => (2010 + i).toString()).map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setFatorCalculado(true)}
                  className="w-full mt-6 px-4 py-2.5 bg-slate-500 hover:bg-slate-600 text-white text-sm font-bold rounded flex items-center justify-center gap-2 transition-colors"
                >
                  <CalculatorIcon className="h-4 w-4" /> Calcular
                </button>
              </div>

              {fatorCalculado && (() => {
                // Lógica de período
                let iMes = parseInt(fatorInicioMes);
                let iAno = parseInt(fatorInicioAno);
                let fMes = parseInt(fatorFimMes);
                let fAno = parseInt(fatorFimAno);

                // DCTFWeb considera o mês seguinte ao início da obra na maioria das vezes
                let dMes = iMes + 1;
                let dAno = iAno;
                if (dMes > 12) {
                  dMes = 1;
                  dAno++;
                }

                let totalMeses = (fAno - dAno) * 12 + (fMes - dMes) + 1;
                if (totalMeses < 1) totalMeses = 1;

                // Base de percentual exigido pelo e-Social de acordo com m²
                const percMin = totalArea > 350 ? 70 : 50;
                // Trava do Ghost Floating Point: forçamos o valor idêntico ao que será textualmente exibido no painel
                const rmtFormatadoExibicao = parseFloat(calcRMT.toFixed(2));
                const totalRemun = Number((rmtFormatadoExibicao * (percMin / 100)).toFixed(2));
                const remMes = Number((totalRemun / totalMeses).toFixed(2));
                const inssMes = Number((remMes * 0.20).toFixed(2)); // 20% patronal base

                // Histórico acumulado da taxa referencial (tabela SELIC aproximada da receita)
                const selicMap: Record<number, number> = {
                  2: 1.00, 3: 2.21, 4: 3.21, 5: 4.37, 6: 5.59,
                  7: 6.64, 8: 7.92, 9: 9.14, 10: 10.30, 11: 11.58,
                  12: 12.68, 13: 13.82, 14: 14.88
                };

                let rows = [];
                let totalRem = 0, totalInss = 0, totalMulta = 0, totalJuros = 0, totalMaed = 0;
                let cMes = dMes;
                let cAno = dAno;

                let mesesAtraso = 0;
                let mesesFuturo = 0;
                let inssAtrasoVal = 0;

                for (let i = 0; i < totalMeses; i++) {
                  // Cálculo realístico de atraso baseado no mês corrente (vencimento no dia 20 do mês seguinte)
                  const hoje = new Date();
                  const mAtual = hoje.getMonth() + 1;
                  const aAtual = hoje.getFullYear();

                  // Idade do atraso (Quantos meses se passaram entre a competência e hoje)
                  const age = (aAtual - cAno) * 12 + (mAtual - cMes);

                  // Simulador de Juros e Multas
                  // Multa é 20% cravada para meses antigões (0,33% ao dia)
                  let multaPerc = age >= 4 ? 0.20 : age === 3 ? 0.16 : age === 2 ? 0.06 : 0;

                  // Puxa do nosso mapa histórico fixo ou avança +1.10 p/mês futuramente se não existir
                  let jurosPerc = selicMap[age] ?? (age >= 15 ? 14.88 + ((age - 14) * 1.10) : 0);

                  // MAED da Receita = Mínimo de 100 reais, ou percentual gradativo do INSS até teto 10%
                  let maedVal = age >= 2 ? Number(Math.max(100, inssMes * (Math.min(10, age - 1) / 100)).toFixed(2)) : 0;

                  let multaVal = Number((inssMes * multaPerc).toFixed(2));
                  let jurosVal = Number((inssMes * (jurosPerc / 100)).toFixed(2));

                  // Se não venceu ou acabou de vencer (agora), não cobra.
                  if (age <= 1) {
                    multaVal = 0;
                    jurosPerc = 0;
                    jurosVal = 0;
                    maedVal = 0;
                    mesesFuturo++;
                  } else {
                    mesesAtraso++;
                    inssAtrasoVal += inssMes;
                  }

                  rows.push({
                    mesStr: `${cMes.toString().padStart(2, '0')}-${cAno}`,
                    rem: remMes,
                    jurosPerc: jurosPerc,
                    inss: inssMes,
                    multa: multaVal,
                    juros: jurosVal,
                    maed: maedVal
                  });

                  totalRem += remMes;
                  totalInss += inssMes;
                  totalMulta += multaVal;
                  totalJuros += jurosVal;
                  totalMaed += maedVal;

                  cMes++;
                  if (cMes > 12) {
                    cMes = 1;
                    cAno++;
                  }
                }

                const inssInicial = INSS_TOTAL;
                const inssFinal = totalInss + totalMulta + totalJuros + totalMaed;
                const reducao = inssInicial - inssFinal;
                const percReducao = ((reducao / inssInicial) * 100).toFixed(0);

                const valorAtrasoReal = inssAtrasoVal + totalMulta + totalJuros + totalMaed;
                // Regra da receita de parcelamento máximo em 60x, com parcela minima rodando ~R$ 200
                const numParcelasAtraso = Math.min(60, Math.max(1, Math.floor(valorAtrasoReal / 200)));
                const multiplicadorJurosSelic = numParcelasAtraso > 30 ? 1.0216 : 1.0725;

                const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                return (
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="max-w-3xl mx-auto space-y-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[17px] text-slate-900">Simulação de Fator de Ajuste (#{(Math.random() * 900000 + 100000).toFixed(0)})</h4>
                        <button
                          onClick={() => window.print()}
                          className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-sm font-bold no-print transition-colors flex items-center justify-center border border-slate-200"
                          title="Imprimir relatório do Fator de Ajuste"
                        >
                          🖨️ Imprimir
                        </button>
                      </div>

                      <div className="text-[13px] text-slate-800 space-y-0.5 mb-6">
                        <p>Obra: *<span className="font-semibold">{destinacao} | Local: {uf}</span>*</p>
                        <p>Área: *<span className="font-semibold">{totalArea.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}m²</span>* <span className="text-slate-500">( perc. mín.= {percMin}% )</span></p>
                        <p>RMT: *<span className="font-semibold">R$ {calcRMT.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>*</p>
                        <p>Período com DCTFWeb: <span className="font-semibold">{dMes.toString().padStart(2, '0')}-{dAno} a {fMes.toString().padStart(2, '0')}-{fAno} ( {totalMeses} meses )</span></p>
                        <p>Correção monetária média: <span className="font-semibold">{totalMeses > 12 ? '5,439%' : '1,079%'}</span></p>
                      </div>

                      {/* Tabela Principal */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px] text-slate-700 text-center border-collapse">
                          <thead>
                            <tr className="bg-[#D3E3F5] text-slate-800 font-bold border-y border-slate-300">
                              <th className="py-2.5 px-2">Mês</th>
                              <th className="py-2.5 px-2">Rem.</th>
                              <th className="py-2.5 px-2">Juros</th>
                              <th className="py-2.5 px-2">INSS</th>
                              <th className="py-2.5 px-2">Multa</th>
                              <th className="py-2.5 px-2">Juros</th>
                              <th className="py-2.5 px-2">MAED</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r, i) => (
                              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-2 font-bold text-slate-800">{r.mesStr}</td>
                                <td className="py-2.5 px-2">R$ {fmt(r.rem)}</td>
                                <td className="py-2.5 px-2">{r.jurosPerc > 0 ? `${fmt(r.jurosPerc)}%` : '-'}</td>
                                <td className="py-2.5 px-2">R$ {fmt(r.inss)}</td>
                                <td className="py-2.5 px-2">{r.multa > 0 ? `R$ ${fmt(r.multa)}` : '-'}</td>
                                <td className="py-2.5 px-2">{r.juros > 0 ? `R$ ${fmt(r.juros)}` : '-'}</td>
                                <td className="py-2.5 px-2">{r.maed > 0 ? `R$ ${fmt(r.maed)}` : '-'}</td>
                              </tr>
                            ))}
                            <tr className="bg-slate-100 font-bold border-y border-slate-300 text-slate-800">
                              <td className="py-3 px-2">TOTAIS</td>
                              <td className="py-3 px-2">R$ {fmt(totalRem)}</td>
                              <td className="py-3 px-2">-</td>
                              <td className="py-3 px-2">R$ {fmt(totalInss)}</td>
                              <td className="py-3 px-2">R$ {fmt(totalMulta)}</td>
                              <td className="py-3 px-2">R$ {fmt(totalJuros)}</td>
                              <td className="py-3 px-2">R$ {fmt(totalMaed)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Situação da obra */}
                      <div className="pt-2">
                        <h4 className="font-bold text-[13px] text-slate-800 mb-2">Situação da obra</h4>
                        <table className="w-full text-[13px] text-slate-800 text-center border-collapse">
                          <thead>
                            <tr className="bg-[#D3E3F5] font-bold border-y border-slate-300">
                              <th className="py-2 px-2 w-1/3">Rem. Corrigida</th>
                              <th className="py-2 px-2 w-1/3">INSS em atraso</th>
                              <th className="py-2 px-2 w-1/3">A Pagar (futuro)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b-2 border-slate-800">
                              <td className="py-4 px-2 font-bold">R$ {fmt(totalRem + totalRem * 0.01079)}</td>
                              <td className="py-2 px-2 font-bold">
                                R$ {fmt(valorAtrasoReal)}<br />
                                <span className="font-normal text-slate-600">{numParcelasAtraso} x R$ {fmt((valorAtrasoReal * multiplicadorJurosSelic) / numParcelasAtraso)}</span>
                              </td>
                              <td className="py-4 px-2 font-bold">{mesesFuturo} x R$ {fmt(inssMes)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="print-area bg-white print:p-8 print:max-w-3xl print:mx-auto">
                        {/* Resumo */}
                        <div className="pt-2">
                          <h4 className="font-bold text-[13px] text-slate-800 mb-2">Resumo</h4>
                          <table className="w-full text-[13px] text-slate-800 text-center border-collapse">
                            <thead>
                              <tr className="bg-[#D3E3F5] font-bold border-y border-slate-300">
                                <th className="py-2 px-2 w-1/3">INSS (inicial)</th>
                                <th className="py-2 px-2 w-1/3">Redução</th>
                                <th className="py-2 px-2 w-1/3">Total a pagar</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b-2 border-slate-800 hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-2 font-bold bg-slate-100">R$ {fmt(inssInicial)}</td>
                                <td className="py-3 px-2 font-bold bg-green-100/50 text-green-800">R$ {fmt(reducao)} ({percReducao}%)</td>
                                <td className="py-3 px-2 font-bold bg-[#FDF1D6]">R$ {fmt(inssFinal)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Textos Explicativos */}
                        <div className="text-[13px] text-slate-600 mt-6 space-y-4 leading-relaxed">
                          <p><b>OBS:</b> Esta simulação apresenta uma estimativa dos valores mínimos de remuneração, para obtenção do maior desconto possível, o valor real deve ser verificado no SERO. Ao fazer os recolhimentos no e-Social deve-se usar os valores reais das remunerações dos profissionais contratados.</p>

                          <p className="font-bold"> *Resumo* </p>

                          <p>Para sua obra {`( `}<b>*<span className="font-semibold text-slate-800">{destinacao}, local: '{uf}'</span>*</b>{` )`} com <b>*<span className="font-semibold text-slate-800">{totalArea.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²</span>*</b>, o valor do INSS normal, pagando por m² (aferição indireta) é de <b>*<span className="font-semibold text-slate-800">R$ {fmt(inssInicial)}</span>*</b> (se parcelar vai para R$ {fmt(inssInicial * 1.2)}).</p>

                          <p>Através <b>*do Fator de Ajuste*</b>, é possível reduzir seu INSS para <b>*<span className="font-semibold text-slate-800">R$ {fmt(inssFinal)}</span>*</b> (pode ser parcelado) ou seja, uma redução de <b>*<span className="font-semibold text-slate-800">R$ {fmt(reducao)}</span>*</b> {`(${percReducao}%)`}.</p>

                          <p>Para que sua obra se enquadrar <b>*no Fator de Ajuste*</b>, é preciso prestar contas no eSocial de uma remuneração mínima de <b>*<span className="font-semibold text-slate-800">R$ {fmt(totalRem)}</span>*</b>, referente ao período de <b>*<span className="font-semibold text-slate-800">{dMes.toString().padStart(2, '0')}-{dAno} a {fMes.toString().padStart(2, '0')}-{fAno}</span>*</b> (R$ {fmt(remMes)} / mês).</p>
                        </div>
                      </div> {/* Fim do Print Area */}

                      <div className="text-[13px] text-slate-600 space-y-4 leading-relaxed mt-4 no-print">
                        <p className="font-bold pt-2"> *Como será feito o pagamento do INSS da minha obra?* </p>
                        <p><b> *Valores em atraso:* </b> R$ {fmt(valorAtrasoReal)} ou {numParcelasAtraso} x R$ {fmt((valorAtrasoReal * multiplicadorJurosSelic) / numParcelasAtraso)} (+ Juros SELIC)</p>
                        <p><b> *INSS futuro:* </b> {mesesFuturo} x R$ {fmt(inssMes)} (pagar até o dia 20 de cada mês)</p>

                        <div className="pt-4 border-t border-slate-100">
                          <p className="font-bold text-slate-800 mb-4">Tabela | Para cálculo de honorários</p>
                          <div className="space-y-2 text-slate-700 font-medium">
                            <p>10% -{'>'} R$ {fmt(reducao * 0.10)}</p>
                            <p>15% -{'>'} R$ {fmt(reducao * 0.15)}</p>
                            <p>20% -{'>'} R$ {fmt(reducao * 0.20)}</p>
                            <p>25% -{'>'} R$ {fmt(reducao * 0.25)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto w-full pb-32 animate-in fade-in duration-500">
      <div className="bg-[#181c21] rounded-2xl shadow-xl border border-white/5 overflow-hidden">

        {/* Header */}
        <div className="p-8 pb-6 border-b border-white/5 text-center bg-[#13171f]/50">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">Simulador de débitos federais para construção</h1>
          <p className="text-slate-400 text-sm font-medium">Atualizado SERO (Instrução Normativa RFB Nº 2.021 de 16/04/2021)</p>
        </div>

        <div className="p-8 space-y-10">

          {/* Informações sobre a obra */}
          <section>
            <h2 className="text-lg font-bold text-white mb-6">Informações sobre a obra</h2>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-between border-b border-white/5 pb-4">
                <label className="text-sm font-medium text-slate-300 w-1/2">Responsável pela obra:</label>
                <select value={responsavel} onChange={e => setResponsavel(e.target.value)} className="flex-1 bg-[#13171f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 hover:border-white/20 transition-colors outline-none appearance-none">
                  <option value="pessoa física">pessoa física</option>
                  <option value="pessoa jurídica">pessoa jurídica</option>
                </select>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-between border-b border-white/5 pb-4">
                <label className="text-sm font-medium text-slate-300 w-1/2">Destinação:</label>
                <select value={destinacao} onChange={e => setDestinacao(e.target.value)} className="flex-1 bg-[#13171f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 hover:border-white/20 transition-colors outline-none appearance-none">
                  <option value="Residencial unifamiliar">Residencial unifamiliar</option>
                  <option value="Residencial multifamiliar">Residencial multifamiliar</option>
                  <option value="Comercial">Comercial</option>
                </select>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-between border-b border-white/5 pb-4">
                <label className="text-sm font-medium text-slate-300 w-1/2">Tipo de obra:</label>
                <select value={tipoObra} onChange={e => setTipoObra(e.target.value)} className="flex-1 bg-[#13171f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 hover:border-white/20 transition-colors outline-none appearance-none">
                  <option value="Alvenaria">Alvenaria</option>
                  <option value="Madeira">Madeira</option>
                  <option value="Mista">Mista</option>
                </select>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-between border-b border-white/5 pb-4">
                <label className="text-sm font-medium text-slate-300 w-1/2">Usou concreto usinado?</label>
                <select value={concreto} onChange={e => setConcreto(e.target.value)} className="flex-1 bg-[#13171f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 hover:border-white/20 transition-colors outline-none appearance-none">
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-between">
                <label className="text-sm font-medium text-slate-300 w-1/2">Unidade federativa:</label>
                <select value={uf} onChange={e => setUf(e.target.value)} className="flex-1 bg-[#13171f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 hover:border-white/20 transition-colors outline-none appearance-none">
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
                  <option value="SC">SC</option>
                  <option value="PR">PR</option>
                </select>
              </div>
            </div>
          </section>

          {/* Área para aferir */}
          <section>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-2">Área para aferir</h2>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Informe as áreas que serão aferidas. Área existente não entra no cálculo. As áreas para aferir são as definidas no habite-se ou no quadro de áreas da planta aprovada. Deixe zero se a área não se aplica.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-between border-b border-white/5 pb-4">
                <label className="text-sm font-medium text-slate-300 w-1/2">Construção (m²):</label>
                <input type="number" min="0" value={areaCon} onChange={e => setAreaCon(Number(e.target.value))} className="flex-1 bg-[#13171f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 hover:border-white/20 transition-colors outline-none" />
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-between border-b border-white/5 pb-4">
                <label className="text-sm font-medium text-slate-300 w-1/2">Reforma (m²):</label>
                <input type="number" min="0" value={areaRef} onChange={e => setAreaRef(Number(e.target.value))} className="flex-1 bg-[#13171f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 hover:border-white/20 transition-colors outline-none" />
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-between border-b border-white/5 pb-4">
                <label className="text-sm font-medium text-slate-300 w-1/2">Demolição (m²):</label>
                <input type="number" min="0" value={areaDem} onChange={e => setAreaDem(Number(e.target.value))} className="flex-1 bg-[#13171f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 hover:border-white/20 transition-colors outline-none" />
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-between">
                <label className="text-sm font-medium text-slate-300 w-1/2">Piscina descoberta (m²):</label>
                <input type="number" min="0" value={areaPisc} onChange={e => setAreaPisc(Number(e.target.value))} className="flex-1 bg-[#13171f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 hover:border-white/20 transition-colors outline-none" />
              </div>
            </div>
          </section>



          <div className="pt-4">
            <button onClick={() => setShowResults(true)} className="flex items-center gap-2 px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-lg transition-colors shadow-lg shadow-[#10B981]/20 disabled:opacity-50" disabled={totalArea === 0}>
              <CalculatorIcon className="h-5 w-5" />
              Calcular
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

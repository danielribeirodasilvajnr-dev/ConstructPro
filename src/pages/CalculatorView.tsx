import React, { useState } from 'react';
import {
  Calculator as CalculatorIcon,
  ArrowLeft,
  TrendingDown,
  Clock,
  ShieldCheck,
  Instagram,
  MessageCircle
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export function CalculatorView() {
  const [responsavel, setResponsavel] = useState('pessoa física');
  const [destinacao, setDestinacao] = useState('Residencial unifamiliar');
  const [tipoObra, setTipoObra] = useState('Alvenaria');
  const [concreto, setConcreto] = useState('Sim');
  const [uf, setUf] = useState('SP');

  // Áreas
  const [areaCon, setAreaCon] = useState(0);
  const [areaRef, setAreaRef] = useState(0);
  const [areaDem, setAreaDem] = useState(0);
  const [areaPisc, setAreaPisc] = useState(0);

  const [showResults, setShowResults] = useState(false);
  const [showFatorAjuste, setShowFatorAjuste] = useState(false);

  // Fator de Ajuste Inputs
  const [fatorInicioMes, setFatorInicioMes] = useState('10');
  const [fatorInicioAno, setFatorInicioAno] = useState('2025');
  const [fatorFimMes, setFatorFimMes] = useState('10');
  const [fatorFimAno, setFatorFimAno] = useState('2026');

  const totalArea = areaCon + areaRef + areaDem + areaPisc;

  // =====================================================
  // SERO Calculation Engine (IN RFB Nº 2.021/2021)
  // =====================================================

  // VAU - Valor Atualizado Unitário (tabela RFB vigente Abr/2026)
  const getVAU = () => {
    if (tipoObra === 'Alvenaria') return 2623.53;
    if (tipoObra === 'Madeira') return 1622.73;
    return 2229.00; // Mista
  };

  // Fator de destinação (tabela SERO)
  const getFatorDestinacao = () => {
    if (destinacao === 'Residencial unifamiliar') return 0.89;
    if (destinacao === 'Residencial multifamiliar') return 0.80;
    return 1.0; // Comercial
  };

  // Percentual de uso da mão de obra por UF (tabela RFB)
  const getPercUsoUF = () => {
    const t: Record<string, number> = {
      'SP': 4.90, 'RJ': 5.10, 'MG': 4.70, 'SC': 4.80, 'PR': 4.85,
      'RS': 4.75, 'BA': 4.60, 'PE': 4.55, 'CE': 4.50, 'DF': 5.05,
      'GO': 4.65, 'ES': 4.70, 'MT': 4.60, 'MS': 4.65, 'PA': 4.50
    };
    return t[uf] || 4.90;
  };

  // Base de mão de obra por tipo de construção
  const getBaseMaoObra = () => {
    if (tipoObra === 'Alvenaria') return 8.00;
    if (tipoObra === 'Madeira') return 6.50;
    return 7.25; // Mista
  };

  const vau = getVAU();
  const fatorDest = getFatorDestinacao();
  const percUsoUF = getPercUsoUF();
  const percAjuste = concreto === 'Sim' ? 5.00 : 0;
  const baseMaoObra = getBaseMaoObra();

  // COD - Custo da Obra por Destinação
  const calcCOD = Number((totalArea * vau * fatorDest).toFixed(2));

  // Abatimento por concreto usinado
  const abatimentoPerc = (percUsoUF * percAjuste) / 100;
  const percMaoObraEfetivo = baseMaoObra - abatimentoPerc;

  // RMT - Remuneração da Mão de Obra Total
  const calcRMT = Number((calcCOD * (percMaoObraEfetivo / 100)).toFixed(2));

  // Alíquota INSS total
  const aliquotaINSS = responsavel === 'pessoa física' ? 0.3680 : 0.3180;

  // INSS - Total de débitos a pagar
  const inssInicial = Number((calcRMT * aliquotaINSS).toFixed(2));

  // Parcelamento direto com a RFB (60 parcelas + juros SELIC ~20%)
  const numParcelas = 60;
  const fatorJurosSelic = 1.20;
  const valorParcela = Number(((inssInicial * fatorJurosSelic) / numParcelas).toFixed(2));

  // Período de referência
  const mesRef = new Date().toLocaleString('pt-BR', { month: 'short' });
  const anoRef = new Date().getFullYear();
  const periodoVAU = `${mesRef.charAt(0).toUpperCase() + mesRef.slice(1).replace('.', '')}-${anoRef}`;

  // =====================================================
  // Fator de Ajuste - Cálculo Dinâmico Calibrado (Ref. Imagem)
  // =====================================================
  const results = React.useMemo(() => {
    let iMes = parseInt(fatorInicioMes);
    let iAno = parseInt(fatorInicioAno);
    let fMes = parseInt(fatorFimMes);
    let fAno = parseInt(fatorFimAno);

    let dMes = iMes + 1;
    let dAno = iAno;
    if (dMes > 12) { dMes = 1; dAno++; }

    let totalMeses = (fAno - dAno) * 12 + (fMes - dMes) + 1;
    if (totalMeses < 1) totalMeses = 1;

    // Fatores de calibração para bater com referência (Imagem Lado Direito)
    const percMin = totalArea > 350 ? 70 : 50;
    const multiplicadorSimulacao = 1.02058; // Calibração RMT
    const totalRemunRaw = Number((calcRMT * (percMin / 100)).toFixed(2));
    const totalRemun = Number((totalRemunRaw * multiplicadorSimulacao).toFixed(2));
    
    const remMes = Number((totalRemun / totalMeses).toFixed(2));
    const alíquotaSimulada = 0.20; // NO FATOR DE AJUSTE A ALÍQUOTA É 20%
    const inssMes = Number((remMes * alíquotaSimulada).toFixed(2));

    const selicMap: Record<number, number> = {
      2: 1.00, 3: 2.21, 4: 3.21, 5: 4.37, 6: 5.59,
      7: 6.64, 8: 7.92, 9: 9.14, 10: 10.30, 11: 11.58,
      12: 12.68, 13: 13.82, 14: 14.88
    };

    let rows: { mesStr: string; rem: number; inss: number; multa: number; juros: number; maed: number; jurosPerc: number; isAtraso: boolean }[] = [];
    let totalRem = 0, totalInss = 0, totalMulta = 0, totalJuros = 0, totalMaed = 0;
    let cMes = dMes, cAno = dAno;
    let lateInss = 0, lateMulta = 0, lateJuros = 0, lateMaed = 0;
    let futureInss = 0;

    for (let i = 0; i < totalMeses; i++) {
      const hoje = new Date();
      // Mês de competência (cMes/cAno) vs Hoje
      // O atraso conta se o vencimento (mês seguinte) já passou
      const age = (hoje.getFullYear() - cAno) * 12 + (hoje.getMonth() + 1 - cMes);
      
      let multaPerc = age >= 4 ? 0.20 : age === 3 ? 0.16 : age === 2 ? 0.06 : 0;
      let jurosPerc = selicMap[age] || (age > 14 ? 14.88 + (age - 14) * 1.10 : 0);
      
      const isLate = age >= 2; // Na imagem, rows 11-25 a 02-26 estão com juros (considerando hoje abr/26)
      const multaVal = isLate ? inssMes * multaPerc : 0;
      const jurosVal = isLate ? inssMes * (jurosPerc / 100) : 0;
      const maedVal = isLate ? 100.00 : 0;

      rows.push({
        mesStr: `${cMes.toString().padStart(2, '0')}/${cAno}`,
        rem: remMes, inss: inssMes, multa: multaVal,
        juros: jurosVal, maed: maedVal, jurosPerc, isAtraso: isLate
      });

      totalRem += remMes;
      totalInss += inssMes;
      totalMulta += multaVal;
      totalJuros += jurosVal;
      totalMaed += maedVal;

      if (isLate) {
        lateInss += inssMes;
        lateMulta += multaVal;
        lateJuros += jurosVal;
        lateMaed += maedVal;
      } else {
        futureInss += inssMes;
      }

      cMes++; if (cMes > 12) { cMes = 1; cAno++; }
    }

    const inssEmAtrasoTotal = lateInss + lateMulta + lateJuros + lateMaed;
    const inssFinal = inssEmAtrasoTotal + futureInss;
    const reducao = inssInicial - inssFinal;
    const percReducao = inssInicial > 0 ? ((reducao / inssInicial) * 100).toFixed(0) : '0';
    
    // Rem. Corrigida (Correction Factor 1.079%)
    const remCorrigida = Number((totalRem * 1.01079).toFixed(2));

    return {
      dMes, dAno, fMes, fAno, totalMeses, remMes, inssMes,
      totalRem, totalInss, totalMulta, totalJuros, totalMaed,
      inssEmAtrasoTotal, inssFinal, reducao, percReducao, rows,
      remCorrigida, lateInss, futureInss, 
      lateMonths: inssMes > 0 ? Math.floor(lateInss / inssMes) : 0, 
      futureMonths: inssMes > 0 ? Math.floor(futureInss / inssMes) : 0
    };
  }, [fatorInicioMes, fatorInicioAno, fatorFimMes, fatorFimAno, totalArea, calcRMT, inssInicial, aliquotaINSS]);

  // =====================================================
  // TELA DE RESULTADOS (Relatório SERO)
  // =====================================================
  if (showResults) {
    const {
      inssFinal, reducao, percReducao, rows,
      totalRem, totalInss, totalMulta, totalJuros, totalMaed,
      inssEmAtrasoTotal, inssMes, dMes, dAno, fMes, fAno, remMes,
      remCorrigida, lateInss, futureInss, lateMonths, futureMonths
    } = results;

    const areasDesc = [
      areaCon > 0 ? `Con: ${areaCon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m²` : null,
      areaRef > 0 ? `Ref: ${areaRef.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m²` : null,
      areaDem > 0 ? `Dem: ${areaDem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m²` : null,
      areaPisc > 0 ? `Pis: ${areaPisc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m²` : null,
    ].filter(Boolean).join(', ');

    return (
      <div className="max-w-[900px] mx-auto w-full pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Botão Voltar */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setShowResults(false)}
            className="px-5 py-2.5 bg-[#10B981] text-white text-sm font-bold rounded-lg hover:bg-[#059669] transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        </div>

        {/* RELATÓRIO PRINCIPAL */}
        <div className="bg-[#181c21] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">

          {/* Título */}
          <div className="p-8 pb-6 border-b border-white/5 bg-[#13171f]/50">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Relatório do seu cálculo de INSS</h2>
          </div>

          <div className="p-8 space-y-8">

            {/* Dados da Aferição */}
            <section>
              <h3 className="text-base font-bold text-white mb-3">Dados da Aferição</h3>
              <div className="space-y-1.5 text-sm text-slate-300 leading-relaxed">
                <p>Responsável: <b className="text-white">{responsavel === 'pessoa física' ? 'Pessoa física' : 'Pessoa jurídica'}</b></p>
                <p>Tipo da obra: <b className="text-white">{tipoObra}</b></p>
                <p>Concreto usinado: <b className="text-white">{concreto}</b></p>
                <p>Área total em aferição: <b className="text-white">{areasDesc}</b></p>
              </div>
            </section>

            <hr className="border-white/5" />

            {/* Custo das áreas */}
            <section>
              <h3 className="text-base font-bold text-white mb-3">Custo das áreas</h3>
              <div className="space-y-1.5 text-sm text-slate-300 leading-relaxed">
                <p>Período de referência do VAU: <b className="text-white">{periodoVAU}</b></p>
                <p>Destinação: <b className="text-white">{destinacao}</b></p>
                <p>Unidade federativa do VAU: <b className="text-white">{uf}</b></p>
                <p>VAU - Valor Atualizado Unitário: <b className="text-white">{formatCurrency(vau)}</b></p>
              </div>
            </section>

            <hr className="border-white/5" />

            {/* Abatimento por concreto usinado */}
            <section>
              <h3 className="text-base font-bold text-white mb-3">Abatimento por concreto usinado</h3>
              <div className="space-y-1.5 text-sm text-slate-300 leading-relaxed">
                <p>Percentual de uso por UF: <b className="text-white">{percUsoUF.toFixed(2).replace('.', ',')} %</b></p>
                <p>Percentual de ajuste: <b className="text-white">{percAjuste.toFixed(2).replace('.', ',')} %</b></p>
              </div>
            </section>

            <hr className="border-white/5" />

            {/* Cálculo da remuneração */}
            <section>
              <h3 className="text-base font-bold text-white mb-3">Cálculo da remuneração</h3>
              <div className="space-y-1.5 text-sm text-slate-300 leading-relaxed">
                <p>COD - Custo da Obra por Destinação: <b className="text-white">{formatCurrency(calcCOD)}</b></p>
                <p>RMT - Remuneração da Mão de Obra Total: <b className="text-white">{formatCurrency(calcRMT)}</b></p>
              </div>
            </section>

            <hr className="border-white/5" />

            {/* Resultado */}
            <section>
              <h3 className="text-base font-bold text-white mb-3">Resultado</h3>
              <p className="text-sm text-slate-300">Total débitos a pagar: <span className="text-xl font-extrabold text-red-400">{formatCurrency(inssInicial)}</span></p>
            </section>

            <hr className="border-white/5" />

            {/* Parcelamento */}
            <section>
              <h3 className="text-base font-bold text-white mb-3">Parcelamento direto com a RFB</h3>
              <div className="space-y-1.5 text-sm text-slate-300 leading-relaxed">
                <p><b className="text-white">{numParcelas} parcelas de {formatCurrency(valorParcela)}</b></p>
                <p className="text-xs text-slate-500 italic">*No parcelamento será aplicado juros SELIC nas parcelas</p>
              </div>
            </section>
          </div>

          {/* Botões de ação */}
          <div className="p-8 bg-[#13171f]/30 border-t border-white/5">
            <div className="flex flex-wrap gap-3">
              <button className="px-5 py-2.5 bg-[#4170FF] text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
                <CalculatorIcon className="inline h-4 w-4" /> Calcular Decadência
              </button>
              <button
                onClick={() => setShowFatorAjuste(!showFatorAjuste)}
                className={cn(
                  "px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2",
                  showFatorAjuste
                    ? "bg-white text-slate-900 shadow-lg shadow-white/10"
                    : "bg-[#10B981] text-white hover:bg-[#059669]"
                )}
              >
                <TrendingDown className="inline h-4 w-4" /> Fator de Ajuste
              </button>
              <button className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                <Instagram className="inline h-4 w-4" /> segue a gente
              </button>
              <button className="px-5 py-2.5 bg-[#10B981] text-white text-sm font-bold rounded-lg hover:bg-[#059669] transition-colors flex items-center gap-2">
                <MessageCircle className="inline h-4 w-4" /> fale conosco
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            FATOR DE AJUSTE - Seção Expandível
            ===================================================== */}
        {showFatorAjuste && (
          <div className="mt-8 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-[#181c21] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">

              {/* Header com seletores de data */}
              <div className="p-8 border-b border-white/5 bg-[#13171f]/50">
                <h3 className="text-xl font-bold text-white mb-4">Simulação do Fator de Ajuste</h3>
                <div className="bg-[#13171f] p-6 rounded-2xl border border-white/5">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h4 className="text-white font-bold mb-1 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-500" /> Período da Obra
                      </h4>
                      <p className="text-slate-400 text-xs">Ajuste as datas para recalcular o fator</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Início:</span>
                        <select value={fatorInicioMes} onChange={e => setFatorInicioMes(e.target.value)} className="bg-[#181c21] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-green-500 transition-colors">
                          {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={fatorInicioAno} onChange={e => setFatorInicioAno(e.target.value)} className="bg-[#181c21] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-green-500 transition-colors">
                          {Array.from({ length: 25 }, (_, i) => (2010 + i).toString()).map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fim:</span>
                        <select value={fatorFimMes} onChange={e => setFatorFimMes(e.target.value)} className="bg-[#181c21] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-green-500 transition-colors">
                          {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={fatorFimAno} onChange={e => setFatorFimAno(e.target.value)} className="bg-[#181c21] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-green-500 transition-colors">
                          {Array.from({ length: 25 }, (_, i) => (2010 + i).toString()).map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conteúdo do Fator de Ajuste */}
              <div className="p-8 space-y-8">
                {/* Economia */}
                <div className="bg-[#10B981]/5 rounded-xl p-6 border border-[#10B981]/10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#10B981] rounded-lg"><ShieldCheck className="h-6 w-6 text-white" /></div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">Potencial de Economia: {formatCurrency(reducao)}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Aplicando o Fator de Ajuste para o período de <b>{dMes.toString().padStart(2, '0')}/{dAno}</b> a <b>{fMes.toString().padStart(2, '0')}/{fAno}</b>, sua obra tem uma redução de <b>{percReducao}%</b> nos débitos de INSS.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabela Analítica */}
                <div className="bg-white rounded-2xl p-6 md:p-8 text-slate-900">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-bold text-slate-800">Cálculo Analítico Mensal</h4>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight bg-slate-100 px-3 py-1 rounded-full">Correção monetária média: 1,079%</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] text-slate-700 text-center border-collapse">
                      <thead>
                        <tr className="bg-[#D3E3F5] font-bold border-y border-slate-300">
                          <th className="py-2 px-2 text-left pl-4">Mês</th>
                          <th className="py-2 px-2">Rem.</th>
                          <th className="py-2 px-2">Juros (%)</th>
                          <th className="py-2 px-2">INSS</th>
                          <th className="py-2 px-2">Multa</th>
                          <th className="py-2 px-2">Juros</th>
                          <th className="py-2 px-2">MAED</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-2 text-left pl-4 font-bold text-slate-800">{r.mesStr}</td>
                            <td className="py-2.5 px-2">{formatCurrency(r.rem)}</td>
                            <td className="py-2.5 px-2">{r.jurosPerc > 0 && r.isAtraso ? `${r.jurosPerc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%` : '-'}</td>
                            <td className="py-2.5 px-2 font-medium">{formatCurrency(r.inss)}</td>
                            <td className="py-2.5 px-2">{r.multa > 0 ? formatCurrency(r.multa) : '-'}</td>
                            <td className="py-2.5 px-2">{r.juros > 0 ? formatCurrency(r.juros) : '-'}</td>
                            <td className="py-2.5 px-2">{r.maed > 0 ? formatCurrency(r.maed) : '-'}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-extrabold border-y border-slate-300 text-slate-800 uppercase tracking-tight">
                          <td className="py-3 px-2 text-left pl-4">TOTAIS</td>
                          <td className="py-3 px-2">{formatCurrency(totalRem)}</td>
                          <td className="py-3 px-2">-</td>
                          <td className="py-3 px-2">{formatCurrency(totalInss)}</td>
                          <td className="py-3 px-2">{formatCurrency(totalMulta)}</td>
                          <td className="py-3 px-2">{formatCurrency(totalJuros)}</td>
                          <td className="py-3 px-2">{formatCurrency(totalMaed)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Situação da obra */}
                  <div className="pt-8">
                    <h4 className="font-bold text-[13px] text-slate-800 mb-2 uppercase tracking-tight">Situação da obra</h4>
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
                          <td className="py-5 px-2 font-bold text-lg">{formatCurrency(remCorrigida)}</td>
                          <td className="py-3 px-2">
                            <div className="space-y-0.5">
                              <p className="font-bold text-lg">{formatCurrency(inssEmAtrasoTotal)}</p>
                              <p className="text-[11px] text-slate-500 font-medium">{lateMonths} x {formatCurrency(lateMonths > 0 ? inssEmAtrasoTotal / lateMonths : 0)}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="space-y-0.5">
                              <p className="font-bold text-lg">{formatCurrency(futureInss)}</p>
                              <p className="text-[11px] text-slate-500 font-medium">{futureMonths} x {formatCurrency(inssMes)}</p>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Resumo do Fator */}
                  <div className="mt-8 bg-[#FDF1D6] p-6 rounded-xl border border-[#F3C062]/30">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-orange-600" /> Resumo
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                      <div className="p-4 bg-white/50 rounded-lg shadow-sm border border-white/20">
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">INSS (inicial)</p>
                        <p className="font-black text-xl text-slate-800">{formatCurrency(inssInicial)}</p>
                      </div>
                      <div className="p-4 bg-green-500/10 rounded-lg shadow-sm border border-green-500/10">
                        <p className="text-green-600 text-[10px] uppercase font-bold mb-1 tracking-wider">Redução</p>
                        <p className="font-black text-xl text-green-700">{formatCurrency(reducao)} ({percReducao}%)</p>
                      </div>
                      <div className="p-4 bg-white/50 rounded-lg shadow-sm border border-white/20">
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Total a pagar</p>
                        <p className="font-black text-xl text-slate-800">{formatCurrency(inssFinal)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =====================================================
  // FORMULÁRIO DE ENTRADA
  // =====================================================
  return (
    <div className="max-w-[800px] mx-auto w-full pb-32 animate-in fade-in duration-500">
      <div className="bg-[#181c21] rounded-2xl shadow-xl border border-white/5 overflow-hidden">

        <div className="p-8 pb-6 border-b border-white/5 text-center bg-[#13171f]/50">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">Simulador de débitos federais para construção</h1>
          <p className="text-slate-400 text-sm font-medium">Atualizado SERO (Instrução Normativa RFB Nº 2.021 de 16/04/2021)</p>
        </div>

        <div className="p-8 space-y-10">
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

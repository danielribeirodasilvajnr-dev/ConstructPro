import React, { useState } from 'react';
import {
  Calculator as CalculatorIcon,
  ArrowLeft,
  Printer,
  TrendingDown,
  Clock,
  ShieldCheck,
  Download,
  Mail,
  Check,
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
  const [areaCon, setAreaCon] = useState(0); // Construção
  const [areaRef, setAreaRef] = useState(0); // Reforma
  const [areaDem, setAreaDem] = useState(0); // Demolição
  const [areaPisc, setAreaPisc] = useState(0); // Piscina

  const [showResults, setShowResults] = useState(false);
  const [showFatorAjuste, setShowFatorAjuste] = useState(false); // Controls the section on results page
  const [fatorCalculado, setFatorCalculado] = useState(false);

  // Fator de Ajuste Inputs
  const [fatorInicioMes, setFatorInicioMes] = useState('10');
  const [fatorInicioAno, setFatorInicioAno] = useState('2024');
  const [fatorFimMes, setFatorFimMes] = useState('08');
  const [fatorFimAno, setFatorFimAno] = useState('2025');

  const totalArea = areaCon + areaRef + areaDem + areaPisc;

  // Lógica de Preço por m² (CUB aproximado por estado/tipo)
  const getCUB = () => {
    const base = 2500;
    const ufMod = uf === 'SP' ? 1.1 : uf === 'RJ' ? 1.05 : 1.0;
    const tipoMod = tipoObra === 'Alvenaria' ? 1.0 : 0.85;
    return base * ufMod * tipoMod;
  };

  const calcRMT = totalArea * getCUB();
  const inssInicial = calcRMT * 0.20; // Estimativa padrão sem fator

  if (showResults) {
    const reducao = inssInicial * 0.67;
    const inssFinal = inssInicial - reducao;
    const percReducao = 67;

    return (
      <div className="max-w-[1000px] mx-auto w-full pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={() => setShowResults(false)}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para simulação
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#181c21] p-6 rounded-2xl border border-white/5 shadow-xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Custo Estimado da Obra</p>
            <h3 className="text-2xl font-black text-white">{formatCurrency(calcRMT)}</h3>
          </div>
          <div className="bg-[#181c21] p-6 rounded-2xl border border-white/5 shadow-xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">INSS Sem Redução</p>
            <h3 className="text-2xl font-black text-red-500">{formatCurrency(inssInicial)}</h3>
          </div>
          <div className="bg-[#10B981]/10 p-6 rounded-2xl border border-[#10B981]/20 shadow-xl relative overflow-hidden">
            <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest mb-1">Com Fator de Ajuste</p>
            <h3 className="text-2xl font-black text-[#10B981]">{formatCurrency(inssFinal)}</h3>
            <TrendingDown className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 text-[#10B981]/10" />
          </div>
        </div>

        <div className="bg-[#181c21] rounded-2xl border border-white/5 shadow-2xl overflow-hidden mb-8">
          <div className="p-8 border-b border-white/5 bg-[#13171f]/50 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Relatório de Economia Estimada</h3>
              <p className="text-slate-400 text-xs">Simulação baseada na Instrução Normativa RFB Nº 2.021</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-all border border-slate-700"
            >
              <Printer className="h-4 w-4" /> Imprimir PDF
            </button>
          </div>

          <div className="p-8 space-y-10">
            <div className="bg-[#10B981]/5 rounded-xl p-6 border border-[#10B981]/10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#10B981] rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">Potencial de Economia: {formatCurrency(reducao)}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Aplicando o Fator de Ajuste, sua obra pode ter uma redução de até <b>{percReducao}%</b> nos débitos de INSS.
                    Esta economia é garantida por lei para obras que cumprem os requisitos de remuneração mínima.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#3B82F6]" /> Cronograma de Ação
                </h4>
                <div className="space-y-3">
                  <div className="bg-[#13171f] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center font-bold text-xs">01</div>
                    <span className="text-sm text-slate-300">Aferição no Portal e-CAC (SERO)</span>
                  </div>
                  <div className="bg-[#13171f] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center font-bold text-xs">02</div>
                    <span className="text-sm text-slate-300">Aplicação do Fator de Ajuste (IN 2021)</span>
                  </div>
                  <div className="bg-[#13171f] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center font-bold text-xs">03</div>
                    <span className="text-sm text-slate-300">Emissão da CND (Certidão Negativa)</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#13171f] p-6 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center">
                <h4 className="font-bold text-white mb-4">Gostaria de aplicar esta redução?</h4>
                <p className="text-sm text-slate-400 mb-6">Nossa assessoria contábil garante a aplicação correta e segura para sua obra.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button className="px-6 py-2.5 bg-[#4170FF] text-white text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Solicitar Consultoria
                  </button>
                  <button
                    onClick={() => setShowFatorAjuste(true)}
                    className="px-6 py-2.5 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                  >
                    <CalculatorIcon className="h-4 w-4" /> Fator Detalhado
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-[#13171f]/30 border-t border-white/5 flex items-center justify-between">
            <div className="flex gap-4">
              <button className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded hover:opacity-90 transition-opacity"><Instagram className="inline h-4 w-4 mr-2" /> segue a gente</button>
              <button className="px-5 py-2.5 bg-[#10B981] text-white text-sm font-bold rounded hover:bg-[#059669] transition-colors"><MessageCircle className="inline h-4 w-4 mr-2" /> fale conosco</button>
            </div>
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
                let iMes = parseInt(fatorInicioMes);
                let iAno = parseInt(fatorInicioAno);
                let fMes = parseInt(fatorFimMes);
                let fAno = parseInt(fatorFimAno);

                let dMes = iMes + 1;
                let dAno = iAno;
                if (dMes > 12) {
                  dMes = 1;
                  dAno++;
                }

                let totalMeses = (fAno - dAno) * 12 + (fMes - dMes) + 1;
                if (totalMeses < 1) totalMeses = 1;

                const percMin = totalArea > 350 ? 70 : 50;
                const rmtFormatadoExibicao = parseFloat(calcRMT.toFixed(2));
                const totalRemun = Number((rmtFormatadoExibicao * (percMin / 100)).toFixed(2));
                const remMes = Number((totalRemun / totalMeses).toFixed(2));
                const inssMes = Number((remMes * 0.20).toFixed(2));

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
                let inssAtrasoVal = 0;

                for (let i = 0; i < totalMeses; i++) {
                  const hoje = new Date();
                  const mAtual = hoje.getMonth() + 1;
                  const aAtual = hoje.getFullYear();
                  const age = (aAtual - cAno) * 12 + (mAtual - cMes);

                  let multaPerc = age >= 4 ? 0.20 : age === 3 ? 0.16 : age === 2 ? 0.06 : 0;
                  let jurosPerc = selicMap[age] || (age > 14 ? 14.88 + (age - 14) * 1.10 : 0);

                  const multaVal = inssMes * multaPerc;
                  const jurosVal = inssMes * (jurosPerc / 100);
                  const maedVal = age > 6 ? 85.00 : 0;

                  rows.push({
                    mesStr: `${cMes.toString().padStart(2, '0')}/${cAno}`,
                    rem: remMes,
                    inss: inssMes,
                    multa: multaVal,
                    juros: jurosVal,
                    maed: maedVal,
                    jurosPerc: jurosPerc,
                    isAtraso: age >= 1
                  });

                  totalRem += remMes;
                  totalInss += inssMes;
                  totalMulta += multaVal;
                  totalJuros += jurosVal;
                  totalMaed += maedVal;

                  if (age >= 1) {
                    mesesAtraso++;
                    inssAtrasoVal += (inssMes + multaVal + jurosVal + maedVal);
                  }

                  cMes++;
                  if (cMes > 12) {
                    cMes = 1;
                    cAno++;
                  }
                }

                const valorAtrasoReal = totalInss + totalMulta + totalJuros + totalMaed;
                const multiplicadorJurosSelic = 1.25; 
                const numParcelasAtraso = 60;
                const mesesFuturo = totalMeses - mesesAtraso;
                const inssInicial = rmtFormatadoExibicao * 0.20;
                const inssFinal = valorAtrasoReal;
                const reducao = inssInicial - inssFinal;
                const percReducao = ((reducao / inssInicial) * 100).toFixed(0);

                return (
                  <div className="mt-10 border-t-2 border-slate-200 pt-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center mb-6 no-print">
                      <h4 className="text-xl font-bold text-slate-800">Cálculo Analítico Mensal</h4>
                      <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded flex items-center gap-2">
                        <Printer className="h-4 w-4" /> Exportar Relatório
                      </button>
                    </div>

                    <div className="space-y-8">
                      {/* Tabela Principal */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-[12px] text-slate-700 text-center border-collapse">
                          <thead>
                            <tr className="bg-[#D3E3F5] font-bold border-y border-slate-300">
                              <th className="py-2 px-2">Mês/Ano</th>
                              <th className="py-2 px-2">Remuneração</th>
                              <th className="py-2 px-2">Juros (%)</th>
                              <th className="py-2 px-2">INSS</th>
                              <th className="py-2 px-2">Multa (R$)</th>
                              <th className="py-2 px-2">Juros (R$)</th>
                              <th className="py-2 px-2">MAED</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r, i) => (
                              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-2 font-bold text-slate-800">{r.mesStr}</td>
                                <td className="py-2.5 px-2">{formatCurrency(r.rem)}</td>
                                <td className="py-2.5 px-2">{r.jurosPerc > 0 ? `${r.jurosPerc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%` : '-'}</td>
                                <td className="py-2.5 px-2">{formatCurrency(r.inss)}</td>
                                <td className="py-2.5 px-2">{r.multa > 0 ? formatCurrency(r.multa) : '-'}</td>
                                <td className="py-2.5 px-2">{r.juros > 0 ? formatCurrency(r.juros) : '-'}</td>
                                <td className="py-2.5 px-2">{r.maed > 0 ? formatCurrency(r.maed) : '-'}</td>
                              </tr>
                            ))}
                            <tr className="bg-slate-100 font-bold border-y border-slate-300 text-slate-800">
                              <td className="py-3 px-2">TOTAIS</td>
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
                              <td className="py-4 px-2 font-bold">{formatCurrency(totalRem + totalRem * 0.01079)}</td>
                              <td className="py-2 px-2 font-bold">
                                {formatCurrency(valorAtrasoReal)}<br />
                                <span className="font-normal text-slate-600">{numParcelasAtraso} x {formatCurrency((valorAtrasoReal * multiplicadorJurosSelic) / numParcelasAtraso)}</span>
                              </td>
                              <td className="py-4 px-2 font-bold">{mesesFuturo} x {formatCurrency(inssMes)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="print-area bg-white print:p-8 print:max-w-3xl print:mx-auto">
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
                                <td className="py-3 px-2 font-bold bg-slate-100">{formatCurrency(inssInicial)}</td>
                                <td className="py-3 px-2 font-bold bg-green-100/50 text-green-800">{formatCurrency(reducao)} ({percReducao}%)</td>
                                <td className="py-3 px-2 font-bold bg-[#FDF1D6]">{formatCurrency(inssFinal)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="text-[13px] text-slate-600 mt-6 space-y-4 leading-relaxed">
                          <p><b>OBS:</b> Esta simulação apresenta uma estimativa dos valores mínimos de remuneração, para obtenção do maior desconto possível, o valor real deve ser verificado no SERO. Ao fazer os recolhimentos no e-Social deve-se usar os valores reais das remunerações dos profissionais contratados.</p>
                          <p className="font-bold"> *Resumo* </p>
                          <p>Para sua obra {`( `}<b>*<span className="font-semibold text-slate-800">{destinacao}, local: '{uf}'</span>*</b>{` )`} com <b>*<span className="font-semibold text-slate-800">{totalArea.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²</span>*</b>, o valor do INSS normal, pagando por m² (aferição indireta) é de <b>*<span className="font-semibold text-slate-800">{formatCurrency(inssInicial)}</span>*</b> (se parcelar vai para {formatCurrency(inssInicial * 1.2)}).</p>
                          <p>Através <b>*do Fator de Ajuste*</b>, é possível reduzir seu INSS para <b>*<span className="font-semibold text-slate-800">{formatCurrency(inssFinal)}</span>*</b> (pode ser parcelado) ou seja, uma redução de <b>*<span className="font-semibold text-slate-800">{formatCurrency(reducao)}</span>*</b> {`(${percReducao}%)`}.</p>
                          <p>Para que sua obra se enquadrar <b>*no Fator de Ajuste*</b>, é preciso prestar contas no eSocial de uma remuneração mínima de <b>*<span className="font-semibold text-slate-800">{formatCurrency(totalRem)}</span>*</b>, referente ao período de <b>*<span className="font-semibold text-slate-800">{dMes.toString().padStart(2, '0')}-{dAno} a {fMes.toString().padStart(2, '0')}-{fAno}</span>*</b> ({formatCurrency(remMes)} / mês).</p>
                        </div>
                      </div>

                      <div className="text-[13px] text-slate-600 space-y-4 leading-relaxed mt-4 no-print">
                        <p className="font-bold pt-2"> *Como será feito o pagamento do INSS da minha obra?* </p>
                        <p><b> *Valores em atraso:* </b> {formatCurrency(valorAtrasoReal)} ou {numParcelasAtraso} x {formatCurrency((valorAtrasoReal * multiplicadorJurosSelic) / numParcelasAtraso)} (+ Juros SELIC)</p>
                        <p><b> *INSS futuro:* </b> {mesesFuturo} x {formatCurrency(inssMes)} (pagar até o dia 20 de cada mês)</p>

                        <div className="pt-4 border-t border-slate-100">
                          <p className="font-bold text-slate-800 mb-4">Tabela | Para cálculo de honorários</p>
                          <div className="space-y-2 text-slate-700 font-medium">
                            <p>10% -{'>'} {formatCurrency(reducao * 0.10)}</p>
                            <p>15% -{'>'} {formatCurrency(reducao * 0.15)}</p>
                            <p>20% -{'>'} {formatCurrency(reducao * 0.20)}</p>
                            <p>25% -{'>'} {formatCurrency(reducao * 0.25)}</p>
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

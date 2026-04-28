import React from 'react';
import { PCIFormData, SERVICOS_CUSTO, LISTA_EXECUTOR } from '../../lib/pciData';

interface Props {
  data: PCIFormData;
  onChange: (patch: Partial<PCIFormData>) => void;
}

export function PCICustos({ data, onChange }: Props) {
  const custos = data.custos;
  const totalServicos = custos.reduce((a, b) => a + b, 0);
  const bdiValor = totalServicos > 0 ? (data.bdi_pct * totalServicos) / 100 : 0;
  const totalComBdi = totalServicos + bdiValor;
  const valorTerreno = parseFloat(data.valor_terreno) || 0;
  const custoProducao = valorTerreno + totalComBdi; // AP133 = AP130 + AP132
  const areaTotal = (parseFloat(data.area_coberta_padrao) || 0) + (parseFloat(data.area_acessoria_coberta) || 0);
  const areaTerreno = parseFloat(data.area_terreno) || 0;

  // O BDI agora é 100% manual. 
  // A regra (6% ou 18%) é apenas mostrada visualmente como referência no rodapé.

  // % acumulado — conforme fórmula original: AI(n) = X(n) + AI(n-1)
  const incidencias = custos.map(c => totalServicos > 0 ? (100 * c / totalServicos) : 0);
  const acumulado: number[] = [];
  const ordemAcum = [0,1,2,3,4,5,6,7,8,9,10,12,11,13,14,15,16,17,18,19];
  ordemAcum.forEach((idx, i) => {
    acumulado[idx] = incidencias[idx] + (i > 0 ? acumulado[ordemAcum[i-1]] : 0);
  });

  const setCusto = (idx: number, val: number) => {
    const next = [...custos];
    next[idx] = val;
    onChange({ custos: next });
  };

  const setServAd = (idx: number, field: 'nome' | 'custo', val: any) => {
    const next = [...data.servicos_adicionais];
    next[idx] = { ...next[idx], [field]: field === 'custo' ? Number(val) || 0 : val };
    onChange({ servicos_adicionais: next });
  };

  const totalAdicionais = data.servicos_adicionais.reduce((a, b) => a + b.custo, 0);

  return (
    <div className="space-y-0">
      {/* TABELA PRINCIPAL DE CUSTOS */}
      <table className="w-full border-collapse table-fixed" style={{ minWidth: '900px' }}>
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <tbody>
          <tr><td colSpan={7} className="bg-[#2F528F] px-3 py-1 border border-[#1a3a6e]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Serviços componentes do projeto/custo referencial adotado</span>
          </td></tr>
          
          <tr className="bg-[#D6DCE4]">
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-center">Item</td>
            <td className="border border-[#8ea0b4] px-2 py-1 text-[8px] font-black text-slate-600">Serviços</td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-center" colSpan={2}>Custos Propostos</td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-center">% Ac.</td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-center" colSpan={2}>Incidências aceitáveis</td>
          </tr>
          <tr className="bg-[#D6DCE4]">
            <td className="border border-[#8ea0b4]" colSpan={2}></td>
            <td className="border border-[#8ea0b4] px-1 text-[7px] font-bold text-slate-500 text-center">Incidência</td>
            <td className="border border-[#8ea0b4] px-1 text-[7px] font-bold text-slate-500 text-center">Custos [R$]</td>
            <td className="border border-[#8ea0b4]"></td>
            <td className="border border-[#8ea0b4] px-1 text-[7px] font-bold text-slate-500 text-center">Mínimo [%]</td>
            <td className="border border-[#8ea0b4] px-1 text-[7px] font-bold text-slate-500 text-center">Máximo [%]</td>
          </tr>

          {SERVICOS_CUSTO.map((srv, i) => {
            const inc = incidencias[i];
            const acum = acumulado[i] || 0;
            const fora = totalServicos > 0 && (inc < srv.minPct || inc > srv.maxPct);
            return (
              <tr key={i} className="hover:bg-blue-50/30">
                <td className="bg-white border border-[#8ea0b4] px-1 py-[2px] text-[9px] font-bold text-slate-500 text-center">{srv.num}</td>
                <td className="bg-white border border-[#8ea0b4] px-2 py-[2px] text-[9px] font-medium text-slate-700">{srv.nome}</td>
                <td className={`border border-[#8ea0b4] px-1 py-[2px] text-[9px] font-bold text-center ${fora ? 'bg-[#FFC7CE] text-red-800' : 'bg-white text-slate-600'}`}>
                  {inc.toFixed(2)}
                </td>
                <td className="bg-[#D9E1F2] border border-[#8ea0b4] px-0 py-0">
                  <input
                    type="number" step="0.01" min="0"
                    value={custos[i] || ''}
                    onChange={e => setCusto(i, Number(e.target.value) || 0)}
                    className="w-full bg-transparent text-[9px] font-bold text-slate-900 text-right outline-none px-2 py-[2px]"
                  />
                </td>
                <td className="bg-white border border-[#8ea0b4] px-1 py-[2px] text-[9px] font-bold text-slate-500 text-center">{acum.toFixed(2)}</td>
                <td className="bg-[#F2F2F2] border border-[#8ea0b4] px-1 py-[2px] text-[8px] font-bold text-slate-400 text-center">{srv.minPct.toFixed(2)}</td>
                <td className="bg-[#F2F2F2] border border-[#8ea0b4] px-1 py-[2px] text-[8px] font-bold text-slate-400 text-center">{srv.maxPct.toFixed(2)}</td>
              </tr>
            );
          })}

          {/* RODAPÉ DE TOTAIS E BDI (Fiel ao Excel) */}
          <tr className="bg-[#D6DCE4] font-black">
            <td className="border border-[#8ea0b4] px-1 py-1" colSpan={2}>
              <span className="text-[9px] font-black text-slate-700 uppercase">TOTAIS</span>
            </td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-center bg-white text-slate-400">
              <span className="text-[9px] font-black">{totalServicos > 0 ? '100.00' : '0.00'}</span>
            </td>
            <td className="border border-[#8ea0b4] px-2 py-1 text-right bg-[#E2EFDA]">
              <span className="text-[9px] font-black text-slate-900">{totalServicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </td>
            <td className="bg-white border border-[#8ea0b4] px-2 py-1 text-left" colSpan={1}>
              <span className="text-[8px] font-bold text-slate-500">Custo Total de Serviços</span>
            </td>
            <td className="bg-white border border-[#8ea0b4] px-2 py-1 text-left" colSpan={1}>
              <span className="text-[8px] font-bold text-slate-500">Executor da obra</span>
            </td>
            <td className="border border-[#8ea0b4] px-0 py-0" colSpan={1}>
                <select value={data.executor_obra} onChange={e => onChange({ executor_obra: e.target.value })}
                  className="w-full bg-[#D9E1F2] border border-[#ED7D31] text-[8px] font-bold outline-none px-1 py-1">
                  {LISTA_EXECUTOR.map(o => <option key={o}>{o}</option>)}
                </select>
            </td>
          </tr>

          <tr>
            <td className="bg-[#D6DCE4] border border-[#8ea0b4]" colSpan={2}>
              <span className="text-[9px] font-bold text-slate-600 px-2">BDI</span>
            </td>
            <td className="bg-[#D9E1F2] border-2 border-[#ED7D31] px-0 py-0">
              <input 
                type="number" 
                step="0.01" 
                value={data.bdi_pct || ''} 
                onChange={e => onChange({ bdi_pct: Number(e.target.value) || 0 })}
                className="w-full bg-transparent text-[10px] font-black text-center outline-none px-1 py-[2px]" 
                placeholder="0,00"
              />
            </td>
            <td className="bg-[#E2EFDA] border border-[#8ea0b4] px-2 py-[2px] text-right">
              <span className="text-[9px] font-black text-slate-900">{bdiValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </td>
            <td className="border border-[#8ea0b4]" colSpan={1}></td>
            <td className="border border-[#8ea0b4]" colSpan={1}></td>
            <td className="bg-[#F2F2F2] border border-[#8ea0b4] px-2 py-1 text-center" colSpan={1}>
              <span className="text-[9px] font-bold text-slate-400">
                {data.executor_obra === 'Construtora' ? '18,00' : data.executor_obra === 'Profissional Autônomo' ? '6,00' : '0,00'}
              </span>
              {/* Validação do BDI (Fórmula AX122) */}
              <div className="absolute right-4 mt-1 text-[8px] font-black uppercase text-right">
                {(() => {
                  const refBdi = data.executor_obra === 'Construtora' ? 18 : data.executor_obra === 'Profissional Autônomo' ? 6 : 0;
                  if (!data.bdi_pct) return null;
                  if (data.bdi_pct > refBdi && refBdi > 0) return <span className="text-red-600">Excede máximo - justifique</span>;
                  if (!data.executor_obra) return <span className="text-blue-600">Para validar BDI informe executor da obra</span>;
                  return <span className="text-green-600">OK</span>;
                })()}
              </div>
            </td>
          </tr>

          <tr>
            <td className="bg-[#D6DCE4] border border-[#8ea0b4]" colSpan={2}>
              <span className="text-[9px] font-black text-slate-700 px-2 uppercase">Custo Total com BDI</span>
            </td>
            <td className="border border-[#8ea0b4]"></td>
            <td className="bg-[#C6EFCE] border-2 border-[#006100] px-2 py-1 text-right">
              <span className="text-[10px] font-black text-[#006100]">{totalComBdi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </td>
            <td className="border border-[#8ea0b4]" colSpan={3}></td>
          </tr>

        </tbody>
      </table>

      {/* SERVIÇOS ADICIONAIS E RESUMO DE PRODUÇÃO */}
      <table className="w-full border-collapse mt-4 table-fixed" style={{ minWidth: '900px' }}>
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: '40%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <tbody>
          <tr><td colSpan={7} className="bg-[#2F528F] px-3 py-1 border border-[#1a3a6e]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Serviços adicionais</span>
          </td></tr>
          <tr className="bg-[#D6DCE4]">
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-center">Item</td>
            <td className="border border-[#8ea0b4] px-2 py-1 text-[8px] font-black text-slate-600">Serviços</td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-center">Custos [R$]</td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-right" colSpan={2}>Resumo final</td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-right">Totais</td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-right">Unitário/m²</td>
          </tr>
          {data.servicos_adicionais.map((sa, i) => (
            <tr key={i}>
              <td className="bg-white border border-[#8ea0b4] px-1 py-[2px] text-[9px] text-center text-slate-400 font-bold">{i + 1}</td>
              <td className="bg-[#D9E1F2] border border-[#8ea0b4] px-0 py-0">
                <input type="text" value={sa.nome} onChange={e => setServAd(i, 'nome', e.target.value)}
                  className="w-full bg-transparent text-[9px] outline-none px-2 py-[2px]" />
              </td>
              <td className="bg-[#D9E1F2] border border-[#8ea0b4] px-0 py-0">
                <input type="number" step="0.01" value={sa.custo || ''} onChange={e => setServAd(i, 'custo', e.target.value)}
                  className="w-full bg-transparent text-[9px] font-bold text-right outline-none px-2 py-[2px]" />
              </td>
              {i === 0 && <>
                <td className="bg-[#D6DCE4] border border-[#8ea0b4] px-2 text-[8px] font-bold text-slate-600" colSpan={2}>Valor do Terreno</td>
                <td className="bg-white border border-[#8ea0b4] px-2 text-[9px] font-bold text-right">{valorTerreno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="bg-white border border-[#8ea0b4] px-2 text-[8px] font-bold text-right text-slate-500">{areaTerreno > 0 ? (valorTerreno / areaTerreno).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</td>
              </>}
              {i === 1 && <>
                <td className="bg-[#D6DCE4] border border-[#8ea0b4] px-2 text-[8px] font-black text-slate-700" colSpan={2}>Custo Total de Produção</td>
                <td className="bg-[#C6EFCE] border-2 border-[#006100] px-2 text-[10px] font-black text-[#006100] text-right">
                  {custoProducao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="bg-white border border-[#8ea0b4] px-2 text-[8px] font-bold text-right text-slate-500">{areaTotal > 0 ? (custoProducao / areaTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</td>
              </>}
              {i > 1 && <><td className="border border-[#8ea0b4]" colSpan={2}></td><td className="border border-[#8ea0b4]"></td><td className="border border-[#8ea0b4]"></td></>}
            </tr>
          ))}
          <tr className="bg-[#D6DCE4]">
            <td className="border border-[#8ea0b4] px-1 py-1 text-[9px] font-black text-slate-700 text-center" colSpan={2}>TOTAIS</td>
            <td className="border border-[#8ea0b4] px-2 py-1 text-[9px] font-black text-slate-900 text-right bg-[#E2EFDA]">
              {totalAdicionais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </td>
            <td className="border border-[#8ea0b4]" colSpan={2}></td>
          </tr>
        </tbody>
      </table>

      {/* JUSTIFICATIVAS */}
      <table className="w-full border-collapse mt-4">
        <tbody>
          <tr><td colSpan={20} className="bg-[#2F528F]/80 px-3 py-0.5 border border-[#1a3a6e]">
            <span className="text-[9px] font-bold text-white">Justificativas para itens fora das referências de incidências aceitáveis</span>
          </td></tr>
          <tr>
            <td className="bg-[#D9E1F2] border border-[#8ea0b4] p-1">
              <textarea value={data.justificativas_incidencias || ''} onChange={e => onChange({ justificativas_incidencias: e.target.value })}
                rows={3} className="w-full bg-transparent text-[10px] outline-none resize-none px-1"
                placeholder="Justificar itens com incidência fora dos percentuais mínimo/máximo..." />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

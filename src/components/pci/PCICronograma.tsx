import React from 'react';
import { PCIFormData } from '../../lib/pciData';

interface Props {
  data: PCIFormData;
  onChange: (patch: Partial<PCIFormData>) => void;
}

export function PCICronograma({ data, onChange }: Props) {
  const custoTotal = data.custos.reduce((a, b) => a + b, 0);
  const bdi = custoTotal > 0 ? (data.bdi_pct * custoTotal) / 100 : 0;
  const totalAdic = data.servicos_adicionais.reduce((a, b) => a + b.custo, 0);
  const custoGeral = custoTotal + bdi + totalAdic;

  const cronPct = data.cronograma_pct;

  const setPct = (idx: number, val: number) => {
    const next = [...cronPct];
    next[idx] = val;
    onChange({ cronograma_pct: next });
  };

  // Acumulado: fórmula IF(X(n-1)="","",IF(L(n)="",X(n-1),L(n)+X(n-1)))
  const acumulado: number[] = [];
  cronPct.forEach((pct, i) => {
    acumulado[i] = pct + (i > 0 ? acumulado[i - 1] : 0);
  });

  // Valor: IF(L(n)="",0,(L(n)*custoGeral)/100)
  const valores = cronPct.map(pct => pct > 0 ? (pct * custoGeral) / 100 : 0);

  const etapas = ['PréExc.', ...Array.from({ length: 24 }, (_, i) => String(i + 1))];

  return (
    <div className="space-y-0">
      {/* PRAZO E PRÉ-EXECUTADO (R142) */}
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="bg-[#D6DCE4] border border-[#8ea0b4] px-2 py-[3px] text-[9px] font-bold text-slate-700">Prazo proposto para a Execução da obra</td>
            <td className="bg-[#D9E1F2] border border-[#8ea0b4] px-1 py-0 w-16">
              <input type="text" value={data.prazo_meses} onChange={e => onChange({ prazo_meses: e.target.value })}
                className="w-full bg-transparent text-[10px] font-bold text-center outline-none px-1 py-[2px]" placeholder="0" />
            </td>
            <td className="bg-[#D6DCE4] border border-[#8ea0b4] px-2 py-[3px] text-[9px] font-bold text-slate-600 w-12">meses</td>
            <td className="bg-[#D6DCE4] border border-[#8ea0b4] px-2 py-[3px] text-[9px] font-bold text-slate-700">Percentual de Obra Pré-Executado (Etapa 0) %</td>
            <td className="bg-[#D9E1F2] border border-[#8ea0b4] px-1 py-0 w-16">
              <input type="text" value={data.pct_pre_executado} onChange={e => onChange({ pct_pre_executado: e.target.value })}
                className="w-full bg-transparent text-[10px] font-bold text-center outline-none px-1 py-[2px]" placeholder="0" />
            </td>
          </tr>
        </tbody>
      </table>

      {/* CRONOGRAMA */}
      <table className="w-full border-collapse mt-0">
        <tbody>
          <tr><td colSpan={5} className="bg-[#2F528F] px-3 py-1 border border-[#1a3a6e]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Cronograma</span>
          </td></tr>
          {/* Cabeçalho — R144 */}
          <tr className="bg-[#D6DCE4]">
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-center w-16">Etapa</td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-center w-24">% Execução previsto para a etapa</td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-center w-24">% Execução previsto acumulado</td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-center w-28">Valor estimado para a etapa (R$)</td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-center">Cronograma de referência</td>
          </tr>

          {etapas.map((etapa, i) => (
            <tr key={i} className={i === etapas.length - 1 && acumulado[i] >= 100 ? 'bg-[#C6EFCE]/30' : ''}>
              <td className="bg-white border border-[#8ea0b4] px-1 py-[2px] text-[9px] font-bold text-slate-500 text-center">{etapa}</td>
              <td className="bg-[#D9E1F2] border border-[#8ea0b4] px-0 py-0">
                <input
                  type="number" step="0.01" min="0" max="100"
                  value={cronPct[i] || ''}
                  onChange={e => setPct(i, Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-transparent text-[9px] font-bold text-slate-900 text-center outline-none px-1 py-[2px]"
                />
              </td>
              <td className="bg-white border border-[#8ea0b4] px-1 py-[2px] text-[9px] font-bold text-slate-600 text-center">
                {acumulado[i] > 0 ? acumulado[i].toFixed(2) : ''}
              </td>
              <td className="bg-white border border-[#8ea0b4] px-2 py-[2px] text-[9px] font-bold text-slate-800 text-right">
                {valores[i] > 0 ? valores[i].toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
              </td>
              <td className="bg-[#F2F2F2] border border-[#8ea0b4] px-2 py-[2px] text-[8px] text-slate-400 text-center">
                {/* Cronograma referência: 100 para etapas 25+ */}
                {i >= 25 ? '100' : ''}
              </td>
            </tr>
          ))}

          {/* Total */}
          <tr className="bg-[#D6DCE4]">
            <td className="border border-[#8ea0b4] px-1 py-1 text-[9px] font-black text-slate-700 text-center">TOTAL</td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-[9px] font-black text-center" style={{
              color: Math.abs(cronPct.reduce((a, b) => a + b, 0) - 100) < 0.01 ? '#006100' : '#9C0006',
              background: Math.abs(cronPct.reduce((a, b) => a + b, 0) - 100) < 0.01 ? '#C6EFCE' : '#FFC7CE'
            }}>
              {cronPct.reduce((a, b) => a + b, 0).toFixed(2)}%
            </td>
            <td className="border border-[#8ea0b4] px-1 py-1 text-[9px] font-black text-slate-700 text-center">100.00</td>
            <td className="border-2 border-[#006100] bg-[#C6EFCE] px-2 py-1 text-[9px] font-black text-[#006100] text-right">
              {custoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </td>
            <td className="border border-[#8ea0b4]"></td>
          </tr>
        </tbody>
      </table>

      {/* INSERIR POLIGONAL DO TERRENO (R172-174) */}
      <table className="w-full border-collapse mt-2">
        <tbody>
          <tr><td colSpan={2} className="bg-[#2F528F] px-3 py-1 border border-[#1a3a6e]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Inserir Poligonal do Terreno</span>
          </td></tr>
          <tr>
            <td className="bg-white border border-[#8ea0b4] px-2 py-1">
              <span className="text-[8px] text-slate-500">A Partir do Google Earth ou Planta do Loteamento</span>
            </td>
          </tr>
          <tr>
            <td className="bg-[#D9E1F2] border border-[#8ea0b4] p-1">
              <textarea value={data.poligonal_descricao} onChange={e => onChange({ poligonal_descricao: e.target.value })}
                rows={3} className="w-full bg-transparent text-[10px] outline-none resize-none px-1"
                placeholder="Descrever foto / inserir descrição da poligonal" />
            </td>
          </tr>
        </tbody>
      </table>

      {/* DESCRIÇÃO OBRAS EXECUTADAS */}
      <table className="w-full border-collapse mt-2">
        <tbody>
          <tr><td className="bg-[#2F528F] px-3 py-1 border border-[#1a3a6e]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Descrição das obras já executadas</span>
          </td></tr>
          <tr>
            <td className="bg-[#D9E1F2] border border-[#8ea0b4] p-1">
              <textarea
                value={data.descricao_obras_executadas}
                onChange={e => onChange({ descricao_obras_executadas: e.target.value })}
                rows={3}
                className="w-full bg-transparent text-[10px] outline-none resize-none px-1"
                placeholder="Descreva as obras já executadas..."
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* OBSERVAÇÕES */}
      <table className="w-full border-collapse mt-2">
        <tbody>
          <tr><td className="bg-[#2F528F] px-3 py-1 border border-[#1a3a6e]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Outras Observações</span>
          </td></tr>
          <tr>
            <td className="bg-[#D9E1F2] border border-[#8ea0b4] p-1">
              <textarea value={data.observacoes} onChange={e => onChange({ observacoes: e.target.value })}
                rows={3} className="w-full bg-transparent text-[10px] outline-none resize-none px-1"
                placeholder="Incluir características/informações relevante específicas da proposta" />
            </td>
          </tr>
        </tbody>
      </table>

      {/* DECLARAÇÕES */}
      <table className="w-full border-collapse mt-2">
        <tbody>
          <tr><td colSpan={4} className="bg-[#2F528F] px-3 py-1 border border-[#1a3a6e]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Declarações e ciência do proponente e do responsável técnico</span>
          </td></tr>
          <tr>
            <td colSpan={4} className="bg-white border border-[#8ea0b4] px-3 py-2">
              <p className="text-[8px] text-slate-600 leading-relaxed">
                O PROPONENTE e o RESPONSÁVEL TÉCNICO PELA EXECUÇÃO DA OBRA declaram, sob as penas da Lei, que:
                Estão CIENTES de que eventuais irregularidades, identificadas no acompanhamento da obra, sujeitam ambos à inclusão no Cadastro Informativo de Pessoas Físicas e Jurídicas com relacionamento com a CAIXA - CONRES;
                O Imóvel atende aos itens e condições mínimas exigidas pela CAIXA;
                O projeto aprovado segue as normas técnicas vigentes e aplicáveis;
                A placa de obra será fixada, conforme modelo estabelecido pela CAIXA;
                O projeto possui destinação exclusivamente residencial unifamiliar e não faz parte de empreendimento.
                São verídicas as informações aqui prestadas.
              </p>
            </td>
          </tr>
          <tr>
            <td className="bg-[#D6DCE4] border border-[#8ea0b4] px-2 py-1 text-[9px] font-bold text-slate-600">Local e data</td>
            <td className="bg-[#D9E1F2] border border-[#8ea0b4] px-1 py-0" colSpan={3}>
              <input type="text" value={data.local_data} onChange={e => onChange({ local_data: e.target.value })}
                className="w-full bg-transparent text-[10px] outline-none px-1 py-[2px]" placeholder="Cidade, DD/MM/AAAA" />
            </td>
          </tr>
          <tr>
            <td className="bg-[#D6DCE4] border border-[#8ea0b4] px-2 py-1 text-[9px] font-bold" colSpan={2}>
              <div className="text-slate-600">Cliente/Proponente</div>
              <div className="text-[8px] text-slate-400 mt-1">Nome: {data.proponente_nome || '—'}</div>
              <div className="text-[8px] text-slate-400">CPF: {data.proponente_cpf_cnpj || '—'}</div>
            </td>
            <td className="bg-[#D6DCE4] border border-[#8ea0b4] px-2 py-1 text-[9px] font-bold" colSpan={2}>
              <div className="text-slate-600">Responsável Técnico pela execução da obra</div>
              <div className="text-[8px] text-slate-400 mt-1">Nome: {data.rte_nome || '—'}</div>
              <div className="text-[8px] text-slate-400">CPF: {data.rte_cpf || '—'} &nbsp; CAU/CREA/CFT: {data.rte_conselho || '—'}/{data.rte_uf || '—'}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

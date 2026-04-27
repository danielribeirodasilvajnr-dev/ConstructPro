import React from 'react';
import {
  PCIFormData, LISTA_SISTEMA_CONSTRUTIVO, LISTA_COBERTURA, LISTA_TETO,
  LISTA_REVEST_PAREDES_EXT, LISTA_ESQUADRIAS_EXT, LISTA_REVEST_PISO_MOLHADAS,
  LISTA_REVEST_PISO_SECAS, LISTA_PISO_AREAS_MOLHADAS, LISTA_LOUCAS_METAIS,
  LISTA_ESGOTO, LISTA_ENERGIA_ALT, LISTA_TIPO_VAGAS, LISTA_COZINHA,
  LISTA_AGUA_QUENTE, LISTA_DESTINACAO, LISTA_PADRAO, LISTA_CUSTO_REF
} from '../../lib/pciData';

interface Props {
  data: PCIFormData;
  onChange: (patch: Partial<PCIFormData>) => void;
}

const L = ({ children, colSpan = 1 }: { children: React.ReactNode; colSpan?: number }) => (
  <td className="bg-[#D6DCE4] border border-[#8ea0b4] px-2 py-[3px] text-[9px] font-bold text-slate-700 whitespace-nowrap" colSpan={colSpan}>{children}</td>
);
const E = ({ value, onChange, placeholder = '', colSpan = 1 }: { value: string; onChange: (v: string) => void; placeholder?: string; colSpan?: number }) => (
  <td className="bg-[#D9E1F2] border border-[#8ea0b4] px-1 py-0" colSpan={colSpan}>
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-transparent text-[10px] font-semibold text-slate-900 outline-none px-1 py-[2px] placeholder:text-slate-400/60" />
  </td>
);
const S = ({ value, onChange, options, colSpan = 1 }: { value: string; onChange: (v: string) => void; options: string[]; colSpan?: number }) => (
  <td className="bg-[#D9E1F2] border-2 border-[#ED7D31] px-1 py-0" colSpan={colSpan}>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-transparent text-[9px] font-semibold text-slate-900 outline-none cursor-pointer py-[2px]">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </td>
);
const F = ({ value, colSpan = 1 }: { value: string | number; colSpan?: number }) => (
  <td className="bg-white border border-[#8ea0b4] px-2 py-[3px] text-[9px] font-bold text-slate-800 text-right" colSpan={colSpan}>{value}</td>
);

export function PCIProjeto({ data, onChange }: Props) {
  const set = (field: keyof PCIFormData) => (v: string) => onChange({ [field]: v });
  const areaCoberta = parseFloat(data.area_coberta_padrao) || 0;
  const areaAcessoria = parseFloat(data.area_acessoria_coberta) || 0;
  const areaTotal = areaCoberta + areaAcessoria; // Fórmula: AC73 = G73 + U73

  return (
    <div className="space-y-0">
      {/* ÁREAS */}
      <table className="w-full border-collapse">
        <tbody>
          <tr><td colSpan={12} className="bg-[#2F528F] px-3 py-1 border border-[#1a3a6e]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Projeto</span>
          </td></tr>
          <tr><td colSpan={12} className="bg-white border border-[#8ea0b4] px-2 py-1">
            <span className="text-[8px] text-slate-500">Preencher seguindo requisitos estritamente técnicos de engenharia e arquitetura</span>
          </td></tr>
          <tr><td colSpan={12} className="bg-[#2F528F]/80 px-3 py-0.5 border border-[#1a3a6e]">
            <span className="text-[9px] font-bold text-white">Áreas</span>
          </td></tr>
          <tr>
            <L>Área Coberta Padrão</L>
            <E value={data.area_coberta_padrao} onChange={set('area_coberta_padrao')} placeholder="m²" />
            <L>Área Permeável</L>
            <E value={data.area_permeavel} onChange={set('area_permeavel')} placeholder="m²" />
            <L>Área Acessória Coberta</L>
            <E value={data.area_acessoria_coberta} onChange={set('area_acessoria_coberta')} placeholder="m²" />
            <L>Área Construída Total</L>
            <F value={areaTotal > 0 ? areaTotal.toFixed(2) : ''} />
            <L>Área do Terreno</L>
            <E value={data.area_terreno} onChange={set('area_terreno')} placeholder="m²" />
            <L>Valor do Terreno</L>
            <E value={data.valor_terreno} onChange={set('valor_terreno')} placeholder="R$" />
          </tr>
          <tr>
            <L>Destinação do Imóvel</L>
            <S value={data.destinacao_imovel} onChange={set('destinacao_imovel')} options={LISTA_DESTINACAO} />
            <L>Sistema Construtivo</L>
            <S value={data.sistema_construtivo} onChange={set('sistema_construtivo')} options={LISTA_SISTEMA_CONSTRUTIVO} colSpan={2} />
            <L>Sist. Constr. Outros (Especificar)</L>
            <E value={data.sistema_construtivo_outros} onChange={set('sistema_construtivo_outros')} colSpan={5} />
          </tr>
          <tr>
            <L>Nº DATec</L>
            <E value={data.num_datec} onChange={set('num_datec')} />
            <td colSpan={10} className="bg-white border border-[#8ea0b4]"></td>
          </tr>
        </tbody>
      </table>

      {/* MEMORIAL DESCRITIVO */}
      <table className="w-full border-collapse mt-0">
        <tbody>
          <tr><td colSpan={12} className="bg-[#2F528F]/80 px-3 py-0.5 border border-[#1a3a6e]">
            <span className="text-[9px] font-bold text-white">Discriminar a solução prevista em projeto para caracterizar o padrão do acabamento</span>
          </td></tr>
          {/* Linha 1: Cobertura, Teto, Pavtos, Quartos, Suítes, Salas, Vagas, Tipo Vagas */}
          <tr>
            <L>Cobertura</L>
            <S value={data.cobertura_tipo} onChange={set('cobertura_tipo')} options={LISTA_COBERTURA} />
            <L>Teto</L>
            <S value={data.teto} onChange={set('teto')} options={LISTA_TETO} />
            <L>Pavtos.</L>
            <E value={data.pavtos} onChange={set('pavtos')} placeholder="Nº" />
            <L>Quartos</L>
            <E value={data.quartos} onChange={set('quartos')} placeholder="Nº" />
            <L>Suítes</L>
            <E value={data.suites} onChange={set('suites')} placeholder="Nº" />
            <L>Salas</L>
            <E value={data.salas} onChange={set('salas')} placeholder="Nº" />
            <L>Vagas</L>
            <E value={data.vagas} onChange={set('vagas')} placeholder="Nº" />
            <L>Tipo de Vagas</L>
            <S value={data.tipo_vagas} onChange={set('tipo_vagas')} options={LISTA_TIPO_VAGAS} />
          </tr>
          {/* Linha 2: Acabamento externo, Louças, Á.Serviço, Cozinha, Água Quente */}
          <tr>
            <L>Acabamento Paredes Externas</L>
            <S value={data.acabamento_paredes_ext} onChange={set('acabamento_paredes_ext')} options={LISTA_REVEST_PAREDES_EXT} />
            <L>Louças e Metais</L>
            <S value={data.loucas_metais} onChange={set('loucas_metais')} options={LISTA_LOUCAS_METAIS} />
            <L>Á. Serviço</L>
            <E value={data.area_servico} onChange={set('area_servico')} />
            <L>Cozinha</L>
            <S value={data.cozinha} onChange={set('cozinha')} options={LISTA_COZINHA} />
            <L>Água Quente</L>
            <S value={data.agua_quente} onChange={set('agua_quente')} options={LISTA_AGUA_QUENTE} />
          </tr>
          {/* Linha 3: Acabamento interno, Pards secas, Calefação, Sustentabilidade */}
          <tr>
            <L>Acabamento Paredes Internas</L>
            <S value={data.acabamento_paredes_int} onChange={set('acabamento_paredes_int')} options={LISTA_REVEST_PAREDES_EXT} />
            <L>Pards./Painéis Á. Secas</L>
            <E value={data.paredes_areas_secas} onChange={set('paredes_areas_secas')} />
            <L>Calefação</L>
            <E value={data.calefacao} onChange={set('calefacao')} />
            <L>Sustentabilidade</L>
            <E value={data.sustentabilidade} onChange={set('sustentabilidade')} />
            <L>Implantação/Inserção</L>
            <E value={data.implantacao} onChange={set('implantacao')} />
          </tr>
          {/* Linha 4: Revest molhadas, piso secas, piso molhadas, divisão */}
          <tr>
            <L>Revest.Pards.Á.Molhadas</L>
            <S value={data.revest_paredes_molhadas} onChange={set('revest_paredes_molhadas')} options={LISTA_REVEST_PISO_MOLHADAS} />
            <L>Revest.Piso Á.Secas</L>
            <S value={data.revest_piso_secas} onChange={set('revest_piso_secas')} options={LISTA_REVEST_PISO_SECAS} />
            <L>Revest.Piso Á.Molhadas</L>
            <S value={data.revest_piso_molhadas} onChange={set('revest_piso_molhadas')} options={LISTA_PISO_AREAS_MOLHADAS} />
            <L>Divisão Interna</L>
            <E value={data.divisao_interna} onChange={set('divisao_interna')} />
          </tr>
          {/* Linha 5: Esquadrias, Abastecimento */}
          <tr>
            <L>Esquadrias Externas</L>
            <S value={data.esquadrias_ext} onChange={set('esquadrias_ext')} options={LISTA_ESQUADRIAS_EXT} />
            <L>Esquadrias Internas</L>
            <E value={data.esquadrias_int} onChange={set('esquadrias_int')} />
            <L>Abastecimento d'água</L>
            <E value={data.abastecimento_agua} onChange={set('abastecimento_agua')} />
            <L>Outros (Especificar)</L>
            <E value={data.outros_acabamento} onChange={set('outros_acabamento')} colSpan={3} />
          </tr>
          {/* Linha 6: Drenagem, Esgoto, Energia */}
          <tr>
            <L>Drenagem</L>
            <E value={data.drenagem} onChange={set('drenagem')} />
            <L>Coleta/Tratmto. Esgoto</L>
            <S value={data.coleta_esgoto} onChange={set('coleta_esgoto')} options={LISTA_ESGOTO} />
            <L>Ger. Alternt. de Energia</L>
            <S value={data.ger_energia} onChange={set('ger_energia')} options={LISTA_ENERGIA_ALT} />
            <td className="bg-white border border-[#8ea0b4]" colSpan={6}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

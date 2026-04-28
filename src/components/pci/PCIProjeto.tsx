import React from 'react';
import {
  PCIFormData, LISTA_SISTEMA_CONSTRUTIVO, LISTA_COBERTURA, LISTA_TETO,
  LISTA_REVEST_PAREDES_EXT, LISTA_ESQUADRIAS_EXT, LISTA_REVEST_PISO_MOLHADAS,
  LISTA_REVEST_PISO_SECAS, LISTA_PISO_AREAS_MOLHADAS, LISTA_LOUCAS_METAIS,
  LISTA_ESGOTO, LISTA_ENERGIA_ALT, LISTA_TIPO_VAGAS, LISTA_COZINHA,
  LISTA_AGUA_QUENTE, LISTA_DESTINACAO, LISTA_PADRAO
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
      className="w-full bg-transparent text-[10px] font-semibold text-slate-900 outline-none px-1 py-[2px] placeholder:text-slate-400/60 text-center" />
  </td>
);
const S = ({ value, onChange, options, colSpan = 1 }: { value: string; onChange: (v: string) => void; options: string[]; colSpan?: number }) => (
  <td className="bg-[#D9E1F2] border-2 border-[#ED7D31] px-0 py-0 relative" colSpan={colSpan}>
    <div className="relative flex items-center h-full">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent text-[9px] font-semibold text-slate-900 outline-none cursor-pointer appearance-none pl-2 pr-4 py-[2px] z-10 text-center">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="absolute right-0 top-0 bottom-0 w-[14px] bg-[#D1D7E2] border-l border-[#8ea0b4] flex items-center justify-center pointer-events-none z-0">
        <span className="text-[6px] text-slate-600">▼</span>
      </div>
    </div>
  </td>
);

const F = ({ value, colSpan = 1 }: { value: string | number; colSpan?: number }) => (
  <td className="bg-white border border-[#8ea0b4] px-2 py-[3px] text-[10px] font-bold text-slate-800 text-center" colSpan={colSpan}>{value}</td>
);

export function PCIProjeto({ data, onChange }: Props) {
  const set = (field: keyof PCIFormData) => (v: string) => onChange({ [field]: v });
  
  // Cálculo reativo das áreas
  const areaCoberta = parseFloat(data.area_coberta_padrao.replace(',', '.')) || 0;
  const areaAcessoria = parseFloat(data.area_acessoria_coberta.replace(',', '.')) || 0;
  const areaTotal = areaCoberta + areaAcessoria;

  return (
    <div className="space-y-0">
      <table className="w-full border-collapse table-fixed" style={{ minWidth: '950px' }}>
        <colgroup>
          <col style={{ width: '12%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '5%' }} />
        </colgroup>
        <tbody>
          <tr><td colSpan={12} className="bg-[#2F528F] px-3 py-1 border border-[#1a3a6e]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Projeto</span>
          </td></tr>
          <tr><td colSpan={12} className="bg-white border border-[#8ea0b4] px-3 py-1">
            <span className="text-[9px] font-medium text-slate-700 italic">Preencher seguindo requisitos estritamente técnicos de engenharia e arquitetura, para evitar divergência com a análise e consequente revisão da proposta</span>
          </td></tr>
          <tr><td colSpan={12} className="bg-[#2F528F]/80 px-3 py-0.5 border border-[#1a3a6e]">
            <span className="text-[9px] font-bold text-white uppercase">Áreas</span>
          </td></tr>
          
          {/* Row 1 Areas */}
          <tr>
            <L>Área Coberta Padrão</L>
            <E value={data.area_coberta_padrao} onChange={set('area_coberta_padrao')} placeholder="" />
            <L>Área Permeável</L>
            <E value={data.area_permeavel} onChange={set('area_permeavel')} placeholder="" />
            <L>Área Acessória Coberta</L>
            <E value={data.area_acessoria_coberta} onChange={set('area_acessoria_coberta')} placeholder="" />
            <L>Área Construída Total</L>
            <F value={areaTotal > 0 ? areaTotal.toFixed(2).replace('.', ',') : ''} />
            <L>Área do Terreno</L>
            <E value={data.area_terreno} onChange={set('area_terreno')} placeholder="" />
            <L>Valor do Terreno</L>
            <E value={data.valor_terreno} onChange={set('valor_terreno')} placeholder="" />
          </tr>
          {/* Row of units/sublabels */}
          <tr className="text-slate-400 text-[7px] font-bold">
            <td className="bg-[#D6DCE4] border-x border-[#8ea0b4]"></td>
            <td className="bg-[#D9E1F2] border-x border-[#8ea0b4] text-center">m²</td>
            <td className="bg-[#D6DCE4] border-x border-[#8ea0b4]"></td>
            <td className="bg-[#D9E1F2] border-x border-[#8ea0b4] text-center">m²</td>
            <td className="bg-[#D6DCE4] border-x border-[#8ea0b4]"></td>
            <td className="bg-[#D9E1F2] border-x border-[#8ea0b4] text-center">m²</td>
            <td className="bg-[#D6DCE4] border-x border-[#8ea0b4]"></td>
            <td className="bg-white border-x border-[#8ea0b4]"></td>
            <td className="bg-[#D6DCE4] border-x border-[#8ea0b4]"></td>
            <td className="bg-[#D9E1F2] border-x border-[#8ea0b4] text-center">m²</td>
            <td className="bg-[#D6DCE4] border-x border-[#8ea0b4]"></td>
            <td className="bg-[#D9E1F2] border-x border-[#8ea0b4] text-center">RS</td>
          </tr>

          {/* Row 2 Areas */}
          <tr>
            <L>Destinação do Imóvel</L>
            <S value={data.destinacao_imovel} onChange={set('destinacao_imovel')} options={LISTA_DESTINACAO} />
            <L>Sistema Construtivo</L>
            <S value={data.sistema_construtivo} onChange={set('sistema_construtivo')} options={LISTA_SISTEMA_CONSTRUTIVO} colSpan={3} />
            <L>Sist. Constr. Outros (Especificar)</L>
            <E value={data.sistema_construtivo_outros} onChange={set('sistema_construtivo_outros')} colSpan={4} />
          </tr>

          {/* Row 3 Areas */}
          <tr>
            <L>Nº DATec</L>
            <E value={data.num_datec} onChange={set('num_datec')} />
            <L colSpan={2}>Docum. complementar Sistema Inovador</L>
            <E value={data.doc_compl_inovador} onChange={set('doc_compl_inovador')} colSpan={8} />
          </tr>

          {/* Row 4 Areas */}
          <tr>
            <L colSpan={2}>Optante pelo Selo Casa Azul - Unidade Isolada?</L>
            <S value={data.selo_casa_azul} onChange={set('selo_casa_azul')} options={['(escolha)', 'Sim', 'Não', 'Não se aplica']} />
            <L colSpan={2}>Documentação complementar Selo</L>
            <S value={data.doc_compl_selo} onChange={set('doc_compl_selo')} options={['(escolha)', 'Sim', 'Não']} colSpan={7} />
          </tr>
        </tbody>
      </table>

      {/* MEMORIAL DESCRITIVO */}
      <table className="w-full border-collapse mt-0" style={{ minWidth: '950px' }}>
        <tbody>
          <tr><td colSpan={12} className="bg-[#2F528F]/80 px-3 py-0.5 border border-[#1a3a6e]">
            <span className="text-[9px] font-bold text-white uppercase">Memorial Descritivo</span>
          </td></tr>
          <tr>
            <td colSpan={10} className="bg-white border border-[#8ea0b4] px-2 py-1">
              <span className="text-[8px] text-slate-500 italic">Discriminar a solução prevista em projeto para caracterizar o padrão do acabamento</span>
            </td>
            <L>Padrão Acabamento</L>
            <S value={data.padrao_acabamento} onChange={set('padrao_acabamento')} options={LISTA_PADRAO} />
          </tr>
          
          {/* Linha 1 */}
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
          </tr>

          {/* Linha 2 */}
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
            <L>Vagas</L>
            <E value={data.vagas} onChange={set('vagas')} placeholder="Nº" />
          </tr>

          {/* Linha 3 */}
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
            <L>Tipo de Vagas</L>
            <S value={data.tipo_vagas} onChange={set('tipo_vagas')} options={LISTA_TIPO_VAGAS} />
          </tr>

          {/* Linha 4 */}
          <tr>
            <L>Revest.Pards.Á.Molhadas</L>
            <S value={data.revest_paredes_molhadas} onChange={set('revest_paredes_molhadas')} options={LISTA_REVEST_PISO_MOLHADAS} />
            <L>Revest.Piso Á.Secas</L>
            <S value={data.revest_piso_secas} onChange={set('revest_piso_secas')} options={LISTA_REVEST_PISO_SECAS} />
            <L>Revest.Piso Á.Molhadas</L>
            <S value={data.revest_piso_molhadas} onChange={set('revest_piso_molhadas')} options={LISTA_PISO_AREAS_MOLHADAS} />
            <L>Divisão Interna</L>
            <E value={data.divisao_interna} onChange={set('divisao_interna')} />
            <td className="bg-white border border-[#8ea0b4]" colSpan={4}></td>
          </tr>

          {/* Linha 5 */}
          <tr>
            <L>Esquadrias Externas</L>
            <S value={data.esquadrias_ext} onChange={set('esquadrias_ext')} options={LISTA_ESQUADRIAS_EXT} />
            <L>Esquadrias Internas</L>
            <E value={data.esquadrias_int} onChange={set('esquadrias_int')} />
            <L>Abastecimento d'água</L>
            <E value={data.abastecimento_agua} onChange={set('abastecimento_agua')} />
            <L>Outros (Especificar)</L>
            <E value={data.outros_acabamento} onChange={set('outros_acabamento')} colSpan={5} />
          </tr>

          {/* Linha 6 */}
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

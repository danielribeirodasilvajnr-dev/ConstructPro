import React from 'react';
import { PCIFormData, LISTA_UFS, LISTA_FINALIDADE } from '../../lib/pciData';

interface Props {
  data: PCIFormData;
  onChange: (patch: Partial<PCIFormData>) => void;
}

/* Célula label fixa (cinza) */
const L = ({ children, w = 'auto' }: { children: React.ReactNode; w?: string }) => (
  <td className="bg-[#D6DCE4] border border-[#8ea0b4] px-2 py-[3px] text-[9px] font-bold text-slate-700 whitespace-nowrap" style={{ width: w }}>
    {children}
  </td>
);

/* Célula editável (lilás) */
const E = ({ value, onChange, placeholder = '', colSpan = 1 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; colSpan?: number;
}) => (
  <td className="bg-[#D9E1F2] border border-[#8ea0b4] px-1 py-0" colSpan={colSpan}>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-[10px] font-semibold text-slate-900 outline-none px-1 py-[2px] placeholder:text-slate-400/60"
    />
  </td>
);

/* Célula select (borda laranja) */
const S = ({ value, onChange, options, colSpan = 1 }: {
  value: string; onChange: (v: string) => void; options: string[]; colSpan?: number;
}) => (
  <td className="bg-[#D9E1F2] border-2 border-[#ED7D31] px-1 py-0" colSpan={colSpan}>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-transparent text-[10px] font-semibold text-slate-900 outline-none cursor-pointer appearance-none py-[2px]">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </td>
);

export function PCIIdentificacao({ data, onChange }: Props) {
  const set = (field: keyof PCIFormData) => (v: string) => onChange({ [field]: v });

  return (
    <div className="space-y-0">
      {/* CABEÇALHO */}
      <table className="w-full border-collapse text-left" style={{ minWidth: '900px' }}>
        <tbody>
          <tr>
            <td colSpan={20} className="bg-white py-3 px-3 border border-[#8ea0b4]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-[#005CA9] text-white font-black text-[14px] px-3 py-1.5 rounded-sm tracking-wider leading-none">
                    CAIXA
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-black text-slate-800">Proposta de Construção Individual</div>
                  <div className="text-[9px] text-slate-500 font-bold">Construção em Terreno Próprio e Aquisição de Terreno e Construção</div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* IDENTIFICAÇÃO */}
      <table className="w-full border-collapse" style={{ minWidth: '900px' }}>
        <tbody>
          <tr><td colSpan={20} className="bg-[#2F528F] px-3 py-1 border border-[#1a3a6e]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Identificação</span>
          </td></tr>

          {/* Proponente */}
          <tr>
            <L w="180px">Proponente</L>
            <E value={data.proponente_nome} onChange={set('proponente_nome')} colSpan={5} />
            <L>E-mail</L>
            <E value={data.proponente_email} onChange={set('proponente_email')} colSpan={2} />
            <L>CPF/CNPJ Prop.</L>
            <E value={data.proponente_cpf_cnpj} onChange={set('proponente_cpf_cnpj')} />
            <L>Telefone Prop.</L>
            <E value={data.proponente_telefone} onChange={set('proponente_telefone')} />
          </tr>

          {/* RTP */}
          <tr>
            <L>RT pelo Proj. Arquit./Edif. - RTP</L>
            <E value={data.rtp_nome} onChange={set('rtp_nome')} colSpan={2} />
            <L>E-mail - RTP</L>
            <E value={data.rtp_email} onChange={set('rtp_email')} />
            <L>Nº CAU/CREA/CFT-RTP</L>
            <E value={data.rtp_conselho} onChange={set('rtp_conselho')} />
            <L w="30px">UF</L>
            <S value={data.rtp_uf} onChange={set('rtp_uf')} options={LISTA_UFS} />
            <L>CPF - RTP</L>
            <E value={data.rtp_cpf} onChange={set('rtp_cpf')} />
            <L>Telefone - RTP</L>
            <E value={data.rtp_telefone} onChange={set('rtp_telefone')} />
          </tr>

          {/* RTE */}
          <tr>
            <L>RT pela Execução da Obra - RTE</L>
            <E value={data.rte_nome} onChange={set('rte_nome')} colSpan={2} />
            <L>E-mail - RTE</L>
            <E value={data.rte_email} onChange={set('rte_email')} />
            <L>Nº CAU/CREA/CFT-RTE</L>
            <E value={data.rte_conselho} onChange={set('rte_conselho')} />
            <L w="30px">UF</L>
            <S value={data.rte_uf} onChange={set('rte_uf')} options={LISTA_UFS} />
            <L>CPF - RTE</L>
            <E value={data.rte_cpf} onChange={set('rte_cpf')} />
            <L>Telefone - RTE</L>
            <E value={data.rte_telefone} onChange={set('rte_telefone')} />
          </tr>
        </tbody>
      </table>

      {/* IDENTIFICAÇÃO DO IMÓVEL */}
      <table className="w-full border-collapse mt-0" style={{ minWidth: '900px' }}>
        <tbody>
          <tr><td colSpan={20} className="bg-[#2F528F] px-3 py-1 border border-[#1a3a6e]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Identificação do imóvel proposto</span>
          </td></tr>
          <tr>
            <L>Endereço</L>
            <E value={data.imovel_endereco} onChange={set('imovel_endereco')} colSpan={9} />
            <L>Complemento</L>
            <E value={data.imovel_complemento} onChange={set('imovel_complemento')} colSpan={2} />
          </tr>
          <tr>
            <L>Bairro</L>
            <E value={data.imovel_bairro} onChange={set('imovel_bairro')} colSpan={4} />
            <L>CEP</L>
            <E value={data.imovel_cep} onChange={set('imovel_cep')} />
            <L>Município</L>
            <E value={data.imovel_municipio} onChange={set('imovel_municipio')} colSpan={3} />
            <L w="30px">UF</L>
            <S value={data.imovel_uf} onChange={set('imovel_uf')} options={LISTA_UFS} />
          </tr>
          <tr>
            <L>Matrícula</L>
            <E value={data.imovel_matricula} onChange={set('imovel_matricula')} />
            <L>ORI (Registro de Imóveis)</L>
            <E value={data.imovel_ori} onChange={set('imovel_ori')} />
            <L>Coordenadas (Graus°, Min', S'')</L>
            <td className="bg-[#D9E1F2] border border-[#8ea0b4] px-0 py-0">
              <div className="flex items-center">
                <input value={data.imovel_coord_lat} onChange={e => set('imovel_coord_lat')(e.target.value)}
                  className="flex-1 bg-transparent text-[10px] outline-none px-1 py-[2px]" placeholder={"00°00'00\""} />
                <select value={data.imovel_coord_lat_hem} onChange={e => set('imovel_coord_lat_hem')(e.target.value)}
                  className="bg-white border-l border-[#8ea0b4] text-[9px] font-black px-1 py-[4px] outline-none cursor-pointer appearance-none min-w-[18px] text-center">
                  <option value="S">S</option>
                  <option value="N">N</option>
                </select>
              </div>
            </td>
            <td className="bg-[#D9E1F2] border border-[#8ea0b4] px-0 py-0">
              <div className="flex items-center">
                <input value={data.imovel_coord_lon} onChange={e => set('imovel_coord_lon')(e.target.value)}
                  className="flex-1 bg-transparent text-[10px] outline-none px-1 py-[2px]" placeholder={"00°00'00\""} />
                <select value={data.imovel_coord_lon_hem} onChange={e => set('imovel_coord_lon_hem')(e.target.value)}
                  className="bg-white border-l border-[#8ea0b4] text-[9px] font-black px-1 py-[4px] outline-none cursor-pointer appearance-none min-w-[18px] text-center">
                  <option value="W">W</option>
                  <option value="E">E</option>
                </select>
              </div>
            </td>
            <L>Construtora (se houver)</L>
            <E value={data.imovel_construtora} onChange={set('imovel_construtora')} />
            <L>CNPJ</L>
            <E value={data.imovel_construtora_cnpj} onChange={set('imovel_construtora_cnpj')} />
            <L>Finalidade</L>
            <S value={data.imovel_finalidade} onChange={set('imovel_finalidade')} options={LISTA_FINALIDADE} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

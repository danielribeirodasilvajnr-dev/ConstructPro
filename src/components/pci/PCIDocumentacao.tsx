import React from 'react';
import { PCIFormData } from '../../lib/pciData';

interface Props {
  data: PCIFormData;
  onChange: (patch: Partial<PCIFormData>) => void;
}

export function PCIDocumentacao({ data, onChange }: Props) {
  const set = (field: keyof PCIFormData) => (v: string) => onChange({ [field]: v });

  const L_DOC = ({ children, colSpan = 1 }: { children: React.ReactNode; colSpan?: number }) => (
    <td className="bg-white border border-[#8ea0b4] px-2 py-[3px] text-[9px] font-medium text-slate-700" colSpan={colSpan}>{children}</td>
  );

  const S_STATUS = ({ value, field }: { value: string; field: keyof PCIFormData }) => {
    const isOk = value === 'Apresentado';
    const isFalta = value === 'Não apresentado';
    return (
      <td className={`border border-[#8ea0b4] px-0 py-0 w-[110px] relative ${isOk ? 'bg-[#C6EFCE] text-[#006100]' : isFalta ? 'bg-[#FFC7CE] text-[#9C0006]' : 'bg-[#D9E1F2] text-slate-400'}`}>
        <div className="relative flex items-center h-full">
          <select 
            value={value} 
            onChange={e => set(field)(e.target.value)}
            className="w-full bg-transparent text-[9px] font-black text-center outline-none cursor-pointer appearance-none pl-1 pr-4 py-[4px] z-10"
          >
            <option value="">(escolha)</option>
            <option value="Apresentado">Apresentado</option>
            <option value="Não apresentado">Não apresentado</option>
          </select>
          <div className="absolute right-0 top-0 bottom-0 w-[16px] bg-[#D1D7E2] border-l border-[#8ea0b4] flex items-center justify-center pointer-events-none z-0">
            <span className="text-[6px] text-slate-600">▼</span>
          </div>
        </div>
      </td>
    );
  };

  const L_GRAY = ({ children, w }: { children: React.ReactNode; w?: string }) => (
    <td className="bg-[#D6DCE4] border border-[#8ea0b4] px-2 py-[3px] text-[8px] font-bold text-slate-500" style={{ width: w }}>{children}</td>
  );

  const E_BLUE = ({ value, field, colSpan = 1 }: { value: string; field: keyof PCIFormData; colSpan?: number }) => (
    <td className="bg-[#D9E1F2] border border-[#8ea0b4] px-1 py-0" colSpan={colSpan}>
      <input type="text" value={value} onChange={e => set(field)(e.target.value)}
        className="w-full bg-transparent text-[10px] outline-none px-1 py-[2px] font-semibold" />
    </td>
  );

  return (
    <div className="space-y-0">
      <table className="w-full border-collapse table-fixed" style={{ minWidth: '950px' }}>
        <colgroup>
          <col style={{ width: '25%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '14%' }} />
        </colgroup>
        <tbody>
          <tr><td colSpan={6} className="bg-[#2F528F] px-3 py-1 border border-[#1a3a6e]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Documentação para Análise Técnica</span>
          </td></tr>
          <tr><td colSpan={6} className="bg-[#D9E1F2] px-3 py-0.5 border border-[#8ea0b4]">
            <span className="text-[9px] font-bold text-[#2F528F]">Documentação básica</span>
          </td></tr>

          {/* 1. Certidão */}
          <tr>
            <L_DOC>Certidão de Matrícula do Imóvel</L_DOC>
            <S_STATUS value={data.doc_certidao} field="doc_certidao" />
            <L_GRAY>Projeto Legal/Arquit. c/ divisões</L_GRAY>
            <S_STATUS value={data.doc_compl_selo} field="doc_compl_selo" />
            <td className="bg-white border border-[#8ea0b4]" colSpan={2}></td>
          </tr>

          {/* 2. Alvará */}
          <tr>
            <L_DOC>Alvará/Licença da Obra</L_DOC>
            <S_STATUS value={data.doc_alvara} field="doc_alvara" />
            <L_GRAY>Data de validade</L_GRAY>
            <E_BLUE value={data.doc_alvara_data} field="doc_alvara_data" />
            <L_GRAY>Terreno é próprio</L_GRAY>
            <td className="bg-[#D9E1F2] border-2 border-[#ED7D31] px-0 py-0 relative">
              <div className="relative flex items-center h-full">
                <select 
                  value={data.terreno_proprio} 
                  onChange={e => set('terreno_proprio')(e.target.value)}
                  className="w-full bg-transparent text-[9px] font-bold outline-none cursor-pointer appearance-none pl-2 pr-4 py-[4px] z-10"
                >
                  <option value="">(escolha)</option>
                  <option value="Sim">Sim</option>
                  <option value="Não (Aquisição)">Não (Aquisição)</option>
                </select>
                <div className="absolute right-0 top-0 bottom-0 w-[16px] bg-[#D1D7E2] border-l border-[#8ea0b4] flex items-center justify-center pointer-events-none z-0">
                  <span className="text-[6px] text-slate-600">▼</span>
                </div>
              </div>
            </td>
          </tr>

          {/* 3. ART Proj */}
          <tr>
            <L_DOC>ART/RRT/TRT de Proj. Arquitetura</L_DOC>
            <S_STATUS value={data.doc_art_proj} field="doc_art_proj" />
            <L_GRAY>Número</L_GRAY>
            <E_BLUE value={data.doc_art_proj_num} field="doc_art_proj_num" />
            <td className="bg-white border border-[#8ea0b4]" colSpan={2}></td>
          </tr>

          {/* 4. ART Exec */}
          <tr>
            <L_DOC>ART/RRT/TRT de Exec. de Obra</L_DOC>
            <S_STATUS value={data.doc_art_exec} field="doc_art_exec" />
            <L_GRAY>Número</L_GRAY>
            <E_BLUE value={data.doc_art_exec_num} field="doc_art_exec_num" />
            <td className="bg-white border border-[#8ea0b4]" colSpan={2}></td>
          </tr>

          {/* 5. Projeto Legal */}
          <tr>
            <L_DOC>Projeto Legal Aprovado</L_DOC>
            <td className="border border-[#8ea0b4] px-0 py-0 relative bg-[#D9E1F2]">
              <div className="relative flex items-center h-full">
                <select 
                  value={data.doc_proj_legal} 
                  onChange={e => set('doc_proj_legal')(e.target.value)}
                  className={`w-full bg-transparent text-[9px] font-black text-center outline-none cursor-pointer appearance-none pl-2 pr-4 py-[4px] z-10 ${
                    data.doc_proj_legal.startsWith('Apresentado') ? 'text-[#006100]' : 
                    data.doc_proj_legal === 'Não apresentado' ? 'text-[#9C0006]' : 'text-slate-400'
                  }`}
                >
                  <option value="">(escolha)</option>
                  <option value="Apresentado projeto aprovado">Apresentado projeto aprovado</option>
                  <option value="Apresentado comprovação de Aprovação Declaratória">Apresentado comprovação de Aprovação Declaratória</option>
                  <option value="Não apresentado">Não apresentado</option>
                </select>
                <div className="absolute right-0 top-0 bottom-0 w-[16px] bg-[#D1D7E2] border-l border-[#8ea0b4] flex items-center justify-center pointer-events-none z-0">
                  <span className="text-[6px] text-slate-600">▼</span>
                </div>
              </div>
            </td>
            <td className="bg-white border border-[#8ea0b4]" colSpan={4}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

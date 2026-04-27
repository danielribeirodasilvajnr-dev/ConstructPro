import React from 'react';
import { PCIFormData } from '../../lib/pciData';

interface Props {
  data: PCIFormData;
  onChange: (patch: Partial<PCIFormData>) => void;
}

export function PCIDocumentacao({ data, onChange }: Props) {
  const set = (field: keyof PCIFormData) => (v: string) => onChange({ [field]: v });

  const docs = [
    { id: 'doc_certidao', label: 'Certidão de Matrícula do Imóvel', field: 'doc_certidao' as keyof PCIFormData },
    { id: 'doc_alvara', label: 'Alvará/Licença da Obra', field: 'doc_alvara' as keyof PCIFormData, extra: 'doc_alvara_data' as keyof PCIFormData, extraLabel: 'Data de validade' },
    { id: 'doc_art_proj', label: 'ART/RRT/TRT de Proj. Arquitetura', field: 'doc_art_proj' as keyof PCIFormData, extra: 'doc_art_proj_num' as keyof PCIFormData, extraLabel: 'Número' },
    { id: 'doc_art_exec', label: 'ART/RRT/TRT de Exec. de Obra', field: 'doc_art_exec' as keyof PCIFormData, extra: 'doc_art_exec_num' as keyof PCIFormData, extraLabel: 'Número' },
    { id: 'doc_proj_legal', label: 'Projeto Legal Aprovado', field: 'doc_proj_legal' as keyof PCIFormData },
  ];

  return (
    <div className="space-y-0">
      <table className="w-full border-collapse">
        <tbody>
          <tr><td colSpan={6} className="bg-[#2F528F] px-3 py-1 border border-[#1a3a6e]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Documentação para Análise Técnica</span>
          </td></tr>
          <tr><td colSpan={6} className="bg-[#2F528F]/80 px-3 py-0.5 border border-[#1a3a6e]">
            <span className="text-[9px] font-bold text-white">Documentação básica</span>
          </td></tr>

          {/* Cabeçalho */}
          <tr className="bg-[#D6DCE4]">
            <td className="border border-[#8ea0b4] px-1 py-1 text-[8px] font-black text-slate-600 text-center w-14">Status</td>
            <td className="border border-[#8ea0b4] px-2 py-1 text-[8px] font-black text-slate-600">Documento</td>
            <td className="border border-[#8ea0b4] px-2 py-1 text-[8px] font-black text-slate-600 w-24">Info adicional</td>
            <td className="border border-[#8ea0b4] px-2 py-1 text-[8px] font-black text-slate-600" colSpan={2}>Proj. Legal/Arquit. c/ divisões</td>
            <td className="border border-[#8ea0b4] px-2 py-1 text-[8px] font-black text-slate-600 w-20">Terreno é próprio</td>
          </tr>

          {docs.map((doc, i) => {
            const status = (data as any)[doc.field] as string;
            const isOk = status === 'Sim';
            const isFalta = status === 'Falta';
            return (
              <tr key={doc.id}>
                <td
                  className={`border border-[#8ea0b4] px-1 py-[3px] text-[9px] font-black text-center cursor-pointer select-none ${isOk ? 'bg-[#C6EFCE] text-[#006100]' : isFalta ? 'bg-[#FFC7CE] text-[#9C0006]' : 'bg-[#D9E1F2] text-slate-400'}`}
                  onClick={() => set(doc.field)(isOk ? 'Falta' : isFalta ? '' : 'Sim')}
                >
                  {status || '—'}
                </td>
                <td className="bg-white border border-[#8ea0b4] px-2 py-[3px] text-[9px] font-medium text-slate-700">{doc.label}</td>
                {doc.extra ? (
                  <>
                    <td className="bg-[#D6DCE4] border border-[#8ea0b4] px-2 py-[3px] text-[8px] font-bold text-slate-500">{doc.extraLabel}</td>
                    <td className="bg-[#D9E1F2] border border-[#8ea0b4] px-1 py-0" colSpan={2}>
                      <input type="text" value={(data as any)[doc.extra] || ''}
                        onChange={e => set(doc.extra)(e.target.value)}
                        className="w-full bg-transparent text-[10px] outline-none px-1 py-[2px]" />
                    </td>
                  </>
                ) : (
                  <td className="bg-white border border-[#8ea0b4]" colSpan={3}></td>
                )}
                {i === 1 && (
                  <td className="bg-[#D9E1F2] border-2 border-[#ED7D31] px-1 py-0" rowSpan={4}>
                    <select value={data.terreno_proprio} onChange={e => set('terreno_proprio')(e.target.value)}
                      className="w-full bg-transparent text-[9px] font-bold outline-none cursor-pointer py-[2px]">
                      <option value="">(escolha)</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

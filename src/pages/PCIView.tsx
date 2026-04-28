import React, { useState, useCallback } from 'react';
import { FileText, Save, Download, Upload, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { PCIFormData, INITIAL_PCI_DATA } from '../lib/pciData';
import { PCIIdentificacao } from '../components/pci/PCIIdentificacao';
import { PCIDocumentacao } from '../components/pci/PCIDocumentacao';
import { PCIProjeto } from '../components/pci/PCIProjeto';
import { PCICustos } from '../components/pci/PCICustos';
import { PCICronograma } from '../components/pci/PCICronograma';
import * as XLSX from 'xlsx';

type AbaId = 'ident' | 'docs' | 'projeto' | 'custos' | 'cronograma';

const ABAS: { id: AbaId; label: string }[] = [
  { id: 'ident', label: 'Identificação' },
  { id: 'docs', label: 'Documentação' },
  { id: 'projeto', label: 'Projeto' },
  { id: 'custos', label: 'Custos' },
  { id: 'cronograma', label: 'Cronograma' },
];

export function PCIView() {
  const [activeTab, setActiveTab] = useState<AbaId>('ident');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PCIFormData>(() => {
    const saved = localStorage.getItem('pci_form_draft_v2');
    return saved ? JSON.parse(saved) : { ...INITIAL_PCI_DATA };
  });

  const handleChange = useCallback((patch: Partial<PCIFormData>) => {
    setData(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem('pci_form_draft_v2', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSave = () => {
    setLoading(true);
    localStorage.setItem('pci_form_draft_v2', JSON.stringify(data));
    setTimeout(() => setLoading(false), 500);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames.find(n => n.includes('Proposta')) || wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        const colToNum = (col: string) => {
          let num = 0;
          for (let i = 0; i < col.length; i++) {
            num = num * 26 + (col.charCodeAt(i) - 64);
          }
          return num;
        };

        const cells = Object.keys(ws)
          .filter(k => k[0] !== '!')
          .sort((a, b) => {
            const r1 = parseInt(a.replace(/[A-Z]+/, ''));
            const r2 = parseInt(b.replace(/[A-Z]+/, ''));
            if (r1 !== r2) return r1 - r2;
            const c1 = colToNum(a.match(/[A-Z]+/)![0]);
            const c2 = colToNum(b.match(/[A-Z]+/)![0]);
            return c1 - c2;
          });

        const findCell = (text: string, startAfter?: string) => {
          const search = text.toUpperCase().trim();
          let found = !startAfter;
          return cells.find(k => {
            if (startAfter && !found) {
              if (k === startAfter) found = true;
              return false;
            }
            const val = String(ws[k]?.v || '').toUpperCase().trim();
            return val.includes(search);
          });
        };

        const formatExcelDate = (val: any) => {
          if (typeof val === 'number' && val > 30000) {
            const date = XLSX.SSF.parse_date_code(val);
            return `${String(date.d).padStart(2, '0')}/${String(date.m).padStart(2, '0')}/${date.y}`;
          }
          return String(val || '').trim();
        };

        const getV = (label: string, afterCell?: string) => {
          const addr = findCell(label, afterCell);
          if (!addr) return { val: '', addr: '' };

          const row = addr.replace(/[A-Z]+/, '');
          const colMatch = addr.match(/[A-Z]+/)![0];
          const startIndex = colToNum(colMatch);

          const numToCol = (n: number) => {
            let s = "";
            while (n > 0) {
              let m = (n - 1) % 26;
              s = String.fromCharCode(65 + m) + s;
              n = Math.floor((n - m) / 26);
            }
            return s;
          };

          for (let i = startIndex + 1; i < startIndex + 50; i++) {
            const nextCol = numToCol(i);
            const raw = ws[nextCol + row]?.v;
            if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
              const valStr = String(raw).trim();
              if (valStr.toUpperCase() === String(ws[addr]?.v).toUpperCase()) continue;
              const cleaned = String(raw).replace(/\.$/, '').trim();
              return { val: formatExcelDate(cleaned), addr: addr };
            }
          }
          return { val: '', addr: addr };
        };

        const normalizeDoc = (val: string) => {
          const v = val.toUpperCase().trim();
          if (v.includes('APRESENTADO') || v.includes('SIM') || v === 'S' || v.includes('CONSTA')) return 'Apresentado';
          if (v.includes('NÃO') || v.includes('NAO') || v === 'N') return 'Não apresentado';
          return '';
        };

        const normalizeTerreno = (val: string) => {
          const v = val.toUpperCase().trim();
          if (v.includes('SIM') || v === 'S') return 'Sim';
          if (v.includes('NÃO') || v.includes('NAO') || v === 'N') return 'Não (Aquisição)';
          return '';
        };

        const normalizeLegal = (val: string) => {
          const v = val.toUpperCase().trim();
          if (v.includes('PROJETO APROVADO')) return 'Apresentado projeto aprovado';
          if (v.includes('DECLARATÓRIA')) return 'Apresentado comprovação de Aprovação Declaratória';
          if (v.includes('NÃO') || v.includes('NAO')) return 'Não apresentado';
          return '';
        };

        const resCert = getV('Certidão de Matrícula do Imóvel');
        const resProjA = getV('Projeto Legal/Arquit. c/ divisões');
        const resAlvara = getV('Alvará/Licença da Obra');
        const resProjL = getV('Projeto Legal Aprovado');
        const resArtP = getV('Proj. Arquitetura');
        const resNumP = getV('Número', resArtP.addr);
        const resArtE = getV('Exec. de Obra');
        const resNumE = getV('Número', resArtE.addr);

        handleChange({
          proponente_nome: getV('Nome do Proponente').val,
          proponente_cpf_cnpj: getV('CPF/CNPJ').val,
          imovel_endereco: getV('Endereço do Imóvel').val,

          doc_certidao: normalizeDoc(resCert.val),
          doc_proj_arquit: normalizeDoc(resProjA.val),
          doc_alvara: normalizeDoc(resAlvara.val),
          doc_alvara_data: getV('Data de validade').val,
          doc_art_proj: normalizeDoc(resArtP.val),
          doc_art_proj_num: resNumP.val,
          doc_art_exec: normalizeDoc(resArtE.val),
          doc_art_exec_num: resNumE.val,
          doc_proj_legal: normalizeLegal(resProjL.val),
          terreno_proprio: normalizeTerreno(getV('Terreno é próprio').val),

          area_coberta_padrao: getV('Área Coberta Padrão').val,
          area_terreno: getV('Área do Terreno').val,
          valor_terreno: getV('Valor do Terreno').val,
          executor_obra: getV('Executor da Obra').val,
          prazo_meses: getV('Prazo proposto').val,
          pct_pre_executado: getV('Obra Pré-Executado').val,
        });

        alert('Importação robusta concluída!');
      } catch (err) {
        console.error(err);
        alert('Erro ao processar o arquivo.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleClear = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados do formulário? Esta ação não pode ser desfeita.')) {
      setData({ ...INITIAL_PCI_DATA });
      localStorage.removeItem('pci_form_draft_v2');
      alert('Dados limpos com sucesso!');
    }
  };

  const custoTotal = data.custos.reduce((a, b) => a + b, 0);
  const bdi = custoTotal > 0 ? (data.bdi_pct * custoTotal) / 100 : 0;
  const totalAdic = data.servicos_adicionais.reduce((a, b) => a + b.custo, 0);
  const custoGeral = custoTotal + bdi + totalAdic;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      <input type="file" id="excel-upload-pci" className="hidden" accept=".xlsx,.xls,.xlsm"
        onChange={handleImportExcel} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#BCB5AC]">Planilha Digital</span>
          <h2 className="text-4xl font-black text-white tracking-tighter mt-1">PCI Digital</h2>
          {custoGeral > 0 && (
            <p className="text-sm font-bold text-emerald-400 mt-1">
              Custo Total: {custoGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => document.getElementById('excel-upload-pci')?.click()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-2 hover:bg-blue-500 transition-all active:scale-95 shadow-xl shadow-blue-900/20"
          >
            <Upload className="h-3.5 w-3.5" />
            Importar .xlsm
          </button>

          <button
            onClick={handleClear}
            className="px-4 py-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 font-bold text-xs flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-xl shadow-red-900/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpar Dados
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-[#BCB5AC] text-[#1C232E] font-bold text-xs flex items-center gap-2 hover:bg-white transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-black/20"
          >
            <Save className="h-3.5 w-3.5" />
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-white/5 overflow-hidden shadow-2xl text-black">
        <div className="p-4 sm:p-6 overflow-x-auto min-h-[500px] [&_input]:text-black [&_select]:text-black [&_textarea]:text-black" style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          {activeTab === 'ident' && <PCIIdentificacao data={data} onChange={handleChange} />}
          {activeTab === 'docs' && <PCIDocumentacao data={data} onChange={handleChange} />}
          {activeTab === 'projeto' && <PCIProjeto data={data} onChange={handleChange} />}
          {activeTab === 'custos' && <PCICustos data={data} onChange={handleChange} />}
          {activeTab === 'cronograma' && <PCICronograma data={data} onChange={handleChange} />}
        </div>

        <div className="flex items-center border-t border-[#B4B8BF] bg-[#E7E6E6] px-1 py-0.5 overflow-x-auto gap-0">
          {ABAS.map(aba => (
            <button
              key={aba.id}
              onClick={() => setActiveTab(aba.id)}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold border border-[#B4B8BF] border-b-0 rounded-t-sm transition-colors whitespace-nowrap",
                activeTab === aba.id
                  ? "bg-white text-slate-800 border-b-white -mb-px z-10 relative"
                  : "bg-[#D6DCE4] text-slate-500 hover:bg-[#E0E4EA] hover:text-slate-700"
              )}
            >
              {aba.label}
            </button>
          ))}
          <div className="flex-1 border-b border-[#B4B8BF]" />
        </div>
      </div>
    </div>
  );
}

import React, { useState, useCallback } from 'react';
import { FileText, Save, Download, Upload } from 'lucide-react';
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
        const g = (cell: string) => ws[cell]?.v ?? '';
        const gn = (cell: string) => {
          const v = ws[cell]?.v;
          return typeof v === 'number' ? v : parseFloat(String(v || '0').replace(',', '.'));
        };

        // Mapeamento de Custos (Itens 1 a 20)
        const custosImportados = Array.from({ length: 20 }, (_, i) => gn(`AP${101 + i}`));
        
        // Mapeamento de Cronograma (Etapas 0 a 24)
        const cronogramaImportado = Array.from({ length: 25 }, (_, i) => gn(`L${145 + i}`) * 100);

        handleChange({
          // Identificação
          proponente_nome: String(g('G44')),
          proponente_email: String(g('Y44')),
          proponente_cpf_cnpj: String(g('AK44')),
          proponente_telefone: String(g('AQ44')),
          rtp_nome: String(g('G47')),
          rtp_email: String(g('Q47')),
          rtp_conselho: String(g('AB47')),
          rtp_uf: String(g('AI47')),
          rtp_cpf: String(g('AK47')),
          rtp_telefone: String(g('AQ47')),
          rte_nome: String(g('G50')),
          rte_email: String(g('Q50')),
          rte_conselho: String(g('AB50')),
          rte_uf: String(g('AI50')),
          rte_cpf: String(g('AK50')),
          rte_telefone: String(g('AQ50')),
          
          // Imóvel e Documentação
          imovel_endereco: String(g('G54')),
          imovel_complemento: String(g('AJ54')),
          imovel_bairro: String(g('G56')),
          imovel_cep: String(g('V56')),
          imovel_municipio: String(g('AA56')),
          imovel_uf: String(g('AV56')),
          imovel_matricula: String(g('G58')),
          imovel_ori: String(g('M58')),
          imovel_finalidade: String(g('AQ58')),
          terreno_proprio: String(g('AJ58')),
          doc_certidao: String(g('G64')),
          doc_alvara: String(g('G67')),
          doc_alvara_data: String(g('Y67')),
          doc_art_proj: String(g('G70')),
          doc_art_proj_num: String(g('U70')),
          doc_art_exec: String(g('AB70')),
          doc_art_exec_num: String(g('AQ70')),
          doc_proj_legal: String(g('G68')),
          doc_proj_arquit: String(g('G69')),

          // Áreas
          area_coberta_padrao: String(g('G73')),
          area_permeavel: String(g('N73')),
          area_acessoria_coberta: String(g('U73')),
          area_terreno: String(g('AJ73')),
          valor_terreno: String(g('AQ73')),

          // Projeto e Memorial
          destinacao_imovel: String(g('G75')),
          sistema_construtivo: String(g('N75')),
          sistema_construtivo_outros: String(g('AG75')),
          num_datec: String(g('G77')),
          selo_casa_azul: String(g('G79')),
          padrao_acabamento: String(g('AG80')),
          cobertura_tipo: String(g('G83')),
          teto: String(g('K83')),
          pavtos: String(g('O83')),
          quartos: String(g('Q83')),
          suites: String(g('S83')),
          salas: String(g('U83')),
          vagas: String(g('W83')),
          tipo_vagas: String(g('Y83')),
          acabamento_paredes_ext: String(g('G87')),
          loucas_metais: String(g('O87')),
          area_servico: String(g('U87')),
          cozinha: String(g('Y87')),
          agua_quente: String(g('AC87')),
          acabamento_paredes_int: String(g('G91')),
          paredes_areas_secas: String(g('O91')),
          calefacao: String(g('U91')),
          sustentabilidade: String(g('Y91')),
          implantacao: String(g('AC91')),
          revest_paredes_molhadas: String(g('G95')),
          revest_piso_secas: String(g('M95')),
          revest_piso_molhadas: String(g('S95')),
          divisao_interna: String(g('Y95')),

          // Custos
          custos: custosImportados,
          bdi_pct: gn('AI122') * 100,
          executor_obra: String(g('G122')),

          // Cronograma
          prazo_meses: String(g('O142')),
          pct_pre_executado: String(g('AK142')),
          cronograma_pct: cronogramaImportado,
        });
        alert('PCI completa importada com sucesso!');
      } catch (err) {
        console.error(err);
        alert('Erro ao processar o arquivo.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Custo total calculado para exibição no header
  const custoTotal = data.custos.reduce((a, b) => a + b, 0);
  const bdi = custoTotal > 0 ? (data.bdi_pct * custoTotal) / 100 : 0;
  const totalAdic = data.servicos_adicionais.reduce((a, b) => a + b.custo, 0);
  const custoGeral = custoTotal + bdi + totalAdic;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      {/* Hidden File Input */}
      <input type="file" id="excel-upload-pci" className="hidden" accept=".xlsx,.xls,.xlsm"
        onChange={handleImportExcel} />

      {/* Header */}
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
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-[#BCB5AC] text-[#1C232E] font-bold text-xs flex items-center gap-2 hover:bg-white transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-black/20"
          >
            <Save className="h-3.5 w-3.5" />
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Conteúdo da planilha */}
      <div className="bg-white rounded-2xl border border-white/5 overflow-hidden shadow-2xl text-black">
        {/* Área da planilha */}
        <div className="p-4 sm:p-6 overflow-x-auto min-h-[500px] [&_input]:text-black [&_select]:text-black [&_textarea]:text-black" style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          {activeTab === 'ident' && <PCIIdentificacao data={data} onChange={handleChange} />}
          {activeTab === 'docs' && <PCIDocumentacao data={data} onChange={handleChange} />}
          {activeTab === 'projeto' && <PCIProjeto data={data} onChange={handleChange} />}
          {activeTab === 'custos' && <PCICustos data={data} onChange={handleChange} />}
          {activeTab === 'cronograma' && <PCICronograma data={data} onChange={handleChange} />}
        </div>

        {/* Abas do Excel (parte inferior) */}
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

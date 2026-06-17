import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { InventoryMaterial, BudgetItem, Project } from '../../lib/types';
import { X, Upload, FileCode2, Check, AlertCircle } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

interface XmlImporterModalProps {
  projectId: string;
  materials: InventoryMaterial[];
  budgetItems: BudgetItem[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedXmlItem {
  id: string;
  originalName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  
  // Mapeamento feito pelo usuário
  action: 'create_new' | 'link_existing' | 'ignore';
  linkedMaterialId?: string;
  newCategory: string;
}

interface ParsedInvoice {
  supplier: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  items: ParsedXmlItem[];
}

export function XmlImporterModal({ projectId, materials, budgetItems, onClose, onSuccess }: XmlImporterModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [invoice, setInvoice] = useState<ParsedInvoice | null>(null);
  const [selectedBudgetItemId, setSelectedBudgetItemId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' as 'error' | 'success' });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        // Validação básica se é NFe
        const infNFe = xmlDoc.getElementsByTagName('infNFe')[0];
        if (!infNFe) throw new Error('O arquivo não parece ser um XML válido de Nota Fiscal Eletrônica (NFe).');

        // Extrair Cabeçalho
        const emit = xmlDoc.getElementsByTagName('emit')[0];
        const supplierName = emit?.getElementsByTagName('xNome')[0]?.textContent || 'Fornecedor Desconhecido';
        
        const ide = xmlDoc.getElementsByTagName('ide')[0];
        const invoiceNumber = ide?.getElementsByTagName('nNF')[0]?.textContent || '';
        
        const dhEmi = ide?.getElementsByTagName('dhEmi')[0]?.textContent || '';
        const date = dhEmi ? dhEmi.substring(0, 10) : new Date().toISOString().substring(0, 10);

        // Extrair Totais
        const total = xmlDoc.getElementsByTagName('total')[0];
        const vNF = total?.getElementsByTagName('vNF')[0]?.textContent || '0';
        const totalAmount = parseFloat(vNF);

        // Extrair Produtos
        const detElements = xmlDoc.getElementsByTagName('det');
        const items: ParsedXmlItem[] = [];

        for (let i = 0; i < detElements.length; i++) {
          const det = detElements[i];
          const prod = det.getElementsByTagName('prod')[0];
          
          if (prod) {
            const xProd = prod.getElementsByTagName('xProd')[0]?.textContent || 'Produto sem nome';
            const qCom = parseFloat(prod.getElementsByTagName('qCom')[0]?.textContent || '0');
            const uCom = prod.getElementsByTagName('uCom')[0]?.textContent || 'UN';
            const vUnCom = parseFloat(prod.getElementsByTagName('vUnCom')[0]?.textContent || '0');
            const vProd = parseFloat(prod.getElementsByTagName('vProd')[0]?.textContent || '0');

            // Tentar auto-mapear buscando nome similar no catálogo
            const normalizedProdName = xProd.toLowerCase().trim();
            const matchedMaterial = materials.find(m => 
              m.description.toLowerCase().trim() === normalizedProdName ||
              normalizedProdName.includes(m.description.toLowerCase().trim())
            );

            items.push({
              id: `item-${i}`,
              originalName: xProd,
              quantity: qCom,
              unit: uCom,
              unitPrice: vUnCom,
              totalPrice: vProd,
              action: matchedMaterial ? 'link_existing' : 'create_new',
              linkedMaterialId: matchedMaterial?.id,
              newCategory: 'Geral'
            });
          }
        }

        setInvoice({
          supplier: supplierName,
          invoiceNumber,
          date,
          totalAmount,
          items
        });

      } catch (err: any) {
        setAlertConfig({ isOpen: true, title: 'Erro de Leitura', message: err.message, type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const updateItem = (id: string, updates: Partial<ParsedXmlItem>) => {
    if (!invoice) return;
    setInvoice({
      ...invoice,
      items: invoice.items.map(item => item.id === id ? { ...item, ...updates } : item)
    });
  };

  const handleConfirm = async () => {
    if (!invoice) return;
    if (!selectedBudgetItemId) {
      setAlertConfig({ isOpen: true, title: 'Atenção', message: 'Selecione um Item do Orçamento (EAP) para vincular a despesa financeira gerada por esta nota fiscal.', type: 'error' });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Usuário não autenticado');

      // 1. Processar itens do estoque
      for (const item of invoice.items) {
        if (item.action === 'ignore') continue;

        let finalMaterialId = item.linkedMaterialId;

        // Se marcou para criar novo material
        if (item.action === 'create_new') {
          const { data: newMat, error: matError } = await supabase.from('inventory_materials').insert({
            project_id: projectId,
            description: item.originalName,
            category: item.newCategory,
            unit: item.unit,
            current_stock: 0
          }).select().single();

          if (matError) throw matError;
          finalMaterialId = newMat.id;
        }

        if (!finalMaterialId) throw new Error(`Falha ao identificar material para o item: ${item.originalName}`);

        // Criar Movimentação de Entrada
        const { error: movError } = await supabase.from('inventory_movements').insert({
          project_id: projectId,
          material_id: finalMaterialId,
          type: 'in',
          date: invoice.date,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          supplier: invoice.supplier,
          invoice_number: invoice.invoiceNumber,
          notes: 'Importado via XML',
          created_by: userId
        });

        if (movError) throw movError;
      }

      // 2. Lançar o consolidado no Financeiro
      const activeItems = invoice.items.filter(i => i.action !== 'ignore');
      const financialTotal = activeItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

      if (financialTotal > 0) {
        const { error: finError } = await supabase.from('financial_items').insert({
          project_id: projectId,
          date: invoice.date,
          description: `NF ${invoice.invoiceNumber} - ${invoice.supplier}`,
          amount: financialTotal,
          category: 'Material',
          supplier: invoice.supplier,
          budget_item_linked_id: selectedBudgetItemId,
          observations: 'Lançamento gerado automaticamente via importação de XML no almoxarifado.'
        });
        
        if (finError) throw finError;
      }

      setAlertConfig({ isOpen: true, title: 'Sucesso!', message: 'Nota fiscal importada com sucesso. Estoque e Financeiro atualizados.', type: 'success' });
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setAlertConfig({ isOpen: true, title: 'Erro ao Salvar', message: err.message, type: 'error' });
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-container-low/95 backdrop-blur-md" onClick={() => !isProcessing && onClose()} />
      
      <div className="relative bg-surface rounded-[32px] shadow-2xl border border-outline w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-outline shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <FileCode2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-on-surface uppercase tracking-tight">Importar XML NFe</h3>
              <p className="text-xs text-on-surface-variant">Automatize a entrada de estoque e o lançamento financeiro</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-surface-container-high rounded-full transition-colors disabled:opacity-50">
            <X className="h-5 w-5 text-on-surface-variant" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          
          {!invoice ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center border border-outline">
                <Upload className="h-10 w-10 text-on-surface-variant" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-bold text-on-surface mb-2">Selecione o arquivo XML</h4>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
                  Faça o upload do arquivo .xml da sua Nota Fiscal Eletrônica. O sistema vai extrair os itens para você revisar.
                </p>
                <input
                  type="file"
                  accept=".xml"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-primary text-background text-sm font-bold uppercase tracking-[2px] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  Procurar Arquivo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Invoice Summary */}
              <div className="bg-surface-container-low rounded-2xl border border-outline p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Fornecedor</span>
                  <p className="font-bold text-on-surface truncate">{invoice.supplier}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Nota Fiscal</span>
                  <p className="font-bold text-on-surface">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Data Emissão</span>
                  <p className="font-bold text-on-surface">{new Date(invoice.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Valor Total (Lido do XML)</span>
                  <p className="font-bold text-emerald-500">{formatCurrency(invoice.totalAmount)}</p>
                </div>
              </div>

              {/* Finance Configuration */}
              <div className="bg-surface border border-primary/30 p-6 rounded-2xl space-y-4 shadow-[0_0_15px_rgba(34,255,136,0.05)]">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-on-surface mb-1">Lançamento Financeiro Automático</h4>
                    <p className="text-xs text-on-surface-variant">O valor total da nota será lançado no módulo Controle de Custos. Selecione em qual item do orçamento esta despesa deve ser apropriada.</p>
                  </div>
                </div>
                <div>
                  <select
                    value={selectedBudgetItemId}
                    onChange={e => setSelectedBudgetItemId(e.target.value)}
                    className="w-full md:w-1/2 bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none appearance-none"
                  >
                    <option value="">-- Selecione o Item do Orçamento (EAP) --</option>
                    {budgetItems.filter(i => i.category.toLowerCase() !== 'mão de obra').map(item => (
                      <option key={item.id} value={item.id}>{item.code} - {item.description}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Matching Table */}
              <div>
                <h4 className="font-display font-bold uppercase tracking-widest text-on-surface mb-4">Revisão dos Itens ({invoice.items.length})</h4>
                <div className="border border-outline rounded-[24px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-surface-container-high/50 border-b border-outline">
                          <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Produto na NFe</th>
                          <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Qtd</th>
                          <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ação / De-Para no Catálogo</th>
                          <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Valor Unit.</th>
                          <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map(item => (
                          <tr key={item.id} className={cn("border-b border-outline/50 transition-colors", item.action === 'ignore' ? 'opacity-50 bg-surface-container-low' : 'hover:bg-white/5')}>
                            <td className="p-4">
                              <p className="font-bold text-sm text-on-surface line-clamp-2" title={item.originalName}>{item.originalName}</p>
                            </td>
                            <td className="p-4 text-sm font-bold text-on-surface">{item.quantity} <span className="text-xs font-normal text-on-surface-variant">{item.unit}</span></td>
                            <td className="p-4">
                              <div className="flex gap-2 items-center">
                                <select
                                  value={item.action}
                                  onChange={e => updateItem(item.id, { action: e.target.value as any })}
                                  className="bg-surface-container-low border border-outline rounded-lg px-2 py-1.5 text-xs text-on-surface outline-none w-32 shrink-0"
                                >
                                  <option value="create_new">Criar Novo</option>
                                  <option value="link_existing">Vincular</option>
                                  <option value="ignore">Ignorar</option>
                                </select>
                                
                                {item.action === 'link_existing' && (
                                  <select
                                    value={item.linkedMaterialId || ''}
                                    onChange={e => updateItem(item.id, { linkedMaterialId: e.target.value })}
                                    className="bg-surface-container-low border border-outline rounded-lg px-2 py-1.5 text-xs text-primary outline-none flex-1 truncate max-w-[200px]"
                                  >
                                    <option value="">Selecione...</option>
                                    {materials.map(m => <option key={m.id} value={m.id}>{m.description}</option>)}
                                  </select>
                                )}
                                
                                {item.action === 'create_new' && (
                                  <select
                                    value={item.newCategory}
                                    onChange={e => updateItem(item.id, { newCategory: e.target.value })}
                                    className="bg-surface-container-low border border-outline rounded-lg px-2 py-1.5 text-xs text-on-surface outline-none flex-1 truncate max-w-[150px]"
                                  >
                                    <option value="Geral">Cat: Geral</option>
                                    <option value="Cimento">Cat: Cimento</option>
                                    <option value="Aço">Cat: Aço</option>
                                    <option value="Hidráulica">Cat: Hidráulica</option>
                                    <option value="Elétrica">Cat: Elétrica</option>
                                  </select>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-on-surface">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-4 text-sm font-bold text-on-surface">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-outline shrink-0 flex justify-end gap-4 bg-surface-container-low">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-widest hover:bg-surface transition-colors rounded-xl"
          >
            Cancelar
          </button>
          {invoice && (
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="px-8 py-3 bg-primary text-background text-xs font-bold uppercase tracking-[2px] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isProcessing ? (
                <>Processando...</>
              ) : (
                <><Check className="h-4 w-4" /> Confirmar e Salvar</>
              )}
            </button>
          )}
        </div>

      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => {
          setAlertConfig({ ...alertConfig, isOpen: false });
          if (alertConfig.type === 'success') {
            onSuccess();
          }
        }}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { ComComposition } from '../../lib/types';
import { Plus, Search, Edit, Trash2, Calculator, Upload, Download } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { ConfirmModal } from '../ui/ConfirmModal';

export function CompositionsManager() {
  const { user } = useAuth();
  const [compositions, setCompositions] = useState<ComComposition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ComComposition | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Message Modal State
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessageModal({ isOpen: true, title, message, type });
  };

  // SINAPI Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'generic' | 'sinapi'>('sinapi');
  const [sinapiType, setSinapiType] = useState('CCD'); // CCD = Com Desoneração, CSD = Sem Desoneração
  const [sinapiState, setSinapiState] = useState('SP');
  const [importFile, setImportFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Form State
  const [itemType, setItemType] = useState<'service' | 'material' | 'equipment'>('service');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('un');
  const [materialCost, setMaterialCost] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [equipmentCost, setEquipmentCost] = useState(0);
  const [thirdPartyCost, setThirdPartyCost] = useState(0);

  useEffect(() => {
    fetchCompositions();
  }, [user]);

  const fetchCompositions = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('com_compositions')
      .select('*')
      .eq('user_id', user.id)
      .order('code');
      
    if (error) {
      console.error('Error fetching compositions:', error);
    } else {
      setCompositions(data || []);
    }
    setLoading(false);
  };

  const openNewModal = () => {
    setEditingItem(null);
    setItemType('service');
    setCode('');
    setDescription('');
    setUnit('un');
    setMaterialCost(0);
    setLaborCost(0);
    setEquipmentCost(0);
    setThirdPartyCost(0);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ComComposition) => {
    setEditingItem(item);
    setItemType(item.material_cost > 0 && item.labor_cost === 0 ? 'material' : item.equipment_cost > 0 ? 'equipment' : 'service');
    setCode(item.code || '');
    setDescription(item.description);
    setUnit(item.unit);
    setMaterialCost(item.material_cost);
    setLaborCost(item.labor_cost);
    setEquipmentCost(item.equipment_cost);
    setThirdPartyCost(item.third_party_cost);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const itemData = {
      user_id: user.id,
      code,
      description,
      unit,
      material_cost: itemType === 'material' ? materialCost : 0,
      labor_cost: itemType === 'service' ? laborCost : 0,
      equipment_cost: itemType === 'equipment' ? equipmentCost : 0,
      third_party_cost: 0,
      updated_at: new Date().toISOString()
    };

    if (editingItem) {
      const { error } = await supabase
        .from('com_compositions')
        .update(itemData)
        .eq('id', editingItem.id);
      if (error) showMessage('Erro', 'Erro ao atualizar composição: ' + error.message, 'error');
    } else {
      const { error } = await supabase
        .from('com_compositions')
        .insert([{ ...itemData, created_at: new Date().toISOString() }]);
      if (error) showMessage('Erro', 'Erro ao criar composição: ' + error.message, 'error');
    }

    setIsModalOpen(false);
    fetchCompositions();
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    if (itemToDelete === 'ALL') {
      const { error } = await supabase.from('com_compositions').delete().eq('user_id', user?.id);
      if (error) showMessage('Erro', 'Erro ao limpar banco: ' + error.message, 'error');
      else {
        fetchCompositions();
        showMessage('Sucesso', 'Banco de preços limpo com sucesso.', 'success');
      }
    } else {
      const { error } = await supabase.from('com_compositions').delete().eq('id', itemToDelete);
      if (error) showMessage('Erro', 'Erro ao excluir: ' + error.message, 'error');
      else fetchCompositions();
    }
    
    setItemToDelete(null);
  };

  const handleDeleteAllClick = () => {
    setItemToDelete('ALL');
    setIsDeleteModalOpen(true);
  };

  // Funções de importação movidas para o Web Worker (excelWorker.ts) para não travar a UI

  const confirmImport = async () => {
    if (!importFile || !user) return;
    setIsImportModalOpen(false);
    setIsImporting(true);

    // Dá um tempo para o modal fechar e o botão de carregamento aparecer
    await new Promise(resolve => setTimeout(resolve, 100));

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Pausa antes do processamento pesado do Excel
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        
        const worker = new Worker(new URL('../../workers/excelWorker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = async (e) => {
          worker.terminate();
          const { error, success, itemsToInsert } = e.data;
          
          if (error) {
            showMessage('Erro na Importação', error, 'error');
            setIsImporting(false);
            setImportFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }

          if (success && itemsToInsert) {
            const chunkSize = 500;
            for (let i = 0; i < itemsToInsert.length; i += chunkSize) {
              const chunk = itemsToInsert.slice(i, i + chunkSize);
              await supabase.from('com_compositions').insert(chunk);
              // Pequena pausa para manter a UI responsiva durante o envio para o DB
              await new Promise(resolve => setTimeout(resolve, 10));
            }

            showMessage('Importação Concluída', `Foram importados e salvos ${itemsToInsert.length} itens com sucesso!`, 'success');
            fetchCompositions();
            setIsImporting(false);
            setImportFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          showMessage('Erro Fatal', 'Erro interno no processador de planilhas.', 'error');
          setIsImporting(false);
          setImportFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        };

        worker.postMessage({
          data,
          mode: importMode,
          sinapiType,
          sinapiState,
          userId: user.id
        });

      } catch (err) {
        console.error(err);
        showMessage('Erro Fatal', 'Erro ao processar arquivo Excel. Certifique-se de que é uma planilha válida.', 'error');
      } finally {
        setIsImporting(false);
        setImportFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      showMessage('Erro de Leitura', 'Erro ao ler o arquivo selecionado.', 'error');
      setIsImporting(false);
      setImportFile(null);
    };
    reader.readAsArrayBuffer(importFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setIsImportModalOpen(true);
    }
  };

  const filteredCompositions = compositions.filter(c => 
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredCompositions.length / itemsPerPage);
  const paginatedCompositions = filteredCompositions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant/50" />
          <input
            type="text"
            placeholder="Buscar composições..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low border border-outline rounded-2xl pl-12 pr-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={handleDeleteAllClick}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-error/10 hover:bg-error/20 text-error font-bold text-xs uppercase tracking-[2px] rounded-2xl transition-all"
          >
            <Trash2 className="h-4 w-4" />
            Limpar Banco
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-surface-container-highest hover:bg-outline/50 border border-outline text-on-surface font-bold text-xs uppercase tracking-[2px] rounded-2xl transition-all disabled:opacity-50"
          >
            {isImporting ? (
              <div className="h-4 w-4 border-2 border-on-surface/20 border-t-on-surface rounded-full animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Importar Planilha
          </button>
          <button
            onClick={openNewModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background font-bold text-xs uppercase tracking-[2px] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            Nova
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredCompositions.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low border border-outline rounded-[32px]">
          <Calculator className="h-12 w-12 text-on-surface-variant/50 mx-auto mb-4" />
          <p className="text-on-surface-variant font-display">Nenhuma composição encontrada.</p>
        </div>
      ) : (
        <div className="bg-surface-container-low border border-outline rounded-[24px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline bg-background/20">
                  <th className="py-4 px-6 text-xs font-display text-on-surface-variant uppercase tracking-[2px]">Código</th>
                  <th className="py-4 px-6 text-xs font-display text-on-surface-variant uppercase tracking-[2px]">Descrição</th>
                  <th className="py-4 px-6 text-xs font-display text-on-surface-variant uppercase tracking-[2px]">Unid</th>
                  <th className="py-4 px-6 text-xs font-display text-on-surface-variant uppercase tracking-[2px] text-right">Material</th>
                  <th className="py-4 px-6 text-xs font-display text-on-surface-variant uppercase tracking-[2px] text-right">Mão de Obra</th>
                  <th className="py-4 px-6 text-xs font-display text-on-surface-variant uppercase tracking-[2px] text-right">Equip.</th>
                  <th className="py-4 px-6 text-xs font-display text-on-surface-variant uppercase tracking-[2px] text-right">Terceiros</th>
                  <th className="py-4 px-6 text-xs font-display text-on-surface-variant uppercase tracking-[2px] text-right">Custo Total</th>
                  <th className="py-4 px-6 text-xs font-display text-on-surface-variant uppercase tracking-[2px] text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompositions.map((comp) => (
                  <tr key={comp.id} className="border-b border-outline last:border-0 hover:bg-surface-container-highest transition-colors group">
                    <td className="py-4 px-6 font-display text-sm text-on-surface-variant">{comp.code || '-'}</td>
                    <td className="py-4 px-6 font-display text-sm text-on-surface">{comp.description}</td>
                    <td className="py-4 px-6 font-display text-sm text-on-surface-variant uppercase">{comp.unit}</td>
                    <td className="py-4 px-6 font-display text-sm text-on-surface-variant text-right">{formatCurrency(comp.material_cost)}</td>
                    <td className="py-4 px-6 font-display text-sm text-on-surface-variant text-right">{formatCurrency(comp.labor_cost)}</td>
                    <td className="py-4 px-6 font-display text-sm text-on-surface-variant text-right">{formatCurrency(comp.equipment_cost)}</td>
                    <td className="py-4 px-6 font-display text-sm text-on-surface-variant text-right">{formatCurrency(comp.third_party_cost)}</td>
                    <td className="py-4 px-6 font-display font-bold text-primary text-right">{formatCurrency(comp.total_cost || 0)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(comp)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(comp.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-outline bg-surface-container-lowest">
              <span className="text-sm text-on-surface-variant">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} até {Math.min(currentPage * itemsPerPage, filteredCompositions.length)} de {filteredCompositions.length} itens
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-outline text-sm font-bold text-on-surface hover:bg-surface-container disabled:opacity-50 transition-colors"
                >
                  Anterior
                </button>
                <span className="text-sm font-bold text-on-surface px-4 py-2 bg-surface-container rounded-xl">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-outline text-sm font-bold text-on-surface hover:bg-surface-container disabled:opacity-50 transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface border border-outline rounded-[32px] p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-display font-bold text-on-surface mb-6">
              {editingItem ? 'Editar Composição' : 'Nova Composição'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2 font-bold">Tipo do Item</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setItemType('service')}
                    className={cn(
                      "py-2 rounded-xl border text-[10px] font-bold uppercase tracking-[1px] transition-all",
                      itemType === 'service' ? "bg-primary/10 border-primary text-primary" : "bg-surface-container border-outline text-on-surface-variant hover:border-outline/50"
                    )}
                  >
                    Serviço
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemType('material')}
                    className={cn(
                      "py-2 rounded-xl border text-[10px] font-bold uppercase tracking-[1px] transition-all",
                      itemType === 'material' ? "bg-primary/10 border-primary text-primary" : "bg-surface-container border-outline text-on-surface-variant hover:border-outline/50"
                    )}
                  >
                    Material
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemType('equipment')}
                    className={cn(
                      "py-2 rounded-xl border text-[10px] font-bold uppercase tracking-[1px] transition-all",
                      itemType === 'equipment' ? "bg-primary/10 border-primary text-primary" : "bg-surface-container border-outline text-on-surface-variant hover:border-outline/50"
                    )}
                  >
                    Equipamento
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                    Código (Opcional)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex: 01.01"
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                    Descrição
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Limpeza do Terreno"
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs font-display text-on-surface-variant uppercase tracking-[2px] mb-2">
                    Unidade
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Ex: m2, un, m3"
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-outline">
                {itemType === 'material' && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2">Custo Material</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={materialCost}
                      onChange={e => setMaterialCost(parseFloat(e.target.value))}
                      className="w-full bg-surface-container-lowest border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-all"
                    />
                  </div>
                )}

                {itemType === 'service' && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2">Custo M. Obra</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={laborCost}
                      onChange={e => setLaborCost(parseFloat(e.target.value))}
                      className="w-full bg-surface-container-lowest border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-all"
                    />
                  </div>
                )}

                {itemType === 'equipment' && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2">Custo Equip.</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={equipmentCost}
                      onChange={e => setEquipmentCost(parseFloat(e.target.value))}
                      className="w-full bg-surface-container-lowest border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-outline">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 font-display font-bold text-xs uppercase tracking-[2px] text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-primary text-background font-display font-bold text-xs uppercase tracking-[2px] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {editingItem ? 'Salvar Alterações' : 'Cadastrar Composição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={itemToDelete === 'ALL' ? "Limpar Banco de Composições" : "Excluir Composição"}
        message={itemToDelete === 'ALL' 
          ? "ATENÇÃO: Você está prestes a apagar TODAS as composições do sistema. Esta ação não pode ser desfeita!" 
          : "Tem certeza que deseja excluir esta composição do seu banco de preços? Esta ação não pode ser desfeita."}
        confirmText={itemToDelete === 'ALL' ? "LIMPAR TUDO" : "Excluir"}
      />

      {/* Modal de Importação SINAPI */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface border border-outline rounded-[32px] p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-xl font-display font-bold text-on-surface mb-6 flex items-center gap-3">
              <Upload className="h-6 w-6 text-primary" />
              Configurar Importação
            </h2>
            
            <p className="text-sm text-on-surface-variant mb-6">
              O arquivo <strong>{importFile?.name}</strong> foi selecionado. Como você quer importar os dados?
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-3 font-bold">Tipo da Planilha</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setImportMode('sinapi')}
                    className={cn(
                      "px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-[1px] transition-all",
                      importMode === 'sinapi' ? "bg-primary/10 border-primary text-primary" : "bg-surface-container-low border-outline text-on-surface-variant hover:text-on-surface hover:border-outline/50"
                    )}
                  >
                    SINAPI Nacional Oficial
                  </button>
                  <button 
                    onClick={() => setImportMode('generic')}
                    className={cn(
                      "px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-[1px] transition-all",
                      importMode === 'generic' ? "bg-primary/10 border-primary text-primary" : "bg-surface-container-low border-outline text-on-surface-variant hover:text-on-surface hover:border-outline/50"
                    )}
                  >
                    Planilha Genérica Própria
                  </button>
                </div>
              </div>

              {importMode === 'sinapi' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2">Aba / Tipo (Desoneração)</label>
                    <select 
                      value={sinapiType} 
                      onChange={e => setSinapiType(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-all"
                    >
                      <option value="CCD">Composições Com Desoneração (CCD)</option>
                      <option value="CSD">Composições Sem Desoneração (CSD)</option>
                      <option value="ICD">Insumos Com Desoneração (ICD)</option>
                      <option value="ISD">Insumos Sem Desoneração (ISD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[2px] text-on-surface-variant mb-2">Seu Estado (UF)</label>
                    <select 
                      value={sinapiState} 
                      onChange={e => setSinapiState(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-all"
                    >
                      {BRAZILIAN_STATES.map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-6 mt-8 border-t border-outline">
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }} 
                className="px-6 py-3 font-bold text-xs uppercase tracking-[2px] text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmImport} 
                disabled={isImporting}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-background font-bold text-xs uppercase tracking-[2px] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isImporting ? (
                  <div className="h-4 w-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4" />
                )}
                Processar Importação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface border border-outline rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center text-center">
            
            <div className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center mb-6",
              messageModal.type === 'success' ? "bg-primary/20 text-primary" : 
              messageModal.type === 'error' ? "bg-error/20 text-error" : 
              "bg-surface-container-high text-on-surface"
            )}>
              {messageModal.type === 'success' && (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {messageModal.type === 'error' && (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {messageModal.type === 'info' && (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <h2 className="text-xl font-display font-bold text-on-surface mb-2">
              {messageModal.title}
            </h2>
            
            <p className="text-sm text-on-surface-variant mb-8 whitespace-pre-line">
              {messageModal.message}
            </p>

            <button 
              onClick={() => setMessageModal({ ...messageModal, isOpen: false })}
              className="w-full py-4 bg-surface-container-highest hover:bg-outline/50 border border-outline text-on-surface font-bold text-xs uppercase tracking-[2px] rounded-2xl transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

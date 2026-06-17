import React, { useState } from 'react';
import { useInventory } from '../../hooks/useInventory';
import { useProjectData } from '../../hooks/useProjectData';
import { Project, InventoryMovement, InventoryMaterial, InventoryEmployee } from '../../lib/types';
import { ArrowDownToLine, ArrowUpFromLine, Package, RefreshCw, Plus, Search, Filter, X, AlertCircle, FileCode2 } from 'lucide-react';
import { AlertModal } from '../ui/AlertModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { XmlImporterModal } from './XmlImporterModal';
import { cn } from '../../lib/utils';

interface InventoryMovementsProps {
  projectId: string;
  project: Project;
}

export function InventoryMovements({ projectId, project }: InventoryMovementsProps) {
  const { movements, materials, employees, saveMovement, deleteMovement, saveEmployee } = useInventory(projectId);
  const { budgetItems } = useProjectData(projectId);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'in' | 'out' | 'cautela' | 'adjustment'>('in');
  
  const [formData, setFormData] = useState<Partial<InventoryMovement>>({});
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('');
  
  const [deletingMovement, setDeletingMovement] = useState<InventoryMovement | null>(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' as 'error' | 'success' });

  const handleNew = (type: 'in' | 'out' | 'cautela' | 'adjustment') => {
    setModalType(type);
    setFormData({
      type,
      date: new Date().toISOString().split('T')[0],
      quantity: 0
    });
    setNewEmployeeName('');
    setNewEmployeeRole('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.material_id) throw new Error('Selecione um material');
      if (!formData.quantity || formData.quantity <= 0) throw new Error('A quantidade deve ser maior que zero');
      
      let payload = { ...formData };
      
      // Validações específicas
      if (modalType === 'out') {
        if (!payload.budget_item_id) throw new Error('Selecione o Item da Obra para a saída');
      }
      
      if (modalType === 'cautela') {
        if (!payload.employee_id && !newEmployeeName) {
          throw new Error('Selecione ou cadastre o funcionário para a cautela');
        }
        
        // Cadastrar novo funcionário se necessário
        if (!payload.employee_id && newEmployeeName) {
          const emp = await saveEmployee({ name: newEmployeeName, role: newEmployeeRole || 'Não informado', project_id: projectId });
          payload.employee_id = emp.id;
        }
      }

      await saveMovement(payload);
      setIsModalOpen(false);
      setAlertConfig({ isOpen: true, title: 'Sucesso', message: 'Movimentação registrada!', type: 'success' });
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (deletingMovement) {
      try {
        await deleteMovement(deletingMovement.id);
        setDeletingMovement(null);
        setAlertConfig({ isOpen: true, title: 'Sucesso', message: 'Movimentação excluída e saldo atualizado.', type: 'success' });
      } catch (err: any) {
        setDeletingMovement(null);
        setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
      }
    }
  };

  const filteredMovements = movements.filter(m => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const materialName = m.material?.description?.toLowerCase() || '';
      return materialName.includes(search);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-1 w-full gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Buscar por material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container-low border border-outline rounded-2xl pl-12 pr-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none appearance-none min-w-[150px]"
          >
            <option value="all">Todas Movimentações</option>
            <option value="in">Entradas</option>
            <option value="out">Saídas</option>
            <option value="cautela">Cautelas</option>
            <option value="adjustment">Ajustes (Inventário)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
          <button onClick={() => setIsXmlModalOpen(true)} className="px-4 py-3 bg-emerald-500 text-background text-[10px] font-display font-bold uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 col-span-2 md:col-span-1">
            <FileCode2 className="h-4 w-4" /> Importar XML
          </button>
          <button onClick={() => handleNew('in')} className="px-4 py-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-background text-[10px] font-display font-bold uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-2 transition-all">
            <ArrowDownToLine className="h-4 w-4" /> Entrada
          </button>
          <button onClick={() => handleNew('out')} className="px-4 py-3 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-background text-[10px] font-display font-bold uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-2 transition-all">
            <ArrowUpFromLine className="h-4 w-4" /> Saída
          </button>
          <button onClick={() => handleNew('cautela')} className="px-4 py-3 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-background text-[10px] font-display font-bold uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-2 transition-all">
            <Package className="h-4 w-4" /> Cautela
          </button>
          <button onClick={() => handleNew('adjustment')} className="px-4 py-3 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-background text-[10px] font-display font-bold uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-2 transition-all">
            <RefreshCw className="h-4 w-4" /> Ajuste
          </button>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-[32px] border border-outline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-outline bg-surface-container-high/50">
                <th className="p-6 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Data</th>
                <th className="p-6 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Tipo</th>
                <th className="p-6 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Material</th>
                <th className="p-6 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Qtd</th>
                <th className="p-6 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Detalhes</th>
                <th className="p-6 text-right text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">Nenhuma movimentação registrada.</td></tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="border-b border-outline/50 hover:bg-white/5 transition-colors group">
                    <td className="p-6 text-sm text-on-surface-variant">
                      {new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          m.type === 'in' ? "bg-emerald-500" :
                          m.type === 'out' ? "bg-orange-500" :
                          m.type === 'cautela' ? "bg-purple-500" :
                          "bg-blue-500"
                        )} />
                        <span className="text-xs font-display uppercase tracking-wider text-on-surface">
                          {m.type === 'in' ? 'Entrada' : m.type === 'out' ? 'Saída' : m.type === 'cautela' ? 'Cautela' : 'Ajuste'}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="font-bold text-on-surface">{m.material?.description || 'Material excluído'}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{m.material?.category}</p>
                    </td>
                    <td className="p-6">
                      <span className={cn(
                        "text-sm font-bold",
                        (m.type === 'out' || m.type === 'cautela') ? "text-error" : "text-emerald-500"
                      )}>
                        {(m.type === 'out' || m.type === 'cautela') ? '-' : '+'}{m.quantity} {m.material?.unit}
                      </span>
                    </td>
                    <td className="p-6 text-xs text-on-surface-variant max-w-[200px] truncate">
                      {m.type === 'out' && m.budget_item && `Obra: ${m.budget_item.description}`}
                      {m.type === 'cautela' && m.employee && `Func: ${m.employee.name}`}
                      {m.type === 'in' && m.supplier && `Forn: ${m.supplier}`}
                      {m.type === 'in' && m.invoice_number && ` | NF: ${m.invoice_number}`}
                      {m.notes && <><br/>{m.notes}</>}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setDeletingMovement(m)}
                          className="p-2 hover:bg-error/10 rounded-xl text-on-surface-variant hover:text-error transition-colors"
                          title="Excluir (Reverte o saldo)"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-container-low/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-surface rounded-[32px] shadow-2xl border border-outline w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-6 flex items-center justify-between border-b border-outline">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  modalType === 'in' ? "bg-emerald-500/10 text-emerald-500" :
                  modalType === 'out' ? "bg-orange-500/10 text-orange-500" :
                  modalType === 'cautela' ? "bg-purple-500/10 text-purple-500" :
                  "bg-blue-500/10 text-blue-500"
                )}>
                  {modalType === 'in' ? <ArrowDownToLine className="h-6 w-6" /> : 
                   modalType === 'out' ? <ArrowUpFromLine className="h-6 w-6" /> : 
                   modalType === 'cautela' ? <Package className="h-6 w-6" /> :
                   <RefreshCw className="h-6 w-6" />}
                </div>
                <h3 className="text-xl font-display font-bold text-on-surface uppercase tracking-tight">
                  {modalType === 'in' ? 'Registrar Entrada' : 
                   modalType === 'out' ? 'Registrar Saída (Uso)' : 
                   modalType === 'cautela' ? 'Registrar Cautela' : 
                   'Ajuste de Inventário'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <X className="h-5 w-5 text-on-surface-variant" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Data</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Material</label>
                  <select
                    value={formData.material_id || ''}
                    onChange={e => setFormData({ ...formData, material_id: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none appearance-none"
                  >
                    <option value="">Selecione...</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.description} (Saldo: {m.current_stock})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Quantidade</label>
                <input
                  type="number"
                  value={formData.quantity || ''}
                  onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              {/* Campos de Entrada */}
              {modalType === 'in' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Fornecedor</label>
                      <input
                        type="text"
                        value={formData.supplier || ''}
                        onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nota Fiscal (Nº)</label>
                      <input
                        type="text"
                        value={formData.invoice_number || ''}
                        onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Local de Armazenamento</label>
                    <input
                      type="text"
                      value={formData.storage_location || ''}
                      onChange={e => setFormData({ ...formData, storage_location: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Valor Unitário (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.unit_price || ''}
                        onChange={e => {
                          const unit = Number(e.target.value);
                          setFormData({ ...formData, unit_price: unit, total_price: unit * (formData.quantity || 0) });
                        }}
                        className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Valor Total (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.total_price || ''}
                        onChange={e => setFormData({ ...formData, total_price: Number(e.target.value) })}
                        className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Campos de Saída */}
              {modalType === 'out' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2">
                    Destino (Item da Obra - EAP) <AlertCircle className="h-3 w-3 text-primary" title="Vínculo necessário para relatórios de consumo" />
                  </label>
                  <select
                    value={formData.budget_item_id || ''}
                    onChange={e => setFormData({ ...formData, budget_item_id: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none appearance-none"
                  >
                    <option value="">Selecione o item...</option>
                    {budgetItems.map(item => (
                      <option key={item.id} value={item.id}>{item.code} - {item.description}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Campos de Cautela */}
              {modalType === 'cautela' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Selecione o Funcionário</label>
                    <select
                      value={formData.employee_id || ''}
                      onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none appearance-none"
                    >
                      <option value="">-- Cadastrar Novo Funcionário --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                      ))}
                    </select>
                  </div>
                  
                  {!formData.employee_id && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-primary/20 bg-primary/5 rounded-2xl">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nome</label>
                        <input
                          type="text"
                          value={newEmployeeName}
                          onChange={e => setNewEmployeeName(e.target.value)}
                          className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Cargo</label>
                        <input
                          type="text"
                          value={newEmployeeRole}
                          onChange={e => setNewEmployeeRole(e.target.value)}
                          className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Destino / Local de Uso</label>
                    <input
                      type="text"
                      value={formData.destination || ''}
                      onChange={e => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Observações</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none resize-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-outline">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-widest hover:bg-surface-container-high rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className={cn(
                    "px-8 py-3 text-background text-xs font-bold uppercase tracking-[2px] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg",
                    modalType === 'in' ? "bg-emerald-500 shadow-emerald-500/40" :
                    modalType === 'out' ? "bg-orange-500 shadow-orange-500/40" :
                    modalType === 'cautela' ? "bg-purple-500 shadow-purple-500/40" :
                    "bg-blue-500 shadow-blue-500/40"
                  )}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isXmlModalOpen && (
        <XmlImporterModal
          projectId={projectId}
          materials={materials}
          budgetItems={budgetItems}
          onClose={() => setIsXmlModalOpen(false)}
          onSuccess={() => {
            setIsXmlModalOpen(false);
            // the useInventory hook will refresh, but let's force a window reload or maybe the parent will refresh if we pass a refresh function
            // Since we don't have refresh() directly available from useInventory in this component (wait, we do? 'movements' is reactive? No, useInventory has a fetch inside useEffect, but we don't trigger it here unless we call refresh)
            window.location.reload(); // Simplest way to refresh all data (inventory and finance) after batch insert
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingMovement}
        onClose={() => setDeletingMovement(null)}
        onConfirm={handleDelete}
        title="Excluir Movimentação?"
        message="Atenção: Excluir esta movimentação reverterá o saldo do material e removerá o histórico. Continuar?"
        requireText="Excluir"
      />

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
}

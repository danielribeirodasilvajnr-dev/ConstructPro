import React, { useState } from 'react';
import { Package, Search, Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { InventoryMaterial } from '../../lib/types';
import { AlertModal } from '../ui/AlertModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { cn } from '../../lib/utils';

interface InventoryMaterialsProps {
  projectId: string;
}

export function InventoryMaterials({ projectId }: InventoryMaterialsProps) {
  const { materials, loading, error, saveMaterial, deleteMaterial } = useInventory(projectId);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<InventoryMaterial | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryMaterial>>({});
  
  const [deletingMaterial, setDeletingMaterial] = useState<InventoryMaterial | null>(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' as 'error' | 'success' });

  const categories = [
    'Cimento', 'Areia', 'Brita', 'Aço', 'Madeira', 'Elétrica', 'Hidráulica', 'Acabamentos', 'Geral'
  ];

  const units = [
    'Unidade', 'Kg', 'Tonelada', 'Metro', 'M²', 'M³', 'Litro', 'Saco'
  ];

  const handleNew = () => {
    setEditingMaterial(null);
    setFormData({
      description: '',
      category: 'Geral',
      unit: 'Unidade',
      min_stock: 0,
      ideal_stock: 0,
      current_stock: 0,
      code: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (material: InventoryMaterial) => {
    setEditingMaterial(material);
    setFormData(material);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.description) throw new Error('A descrição é obrigatória');
      await saveMaterial(formData);
      setIsModalOpen(false);
      setAlertConfig({ isOpen: true, title: 'Sucesso', message: 'Material salvo com sucesso!', type: 'success' });
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (deletingMaterial) {
      try {
        await deleteMaterial(deletingMaterial.id);
        setDeletingMaterial(null);
        setAlertConfig({ isOpen: true, title: 'Sucesso', message: 'Material excluído.', type: 'success' });
      } catch (err: any) {
        setDeletingMaterial(null);
        setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
      }
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.code && m.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low border border-outline rounded-2xl pl-12 pr-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-all"
          />
        </div>
        <button
          onClick={handleNew}
          className="w-full sm:w-auto px-6 py-3 bg-primary text-background text-[11px] font-display font-bold uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-[0_0_20px_-5px_rgba(34,255,136,0.4)] active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Novo Material
        </button>
      </div>

      <div className="bg-surface-container-low rounded-[32px] border border-outline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-outline bg-surface-container-high/50">
                <th className="p-6 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Material</th>
                <th className="p-6 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Categoria</th>
                <th className="p-6 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Saldo Atual</th>
                <th className="p-6 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Mínimo / Ideal</th>
                <th className="p-6 text-right text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">Carregando materiais...</td></tr>
              ) : filteredMaterials.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">Nenhum material encontrado.</td></tr>
              ) : (
                filteredMaterials.map((m) => (
                  <tr key={m.id} className="border-b border-outline/50 hover:bg-white/5 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-surface rounded-xl border border-outline">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{m.description}</p>
                          {m.code && <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Cód: {m.code}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 bg-surface-container-high rounded-full text-[11px] font-display uppercase tracking-wider text-on-surface-variant">
                        {m.category}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-lg font-display font-bold",
                          m.current_stock <= m.min_stock && m.min_stock > 0 ? "text-error" : "text-on-surface"
                        )}>
                          {m.current_stock}
                        </span>
                        <span className="text-xs text-on-surface-variant">{m.unit}</span>
                      </div>
                    </td>
                    <td className="p-6 text-on-surface-variant text-sm">
                      {m.min_stock} / {m.ideal_stock}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(m)}
                          className="p-2 hover:bg-surface rounded-xl text-on-surface-variant hover:text-primary transition-colors border border-transparent hover:border-outline"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingMaterial(m)}
                          className="p-2 hover:bg-error/10 rounded-xl text-on-surface-variant hover:text-error transition-colors border border-transparent hover:border-error/20"
                        >
                          <Trash2 className="h-4 w-4" />
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
              <h3 className="text-xl font-display font-bold text-on-surface uppercase tracking-tight">
                {editingMaterial ? 'Editar Material' : 'Novo Material'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <X className="h-5 w-5 text-on-surface-variant" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Descrição do Material</label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                    placeholder="Ex: Cimento CP II 50kg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Código (Opcional)</label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                    placeholder="Ex: CIM-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Categoria</label>
                  <select
                    value={formData.category || 'Geral'}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none appearance-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Unidade de Medida</label>
                  <select
                    value={formData.unit || 'Unidade'}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none appearance-none"
                  >
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2">
                    Estoque Inicial <AlertCircle className="h-3 w-3 text-primary" title="Apenas na criação" />
                  </label>
                  <input
                    type="number"
                    value={formData.current_stock || 0}
                    onChange={e => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                    disabled={!!editingMaterial}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={formData.min_stock || 0}
                    onChange={e => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Estoque Ideal</label>
                  <input
                    type="number"
                    value={formData.ideal_stock || 0}
                    onChange={e => setFormData({ ...formData, ideal_stock: Number(e.target.value) })}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none"
                  />
                </div>
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
                  className="px-8 py-3 bg-primary text-background text-xs font-bold uppercase tracking-[2px] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_-5px_rgba(34,255,136,0.4)]"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingMaterial}
        onClose={() => setDeletingMaterial(null)}
        onConfirm={handleDelete}
        title="Excluir Material?"
        message={`Deseja excluir o material "${deletingMaterial?.description}"? O histórico de movimentações também poderá ser afetado.`}
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

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { InventoryMaterial, InventoryEmployee, InventoryMovement } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

export function useInventory(projectId: string | null) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<InventoryMaterial[]>([]);
  const [employees, setEmployees] = useState<InventoryEmployee[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!projectId || !user) {
      setMaterials([]);
      setEmployees([]);
      setMovements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [materialsRes, employeesRes, movementsRes] = await Promise.all([
        supabase.from('inventory_materials').select('*').eq('project_id', projectId).order('description'),
        supabase.from('inventory_employees').select('*').eq('project_id', projectId).order('name'),
        supabase.from('inventory_movements').select('*, material:inventory_materials(*), employee:inventory_employees(*), budget_item:budget_items(*), budget_sub_item:budget_sub_items(*)').eq('project_id', projectId).order('created_at', { ascending: false })
      ]);

      if (materialsRes.error) throw materialsRes.error;
      if (employeesRes.error) throw employeesRes.error;
      if (movementsRes.error) throw movementsRes.error;

      setMaterials(materialsRes.data as InventoryMaterial[]);
      setEmployees(employeesRes.data as InventoryEmployee[]);
      setMovements(movementsRes.data as InventoryMovement[]);
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const saveMaterial = async (data: Partial<InventoryMaterial>) => {
    if (!projectId || !user) throw new Error('Projeto ou usuário não definido');

    try {
      const payload = { ...data, project_id: projectId };
      const isNew = !data.id;
      const initialStock = payload.current_stock || 0;
      
      let res;
      if (!isNew) {
        res = await supabase.from('inventory_materials').update(payload).eq('id', data.id).select().single();
      } else {
        res = await supabase.from('inventory_materials').insert([payload]).select().single();
      }

      if (res.error) throw res.error;
      
      if (isNew && initialStock > 0) {
        const movPayload = {
          project_id: projectId,
          material_id: res.data.id,
          type: 'adjustment',
          quantity: initialStock,
          date: new Date().toISOString().split('T')[0],
          notes: 'Saldo Inicial cadastrado na criação do material',
          created_by: user.id
        };
        await supabase.from('inventory_movements').insert([movPayload]);
      }

      await fetchInventory();
      return res.data;
    } catch (err: any) {
      console.error('Error saving material:', err);
      throw err;
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase.from('inventory_materials').delete().eq('id', id);
      if (error) throw error;
      await fetchInventory();
    } catch (err: any) {
      console.error('Error deleting material:', err);
      throw err;
    }
  };

  const saveEmployee = async (data: Partial<InventoryEmployee>) => {
    if (!projectId || !user) throw new Error('Projeto ou usuário não definido');
    try {
      const payload = { ...data, project_id: projectId };
      let res;
      if (data.id) {
        res = await supabase.from('inventory_employees').update(payload).eq('id', data.id).select().single();
      } else {
        res = await supabase.from('inventory_employees').insert([payload]).select().single();
      }
      if (res.error) throw res.error;
      await fetchInventory();
      return res.data;
    } catch (err: any) {
      console.error('Error saving employee:', err);
      throw err;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase.from('inventory_employees').delete().eq('id', id);
      if (error) throw error;
      await fetchInventory();
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      throw err;
    }
  };

  const saveMovement = async (data: Partial<InventoryMovement>) => {
    if (!projectId || !user) throw new Error('Projeto ou usuário não definido');
    try {
      const payload = { ...data, project_id: projectId, created_by: user.id };
      let res;
      if (data.id) {
        res = await supabase.from('inventory_movements').update(payload).eq('id', data.id).select().single();
      } else {
        res = await supabase.from('inventory_movements').insert([payload]).select().single();
      }
      if (res.error) throw res.error;
      await fetchInventory();
      return res.data;
    } catch (err: any) {
      console.error('Error saving movement:', err);
      throw err;
    }
  };

  const deleteMovement = async (id: string) => {
    try {
      const { error } = await supabase.from('inventory_movements').delete().eq('id', id);
      if (error) throw error;
      await fetchInventory();
    } catch (err: any) {
      console.error('Error deleting movement:', err);
      throw err;
    }
  };

  return {
    materials,
    employees,
    movements,
    loading,
    error,
    refresh: fetchInventory,
    saveMaterial,
    deleteMaterial,
    saveEmployee,
    deleteEmployee,
    saveMovement,
    deleteMovement
  };
}

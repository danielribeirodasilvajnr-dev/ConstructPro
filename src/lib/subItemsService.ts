import { supabase } from './supabase';
import { BudgetSubItem } from './types';

// Helper to get local sub-items
const getLocalSubItems = (budgetItemId: string): BudgetSubItem[] => {
  const localData = localStorage.getItem(`subitems_${budgetItemId}`);
  if (localData) {
    try {
      return JSON.parse(localData);
    } catch (e) {
      console.error('Error parsing local sub-items', e);
    }
  }
  return [];
};

// Helper to save local sub-items
const saveLocalSubItems = (budgetItemId: string, subItems: BudgetSubItem[]) => {
  localStorage.setItem(`subitems_${budgetItemId}`, JSON.stringify(subItems));
};

export const getSubItems = async (budgetItemId: string): Promise<BudgetSubItem[]> => {
  try {
    const { data, error } = await supabase
      .from('budget_sub_items')
      .select('*')
      .eq('budget_item_id', budgetItemId)
      .order('created_at', { ascending: true });

    if (error) {
      // Table might not exist yet, fallback to local storage
      console.warn('Could not fetch from budget_sub_items, using localStorage fallback', error);
      return getLocalSubItems(budgetItemId);
    }

    return data || [];
  } catch (error) {
    console.warn('Error fetching sub items, using localStorage fallback', error);
    return getLocalSubItems(budgetItemId);
  }
};

export const saveSubItems = async (budgetItemId: string, subItems: Omit<BudgetSubItem, 'id' | 'budget_item_id' | 'created_at'>[]): Promise<BudgetSubItem[]> => {
  const newItemsToSave = subItems.map(item => ({
    ...item,
    budget_item_id: budgetItemId,
  }));

  try {
    // Try to delete existing and insert new
    await supabase
      .from('budget_sub_items')
      .delete()
      .eq('budget_item_id', budgetItemId);

    if (newItemsToSave.length > 0) {
      const { data, error } = await supabase
        .from('budget_sub_items')
        .insert(newItemsToSave)
        .select();

      if (error) {
        throw error;
      }
      return data || [];
    }
    return [];
  } catch (error) {
    console.warn('Could not save to budget_sub_items, using localStorage fallback', error);
    
    // Create local structure
    const localItems: BudgetSubItem[] = newItemsToSave.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    }));
    
    saveLocalSubItems(budgetItemId, localItems);
    return localItems;
  }
};

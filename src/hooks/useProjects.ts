import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Project } from '../lib/types';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 10000);

      setLoading(true);
      
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout')), 2500)
      );

      try {
        const supabaseCall = supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        let result: any = null;
        try {
          result = await Promise.race([supabaseCall, timeoutPromise]);
        } catch (e) {
          console.warn('Supabase hung in useProjects, triggering fallback');
        }

        let projectsData = result?.data || [];

        // RETRY LOGIC FOR F5 RACE CONDITION: Bypass Supabase JS completely
        if (!projectsData || projectsData.length === 0) {
          const sessionStr = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
          if (sessionStr) {
            const sessionData = JSON.parse(localStorage.getItem(sessionStr) || '{}');
            const token = sessionData?.access_token;
            if (token) {
              try {
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), 5000);

                const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/projects?select=*&order=created_at.desc`, {
                  headers: { 
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, 
                    'Authorization': `Bearer ${token}` 
                  },
                  signal: controller.signal
                });
                
                clearTimeout(id);
                
                if (res.ok) {
                  const raw = await res.json();
                  if (raw && raw.length > 0) projectsData = raw;
                }
              } catch (e) {
                console.error('Raw fetch inside useProjects failed:', e);
              }
            }
          }
        }

        // Busca o status de assinatura dos donos dos projetos
        if (projectsData && projectsData.length > 0) {
          try {
            const uniqueOwnerIds = [...new Set(projectsData.map((p: any) => p.user_id))];
            const { data: ownersData } = await supabase
              .from('profiles')
              .select('id, subscription_status')
              .in('id', uniqueOwnerIds);

            if (ownersData) {
              const ownerStatusMap = ownersData.reduce((acc: any, owner: any) => {
                acc[owner.id] = owner.subscription_status;
                return acc;
              }, {});

              projectsData = projectsData.map((p: any) => ({
                ...p,
                owner_status: ownerStatusMap[p.user_id] || 'pending'
              }));
            }
          } catch (e) {
            console.error('Failed to fetch owners status:', e);
          }
        }

        setProjects(projectsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const saveProject = async (project: Partial<Project>, pciItems?: any[]) => {
    if (!user) return;
    try {
      const projectData: any = {
        ...project,
        user_id: user.id
      };
      
      // Remove campos injetados no frontend que não existem no banco de dados
      delete projectData.owner_status;

      // Corrigir erro "invalid input syntax for type date"
      if (projectData.deadline === '') {
        projectData.deadline = null;
      }
      if (projectData.start_date === '') {
        projectData.start_date = null;
      }

      let oldContractValue = 0;
      let isContractValueUpdated = false;

      if (project.id) {
        const { data: oldProj } = await supabase
          .from('projects')
          .select('contract_value')
          .eq('id', project.id)
          .single();
        
        if (oldProj) {
          oldContractValue = oldProj.contract_value || 0;
          if (project.contract_value !== undefined && project.contract_value !== oldContractValue) {
            isContractValueUpdated = true;
          }
        }
      }

      let result;
      if (project.id) {
        // Update existing project
        result = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id)
          .select()
          .single();
      } else {
        // Insert new project
        result = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single();
      }

      const { data, error } = result;

      if (error) throw error;
      
      // Se houver pciItems, insere no budget_items (funciona para obras novas ou edição)
      if (pciItems && pciItems.length > 0 && data) {
        // Se for uma edição de projeto existente, remove os itens de orçamento anteriores para evitar duplicados
        if (project.id) {
          try {
            const { error: deleteError } = await supabase
              .from('budget_items')
              .delete()
              .eq('project_id', project.id);
            if (deleteError) {
              console.warn('Failed to delete existing budget items before re-import:', deleteError);
            }
          } catch (delErr) {
            console.error('Error deleting old budget items:', delErr);
          }
        }

        const budgetPayload = pciItems.map(item => ({
          project_id: data.id,
          category: item.category || 'Importado da PCI',
          code: item.code || '',
          description: item.description,
          unit: item.unit || 'vb',
          quantity: item.quantity || 1,
          unit_cost: item.unit_cost || 0,
          executed_quantity: 0,
          incidence: item.incidence || 0
        }));
        
        try {
          const { error: budgetError } = await supabase.from('budget_items').insert(budgetPayload);
          if (budgetError) {
            console.warn('Insert with incidence failed, retrying without:', budgetError);
            const safePayload = budgetPayload.map(({ incidence, ...rest }) => rest);
            const { error: retryError } = await supabase.from('budget_items').insert(safePayload);
            if (retryError) throw retryError;
          }
        } catch (insertErr) {
          console.error('Failed to insert budget items:', insertErr);
        }
      } else if (project.id && data) {
        // Se é um projeto existente e não subiu nova planilha:
        // 1. Busca todos os itens existentes
        const { data: existingItems } = await supabase
          .from('budget_items')
          .select('*')
          .eq('project_id', project.id);

        if (existingItems && existingItems.length > 0) {
          // 2. Sempre faz a deduplicação automática para garantir a consistência dos dados (ex: limpar duplicados anteriores)
          const uniqueItemsMap = new Map<string, any>();
          const idsToDelete: string[] = [];

          existingItems.forEach(item => {
            const key = `${item.code || ''}-${item.description || ''}`;
            if (!uniqueItemsMap.has(key)) {
              uniqueItemsMap.set(key, item);
            } else {
              const existing = uniqueItemsMap.get(key);
              // Prefere manter o item que possui maior incidência (ou qualquer um se forem iguais)
              if ((item.incidence || 0) > (existing.incidence || 0)) {
                idsToDelete.push(existing.id);
                uniqueItemsMap.set(key, item);
              } else {
                idsToDelete.push(item.id);
              }
            }
          });

          // Se encontramos duplicados, limpa do banco de dados na hora!
          if (idsToDelete.length > 0) {
            console.log(`Deduplicating: deleting ${idsToDelete.length} duplicate budget items for project ${project.id}`);
            try {
              const { error: cleanupError } = await supabase
                .from('budget_items')
                .delete()
                .in('id', idsToDelete);
              if (cleanupError) {
                console.warn('Failed to cleanup duplicate items:', cleanupError);
              }
            } catch (err) {
              console.error('Error during budget items deduplication:', err);
            }
          }

          const uniqueItems = Array.from(uniqueItemsMap.values());

          // 3. Se mudou o valor do contrato, recalcula e atualiza os custos dos itens proporcionais
          if (isContractValueUpdated) {
            const baseContractValue = oldContractValue > 0 ? oldContractValue : uniqueItems.reduce(
              (sum, item) => sum + (Number(item.unit_cost) * Number(item.quantity)),
              0
            );

            if (baseContractValue > 0) {
              const newContractValue = project.contract_value || 0;
              const scale = newContractValue / baseContractValue;

              const updates = uniqueItems.map(item => {
                const currentCost = Number(item.unit_cost) || 0;
                const newCost = currentCost * scale;
                const currentIncidence = Number(item.incidence) || ((currentCost * Number(item.quantity)) / baseContractValue) * 100;
                const newIncidence = newContractValue > 0 ? ((newCost * Number(item.quantity)) / newContractValue) * 100 : currentIncidence;

                return {
                  id: item.id,
                  project_id: item.project_id,
                  category: item.category,
                  code: item.code,
                  description: item.description,
                  unit: item.unit,
                  quantity: item.quantity,
                  unit_cost: newCost,
                  executed_quantity: item.executed_quantity,
                  incidence: newIncidence,
                  bid_group_id: item.bid_group_id
                };
              });

              try {
                const { error: updateError } = await supabase.from('budget_items').upsert(updates);
                if (updateError) {
                  console.warn('Upsert with incidence failed, retrying without:', updateError);
                  const safeUpdates = updates.map(({ incidence, ...rest }) => rest);
                  const { error: retryError } = await supabase.from('budget_items').upsert(safeUpdates);
                  if (retryError) throw retryError;
                }
              } catch (upsertErr) {
                console.error('Failed to update budget items:', upsertErr);
              }
            }
          }
        }
      }

      await fetchProjects();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProjects(projects.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    saveProject,
    deleteProject,
    refresh: fetchProjects
  };
}

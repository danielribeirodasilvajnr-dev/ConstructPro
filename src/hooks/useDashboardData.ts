import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/utils';

export function useDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Init');

  const fetchDashboardData = async () => {
    if (!user) {
      setDebugInfo('No user');
      return;
    }
    
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    setLoading(true);
    try {
      // Race the Supabase call against a 2-second timeout
      const supabaseCall = supabase
        .from('projects')
        .select(`
          *,
          budget_items(*),
          schedule_items(*),
          financial_items(*),
          daily_logs(*)
        `)
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise<{ data: any[] | null, error: any }>((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout')), 2000)
      );

      let projects: any[] | null = null;
      let projectsError: any = null;

      try {
        const result = await Promise.race([supabaseCall, timeoutPromise]);
        projects = result.data;
        projectsError = result.error;
        setDebugInfo(`Supabase returned: ${projects?.length ?? 'null'} projects`);
      } catch (e: any) {
        setDebugInfo(`Supabase hung or timed out: ${e.message}. Triggering fallback...`);
      }

      // RETRY LOGIC FOR F5 RACE CONDITION: Bypass Supabase JS completely
      if (!projects || projects.length === 0) {
        const sessionStr = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (sessionStr) {
          const sessionData = JSON.parse(localStorage.getItem(sessionStr) || '{}');
          const token = sessionData?.access_token;
          if (token) {
            try {
              const controller = new AbortController();
              const id = setTimeout(() => controller.abort(), 5000);

              const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/projects?select=*,budget_items(*),schedule_items(*),financial_items(*),daily_logs(*)&order=created_at.desc`;
              const res = await fetch(url, {
                headers: {
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${token}`
                },
                signal: controller.signal
              });
              
              clearTimeout(id);

              if (res.ok) {
                const rawData = await res.json();
                setDebugInfo(`Fallback success: ${rawData.length} projects found`);
                if (rawData && rawData.length > 0) {
                  projects = rawData;
                }
              } else {
                setDebugInfo(`Fallback failed: HTTP ${res.status}`);
              }
            } catch (e: any) {
              setDebugInfo(`Fallback exception: ${e.message}`);
            }
          } else {
            setDebugInfo('No token in localStorage');
          }
        } else {
          setDebugInfo('No session key in localStorage');
        }
      }

      clearTimeout(timeout);

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) {
        setData([]);
        return;
      }

      const mapped = projects.map((p: any) => {
        // ... (keeping mapping logic same)
        // Consistent filtering with BudgetTab
        const budgetItemsFiltered = (p.budget_items || []).filter((i: any) => 
          String(i.category).toLowerCase() !== 'mão de obra'
        );
        const filteredItemIds = new Set(budgetItemsFiltered.map((i: any) => i.id));
        
        const ordained = budgetItemsFiltered.reduce((acc: number, item: any) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0);
        
        const totalIncome = (p.financial_items || []).filter((i: any) => String(i.category).toLowerCase() === 'entrada').reduce((acc: number, item: any) => acc + Number(item.amount), 0);
        
        // Budget-linked spent (for progress)
        const budgetSpent = (p.financial_items || []).filter((i: any) => 
          i.budget_item_linked_id && filteredItemIds.has(i.budget_item_linked_id)
        ).reduce((acc: number, item: any) => acc + Number(item.amount), 0);

        // General spent (for cash flow)
        const spent = (p.financial_items || []).filter((i: any) => String(i.category).toLowerCase() !== 'entrada').reduce((acc: number, item: any) => acc + Number(item.amount), 0);
        
        const balanceDue = ordained - totalIncome;
        const cashBalance = totalIncome - spent;
        const financialProgress = ordained > 0 ? (budgetSpent / ordained) * 100 : 0;

        const scheduleItems = p.schedule_items || [];
        let totalWeight = 0;
        let weightedProgressSum = 0;
        
        scheduleItems.forEach((item: any) => {
          const start = new Date(item.start_date).getTime();
          const end = new Date(item.end_date).getTime();
          const days = Math.max(1, (end - start) / (1000 * 3600 * 24));
          const progress = Number(item.progress || 0);
          
          totalWeight += days;
          weightedProgressSum += (progress * days);
        });

        const physicalProgress = totalWeight > 0 ? weightedProgressSum / totalWeight : 0;

        const sortedLogs = [...(p.daily_logs || [])].sort((a: any, b: any) => {
          const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }).slice(0, 3);
        const logs = sortedLogs.map((log: any) => {
          let desc = log.activities || '';
          if (desc.length > 70) desc = desc.substring(0, 70) + '...';
          return { date: formatDate(log.date, { day: '2-digit', month: 'short' }), desc };
        });

        const categoriesRaw = [...new Set([
          ...(p.budget_items || []).map((i: any) => i.category),
          ...(p.financial_items || []).map((i: any) => i.category)
        ])].filter(c => c);

        let costData = categoriesRaw.map(cat => {
          const previsto = (p.budget_items || []).filter((i: any) => i.category === cat).reduce((acc: number, item: any) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0);
          const realizado = (p.financial_items || []).filter((i: any) => i.category === cat).reduce((acc: number, item: any) => acc + Number(item.amount), 0);
          return { name: String(cat).substring(0, 8), previsto, realizado };
        });

        return {
          ...p,
          ordained,
          spent,
          budgetSpent,
          totalIncome,
          balanceDue,
          cashBalance,
          financialProgress: Number(financialProgress.toFixed(1)),
          physicalProgress: Number(physicalProgress.toFixed(1)),
          logs,
          costData,
          evolutionData: [
            { month: 'Sem 1', real: Number((physicalProgress * 0.2).toFixed(1)), previsto: Number((physicalProgress * 0.3).toFixed(1)) },
            { month: 'Atual', real: Number(physicalProgress.toFixed(1)), previsto: Number((physicalProgress + 5).toFixed(1)) },
          ]
        };
      });

      setData(mapped);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  return { data, loading, error, refresh: fetchDashboardData, debugInfo };
}

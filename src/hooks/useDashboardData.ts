import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/utils';

export function useDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    // Safety timeout to prevent infinite spinner
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    setLoading(true);
    try {
      // Fetch all projects for the user
      let { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          budget_items(*),
          schedule_items(*),
          financial_items(*),
          daily_logs(*)
        `)
        .order('created_at', { ascending: false });

      // RETRY LOGIC FOR F5 RACE CONDITION: Bypass Supabase JS completely
      if (!projectsError && (!projects || projects.length === 0)) {
        console.log('SUPABASE JS RETURNED EMPTY. TRIGGERING RAW FALLBACK...');
        const sessionStr = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (sessionStr) {
          const sessionData = JSON.parse(localStorage.getItem(sessionStr) || '{}');
          const token = sessionData?.access_token;
          if (token) {
            try {
              // Try a simpler query first to see if it works
              const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/projects?select=*,budget_items(*),schedule_items(*),financial_items(*),daily_logs(*)&order=created_at.desc`, {
                headers: {
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (res.ok) {
                const rawData = await res.json();
                console.log('RAW FALLBACK DATA SUCCESS:', rawData);
                if (rawData && rawData.length > 0) {
                  projects = rawData;
                }
              } else {
                console.error('RAW FALLBACK FAILED:', res.status);
              }
            } catch (e) {
              console.error('Raw fetch fallback failed exception:', e);
            }
          }
        }
      }

      clearTimeout(timeout);

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) {
        setData([]);
        return;
      }

      const mapped = projects.map((p: any) => {
        const ordained = (p.budget_items || []).reduce((acc: number, item: any) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0);
        const spent = (p.financial_items || []).reduce((acc: number, item: any) => acc + Number(item.amount), 0);
        const balance = ordained - spent;
        const financialProgress = ordained > 0 ? (spent / ordained) * 100 : 0;

        const scheduleItems = p.schedule_items || [];
        const totalPhysical = scheduleItems.reduce((acc: number, item: any) => acc + Number(item.progress || 0), 0);
        const physicalProgress = scheduleItems.length > 0 ? totalPhysical / scheduleItems.length : 0;

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
          balance,
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

  return { data, loading, error, refresh: fetchDashboardData };
}

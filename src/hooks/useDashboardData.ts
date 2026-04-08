import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all projects for the user
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          budget_items(*),
          schedule_items(*),
          financial_items(*),
          daily_logs(*)
        `);

      if (projectsError) throw projectsError;
      if (!projects) {
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

        const sortedLogs = [...(p.daily_logs || [])].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
        const logs = sortedLogs.map((log: any) => {
          let desc = log.activities || '';
          if (desc.length > 70) desc = desc.substring(0, 70) + '...';
          const dateObj = new Date(log.date + 'T12:00:00Z');
          return { date: dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), desc };
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  return { data, loading, refresh: fetchDashboardData };
}

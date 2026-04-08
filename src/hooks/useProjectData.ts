import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BudgetItem, ScheduleItem, FinancialItem, DailyLog } from '../lib/types';

export function useProjectData(projectId: string | null) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [financialItems, setFinancialItems] = useState<FinancialItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [budget, schedule, finance, logs] = await Promise.all([
        supabase.from('budget_items').select('*').eq('project_id', projectId),
        supabase.from('schedule_items').select('*').eq('project_id', projectId).order('start_date', { ascending: true }),
        supabase.from('financial_items').select('*').eq('project_id', projectId).order('date', { ascending: false }),
        supabase.from('daily_logs').select('*, daily_log_photos(*)').eq('project_id', projectId).order('date', { ascending: false })
      ]);

      setBudgetItems(budget.data || []);
      setScheduleItems(schedule.data || []);
      setFinancialItems(finance.data || []);
      setDailyLogs(logs.data || []);
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  return {
    budgetItems,
    scheduleItems,
    financialItems,
    dailyLogs,
    loading,
    refresh: fetchData
  };
}

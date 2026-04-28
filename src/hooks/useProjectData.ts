import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BudgetItem, ScheduleItem, FinancialItem, DailyLog, ProjectCollaborator } from '../lib/types';

export function useProjectData(projectId: string | null) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [financialItems, setFinancialItems] = useState<FinancialItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [bidGroups, setBidGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer' | 'proprietor' | null>(null);
  const { user } = useAuth();

  const fetchData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout')), 2500)
      );

      const supabaseCall = Promise.all([
        supabase.from('budget_items').select('*').eq('project_id', projectId),
        supabase.from('schedule_items').select('*').eq('project_id', projectId).order('start_date', { ascending: true }),
        supabase.from('financial_items').select('*').eq('project_id', projectId).order('date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('daily_logs').select('*, daily_log_photos(*)').eq('project_id', projectId).order('date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('project_documents').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('project_collaborators').select('role').eq('project_id', projectId).eq('user_id', user?.id).maybeSingle(),
        supabase.from('project_collaborators').select('*, profile:profiles(*)').eq('project_id', projectId),
        supabase.from('measurements').select('*, measurement_items(*)').eq('project_id', projectId).order('date', { ascending: false }),
        supabase.from('bid_groups').select('*, bid_quotes(*)').eq('project_id', projectId).order('created_at', { ascending: false })
      ]);

      let results: any[] = [];
      try {
        const raceResult = await Promise.race([supabaseCall, timeoutPromise]);
        results = raceResult;
      } catch (e) {
        console.warn('Supabase hung in useProjectData, triggering fallback');
        
        // RAW FETCH FALLBACK for specific project data
        const sessionStr = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (sessionStr) {
          const sessionData = JSON.parse(localStorage.getItem(sessionStr) || '{}');
          const token = sessionData?.access_token;
          if (token) {
            const fetchTable = async (table: string, params: string = '') => {
              try {
                const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}?project_id=eq.${projectId}${params}`, {
                  headers: { 
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, 
                    'Authorization': `Bearer ${token}` 
                  }
                });
                return res.ok ? await res.json() : [];
              } catch { return []; }
            };

            const [budget, schedule, finance, logs, docs, collabList] = await Promise.all([
              fetchTable('budget_items'),
              fetchTable('schedule_items', '&order=start_date.asc'),
              fetchTable('financial_items', '&order=date.desc'),
              fetchTable('daily_logs', '&select=*,daily_log_photos(*)&order=date.desc'),
              fetchTable('project_documents', '&order=created_at.desc'),
              fetchTable('project_collaborators', '&select=*,profiles(*)'),
            ]);

            results = [
              { data: budget },
              { data: schedule },
              { data: finance },
              { data: logs },
              { data: docs },
              { data: { role: null } }, // Role logic will be handled below
              { data: collabList }
            ];
          }
        }
      }

      const [budget, schedule, finance, logs, docs, collab, collabList, measurementsData, bidsData] = results;

      setBudgetItems(budget?.data || []);
      setScheduleItems(schedule?.data || []);
      setFinancialItems(finance?.data || []);
      setDailyLogs(logs?.data || []);
      setDocuments(docs?.data || []);
      setCollaborators(collabList?.data || []);
      setMeasurements(measurementsData?.data || []);
      setBidGroups(bidsData?.data || []);

      // Determine user role
      try {
        const { data: project } = await supabase.from('projects').select('user_id').eq('id', projectId).single();
        if (project?.user_id === user?.id) {
          setUserRole('owner');
        } else if (collab?.data) {
          setUserRole(collab.data.role as 'editor' | 'viewer' | 'proprietor');
        } else {
          setUserRole(null);
        }
      } catch {
        setUserRole(null);
      }
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
    documents,
    collaborators,
    measurements,
    bidGroups,
    loading,
    userRole,
    isEditor: userRole === 'owner' || userRole === 'editor',
    refresh: fetchData
  };
}

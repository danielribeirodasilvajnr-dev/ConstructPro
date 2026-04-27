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

        setProjects(projectsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const saveProject = async (project: Partial<Project>) => {
    if (!user) return;
    try {
      const projectData = {
        ...project,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('projects')
        .upsert(projectData)
        .select()
        .single();

      if (error) throw error;
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

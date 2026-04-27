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
      
      // Fetch projects where user is owner OR collaborator
      let [ownedProjects, collaborations] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('project_collaborators').select('project_id').eq('user_id', user.id)
      ]);

      // RETRY LOGIC FOR F5 RACE CONDITION: Bypass Supabase JS completely
      if ((!ownedProjects.data || ownedProjects.data.length === 0) && (!collaborations.data || collaborations.data.length === 0)) {
        try {
          const sessionStr = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
          if (sessionStr) {
            const sessionData = JSON.parse(localStorage.getItem(sessionStr) || '{}');
            const token = sessionData?.access_token;
            if (token) {
              const [rawProjectsRes, rawCollabsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/projects?select=*&user_id=eq.${user.id}`, {
                  headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/project_collaborators?select=project_id&user_id=eq.${user.id}`, {
                  headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
                })
              ]);
              
              if (rawProjectsRes.ok && rawCollabsRes.ok) {
                const rawProjects = await rawProjectsRes.json();
                const rawCollabs = await rawCollabsRes.json();
                
                if (rawProjects.length > 0 || rawCollabs.length > 0) {
                  ownedProjects = { data: rawProjects, error: null } as any;
                  collaborations = { data: rawCollabs, error: null } as any;
                }
              }
            }
          }
        } catch (e) {
          console.error('Raw fetch fallback failed', e);
        }
      }

      if (ownedProjects.error) throw ownedProjects.error;
      if (collaborations.error) throw collaborations.error;

      let allProjectIds = (ownedProjects.data || []).map(p => p.id);
      const collabIds = (collaborations.data || []).map(c => c.project_id);
      
      const uniqueIds = [...new Set([...allProjectIds, ...collabIds])];
      
      if (uniqueIds.length === 0) {
        setProjects([]);
        clearTimeout(timeout);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .in('id', uniqueIds)
        .order('created_at', { ascending: false });

      clearTimeout(timeout);
      if (fetchError) throw fetchError;
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
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

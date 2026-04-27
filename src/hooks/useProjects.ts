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
      }, 5000);

      setLoading(true);
      
      // Fetch projects where user is owner OR collaborator
      const [ownedProjects, collaborations] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('project_collaborators').select('project_id').eq('user_id', user.id)
      ]);

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

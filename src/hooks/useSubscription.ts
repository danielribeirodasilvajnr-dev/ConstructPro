import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface PlanLimits {
  id: string;
  name: string;
  max_projects: number;
  max_regularizations: number;
  access_projects: boolean;
  access_calculator: boolean;
  access_simulator: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanLimits | null>(null);
  const [usedProjects, setUsedProjects] = useState(0);
  const [usedRegularizations, setUsedRegularizations] = useState(0);

  const fetchSubscriptionData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch user's plan_id from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('plan_id')
        .eq('id', user.id)
        .maybeSingle();

      const planId = profileData?.plan_id || 'start'; // fallback to start

      // 2. Fetch plan limits
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle();

      if (planData) {
        setCurrentPlan(planData);
      } else {
        // Fallback limits if table doesn't exist yet
        const fallbacks: Record<string, PlanLimits> = {
          'start': { id: 'start', name: 'START', max_projects: 1, max_regularizations: 1, access_projects: true, access_calculator: true, access_simulator: true },
          'pro': { id: 'pro', name: 'PRO', max_projects: 3, max_regularizations: 3, access_projects: true, access_calculator: true, access_simulator: true },
          'elite': { id: 'elite', name: 'ELITE', max_projects: 10, max_regularizations: 10, access_projects: true, access_calculator: true, access_simulator: true },
          'inss': { id: 'inss', name: 'INSS', max_projects: 0, max_regularizations: 99999, access_projects: false, access_calculator: true, access_simulator: true },
        };
        setCurrentPlan(fallbacks[planId] || fallbacks['start']);
      }

      // 3. Count used projects
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 4. Count used regularizations
      const { count: regCount } = await supabase
        .from('inss_regularizations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setUsedProjects(projectsCount || 0);
      setUsedRegularizations(regCount || 0);

    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  const checkProjectLimit = () => {
    if (!currentPlan) return false;
    if (!currentPlan.access_projects) return false;
    return usedProjects < currentPlan.max_projects;
  };

  const checkRegularizationLimit = () => {
    if (!currentPlan) return false;
    return usedRegularizations < currentPlan.max_regularizations;
  };

  return {
    loading,
    currentPlan,
    usedProjects,
    usedRegularizations,
    checkProjectLimit,
    checkRegularizationLimit,
    refresh: fetchSubscriptionData
  };
}

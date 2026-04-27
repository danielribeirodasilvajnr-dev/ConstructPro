import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
  isProprietor: boolean;
  profile: any;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProprietor, setIsProprietor] = useState<boolean>(() => {
    try {
      return localStorage.getItem('is-proprietor') === 'true';
    } catch {
      return false;
    }
  });

  const checkRole = async (userId: string) => {
    try {
      let { data: collaborations } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('user_id', userId);

      let { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // RETRY LOGIC FOR F5 RACE CONDITION: Bypass Supabase JS completely
      if (!profileData || !collaborations) {
        try {
          const sessionStr = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
          if (sessionStr) {
            const sessionData = JSON.parse(localStorage.getItem(sessionStr) || '{}');
            const token = sessionData?.access_token;
            if (token) {
              const [rawCollabsRes, rawProfileRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/project_collaborators?select=role&user_id=eq.${userId}`, {
                  headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${userId}`, {
                  headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
                })
              ]);
              
              if (rawCollabsRes.ok && rawProfileRes.ok) {
                const rawCollabs = await rawCollabsRes.json();
                const rawProfile = await rawProfileRes.json();
                
                if (rawCollabs && rawCollabs.length > 0) collaborations = rawCollabs;
                if (rawProfile && rawProfile.length > 0) profileData = rawProfile[0];
              }
            }
          }
        } catch (e) {
          console.error('Raw fetch fallback failed', e);
        }
      }

      let ownsProjects = false;
      try {
        const { data: proj } = await supabase.from('projects').select('id').eq('user_id', userId);
        ownsProjects = (proj || []).length > 0;
      } catch (e) {}

      if (profileData) {
        if (profileData.avatar_url === '') profileData.avatar_url = null;
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      const roles = collaborations || [];
      const proprietorRole = roles.find(c => c.role === 'proprietor');
      const isProp = !!proprietorRole && !ownsProjects;
      setIsProprietor(isProp);
      
      if (isProp) {
        localStorage.setItem('is-proprietor', 'true');
      } else {
        localStorage.removeItem('is-proprietor');
      }
    } catch (error) {
      console.error('Error checking role:', error);
    }
  };

  const initAuth = async () => {
    let mounted = true;
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    try {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        await checkRole(initialSession.user.id);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      clearTimeout(timeout);
      if (mounted) setLoading(false);
    }
    
    return () => { mounted = false; };
  };

  useEffect(() => {
    let cleanup = () => {};
    initAuth().then(fn => { cleanup = fn; });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkRole(session.user.id);
      } else {
        setIsProprietor(false);
        setProfile(null);
        localStorage.removeItem('is-proprietor');
      }
      setLoading(false);
    });

    return () => {
      cleanup();
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    profile,
    signOut: async () => {
      // Clear Supabase tokens manually to prevent ghost logins on fast redirects
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear app state
      setSession(null);
      setUser(null);
      setIsProprietor(false);
      setProfile(null);
      localStorage.removeItem('is-proprietor');
      
      // Clear navigation state
      sessionStorage.removeItem('activeTab');
      sessionStorage.removeItem('selectedProjectId');
      
      try {
        // Attempt server logout with a 2-second timeout so it never hangs
        await Promise.race([
          supabase.auth.signOut(),
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
      } catch (err) {
        console.error('SignOut error:', err);
      } finally {
        window.location.href = '/login';
      }
    },
    loading,
    isProprietor,
    refreshRole: () => user ? checkRole(user.id) : Promise.resolve(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

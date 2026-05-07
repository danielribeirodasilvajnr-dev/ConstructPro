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
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout')), 2000)
      );

      const supabaseCalls = Promise.all([
        supabase.from('project_collaborators').select('role').eq('user_id', userId),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      ]);

      let collaborations: any = { data: [] };
      let profileData: any = null;

      try {
        const results = await Promise.race([supabaseCalls, timeoutPromise]);
        collaborations = results[0].data;
        profileData = results[1].data;
      } catch (e) {
        console.warn('Supabase hung in checkRole, moving to fallback');
      }

      // RETRY LOGIC FOR F5 RACE CONDITION: Bypass Supabase JS completely
      if (!profileData || !collaborations || collaborations.length === 0) {
        try {
          const sessionStr = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
          if (sessionStr) {
            const sessionData = JSON.parse(localStorage.getItem(sessionStr) || '{}');
            const token = sessionData?.access_token;
            if (token) {
              const controller = new AbortController();
              const id = setTimeout(() => controller.abort(), 5000);

              try {
                const [rawCollabsRes, rawProfileRes] = await Promise.all([
                  fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/project_collaborators?select=role&user_id=eq.${userId}`, {
                    headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
                    signal: controller.signal
                  }),
                  fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${userId}`, {
                    headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
                    signal: controller.signal
                  })
                ]);
                
                clearTimeout(id);
                
                if (rawCollabsRes.ok && rawProfileRes.ok) {
                  const rawCollabs = await rawCollabsRes.json();
                  const rawProfile = await rawProfileRes.json();
                  
                  if (rawCollabs && rawCollabs.length > 0) collaborations = rawCollabs;
                  if (rawProfile && rawProfile.length > 0) profileData = rawProfile[0];
                }
              } catch (e) {
                console.error('Raw fetch inside checkRole failed:', e);
              }
            }
          }
        } catch (e) {
          console.error('Raw fetch fallback failed', e);
        }
      }

      if (profileData) {
        if (profileData.avatar_url === '') profileData.avatar_url = null;
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      // Check for proprietor status safely
      const roles = collaborations || [];
      const proprietorRole = roles.find((c: any) => c.role === 'proprietor');
      
      // Assume NOT proprietor if we can't verify ownership quickly, 
      // or just trust the role if it's explicitly proprietor.
      setIsProprietor(!!proprietorRole);
      
      if (proprietorRole) {
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

  const value = React.useMemo(() => ({
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
  }), [session, user, profile, loading, isProprietor]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

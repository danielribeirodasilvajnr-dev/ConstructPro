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
      const { data: collaborations } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('user_id', userId);

      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const roles = collaborations || [];
      const ownsProjects = (projects || []).length > 0;
      const proprietorRole = roles.find(c => c.role === 'proprietor');

      // If user is a proprietor in a collaboration AND does not own projects, they are a client
      const proprietorStatus = !!proprietorRole && !ownsProjects;
      setIsProprietor(proprietorStatus);
      localStorage.setItem('is-proprietor', String(proprietorStatus));

      if (profileData) {
        if (profileData.avatar_url === '') profileData.avatar_url = null;
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error checking role:', error);
    }
  };

  const initAuth = async () => {
    const timeout = setTimeout(() => {
      setLoading(false);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

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

    return () => subscription.unsubscribe();
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

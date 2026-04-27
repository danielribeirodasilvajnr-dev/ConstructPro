import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
  isProprietor: boolean;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProprietor, setIsProprietor] = useState<boolean>(() => {
    return localStorage.getItem('is-proprietor') === 'true';
  });

  const checkRole = async (userId: string) => {
    try {
      const { data: collaborations } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('user_id', userId);

      const { data: projects } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      const roles = collaborations || [];
      const ownsProjects = (projects || []).length > 0;
      const proprietorRole = roles.find(c => c.role === 'proprietor');
      
      const proprietorStatus = !!proprietorRole && !ownsProjects;
      setIsProprietor(proprietorStatus);
      localStorage.setItem('is-proprietor', String(proprietorStatus));
    } catch (error) {
      console.error('Error checking role:', error);
    }
  };

  useEffect(() => {
    // Busca a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkRole(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkRole(session.user.id).finally(() => setLoading(false));
      } else {
        setIsProprietor(false);
        localStorage.removeItem('is-proprietor');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    signOut,
    loading,
    isProprietor,
    refreshRole: () => user ? checkRole(user.id) : Promise.resolve(),
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

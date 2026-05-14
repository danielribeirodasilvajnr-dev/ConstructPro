import React, { useState } from 'react';
import Layout from './components/Layout';
import { DashboardView } from './pages/DashboardView';
import { supabase } from './lib/supabase';
import { ScheduleView } from './pages/ScheduleView';
import { FinancialsView } from './pages/FinancialsView';
import { LogsView } from './pages/LogsView';
import { BudgetView } from './pages/BudgetView';
import { ProjectsView } from './pages/ProjectsView';
import { ProprietorView } from './pages/ProprietorView';
import { CalculatorView } from './pages/CalculatorView';
import { RegularizationView } from './pages/RegularizationView';
import { AuthView } from './pages/AuthView';
import { FileSpreadsheet } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user, isProprietor, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>(() => {
    return sessionStorage.getItem('activeTab') || null;
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    return sessionStorage.getItem('selectedProjectId') || null;
  });

  // Save state to sessionStorage
  React.useEffect(() => {
    if (activeTab) sessionStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    if (selectedProjectId) {
      sessionStorage.setItem('selectedProjectId', selectedProjectId);
    } else {
      sessionStorage.removeItem('selectedProjectId');
    }
  }, [selectedProjectId]);

  React.useEffect(() => {
    if (authLoading || !user) return;

    if (isProprietor) {
      setActiveTab('safety');
      // If we don't have a selected project yet, we need to find it
      if (!selectedProjectId) {
        const checkProprietor = async () => {
          try {
            const timeoutPromise = new Promise<any>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 2000)
            );

            const supabaseCall = supabase.from('project_collaborators')
              .select('project_id')
              .eq('user_id', user.id)
              .eq('role', 'proprietor')
              .maybeSingle();

            let data = null;
            try {
              const res = await Promise.race([supabaseCall, timeoutPromise]);
              data = res.data;
            } catch (e) {
              console.warn('App.tsx hung, using fetch fallback for proprietor check');
              const sessionStr = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
              if (sessionStr) {
                const sessionData = JSON.parse(localStorage.getItem(sessionStr) || '{}');
                const token = sessionData?.access_token;
                if (token) {
                  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/project_collaborators?user_id=eq.${user.id}&role=eq.proprietor&select=project_id`, {
                    headers: {
                      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  if (res.ok) {
                    const list = await res.json();
                    if (list && list.length > 0) data = list[0];
                  }
                }
              }
            }

            if (data) setSelectedProjectId(data.project_id);
          } catch (err) {
            console.error('Error in App.tsx proprietor check:', err);
          }
        };
        checkProprietor();
      }
    } else {
      if (!activeTab) {
        setActiveTab(isAdmin ? 'dashboard' : 'projects');
      }
    }
  }, [user, isProprietor, authLoading, isAdmin]);

  // Failsafe: if activeTab is still null after 3 seconds of having a user, force it to dashboard
  React.useEffect(() => {
    if (user && !authLoading && !activeTab) {
      const fallbackTimer = setTimeout(() => {
        setActiveTab(isProprietor ? 'safety' : 'dashboard');
      }, 3000);
      return () => clearTimeout(fallbackTimer);
    }
  }, [user, authLoading, activeTab, isProprietor]);

  if (!user) {
    return <AuthView />;
  }

  if (authLoading || activeTab === null) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-6 z-[1000]">
        <div className="relative">
          <div className="h-24 w-24 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center animate-pulse overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent animate-pulse" />
            <div className="h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <div className="absolute -inset-8 bg-primary/5 blur-3xl rounded-full animate-pulse" />
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-[8px] animate-pulse">360Pro</h2>
          <div className="flex items-center gap-2 justify-center">
            <div className="h-1 w-1 bg-primary rounded-full animate-ping" />
            <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-[3px]">Inicializando Sistemas...</p>
          </div>
        </div>
      </div>
    );
  }


  const renderView = () => {
    // Hard lock for Proprietor profile: Prevents tab state manipulation via DevTools/sessionStorage
    if (isProprietor) {
      return <ProprietorView selectedProjectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return isAdmin ? <DashboardView /> : <ProjectsView selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
      case 'projects':
        return <ProjectsView selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
      case 'schedule':
        return <ScheduleView selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
      case 'financials':
        return <FinancialsView selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
      case 'logs':
        return <LogsView selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
      case 'calculator':
        return isAdmin ? <CalculatorView /> : <ProjectsView selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
      case 'regularization':
        return isAdmin ? <RegularizationView /> : <ProjectsView selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
      case 'safety':
        return <ProprietorView selectedProjectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />;
      default:
        return <ProjectsView selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'projects': return 'Projetos';
      case 'schedule': return 'Cronograma de Obra';
      case 'financials': return 'Financeiro da Obra';
      case 'logs': return 'Diário de Obra';
      case 'calculator': return 'Calculadora INSS';
      case 'regularization': return 'Regularização INSS';
      case 'safety': return 'Painel do Proprietário';
      default: return '360Pro';
    }
  };

  return (
    <Layout
      activeTab={activeTab || 'dashboard'}
      setActiveTab={setActiveTab}
      title={getTitle()}
      isClient={isProprietor}
    >
      {renderView()}
    </Layout>
  );
}

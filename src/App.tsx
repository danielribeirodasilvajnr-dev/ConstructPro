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
import { AuthView } from './pages/AuthView';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user, isProprietor, loading: authLoading } = useAuth();
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
        supabase.from('project_collaborators')
          .select('project_id')
          .eq('user_id', user.id)
          .eq('role', 'proprietor')
          .maybeSingle()
          .then(({ data }) => {
            if (data) setSelectedProjectId(data.project_id);
          });
      }
    } else {
      if (!activeTab || activeTab === 'safety') {
        setActiveTab('dashboard');
      }
    }
  }, [user, isProprietor, authLoading]);

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
      <div className="fixed inset-0 bg-[#1C232E] flex flex-col items-center justify-center gap-6 z-[1000]">
        <div className="relative">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-[4px]">AevumPro</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sincronizando ambiente seguro...</p>
        </div>
      </div>
    );
  }


  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'projects':
        return <ProjectsView selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
      case 'schedule':
        return <ScheduleView selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
      case 'financials':
        return <FinancialsView selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
      case 'logs':
        return <LogsView selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
      case 'resources':
        return <CalculatorView />;
      case 'safety':
        return <ProprietorView selectedProjectId={selectedProjectId} />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'projects': return 'Projetos';
      case 'schedule': return 'Cronograma de Obra';
      case 'financials': return 'Financeiro da Obra';
      case 'logs': return 'Diário de Obra';
      case 'resources': return 'Calculadora INSS';
      case 'safety': return 'Painel do Proprietário';
      default: return 'AevumPro';
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

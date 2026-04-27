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
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const { user } = useAuth();

    async function checkRole() {
      if (!user) {
        setIsRoleLoading(false);
        return;
      }

      setIsRoleLoading(true);
      try {
        // Check if user is proprietor in any project
        const { data: collaborations } = await supabase
          .from('project_collaborators')
          .select('project_id, role')
          .eq('user_id', user.id);

        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id);

        const roles = collaborations || [];
        const ownsProjects = (projects || []).length > 0;
        const isProprietorOf = roles.find(c => c.role === 'proprietor');

        if (isProprietorOf && !ownsProjects) {
          setIsClient(true);
          setActiveTab('safety');
          setSelectedProjectId(isProprietorOf.project_id);
        } else {
          setIsClient(false);
          setActiveTab('dashboard');
        }
      } catch (error) {
        console.error('Error checking role:', error);
        setActiveTab('dashboard');
      } finally {
        setIsRoleLoading(false);
      }
    }
    checkRole();
  }, [user]);

  if (!user) {
    return <AuthView />;
  }

  if (isRoleLoading || activeTab === null) {
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
        return <DashboardView />;
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
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={getTitle()}
      isClient={isClient}
    >
      {renderView()}
    </Layout>
  );
}

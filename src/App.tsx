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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { user } = useAuth();

  React.useEffect(() => {
    async function checkRole() {
      if (!user) return;

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
      }
    }
    checkRole();
  }, [user]);

  if (!user) {
    return <AuthView />;
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
      default: return 'ConstructPro';
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

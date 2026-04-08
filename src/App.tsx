import React, { useState } from 'react';
import Layout from './components/Layout';
import { DashboardView } from './pages/DashboardView';
import { ScheduleView } from './pages/ScheduleView';
import { FinancialsView } from './pages/FinancialsView';
import { LogsView } from './pages/LogsView';
import { BudgetView } from './pages/BudgetView';
import { ProjectsView } from './pages/ProjectsView';
import { ProprietorView } from './pages/ProprietorView';
import { AuthView } from './pages/AuthView';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { user } = useAuth();

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
        return <BudgetView selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
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
      case 'resources': return 'Orçamento Executivo';
      case 'safety': return 'Painel do Proprietário';
      default: return 'ConstructPro';
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} title={getTitle()}>
      {renderView()}
    </Layout>
  );
}

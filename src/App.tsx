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
  const { user } = useAuth();

  if (!user) {
    return <AuthView />;
  }


  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'projects':
        return <ProjectsView />;
      case 'schedule':
        return <ScheduleView />;
      case 'financials':
        return <FinancialsView />;
      case 'logs':
        return <LogsView />;
      case 'resources':
        return <BudgetView />;
      case 'safety':
        return <ProprietorView />;
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

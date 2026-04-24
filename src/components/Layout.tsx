import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title?: string;
  isClient?: boolean;
}

export default function Layout({ children, activeTab, setActiveTab, title, isClient }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isClient={isClient} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      {/* Main Content */}
      <main className={cn(
        "flex flex-1 flex-col transition-all duration-300 w-full min-w-0",
        isCollapsed ? "md:ml-20" : "md:ml-72",
        "ml-0" // Always 0 margin on mobile
      )}>
        <Header title={title} />

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </div>
      </main>

      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} isClient={isClient} />
    </div>
  );
}


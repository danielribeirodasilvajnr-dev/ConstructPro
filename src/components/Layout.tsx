import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content */}
      <main className={cn(
        "flex flex-1 flex-col transition-all duration-300 w-full min-w-0",
        isCollapsed ? "ml-0" : "md:ml-72",
        "ml-0"
      )}>
        <Header
          title={title}
          onMenuClick={() => {
            if (window.innerWidth < 768) {
              setIsMobileSidebarOpen(true);
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
        />

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}


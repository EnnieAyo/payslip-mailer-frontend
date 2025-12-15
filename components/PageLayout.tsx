'use client';

import { ReactNode } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { Navigation } from './Navigation';

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
}

export function PageLayout({ children, maxWidth = 'none' }: PageLayoutProps) {
  const { isCollapsed } = useSidebar();

  const maxWidthClass = maxWidth !== 'none' ? `max-w-${maxWidth}` : '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800">
      <Navigation />
      <main
        className={`transition-all duration-300 pt-16 md:pt-8 px-4 sm:px-6 lg:px-8 pb-8 ${
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
        } ${maxWidthClass}`}
      >
        {children}
      </main>
    </div>
  );
}

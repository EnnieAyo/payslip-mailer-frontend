'use client';

import { useSidebar } from '@/contexts/SidebarContext';

export function Footer() {
  const { isCollapsed } = useSidebar();

  return (
    <footer className={`transition-all duration-300 bg-white dark:bg-dark-700 border-t border-gray-200 dark:border-dark-600 py-4 ${
      isCollapsed ? 'md:ml-20' : 'md:ml-64'
    }`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          All rights reserved.{' '}
          <a
            href="mailto:mail@rayzenlimited.com"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
          >
            Rayzen Limited
          </a>
          {' '}© 2025
        </p>
      </div>
    </footer>
  );
}

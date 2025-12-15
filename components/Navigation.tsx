'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  LogOut,
  User,
  Moon,
  Sun,
  ChevronDown,
  Shield,
  Users,
  UserCog,
  LayoutDashboard,
  UsersRound,
  FileText,
  BarChart3,
  ScrollText,
  Settings,
  ChevronRight
} from 'lucide-react';

export function Navigation() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed: isSidebarCollapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccessMenuOpen, setIsAccessMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: UsersRound },
    { name: 'Payslips', path: '/payslips', icon: FileText },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Audit Logs', path: '/audit-logs', icon: ScrollText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const accessMenuItems = [
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Roles', path: '/roles', icon: Shield },
  ];

  const isAccessMenuActive = accessMenuItems.some(item => pathname === item.path);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-dark-900 dark:bg-dark-950 border-b-2 border-primary-600">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/dashboard" className="text-xl font-bold text-primary-500">
            Payslip Mailer
          </Link>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-800"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-800"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex md:flex-col fixed left-0 top-0 h-screen bg-dark-900 dark:bg-dark-950 border-r-2 border-primary-600 transition-all duration-300 z-40 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Logo & Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b-2 border-primary-600">
          {!isSidebarCollapsed && (
            <Link href="/dashboard" className="text-xl font-bold text-primary-500 hover:text-primary-400 transition-colors">
              Payslip Mailer
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                    pathname === item.path
                      ? 'bg-primary-500 text-dark-900 shadow-md'
                      : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}

            {/* Access Management Section */}
            <div className="pt-4 mt-4 border-t border-dark-700">
              {!isSidebarCollapsed && (
                <button
                  onClick={() => setIsAccessMenuOpen(!isAccessMenuOpen)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                    isAccessMenuActive
                      ? 'bg-primary-500 text-dark-900'
                      : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <UserCog className="w-5 h-5" />
                    <span>Access Mgmt</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isAccessMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              )}

              {(!isSidebarCollapsed && isAccessMenuOpen) || isSidebarCollapsed ? (
                <div className={isSidebarCollapsed ? 'space-y-1' : 'space-y-1 pl-4 mt-1'}>
                  {accessMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          pathname === item.path
                            ? 'bg-primary-500 text-dark-900'
                            : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                        } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                        title={isSidebarCollapsed ? item.name : undefined}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {!isSidebarCollapsed && <span>{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t-2 border-primary-600 p-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-800 hover:text-white transition-all mb-2 ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
            title={isSidebarCollapsed ? 'Toggle theme' : undefined}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            {!isSidebarCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          {/* User Info */}
          {!isSidebarCollapsed && (
            <div className="flex items-center space-x-2 px-3 py-2 mb-2">
              <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-900 hover:text-white transition-all ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
            title={isSidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="fixed top-16 left-0 right-0 bottom-0 bg-dark-900 dark:bg-dark-950 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pt-4 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      pathname === item.path
                        ? 'bg-primary-500 text-dark-900'
                        : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Access Management Section */}
              <div className="pt-4 mt-4 border-t border-dark-700">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-2">
                  <UserCog className="w-4 h-4" />
                  <span>Access Management</span>
                </div>
                {accessMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 pl-6 pr-3 py-2 rounded-lg text-base font-medium transition-colors ${
                        pathname === item.path
                          ? 'bg-primary-500 text-dark-900'
                          : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Mobile User Section */}
            <div className="pt-4 pb-3 border-t-2 border-primary-600 px-4">
              <div className="flex items-center space-x-2 px-3 py-2 mb-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-base font-medium text-gray-300 hover:bg-red-900 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

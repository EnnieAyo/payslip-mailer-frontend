'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  Settings
} from 'lucide-react';

export function Navigation() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccessMenuOpen, setIsAccessMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccessMenuOpen(false);
      }
    }

    if (isAccessMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isAccessMenuOpen]);

  return (
    <nav className="bg-dark-900 dark:bg-dark-950 text-white border-b-2 border-primary-600 dark:border-primary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-primary-500 hover:text-primary-400 transition-colors">
              Payslip Mailer
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors border-2 ${
                      pathname === item.path
                        ? 'bg-primary-500 text-dark-900 border-primary-600 shadow-md'
                        : 'text-gray-300 border-transparent hover:bg-dark-800 hover:text-white hover:border-primary-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Access Management Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsAccessMenuOpen(!isAccessMenuOpen)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors border-2 ${
                    isAccessMenuActive
                      ? 'bg-primary-500 text-dark-900 border-primary-600 shadow-md'
                      : 'text-gray-300 border-transparent hover:bg-dark-800 hover:text-white hover:border-primary-500'
                  }`}
                >
                  <UserCog className="w-4 h-4" />
                  <span>Access Management</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isAccessMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAccessMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-dark-800 border-2 border-primary-500 z-50">
                    <div className="py-1">
                      {accessMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            onClick={() => setIsAccessMenuOpen(false)}
                            className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                              pathname === item.path
                                ? 'bg-primary-500 text-dark-900'
                                : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Menu & Theme Toggle */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-300 hover:bg-dark-800 hover:text-white transition-colors border-2 border-transparent hover:border-primary-500"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-300">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-dark-800 hover:text-white transition-colors border-2 border-transparent hover:border-red-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-800"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-800 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-dark-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
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
            <div className="pt-2">
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
                    className={`flex items-center space-x-2 pl-6 pr-3 py-2 rounded-md text-base font-medium transition-colors ${
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
          <div className="pt-4 pb-3 border-t border-dark-700">
            <div className="flex items-center px-5 space-x-2">
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
              className="mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-dark-800 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

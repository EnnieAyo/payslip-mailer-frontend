'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Users, FileText, Clock, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const router = useRouter();

  const { data: employeesData } = useQuery({
    queryKey: ['employees', { page: 1, limit: 1 }],
    queryFn: () => apiClient.getEmployees(0, 1),
    enabled: !!user,
  });

  const { data: unsentPayslipsData } = useQuery({
    queryKey: ['payslips', 'unsent'],
    queryFn: () => apiClient.getUnsentPayslips(),
    enabled: !!user,
  });

  const { data: auditLogsData } = useQuery({
    queryKey: ['audit-logs', { page: 1, limit: 10 }],
    queryFn: () => apiClient.getAuditLogs(1, 10),
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Employees',
      value: employeesData?.meta?.total || 0,
      icon: Users,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
      borderColor: 'border-primary-200',
    },
    {
      title: 'Total Payslips',
      value: (unsentPayslipsData?.data?.length || 0),
      icon: FileText,
      color: 'text-dark-700',
      bgColor: 'bg-dark-100',
      borderColor: 'border-dark-200',
    },
    {
      title: 'Unsent Payslips',
      value: unsentPayslipsData?.data?.filter((p: any) => !p.sentAt).length || 0,
      icon: Clock,
      color: 'text-primary-700',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-300',
    },
    {
      title: 'Recent Activity',
      value: auditLogsData?.meta?.total || 0,
      icon: CheckCircle,
      color: 'text-dark-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800 flex flex-col">
      <Navigation />
      <main className={`flex-1 transition-all duration-300 pt-16 md:pt-8 px-4 sm:px-6 lg:px-8 pb-8 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome back, {user.firstName}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.title}
              className={`bg-white dark:bg-dark-700 rounded-lg border-2 ${stat.borderColor} dark:border-dark-600 shadow p-6 hover:shadow-xl hover:scale-105 transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-dark-900 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} dark:bg-dark-600 p-3 rounded-lg border ${stat.borderColor} dark:border-dark-500`}>
                  <stat.icon className={`w-6 h-6 ${stat.color} dark:text-primary-400`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-dark-700 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600">
            <h2 className="text-xl font-semibold text-dark-900 dark:text-gray-100">Recent Activity</h2>
          </div>
          <div className="p-6">
            {auditLogsData?.data && auditLogsData.data.length > 0 ? (
              <div className="space-y-4">
                {auditLogsData.data.slice(0, 5).map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-3 pb-4 border-b border-gray-100 dark:border-dark-600 last:border-0"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-dark-900 dark:text-gray-100">
                        {log.action} by {log.user?.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/Button';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { AuditLog } from '@/types';
import { Search, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

export default function AuditLogsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const limit = 20;

  const { data, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['audit-logs', { page }],
    queryFn: () => apiClient.getAuditLogs(page, limit),
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

  const auditLogs = data?.data || [];
  const filteredLogs = search
    ? auditLogs.filter(
        (log: AuditLog) =>
          log.action.toLowerCase().includes(search.toLowerCase()) ||
          log.user?.email.toLowerCase().includes(search.toLowerCase()) ||
          log.details?.toLowerCase().includes(search.toLowerCase())
      )
    : auditLogs;

  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('REGISTER')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('UPDATE') || action.includes('EDIT')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (action.includes('DELETE') || action.includes('REMOVE')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.includes('LOGIN') || action.includes('LOGOUT')) {
      return 'bg-purple-100 text-purple-800';
    }
    if (action.includes('UPLOAD') || action.includes('SEND')) {
      return 'bg-primary-100 text-primary-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">View system activity and user actions</p>
        </div>

        <div className="bg-white dark:bg-dark-700 rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by action, user, or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.map((log: AuditLog) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{log.user?.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-md white-space-pre-wrap break-words">
                            {log.details || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of{' '}
                    {total} logs
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white dark:bg-dark-700 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-dark-900 dark:text-gray-100 mb-4">About Audit Logs</h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Audit logs track all significant actions performed in the system, including user
              authentication, employee management, payslip uploads, and system configuration changes.
            </p>
            <p>
              Each log entry includes the action performed, the user who performed it, relevant
              details, and a timestamp. This helps maintain accountability and track system usage.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                CREATE/REGISTER
              </span>
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                UPDATE/EDIT
              </span>
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                DELETE/REMOVE
              </span>
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                LOGIN/LOGOUT
              </span>
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                UPLOAD/SEND
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/Button';
import { Footer } from '@/components/Footer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Payslip } from '@/types';
import { Upload, FileText, Search, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PayslipsPage() {
  const { user, isLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'unsent'>('all');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const limit = 10;

  const { data, isLoading: isLoadingPayslips } = useQuery({
    queryKey: ['payslips', { page, search, statusFilter }],
    queryFn: async () => {
      if (statusFilter === 'unsent') {
        return apiClient.getUnsentPayslips();
      }
      // For 'all' and 'sent' we need to implement filtering on backend or client-side
      const result = await apiClient.getUnsentPayslips();
      return result;
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadPayslips(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      toast.success('Payslips uploaded successfully');
      setUploading(false);
    },
    onError: () => {
      toast.error('Failed to upload payslips');
      setUploading(false);
    },
  });

  const resendMutation = useMutation({
    mutationFn: (id: number) => apiClient.resendPayslip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      toast.success('Payslip resent successfully');
    },
    onError: () => {
      toast.error('Failed to resend payslip');
    },
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.includes('pdf') && !file.type.includes('zip') && !file.name.endsWith('.zip')) {
        toast.error('Please upload a PDF or ZIP file');
        return;
      }

      setUploading(true);
      uploadMutation.mutate(file);
    },
    [uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const payslips = data?.data || [];
  const filteredPayslips = payslips.filter((p: Payslip) => {
    const matchesSearch =
      !search ||
      p.employee?.firstName.toLowerCase().includes(search.toLowerCase()) ||
      p.employee?.lastName.toLowerCase().includes(search.toLowerCase()) ||
      p.employee?.email.toLowerCase().includes(search.toLowerCase()) ||
      p.employee?.ippisNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'sent' && p.sentAt) ||
      (statusFilter === 'unsent' && !p.sentAt);

    return matchesSearch && matchesStatus;
  });

  const total = filteredPayslips.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedPayslips = filteredPayslips.slice((page - 1) * limit, page * limit);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800 flex flex-col">
      <Navigation />
      <main className={`flex-1 transition-all duration-300 pt-16 md:pt-8 px-4 sm:px-6 lg:px-8 pb-8 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100">Payslips</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Upload and manage employee payslips</p>
        </div>

        <div
          className={`bg-white rounded-lg shadow p-8 mb-6 border-2 border-dashed transition-colors ${
            dragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-dark-900 dark:text-gray-100">Upload Payslips</h3>
            <p className="mt-1 text-sm text-gray-500">
              Drag and drop a PDF or ZIP file here, or click to select
            </p>
            <div className="mt-6">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.zip"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center justify-center px-4 py-2 border-2 border-primary-600 text-sm font-medium rounded-lg shadow-sm text-dark-900 dark:text-gray-100 bg-primary-500 hover:bg-primary-600 hover:border-primary-700 hover:shadow-md active:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 ${
                  uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-700 rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or IPPIS..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${
                  statusFilter === 'all'
                    ? 'bg-primary-500 text-dark-900 dark:text-gray-100 border-primary-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-primary-50 hover:border-primary-400 hover:shadow-sm'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setStatusFilter('sent');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${
                  statusFilter === 'sent'
                    ? 'bg-primary-500 text-dark-900 dark:text-gray-100 border-primary-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-primary-50 hover:border-primary-400 hover:shadow-sm'
                }`}
              >
                Sent
              </button>
              <button
                onClick={() => {
                  setStatusFilter('unsent');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${
                  statusFilter === 'unsent'
                    ? 'bg-primary-500 text-dark-900 dark:text-gray-100 border-primary-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-primary-50 hover:border-primary-400 hover:shadow-sm'
                }`}
              >
                Unsent
              </button>
            </div>
          </div>

          {isLoadingPayslips ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : paginatedPayslips.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No payslips found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IPPIS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent At
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedPayslips.map((payslip: Payslip) => (
                      <tr key={payslip.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-dark-900 dark:text-gray-100">
                            {payslip.employee?.firstName} {payslip.employee?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{payslip.employee?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payslip.employee?.ippisNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payslip.month}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {payslip.sentAt ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Unsent
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payslip.sentAt
                              ? new Date(payslip.sentAt).toLocaleString()
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!payslip.sentAt && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resendMutation.mutate(payslip.id)}
                              loading={resendMutation.isPending}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
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
                    {total} payslips
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
      </main>
      <Footer />
    </div>
  );
}

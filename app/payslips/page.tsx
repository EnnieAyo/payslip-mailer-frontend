'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { PayslipBatch, BatchDetails } from '@/types/payslip-batch.types';
import { Upload, Search, ChevronLeft, ChevronRight, Eye, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PayslipUploadModal } from '@/components/payslips/PayslipUploadModal';
import { BatchDetailsModal } from '@/components/payslips/BatchDetailsModal';

export default function PayslipBatchesPage() {
  const { user, isLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchDetails | null>(null);

  const limit = 10;

  const { data, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['payslip-batches', { page, search, statusFilter }],
    queryFn: async () => {
      return apiClient.getPayslipBatches({
        page,
        limit,
        payMonth: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, payMonth }: { file: File; payMonth: string }) =>
      apiClient.uploadPayslipBatch(file, payMonth),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslip-batches'] });
    },
  });

  const batchDetailsMutation = useMutation({
    mutationFn: (batchId: string) => apiClient.getBatchDetails(batchId),
    onSuccess: (response) => {
      setSelectedBatch(response.data as BatchDetails);
      setDetailsModalOpen(true);
    },
    onError: () => {
      toast.error('Failed to load batch details');
    },
  });

  const sendBatchMutation = useMutation({
    mutationFn: (batchId: string) => apiClient.sendBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslip-batches'] });
    },
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

  const batches = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 0;

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      processed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    };
    const s = config[status as keyof typeof config] || config.pending;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getEmailStatusBadge = (emailStatus: string) => {
    const config = {
      pending: { bg: 'bg-orange-100', text: 'text-orange-800' },
      sending: { bg: 'bg-blue-100', text: 'text-blue-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      failed: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const s = config[emailStatus as keyof typeof config] || config.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        {emailStatus.charAt(0).toUpperCase() + emailStatus.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800 flex flex-col">
      <Navigation />
      <main className={`flex-1 transition-all duration-300 pt-16 md:pt-8 px-4 sm:px-6 lg:px-8 pb-8 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100">Payslip Batches</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Upload, review, and send payslip batches
            </p>
          </div>
          <Button onClick={() => setUploadModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Batch
          </Button>
        </div>

        <div className="bg-white dark:bg-dark-700 rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Filter by pay month (e.g., 2025-12)..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'processing', 'processed', 'completed', 'failed'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 ${
                    statusFilter === status
                      ? 'bg-primary-500 text-gray-900 dark:text-gray-100 border-primary-600 shadow-md'
                      : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-400 border-gray-300 hover:bg-primary-50 hover:border-primary-400'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {isLoadingBatches ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No batches found</p>
              <Button onClick={() => setUploadModalOpen(true)} className="mt-4">
                Upload First Batch
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        File Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Pay Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Files
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Email Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                    {batches.map((batch: PayslipBatch) => (
                      <tr key={batch.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-dark-900 dark:text-gray-100">{batch.fileName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-200">{batch.payMonth}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-200">
                            {batch.processedFiles || batch.totalFiles} / {batch.totalFiles}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(batch.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getEmailStatusBadge(batch.emailStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(batch.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => batchDetailsMutation.mutate(batch.uuid)}
                              loading={batchDetailsMutation.isPending}
                            >
                              <Eye className="w-4 h-4 text-gray-900 dark:text-gray-400" />
                            </Button>
                            {batch.status === 'processed' && batch.emailStatus === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Send emails for ${batch.payMonth} batch?`)) {
                                    sendBatchMutation.mutate(batch.uuid);
                                  }
                                }}
                                loading={sendBatchMutation.isPending}
                              >
                                <Send className="w-4 h-4 text-gray-900 dark:text-gray-400" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} batches
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

      <PayslipUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['payslip-batches'] });
        }}
        onUpload={(file, payMonth) => uploadMutation.mutateAsync({ file, payMonth })}
      />

      <BatchDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedBatch(null);
        }}
        batch={selectedBatch}
        onSend={(batchId) => sendBatchMutation.mutateAsync(batchId)}
        loading={sendBatchMutation.isPending}
      />
      <Footer />
    </div>
  );
}

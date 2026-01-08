'use client';

import { useState, useEffect } from 'react';
import { X, Send, CheckCircle, XCircle, Clock, AlertCircle, Mail, User, Loader } from 'lucide-react';
import { Button } from '@/components/Button';
import { BatchDetails } from '@/types';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';

interface BatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchDetails | null;
  onSend: (batchId: string) => Promise<any>;
  loading?: boolean;
}

export function BatchDetailsModal({ isOpen, onClose, batch, onSend, loading = false }: BatchDetailsModalProps) {
  const [sending, setSending] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'waiting' | 'active' | 'completed' | 'failed'>('waiting');
  const [progress, setProgress] = useState<number | { stage: string; processed: number; total: number; percentage: number } | null>(null);
  const [failedReason, setFailedReason] = useState<string | null>(null);

  const handleSend = async () => {
    setSending(true);
    try {
      const response = await onSend(batch?.uuid || '');
      // Expecting { jobId: string } in response.data
      if (response.data?.jobId) {
        setJobId(response.data.jobId);
        setIsProcessing(true);
        setProcessingStatus('waiting');
        toast.success('Email batch queued for sending');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to queue batch');
      setIsProcessing(false);
    } finally {
      setSending(false);
    }
  };

  // Poll job status
  useEffect(() => {
    if (!jobId || !isProcessing) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await apiClient.getSendBatchJobStatus(jobId);
        const jobStatus = response.data;

        if (jobStatus) {
          setProcessingStatus(jobStatus.state);
          setProgress(jobStatus.progress);

          // Handle completed state
          if (jobStatus.state === 'completed') {
            setIsProcessing(false);
            toast.success('All emails sent successfully!');

            // Close modal after short delay
            setTimeout(() => {
              handleReset();
              onClose();
            }, 5000);
          }

          // Handle failed state
          if (jobStatus.state === 'failed') {
            setIsProcessing(false);
            setFailedReason(jobStatus.failedReason || 'Unknown error occurred');
            toast.error(jobStatus.failedReason || 'Email sending failed');
          }
        }
      } catch (error: any) {
        console.error('Error polling job status:', error);
        setIsProcessing(false);
        setProcessingStatus('failed');
        setFailedReason(error.message || 'Failed to check send status');
        toast.error('Failed to check send status.');
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, isProcessing, onClose]);

  const handleReset = () => {
    setJobId(null);
    setIsProcessing(false);
    setProcessingStatus('waiting');
    setProgress(null);
    setFailedReason(null);
  };

  if (!isOpen || !batch) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      processed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getEmailStatusBadge = (emailStatus: string) => {
    const statusConfig = {
      pending: { bg: 'bg-orange-100', text: 'text-orange-800', icon: Clock },
      sending: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Mail },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    };

    const config = statusConfig[emailStatus as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {emailStatus.charAt(0).toUpperCase() + emailStatus.slice(1)}
      </span>
    );
  };

  const sentPayslips = batch.payslips.filter(p => p.emailSent);
  const unsentPayslips = batch.payslips.filter(p => !p.emailSent);
  const failedPayslips = batch.payslips.filter(p => p.emailError);

  const canSend = batch.status === 'processed' && batch.emailStatus === 'pending' && unsentPayslips.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
          <div>
            <h2 className="text-2xl font-bold text-dark-900 dark:text-gray-100">Batch Details</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{batch.fileName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-300">Pay Month</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{batch.payMonth}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-sm font-medium text-green-900 dark:text-green-300">Total Files</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{batch.totalFiles}</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="text-sm font-medium text-purple-900 dark:text-purple-300">Processed</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{batch.processedFiles}</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="text-sm font-medium text-orange-900 dark:text-orange-300">Status</div>
              <div className="mt-2">{getStatusBadge(batch.status)}</div>
            </div>
          </div>

          {/* Email Status */}
          <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Email Status</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getEmailStatusBadge(batch.emailStatus)}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-green-600">{sentPayslips.length} sent</span>
                  {' · '}
                  <span className="font-medium text-orange-600">{unsentPayslips.length} unsent</span>
                  {failedPayslips.length > 0 && (
                    <>
                      {' · '}
                      <span className="font-medium text-red-600">{failedPayslips.length} failed</span>
                    </>
                  )}
                </div>
              </div>
              {batch.sentAt && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Sent: {new Date(batch.sentAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Payslips Table */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Payslips ({batch.payslips.length})
            </h3>
            <div className="border border-gray-200 dark:border-dark-600 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        IPPIS
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Filename
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-700 divide-y divide-gray-200 dark:divide-dark-600">
                    {batch.payslips.map((payslip) => (
                      <tr key={payslip.id} className="hover:bg-gray-50 dark:hover:bg-dark-600">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div className="text-sm font-medium text-dark-900 dark:text-gray-100">
                              {payslip.employee.firstName} {payslip.employee.lastName}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {payslip.employee.ippisNumber}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {payslip.employee.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {payslip.fileName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {payslip.emailSent ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Sent
                            </span>
                          ) : payslip.emailError ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                          )}
                          {payslip.emailError && (
                            <div className="text-xs text-red-600 mt-1">{payslip.emailError}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="bg-white dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sending Emails</h3>
                <div className={`flex items-center text-sm ${
                  processingStatus === 'failed' ? 'text-red-600 dark:text-red-400' :
                  processingStatus === 'completed' ? 'text-green-600 dark:text-green-400' :
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  {processingStatus === 'failed' ? (
                    <XCircle className="w-4 h-4 mr-2" />
                  ) : processingStatus === 'completed' ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  <span className="font-medium capitalize">{processingStatus}</span>
                </div>
              </div>

              <div className={`rounded-lg p-3 ${
                processingStatus === 'failed'
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : processingStatus === 'completed'
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <div className="flex items-start">
                  {processingStatus === 'failed' ? (
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  ) : processingStatus === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-xs mb-1 ${
                      processingStatus === 'failed'
                        ? 'text-red-700 dark:text-red-300'
                        : processingStatus === 'completed'
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-blue-700 dark:text-blue-300'
                    }`}>
                      Job ID: <span className="font-mono font-semibold">{jobId}</span>
                    </p>
                    {failedReason && processingStatus === 'failed' && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{failedReason}</p>
                    )}
                    {typeof progress === 'object' && progress && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Sent {progress.processed} of {progress.total} emails
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {processingStatus !== 'failed' && processingStatus !== 'completed' && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{typeof progress === 'object' && progress ? progress.percentage : (progress ?? 0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${typeof progress === 'object' && progress ? progress.percentage : (progress ?? 0)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {canSend ? (
              <span className="text-green-600 dark:text-green-400 font-medium">
                Ready to send {unsentPayslips.length} email{unsentPayslips.length !== 1 ? 's' : ''}
              </span>
            ) : batch.emailStatus === 'completed' ? (
              <span className="text-green-600 dark:text-green-400 font-medium">
                All emails sent successfully
              </span>
            ) : (
              <span>Batch status: {batch.status}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={sending || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Close'}
            </Button>
            {canSend && !isProcessing && (
              <Button
                onClick={handleSend}
                loading={sending}
                disabled={sending || loading || isProcessing}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Emails
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Upload, Calendar, Clock, Loader, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { UploadResultDto } from '@/types';

interface PayslipUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PayslipUploadModal({ isOpen, onClose, onSuccess }: PayslipUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [payMonth, setPayMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'queued' | 'processing' | 'completed' | 'failed'>('queued');
  const [progress, setProgress] = useState<number | { stage: string; processed: number; total: number; percentage: number } | null>(null);
  const [failedReason, setFailedReason] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResultDto | null>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.includes('pdf') && !selectedFile.type.includes('zip') && !selectedFile.name.endsWith('.zip')) {
      toast.error('Please upload a PDF or ZIP file');
      return;
    }
    setFile(selectedFile);
  }, []);

  // Poll job status
  useEffect(() => {
    if (!jobId || !isProcessing) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await apiClient.getPayslipUploadJobStatus(jobId);
        const jobStatus = response.data;
        
        if (jobStatus) {
          setProcessingStatus(jobStatus.state);
          setProgress(jobStatus.progress);
          
          // Handle completed state
          if (jobStatus.state === 'completed' && jobStatus.result) {
            setUploadResult(jobStatus.result);
            setIsProcessing(false);
            toast.success('Payslips processed successfully!');
            
            // Close modal after short delay
            setTimeout(() => {
              handleReset();
              onSuccess();
              onClose();
            }, 2000);
          }
          
          // Handle failed state
          if (jobStatus.state === 'failed') {
            setIsProcessing(false);
            setFailedReason(jobStatus.failedReason || 'Unknown error occurred');
            toast.error(jobStatus.failedReason || 'Upload processing failed');
          }
        }
      } catch (error: any) {
        console.error('Error polling job status:', error);
        setIsProcessing(false);
        setProcessingStatus('failed');
        setFailedReason(error.message || 'Failed to check upload status');
        toast.error('Failed to check upload status.');
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, isProcessing, onSuccess, onClose]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!payMonth) {
      toast.error('Please select pay month');
      return;
    }

    setUploading(true);
    try {
      const response = await apiClient.uploadPayslipBatch(file, payMonth);
      const data = response.data;
      setJobId(data.jobId);
      setIsProcessing(true);
      setProcessingStatus('queued');
      setUploading(false);
      toast.success(data.message || 'File uploaded and queued for processing');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      setUploading(false);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setJobId(null);
    setIsProcessing(false);
    setProcessingStatus('queued');
    setProgress(null);
    setFailedReason(null);
    setUploadResult(null);
  };

  const handleClose = () => {
    if (!uploading && !isProcessing) {
      handleReset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
          <h2 className="text-2xl font-bold text-dark-900 dark:text-gray-100">Upload Payslips</h2>
          <button
            onClick={handleClose}
            disabled={uploading || isProcessing}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Pay Month Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline-block mr-2" />
              Pay Month *
            </label>
            <input
              type="month"
              value={payMonth}
              onChange={(e) => setPayMonth(e.target.value)}
              disabled={uploading || isProcessing}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-600 dark:text-gray-100 disabled:opacity-50"
              required
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select the month and year for these payslips
            </p>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragging
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-dark-500'
            } ${uploading || isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            {file ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-dark-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setFile(null)}
                  disabled={uploading || isProcessing}
                  className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-medium text-dark-900 dark:text-gray-100 mb-2">
                  Drop your file here, or click to select
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  PDF or ZIP files accepted
                </p>
                <input
                  type="file"
                  id="file-upload-modal"
                  className="hidden"
                  accept=".pdf,.zip"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFileSelect(selectedFile);
                  }}
                  disabled={uploading || isProcessing}
                />
                <label
                  htmlFor="file-upload-modal"
                  className="inline-flex items-center justify-center px-4 py-2 border-2 border-primary-600 text-sm font-medium rounded-lg shadow-sm text-white bg-primary-500 hover:bg-primary-600 cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select File
                </label>
              </>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              How it works:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>Upload a PDF or ZIP file containing payslips</li>
              <li>System will extract and match payslips to employees by IPPIS number</li>
              <li>Review the batch before sending emails</li>
              <li>Send emails manually or schedule for later</li>
            </ul>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="bg-white dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Processing Upload</h3>
                <div className={`flex items-center text-sm ${
                  processingStatus === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
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
                    {processingStatus === 'completed' && uploadResult && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Processed {uploadResult.totalFiles} files successfully
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
                  {typeof progress === 'object' && progress && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      {progress.stage === 'processing' ? 'Processing' : progress.stage}: {progress.processed} of {progress.total} files
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-800">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={uploading || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Cancel'}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !payMonth || uploading || isProcessing}
            loading={uploading}
          >
            {uploading ? 'Uploading...' : isProcessing ? 'Processing...' : 'Upload & Process'}
          </Button>
        </div>
      </div>
    </div>
  );
}

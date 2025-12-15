'use client';

import { useState, useCallback } from 'react';
import { X, Upload, Calendar } from 'lucide-react';
import { Button } from '@/components/Button';
import toast from 'react-hot-toast';

interface PayslipUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onUpload: (file: File, payMonth: string) => Promise<any>;
}

export function PayslipUploadModal({ isOpen, onClose, onSuccess, onUpload }: PayslipUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [payMonth, setPayMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.includes('pdf') && !selectedFile.type.includes('zip') && !selectedFile.name.endsWith('.zip')) {
      toast.error('Please upload a PDF or ZIP file');
      return;
    }
    setFile(selectedFile);
  }, []);

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
      await onUpload(file, payMonth);
      toast.success('Payslips uploaded successfully!');
      setFile(null);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
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
            disabled={uploading}
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
              disabled={uploading}
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
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
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
                  disabled={uploading}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
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
                  disabled={uploading}
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-800">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !payMonth || uploading}
            loading={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload & Process'}
          </Button>
        </div>
      </div>
    </div>
  );
}

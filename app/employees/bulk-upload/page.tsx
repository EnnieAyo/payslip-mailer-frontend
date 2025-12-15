'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Download, Upload, AlertCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/Button';
import { apiClient } from '@/lib/api-client';
import { BulkUploadResultDto } from '@/types';
import { useSidebar } from '@/contexts/SidebarContext';
// import { BulkUploadResultDto, BulkUploadError } from '@/types/bulk-upload.types';

export default function EmployeeBulkUploadPage() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResultDto | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Download template mutation
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      const blob = await apiClient.downloadEmployeeTemplate();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employee-bulk-upload-template-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Template downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download template');
    } finally {
      setIsDownloading(false);
    }
  };

  // Bulk upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => apiClient.bulkUploadEmployees(file),
    onSuccess: (response) => {
      setUploadResult(response.data);
      setSelectedFile(null);

      if (response.data.failureCount === 0) {
        toast.success(`Successfully uploaded ${response.data.successCount} employees!`);
      } else {
        toast.error(`Upload completed with ${response.data.failureCount} errors. Check the results below.`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload file');
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];

      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setUploadResult(null); // Clear previous results
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    uploadMutation.mutate(selectedFile);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
  };

  return (
    <>
      <Navigation />
      <div className={`min-h-screen bg-gray-50 transition-all duration-300 pt-16 md:pt-8 pb-8 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/employees')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Employees
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Employee Upload</h1>
            <p className="mt-2 text-gray-600">
              Upload an Excel file to create multiple employees at once
            </p>
          </div>

          {/* Instructions Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold mr-3">
                  1
                </span>
                <p>Download the Excel template using the button below</p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold mr-3">
                  2
                </span>
                <p>Fill in the employee details (IPPIS Number, First Name, Last Name, Email, Department)</p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold mr-3">
                  3
                </span>
                <p>Upload the completed Excel file using the upload section below</p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold mr-3">
                  4
                </span>
                <p>Review the upload results and fix any errors if necessary</p>
              </div>
            </div>

            {/* Download Template Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button
                onClick={handleDownloadTemplate}
                disabled={isDownloading}
                className="inline-flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download Excel Template'}
              </Button>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload File</h2>

            <div className="space-y-4">
              {/* File Input */}
              <div>
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">Excel files only (.xlsx, .xls) - Max 10MB</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={uploadMutation.isPending}
                  />
                </label>
              </div>

              {/* Selected File Info */}
              {selectedFile && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearFile}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={uploadMutation.isPending}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="inline-flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload and Process'}
                </Button>
              </div>
            </div>
          </div>

          {/* Upload Results */}
          {uploadResult && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Results</h2>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900">{uploadResult.totalRecords}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 mb-1">Successful</p>
                  <p className="text-2xl font-bold text-green-700">{uploadResult.successCount}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600 mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-700">{uploadResult.failureCount}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 mb-1">Processing Time</p>
                  <p className="text-2xl font-bold text-blue-700">{uploadResult.processingTime}s</p>
                </div>
              </div>

              {/* Errors Table */}
              {uploadResult.errors.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Errors ({uploadResult.errors.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Row
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            IPPIS Number
                          </th>
                          {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th> */}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Error Message
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {uploadResult.errors.map((error, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {error.row}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {error.ippisNumber}
                            </td>
                            {/* <td className="px-6 py-4 text-sm text-gray-700">
                              {error.value ? String(error.value) : '(empty)'}
                            </td> */}
                            <td className="px-6 py-4 text-sm text-red-600">
                              {error.errors.join('; ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {uploadResult.errors.length === 0 && (
                <div className="flex items-center justify-center bg-green-50 border border-green-200 rounded-lg p-6">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <p className="text-lg font-medium text-green-800">
                    All employees uploaded successfully!
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-4">
                <Button
                  onClick={handleClearFile}
                  variant="secondary"
                >
                  Upload Another File
                </Button>
                <Button
                  onClick={() => router.push('/employees')}
                >
                  View All Employees
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/Button';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Download, FileText, Users, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const { user, isLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: () => apiClient.getEmployees(0, 1000),
    enabled: !!user,
  });

  const { data: payslipsData } = useQuery({
    queryKey: ['payslips', 'all'],
    queryFn: () => apiClient.getUnsentPayslips(),
    enabled: !!user,
  });

  const { data: auditLogsData } = useQuery({
    queryKey: ['audit-logs', 'all'],
    queryFn: () => apiClient.getAuditLogs(1, 1000),
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    try {
      const csv = [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header] || '';
              return typeof value === 'string' && value.includes(',')
                ? `"${value}"`
                : value;
            })
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const exportToExcel = (data: any[], filename: string, sheetName: string) => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handleExportEmployees = (format: 'csv' | 'excel') => {
    setDownloading('employees');

    const employees = employeesData?.data || [];
    const exportData = employees.map((emp: any) => ({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      ippis: emp.ippisNumber,
      createdAt: new Date(emp.createdAt).toLocaleDateString(),
    }));

    if (format === 'csv') {
      exportToCSV(
        exportData,
        'employees_report',
        ['firstName', 'lastName', 'email', 'ippis', 'createdAt']
      );
    } else {
      exportToExcel(exportData, 'employees_report', 'Employees');
    }

    setDownloading(null);
  };

  const handleExportPayslips = (format: 'csv' | 'excel') => {
    setDownloading('payslips');

    const payslips = payslipsData?.data || [];
    const exportData = payslips.map((ps: any) => ({
      employeeName: `${ps.employee?.firstName} ${ps.employee?.lastName}`,
      email: ps.employee?.email,
      ippis: ps.employee?.ippisNumber,
      month: ps.month,
      status: ps.sentAt ? 'Sent' : 'Unsent',
      sentAt: ps.sentAt ? new Date(ps.sentAt).toLocaleDateString() : '-',
      uploadedAt: new Date(ps.createdAt).toLocaleDateString(),
    }));

    if (format === 'csv') {
      exportToCSV(
        exportData,
        'payslips_report',
        ['employeeName', 'email', 'ippis', 'month', 'status', 'sentAt', 'uploadedAt']
      );
    } else {
      exportToExcel(exportData, 'payslips_report', 'Payslips');
    }

    setDownloading(null);
  };

  const handleExportAuditLogs = (format: 'csv' | 'excel') => {
    setDownloading('audit-logs');

    const auditLogs = auditLogsData?.data || [];
    const exportData = auditLogs.map((log: any) => ({
      action: log.action,
      user: log.user?.email || '-',
      details: log.details || '-',
      timestamp: new Date(log.createdAt).toLocaleString(),
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'audit_logs_report', ['action', 'user', 'details', 'timestamp']);
    } else {
      exportToExcel(exportData, 'audit_logs_report', 'Audit Logs');
    }

    setDownloading(null);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const reports = [
    {
      id: 'employees',
      title: 'Employees Report',
      description: 'Export all employee records with contact information',
      icon: Users,
      count: employeesData?.meta?.total || 0,
      onExportCSV: () => handleExportEmployees('csv'),
      onExportExcel: () => handleExportEmployees('excel'),
    },
    {
      id: 'payslips',
      title: 'Payslips Report',
      description: 'Export all payslip records with status and dates',
      icon: FileText,
      count: payslipsData?.data?.length || 0,
      onExportCSV: () => handleExportPayslips('csv'),
      onExportExcel: () => handleExportPayslips('excel'),
    },
    {
      id: 'audit-logs',
      title: 'Audit Logs Report',
      description: 'Export system activity and audit trail',
      icon: Activity,
      count: auditLogsData?.meta?.total || 0,
      onExportCSV: () => handleExportAuditLogs('csv'),
      onExportExcel: () => handleExportAuditLogs('excel'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800">
      <Navigation />
      <main className={`transition-all duration-300 pt-16 md:pt-8 px-4 sm:px-6 lg:px-8 pb-8 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Generate and export reports for your data</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div key={report.id} className="bg-white dark:bg-dark-700 rounded-lg border-2 border-primary-200 shadow p-6 hover:shadow-xl hover:border-primary-400 hover:scale-105 transition-all duration-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-primary-100 border-2 border-primary-300 p-3 rounded-lg">
                  <report.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-gray-100">{report.title}</h3>
                  <p className="text-sm text-gray-500">{report.count} records</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{report.description}</p>
              <div className="flex space-x-2">
                <Button
                  onClick={report.onExportCSV}
                  variant="secondary"
                  size="sm"
                  loading={downloading === report.id}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  onClick={report.onExportExcel}
                  variant="secondary"
                  size="sm"
                  loading={downloading === report.id}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-dark-900 dark:text-gray-100 mb-4">Report Information</h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>CSV Format:</strong> Comma-separated values, compatible with Excel, Google
              Sheets, and most data analysis tools.
            </p>
            <p>
              <strong>Excel Format:</strong> Native Excel format (.xlsx) with formatted columns and
              headers.
            </p>
            <p>
              <strong>Note:</strong> All reports are generated with current data and include
              timestamps for reference.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

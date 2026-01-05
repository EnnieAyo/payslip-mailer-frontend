import { AuthResponse, User, Employee, Payslip, AuditLog, PaginatedResponse, ApiResponse, UserManagement, Role, Permission, BulkUploadResultDto, PayslipBatch, BatchDetails, UploadResultDto, BatchSendResultDto, GetBatchesParams, PayslipSummary } from '@/types';
import { getAuthToken } from './cookies';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '',
    };

    // Get token from cookie instead of localStorage
    if (typeof window !== 'undefined') {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
        credentials: 'include', // Important for cookies
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `Request failed with status ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data}),
    });
  }

  async verifyEmail(token: string): Promise<ApiResponse<any>> {
    return this.request(`/auth/verify-email?token=${token}`);
  }

  async resendVerification(email: string): Promise<ApiResponse<any>> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verify2FA(userId: number, token: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ userId, token }),
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse<any>> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async requestPasswordReset(email: string): Promise<ApiResponse<any>> {
    return this.forgotPassword(email);
  }

  async resetPasswordWithToken(token: string, password: string): Promise<ApiResponse<any>> {
    return this.request('/auth/reset-password-with-token', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword: password }),
    });
  }

  // Employee endpoints
  async getEmployees(page: number, limit: number, search?: string): Promise<ApiResponse<Employee[]>> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return this.request(`/employees?page=${page}&limit=${limit}${searchParam}`);
  }

  async getEmployee(id: number): Promise<ApiResponse<Employee>> {
    return this.request(`/employees/${id}`);
  }

  async createEmployee(data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify({ ...data }),
    });
  }

  async updateEmployee(id: number, data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return this.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data}),
    });
  }

  async deleteEmployee(id: number): Promise<ApiResponse<void>> {
    return this.request(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Payslip endpoints
  // Payslip Batch Management Endpoints
  async uploadPayslipBatch(file: File, payMonth: string): Promise<ApiResponse<UploadResultDto>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('payMonth', payMonth);

    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/payslips/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}`, 'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '' } : { 'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '' }),
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  // Legacy single file upload method (for backward compatibility)
  async uploadPayslips(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/payslips/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}`, 'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '' } : { 'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '' }),
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  async getPayslipBatches(params?: GetBatchesParams): Promise<ApiResponse<PayslipBatch[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.payMonth) queryParams.append('payMonth', params.payMonth);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    return this.request(`/payslips/batches${queryString ? `?${queryString}` : ''}`);
  }

  async getPendingBatches(): Promise<ApiResponse<PayslipBatch[]>> {
    return this.request('/payslips/batches/pending');
  }

  async getBatchDetails(batchId: string): Promise<ApiResponse<BatchDetails>> {
    return this.request(`/payslips/batches/${batchId}`);
  }

  async sendBatch(batchId: string): Promise<ApiResponse<BatchSendResultDto>> {
    return this.request(`/payslips/batches/${batchId}/send`, {
      method: 'POST',
    });
  }

  // Legacy/Individual Payslip Methods
  async getPayslipsByEmployee(employeeId: number): Promise<ApiResponse<Payslip[]>> {
    return this.request(`/payslips/employee/${employeeId}`);
  }

  async getUnsentPayslips(): Promise<ApiResponse<Payslip[]>> {
    return this.request('/payslips/unsent');
  }

  async getPayslipSummary(): Promise<ApiResponse<PayslipSummary>> {
    return this.request('/payslips/summary');
  }

  async resendPayslip(id: number): Promise<ApiResponse<any>> {
    return this.request(`/payslips/resend/${id}`, {
      method: 'POST',
    });
  }

  async getUploadStatus(uploadId: string): Promise<ApiResponse<any>> {
    return this.request(`/payslips/upload/${uploadId}/status`);
  }
  // Audit log endpoints
  async getAuditLogs(page: number, limit: number): Promise<ApiResponse<AuditLog[]>> {
    return this.request(`/audit/logs?page=${page}&limit=${limit}`);
  }
  
  async getUserAuditLogs(id: number, page: number, limit: number): Promise<ApiResponse<AuditLog[]>> {
    return this.request(`/audit/trail/${id}?page=${page}&limit=${limit}`);
  }

  // Profile & Settings endpoints
  async updateProfile(data: { firstName: string; lastName: string; email: string }): Promise<ApiResponse<User>> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ ...data }),
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<any>> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ ...data }),
    });
  }

  async toggle2FA(enabled: boolean): Promise<ApiResponse<{ twoFactorEnabled: boolean }>> {
    return this.request('/auth/toggle-2fa', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  async resendVerificationEmail(email: string): Promise<ApiResponse<any>> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // User Management endpoints
  async getUsers(page: number, limit: number, search?: string): Promise<ApiResponse<UserManagement[]>> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return this.request(`/users?page=${page}&limit=${limit}${searchParam}`);
  }

  async getUser(id: number): Promise<ApiResponse<UserManagement>> {
    return this.request(`/users/${id}`);
  }

  async createUser(data: Partial<UserManagement> & { password: string }): Promise<ApiResponse<UserManagement>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ ...data }),
    });
  }

  async updateUser(id: number, data: Partial<UserManagement>): Promise<ApiResponse<UserManagement>> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data }),
    });
  }

  async deleteUser(id: number): Promise<ApiResponse<any>> {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async updateUserPermissions(id: number, permissions: string[]): Promise<ApiResponse<UserManagement>> {
    return this.request(`/users/${id}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    });
  }

  async toggleUserActivation(id: number): Promise<ApiResponse<UserManagement>> {
    return this.request(`/users/${id}/toggle-activation`, {
      method: 'PATCH',
    });
  }

  async unlockUser(id: number): Promise<ApiResponse<UserManagement>> {
    return this.request(`/users/${id}/unlock`, {
      method: 'PATCH',
    });
  }

  // Role Management endpoints
  async getRoles(): Promise<ApiResponse<Role[]>> {
    return this.request('/roles');
  }

  async getRole(name: string): Promise<ApiResponse<Role>> {
    return this.request(`/roles/${name}`);
  }

  async createRole(data: { name: string; description?: string; permissions: string[] }): Promise<ApiResponse<Role>> {
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify({ ...data }),
    });
  }

  async updateRole(name: string, data: Partial<Role>): Promise<ApiResponse<Role>> {
    return this.request(`/roles/${name}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data }),
    });
  }

  async deleteRole(name: string): Promise<ApiResponse<any>> {
    return this.request(`/roles/${name}`, {
      method: 'DELETE',
    });
  }

  async getAvailablePermissions(): Promise<ApiResponse<{ data: Permission[] }>> {
    return this.request('/roles/permissions');
  }
  /**
   *
   * bulk upload endpoints
   */
  async downloadEmployeeTemplate(): Promise<Blob> {
    const token = getAuthToken();

    const response = await fetch(`${this.baseURL}/employees/bulk-upload/template`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to download template' }));
    throw new Error(error.message || 'Failed to download template');
  }

  return response.blob();
  }

  async bulkUploadEmployees(file: File): Promise<ApiResponse<BulkUploadResultDto>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken(); // Use cookie instead of localStorage
    const response = await fetch(`${this.baseURL}/employees/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}`, 'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '' } : { 'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '' }),
      },
      credentials: 'include', // Important for cookies
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();

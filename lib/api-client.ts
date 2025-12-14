import { AuthResponse, User, Employee, Payslip, AuditLog, PaginatedResponse, ApiResponse, UserManagement, Role, Permission } from '@/types';
import { getAuthToken } from './cookies';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
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

  async resetPassword(token: string, password: string): Promise<ApiResponse<any>> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
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
  async uploadPayslips(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken(); // Use cookie instead of localStorage
    const response = await fetch(`${this.baseURL}/payslips/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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

  async getPayslipsByEmployee(employeeId: number): Promise<ApiResponse<Payslip[]>> {
    return this.request(`/payslips/employee/${employeeId}`);
  }

  async getUnsentPayslips(): Promise<ApiResponse<Payslip[]>> {
    return this.request('/payslips/unsent');
  }

  async resendPayslip(id: number): Promise<ApiResponse<any>> {
    return this.request(`/payslips/${id}/resend`, {
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

  async toggle2FA(enabled: boolean): Promise<ApiResponse<{ enabled: boolean }>> {
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
}

export const apiClient = new ApiClient();

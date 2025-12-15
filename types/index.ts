export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}


export interface AuthResponse {
  success: boolean;
  message: string;
  data:
    | {
        access_token: string;
        user: User;
      }
    | {
        requiresTwoFactor: true;
        userId: number;
        message: string;
      };
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  ippisNumber: string;
  department?: string;
  position?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payslip {
  id: number;
  employeeId: number;
  employee: Employee;
  month: string;
  year: number;
  filePath: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta | null;
}

export interface AuditLog {
  id: number;
  userId: number;
  user?: User;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface Role {
  name: string;
  description: string;
  permissions: string[];
}

export interface Permission {
  key: string;
  description: string;
}

export interface UserManagement extends User {
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts?: number;
}
// Types for Employee Bulk Upload Feature

export interface BulkEmployeeDto {
  ippisNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
}

export interface BulkUploadError {
  row: number;
  ippisNumber?: string;
  // value: any;
  errors: string[];
}

export interface BulkUploadResultDto {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errors: BulkUploadError[];
  processingTime: string;
}

// Re-export batch types from payslip-batch.types
export * from './payslip-batch.types';

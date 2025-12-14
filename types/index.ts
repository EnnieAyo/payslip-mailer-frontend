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

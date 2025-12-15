// Batch Payslip Types

export interface PayslipBatch {
  id: number;
  uuid: string;
  fileName: string;
  filePath: string;
  payMonth: string;
  totalFiles: number;
  processedFiles: number;
  successCount: number;
  failureCount: number;
  status: 'pending' | 'processing' | 'processed' | 'failed' | 'completed';
  emailStatus: 'pending' | 'sending' | 'completed' | 'partial' | 'failed';
  sentAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    payslips: number;
  };
}

export interface PayslipWithEmployee {
  id: number;
  uuid: string;
  ippisNumber: string;
  fileName: string;
  employeeId: number;
  uploadId: number;
  payMonth: string;
  emailSent: boolean;
  emailSentAt?: Date;
  emailError?: string;
  createdAt: Date;
  updatedAt: Date;
  employee: {
    id: number;
    uuid: string;
    ippisNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  };
}

export interface BatchDetails extends PayslipBatch {
  payslips: PayslipWithEmployee[];
}

export interface UploadPayslipDto {
  payMonth: string;
}

export interface UploadResultDto {
  uploadId: number;
  batchId: string;
  processedFiles: number;
  failedFiles: number;
  totalFiles: number;
  payMonth: string;
}

export interface BatchSendResultDto {
  batchId: string;
  payMonth: string;
  totalPayslips: number;
  successCount: number;
  failureCount: number;
  skippedCount?: number;
  emailStatus: string;
  message?: string;
  sentAt: Date;
  completedAt: Date;
}

export interface GetBatchesParams {
  page?: number;
  limit?: number;
  payMonth?: string;
  status?: string;
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function VerifyEmailPage() {
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('Invalid verification link. No token provided.');
        setVerifying(false);
        return;
      }

      try {
        const response = await apiClient.verifyEmail(token);
        setSuccess(true);
        toast.success('Email verified successfully!');
      } catch (err: any) {
        setError(err.message || 'Failed to verify email. The link may have expired.');
        toast.error(err.message || 'Email verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams]);

  // Verifying state
  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-dark-900 dark:to-dark-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-10 h-10 text-primary-600 dark:text-primary-400 animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100">Verifying Your Email</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-dark-900 dark:to-dark-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100">Email Verified!</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your email has been successfully verified.
            </p>
          </div>

          <div className="bg-white dark:bg-dark-700 rounded-lg shadow-lg p-8 border-2 border-gray-200 dark:border-dark-600">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              You can now access all features of your account.
            </p>
            
            <Button
              variant="primary"
              fullWidth
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-dark-900 dark:to-dark-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100">Verification Failed</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            We couldn't verify your email address.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-700 rounded-lg shadow-lg p-8 border-2 border-gray-200 dark:border-dark-600">
          <div className="space-y-4">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
            
            <div className="pt-4 space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => router.push('/login')}
              >
                Go to Login
              </Button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                You can request a new verification email from your account settings after logging in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

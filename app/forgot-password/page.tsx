'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call the API to send password reset email
      await apiClient.requestPasswordReset(email);
      setEmailSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-dark-900 dark:to-dark-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100">Check Your Email</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              We've sent a password reset link to <span className="font-medium">{email}</span>
            </p>
          </div>

          <div className="bg-white dark:bg-dark-700 rounded-lg shadow-lg p-8 border-2 border-gray-200 dark:border-dark-600">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please check your email and click on the password reset link to create a new password.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The link will expire in 1 hour.
              </p>
              
              <div className="pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Didn't receive the email?
                </p>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                >
                  Try Another Email
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-dark-900 dark:to-dark-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100">Forgot Password?</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-700 rounded-lg shadow-lg p-8 border-2 border-gray-200 dark:border-dark-600">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email address"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
            >
              Send Reset Link
            </Button>
          </form>
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

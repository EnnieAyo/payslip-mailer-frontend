'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { setAuthToken, setUserData } from '@/lib/cookies';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const { login, updateUser } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(email, password);

      if ('requiresTwoFactor' in response.data && response.data.requiresTwoFactor) {
        setUserId((response.data as any).userId);
        setShow2FA(true);
        toast.success((response.data as any).message || '2FA code sent to your email');
      } else {
        toast.success('Login successful!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await apiClient.verify2FA(userId, twoFactorCode);

      // Check response structure
      if (response.success && response.data) {
        // Type narrowing with explicit check
        if ('access_token' in response.data && 'user' in response.data) {
          setAuthToken(response.data.access_token as string);
          setUserData(response.data.user);
          updateUser(response.data.user as any);
          toast.success('2FA verification successful!');
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      toast.error(error.message || '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-dark-900 dark:to-dark-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-dark-900 dark:text-gray-100">Payslip Mailer</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>

        <div className="bg-white dark:bg-dark-700 rounded-lg shadow-lg p-8 border-2 border-gray-200 dark:border-dark-600">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@company.com"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />

            <div className="flex items-center justify-between">
              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={show2FA}
        onClose={() => setShow2FA(false)}
        title="Two-Factor Authentication"
      >
        <form onSubmit={handleVerify2FA} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter the 6-digit code sent to your email
          </p>

          <Input
            label="Verification Code"
            type="text"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            required
            maxLength={6}
            placeholder="000000"
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShow2FA(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
            >
              Verify
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

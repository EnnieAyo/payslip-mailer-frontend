'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { Shield, User, Lock, Mail, CheckCircle, XCircle } from 'lucide-react';

const profileSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

export default function SettingsPage() {
  const { user, isLoading, updateUser } = useAuth();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      setTwoFactorEnabled(user.twoFactorEnabled || false);
    }
  }, [user, isLoading, router]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string; email: string }) =>
      apiClient.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data);
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiClient.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      passwordFormik.resetForm();
    },
    onError: () => {
      toast.error('Failed to change password');
    },
  });

  const toggle2FAMutation = useMutation({
    mutationFn: () => apiClient.toggle2FA(!twoFactorEnabled),
    onSuccess: (response) => {
      setTwoFactorEnabled(response.data.twoFactorEnabled);
      updateUser({ ...user!, twoFactorEnabled: response.data.twoFactorEnabled });
      toast.success(
        response.data.twoFactorEnabled ? '2FA enabled successfully' : '2FA disabled successfully'
      );
    },
    onError: () => {
      toast.error('Failed to toggle 2FA');
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: (email: string) => apiClient.resendVerificationEmail(email),
    onSuccess: () => {
      toast.success('Verification email sent');
    },
    onError: () => {
      toast.error('Failed to send verification email');
    },
  });

  const profileFormik = useFormik({
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
    enableReinitialize: true,
    validationSchema: profileSchema,
    onSubmit: (values) => {
      updateProfileMutation.mutate(values);
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: passwordSchema,
    onSubmit: (values) => {
      changePasswordMutation.mutate({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
    },
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800 flex flex-col">
      <Navigation />
      <main className={`flex-1 transition-all duration-300 pt-16 md:pt-8 px-4 sm:px-6 lg:px-8 pb-8 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account settings and preferences</p>
          </div>

          <div className="space-y-6">
          {/* Email Verification Status */}
          <div className="bg-white dark:bg-dark-700 rounded-lg border-2 border-primary-200 shadow p-6 hover:border-primary-400 transition-all duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <Mail className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-dark-900 dark:text-gray-100">Email Verification</h2>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {user.emailVerified ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-700">Email verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-sm text-orange-700">Email not verified</span>
                  </>
                )}
              </div>
              {!user.emailVerified && (
                <Button
                  onClick={() => resendVerificationMutation.mutate(user?.email || '')}
                  loading={resendVerificationMutation.isPending}
                  size="sm"
                >
                  Resend Email
                </Button>
              )}
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-white dark:bg-dark-700 rounded-lg border-2 border-primary-200 shadow p-6 hover:border-primary-400 transition-all duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-dark-900 dark:text-gray-100">Two-Factor Authentication</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <Button
                onClick={() => toggle2FAMutation.mutate()}
                loading={toggle2FAMutation.isPending}
                variant={twoFactorEnabled ? 'danger' : 'primary'}
              >
                {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </Button>
            </div>
          </div>

          {/* Profile Settings */}
          <div className="bg-white dark:bg-dark-700 rounded-lg border-2 border-primary-200 shadow p-6 hover:border-primary-400 transition-all duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-dark-900 dark:text-gray-100">Profile Information</h2>
            </div>
            <form onSubmit={profileFormik.handleSubmit} className="space-y-4">
              <Input
                label="First Name"
                {...profileFormik.getFieldProps('firstName')}
                error={
                  profileFormik.touched.firstName ? profileFormik.errors.firstName : undefined
                }
                readOnly
              />
              <Input
                label="Last Name"
                {...profileFormik.getFieldProps('lastName')}
                error={
                  profileFormik.touched.lastName ? profileFormik.errors.lastName : undefined
                }
                readOnly
              />
              <Input
                label="Email"
                type="email"
                {...profileFormik.getFieldProps('email')}
                error={profileFormik.touched.email ? profileFormik.errors.email : undefined}
                readOnly
              />
              {/* <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={updateProfileMutation.isPending}
                  disabled={!profileFormik.dirty || !profileFormik.isValid}
                >
                  Update Profile
                </Button>
              </div> */}
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-dark-700 rounded-lg border-2 border-primary-200 shadow p-6 hover:border-primary-400 transition-all duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-dark-900 dark:text-gray-100">Change Password</h2>
            </div>
            <form onSubmit={passwordFormik.handleSubmit} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                {...passwordFormik.getFieldProps('currentPassword')}
                error={
                  passwordFormik.touched.currentPassword
                    ? passwordFormik.errors.currentPassword
                    : undefined
                }
              />
              <Input
                label="New Password"
                type="password"
                {...passwordFormik.getFieldProps('newPassword')}
                error={
                  passwordFormik.touched.newPassword
                    ? passwordFormik.errors.newPassword
                    : undefined
                }
              />
              <Input
                label="Confirm New Password"
                type="password"
                {...passwordFormik.getFieldProps('confirmPassword')}
                error={
                  passwordFormik.touched.confirmPassword
                    ? passwordFormik.errors.confirmPassword
                    : undefined
                }
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={changePasswordMutation.isPending}
                  disabled={!passwordFormik.dirty || !passwordFormik.isValid}
                >
                  Change Password
                </Button>
              </div>
            </form>
          </div>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

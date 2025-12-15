'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { UserManagement, Role } from '@/types';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { MoreVertical, Lock, Unlock, Shield, Trash2 } from 'lucide-react';

const userSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  role: Yup.string().required('Role is required'),
});

export default function UsersPage() {
  const { user, isLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagement | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const limit = 10;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const { data, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', page, limit, search],
    queryFn: () => apiClient.getUsers(page, limit, search),
    enabled: !!user,
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => await apiClient.getRoles(),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      setShowCreateModal(false);
      formik.resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      setEditingUser(null);
      formik.resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });

  const toggleActivationMutation = useMutation({
    mutationFn: (id: number) => apiClient.toggleUserActivation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user status');
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (id: number) => apiClient.unlockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User unlocked successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unlock user');
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: number; permissions: string[] }) =>
      apiClient.updateUserPermissions(id, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Permissions updated successfully');
      setShowPermissionsModal(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update permissions');
    },
  });

  const formik = useFormik({
    initialValues: {
      email: editingUser?.email || '',
      password: '',
      firstName: editingUser?.firstName || '',
      lastName: editingUser?.lastName || '',
      role: editingUser?.role || 'user',
    },
    enableReinitialize: true,
    validationSchema: editingUser ? userSchema.omit(['password']) : userSchema,
    onSubmit: (values) => {
      if (editingUser) {
        updateMutation.mutate({ id: editingUser.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  const handleEdit = (user: UserManagement) => {
    setEditingUser(user);
    setShowCreateModal(true);
    setOpenDropdown(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id);
    }
    setOpenDropdown(null);
  };

  const handleToggleActivation = (id: number) => {
    toggleActivationMutation.mutate(id);
    setOpenDropdown(null);
  };

  const handleUnlock = (id: number) => {
    unlockMutation.mutate(id);
    setOpenDropdown(null);
  };

  const handleManagePermissions = (user: UserManagement) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
    setOpenDropdown(null);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingUser(null);
    formik.resetForm();
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-dark-800 flex flex-col">
        <main className={`flex-1 transition-all duration-300 pt-16 md:pt-8 px-4 sm:px-6 lg:px-8 pb-8 ${
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <Button onClick={() => setShowCreateModal(true)}>Create User</Button>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-4">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        Loading...
                      </td>
                    </tr>
                  ) : data?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    data?.data?.map((usr: UserManagement) => (
                      <tr key={usr.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {usr.firstName} {usr.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">{usr.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                            {usr.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                usr.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {usr.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {usr.isLocked && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                Locked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === usr.id ? null : usr.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          {openDropdown === usr.id && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-dark-700 ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => handleEdit(usr)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  Edit User
                                </button>
                                <button
                                  onClick={() => handleManagePermissions(usr)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  Manage Permissions
                                </button>
                                <button
                                  onClick={() => handleToggleActivation(usr.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
                                >
                                  {usr.isActive ? (
                                    <>
                                      <Lock className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="w-4 h-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </button>
                                {usr.isLocked && (
                                  <button
                                    onClick={() => handleUnlock(usr.id)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
                                  >
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Unlock User
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(usr.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white dark:bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-dark-600">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {data?.data?.length || 0} of {data?.meta?.total || 0} users
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  variant="secondary"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={!data?.data || data.data.length < limit}
                  variant="secondary"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {/* Create/Edit Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={handleModalClose}
            title={editingUser ? 'Edit User' : 'Create User'}
          >
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <input
                  type="text"
                  {...formik.getFieldProps('firstName')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
                {formik.touched.firstName && formik.errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <input
                  type="text"
                  {...formik.getFieldProps('lastName')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
                {formik.touched.lastName && formik.errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  {...formik.getFieldProps('email')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
                )}
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    type="password"
                    {...formik.getFieldProps('password')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                  {formik.touched.password && formik.errors.password && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.password}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <select
                  {...formik.getFieldProps('role')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a role</option>
                  {rolesData?.data?.map((role: Role) => (
                    <option key={role.name} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {formik.touched.role && formik.errors.role && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.role}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Permissions Modal */}
          {showPermissionsModal && selectedUser && (
            <Modal
              isOpen={showPermissionsModal}
              onClose={() => {
                setShowPermissionsModal(false);
                setSelectedUser(null);
              }}
              title="Manage Permissions"
            >
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Managing permissions for: <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
                </p>
                <div className="space-y-2">
                  {selectedUser.permissions?.map((perm) => (
                    <div key={perm} className="flex items-center">
                      <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-dark-600 rounded">
                        {perm}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={() => setShowPermissionsModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </main>
      <Footer />
      </div>
    </>
  );
}

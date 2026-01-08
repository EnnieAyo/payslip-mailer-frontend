'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Role, Permission } from '@/types';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { MoreVertical, Pencil, Trash2, Shield, CheckCircle, RefreshCw } from 'lucide-react';

const roleSchema = Yup.object({
  name: Yup.string().required('Role name is required'),
  description: Yup.string().required('Description is required'),
  permissions: Yup.array().min(1, 'At least one permission is required'),
});

export default function RolesPage() {
  const { user, isLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const systemRoles = ['admin', 'payroll_manager', 'user'];

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiClient.getRoles(),
    enabled: !!user,
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiClient.getAvailablePermissions(),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
      setShowCreateModal(false);
      formik.resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create role');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ name, data }: { name: string; data: any }) =>
      apiClient.updateRole(name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role updated successfully');
      setEditingRole(null);
      setShowCreateModal(false);
      formik.resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update role');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => apiClient.deleteRole(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete role');
    },
  });

  const formik = useFormik({
    initialValues: {
      name: editingRole?.name || '',
      description: editingRole?.description || '',
      permissions: editingRole?.permissions || [],
    },
    enableReinitialize: true,
    validationSchema: roleSchema,
    onSubmit: (values) => {
      if (editingRole) {
        updateMutation.mutate({ name: editingRole.name, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  const handleCreate = () => {
    setEditingRole(null);
    setShowCreateModal(true);
  };

  const handleEdit = (role: Role) => {
    if (systemRoles.includes(role.name)) {
      toast.error('System roles cannot be modified');
      return;
    }
    setEditingRole(role);
    setShowCreateModal(true);
    setOpenDropdown(null);
  };

  const handleDelete = (name: string) => {
    if (systemRoles.includes(name)) {
      toast.error('System roles cannot be deleted');
      return;
    }
    if (confirm('Are you sure you want to delete this role?')) {
      deleteMutation.mutate(name);
    }
    setOpenDropdown(null);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingRole(null);
    formik.resetForm();
  };

  const togglePermission = (permission: string) => {
    const current = formik.values.permissions as string[];
    if (current.includes(permission)) {
      formik.setFieldValue(
        'permissions',
        current.filter((p) => p !== permission)
      );
    } else {
      formik.setFieldValue('permissions', [...current, permission]);
    }
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Role Management</h1>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['roles'] })}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={handleCreate}>Create Role</Button>
            </div>
          </div>

          {/* Roles Table */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                  {isLoadingRoles ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        Loading...
                      </td>
                    </tr>
                  ) : rolesData?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No roles found
                      </td>
                    </tr>
                  ) : (
                    rolesData?.data?.map((role: Role) => (
                      <tr key={role.name}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Shield className="w-5 h-5 text-primary-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {role.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {role.description}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map((perm) => (
                              <span
                                key={perm}
                                className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800"
                              >
                                {perm}
                              </span>
                            ))}
                            {role.permissions.length > 3 && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                +{role.permissions.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              systemRoles.includes(role.name)
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {systemRoles.includes(role.name) ? 'System' : 'Custom'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === role.name ? null : role.name)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openDropdown === role.name && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-dark-700 ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => handleEdit(role)}
                                  disabled={systemRoles.includes(role.name)}
                                  className={`flex items-center w-full px-4 py-2 text-sm ${
                                    systemRoles.includes(role.name)
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600'
                                  }`}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit Role
                                </button>
                                <button
                                  onClick={() => handleDelete(role.name)}
                                  disabled={systemRoles.includes(role.name)}
                                  className={`flex items-center w-full px-4 py-2 text-sm ${
                                    systemRoles.includes(role.name)
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-600'
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Role
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

            {/* Summary */}
            <div className="bg-white dark:bg-dark-800 px-4 py-3 border-t border-gray-200 dark:border-dark-600">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Total roles: {rolesData?.meta?.total || 0}
              </div>
            </div>
          </div>

          {/* Create/Edit Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={handleModalClose}
            title={editingRole ? 'Edit Role' : 'Create Role'}
          >
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <Input
                label="Role Name"
                type="text"
                {...formik.getFieldProps('name')}
                disabled={!!editingRole}
                error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  {...formik.getFieldProps('description')}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
                {formik.touched.description && formik.errors.description && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Permissions
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 dark:border-dark-600 rounded-md p-3">
                  {permissionsData?.data?.data?.map((permission: Permission) => (
                    <label
                      key={permission.key}
                      className="flex items-start space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-600 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={(formik.values.permissions as string[]).includes(permission.key)}
                        onChange={() => togglePermission(permission.key)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {permission.key}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {permission.description}
                        </div>
                      </div>
                      {(formik.values.permissions as string[]).includes(permission.key) && (
                        <CheckCircle className="w-5 h-5 text-primary-500" />
                      )}
                    </label>
                  ))}
                </div>
                {formik.touched.permissions && formik.errors.permissions && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.permissions as string}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                  {editingRole ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </main>
      <Footer />
      </div>
    </>
  );
}

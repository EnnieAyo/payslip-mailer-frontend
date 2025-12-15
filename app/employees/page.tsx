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
import { Employee } from '@/types';
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';

const employeeSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  ippisNumber: Yup.string().required('IPPIS number is required'),
});

export default function EmployeesPage() {
  const { user, isLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const limit = 10;

  const { data, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees', { page, search }],
    queryFn: () => apiClient.getEmployees(page, limit, search || undefined),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiClient.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully');
      setShowModal(false);
      formik.resetForm();
    },
    onError: () => {
      toast.error('Failed to create employee');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>;
    }) => apiClient.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated successfully');
      setShowModal(false);
      setEditingEmployee(null);
      formik.resetForm();
    },
    onError: () => {
      toast.error('Failed to update employee');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted successfully');
      setDeletingEmployee(null);
    },
    onError: () => {
      toast.error('Failed to delete employee');
    },
  });

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      ippisNumber: '',
    },
    validationSchema: employeeSchema,
    onSubmit: (values) => {
      if (editingEmployee) {
        updateMutation.mutate({ id: editingEmployee.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (editingEmployee) {
      formik.setValues({
        firstName: editingEmployee.firstName,
        lastName: editingEmployee.lastName,
        email: editingEmployee.email,
        ippisNumber: editingEmployee.ippisNumber,
      });
    }
  }, [editingEmployee]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const employees = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800 flex flex-col">
      <Navigation />
      <main className={`flex-1 transition-all duration-300 pt-16 md:pt-8 px-4 sm:px-6 lg:px-8 pb-8 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100">Employees</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage employee records</p>
          </div>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <Button
                onClick={() => {
                  setEditingEmployee(null);
                  formik.resetForm();
                  setShowModal(true);
                }}
                className="mt-4 mr-2 sm:mt-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
              <Button
              variant='secondary'
              onClick={() => router.push('/employees/bulk-upload')}
              className="mt-4 mr-2 sm:mt-0"
            >
              <Upload className="w-4 h-4 mr-2" />
              Mass Upload
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-700 rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-dark-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, email, or IPPIS..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {isLoadingEmployees ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No employees found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        IPPIS Number
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                    {employees.map((employee: Employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-dark-900 dark:text-gray-100">
                            {employee.firstName} {employee.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-200">{employee.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-200">{employee.ippisNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingEmployee(employee);
                              setShowModal(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 text-gray-900 dark:text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingEmployee(employee)}
                            className="ml-2"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of{' '}
                    {total} employees
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEmployee(null);
          formik.resetForm();
        }}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <Input
            label="First Name"
            {...formik.getFieldProps('firstName')}
            error={formik.touched.firstName ? formik.errors.firstName : undefined}
          />
          <Input
            label="Last Name"
            {...formik.getFieldProps('lastName')}
            error={formik.touched.lastName ? formik.errors.lastName : undefined}
          />
          <Input
            label="Email"
            type="email"
            {...formik.getFieldProps('email')}
            error={formik.touched.email ? formik.errors.email : undefined}
          />
          <Input
            label="IPPIS Number"
            {...formik.getFieldProps('ippisNumber')}
            error={formik.touched.ippisNumber ? formik.errors.ippisNumber : undefined}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setEditingEmployee(null);
                formik.resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingEmployee ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        title="Delete Employee"
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete {deletingEmployee?.firstName}{' '}
          {deletingEmployee?.lastName}? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setDeletingEmployee(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deletingEmployee && deleteMutation.mutate(deletingEmployee.id)}
            loading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
      <Footer />
    </div>
  );
}

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

const employeeSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  phoneNumber: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  role: z.enum(['admin', 'manager', 'employee']).default('employee'),
  manager: z.string().optional(),
  employmentStatus: z.enum(['active', 'probation', 'inactive', 'resigned', 'terminated']).default('active'),
});

const DEPARTMENTS = [
  'Executive & Management',
  'Sales & Business Development',
  'Custom Software Engineering',
  'Web & Mobile Development',
  'UI/UX Design',
  'Quality Assurance',
  'Operations & HR',
];

export const EmployeeModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  managers = [],
  isLoading = false,
}) => {
  const isEditing = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
      department: DEPARTMENTS[1],
      designation: '',
      role: 'employee',
      manager: '',
      employmentStatus: 'active',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        password: '',
        phoneNumber: initialData.phoneNumber || '',
        department: initialData.department || DEPARTMENTS[1],
        designation: initialData.designation || '',
        role: initialData.role || 'employee',
        manager: initialData.manager?._id || initialData.manager || '',
        employmentStatus: initialData.employmentStatus || 'active',
      });
    } else {
      reset({
        fullName: '',
        email: '',
        password: 'Password123!',
        phoneNumber: '',
        department: DEPARTMENTS[1],
        designation: '',
        role: 'employee',
        manager: '',
        employmentStatus: 'active',
      });
    }
  }, [initialData, reset, isOpen]);

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Employee Details' : 'Add Employee Account'}
      subtitle="Creates official employee record and user login credentials"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              {...register('fullName')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
              placeholder="e.g. Sarah Jenkins"
            />
            {errors.fullName && (
              <p className="text-[11px] text-red-500 mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Work Email Address *
            </label>
            <input
              type="email"
              disabled={isEditing}
              {...register('email')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white disabled:opacity-60"
              placeholder="name@amscrafters.com"
            />
            {errors.email && (
              <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        {!isEditing && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Initial Login Password *
            </label>
            <input
              type="text"
              {...register('password')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white font-mono"
              placeholder="Min 8 characters"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department *
            </label>
            <select
              {...register('department')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Designation *
            </label>
            <input
              type="text"
              {...register('designation')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
              placeholder="e.g. Senior CRM Specialist"
            />
            {errors.designation && (
              <p className="text-[11px] text-red-500 mt-1">{errors.designation.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Access Role *
            </label>
            <select
              {...register('role')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin / Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reporting Manager
            </label>
            <select
              {...register('manager')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            >
              <option value="">No Direct Manager (Executive)</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.fullName} ({m.designation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              {...register('employmentStatus')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Phone Number
          </label>
          <input
            type="text"
            {...register('phoneNumber')}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            placeholder="+92 300 0000000"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

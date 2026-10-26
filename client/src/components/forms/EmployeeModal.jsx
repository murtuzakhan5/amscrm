import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock } from 'lucide-react';
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
  shiftStartTime: z.string().default('09:00'),
  shiftEndTime: z.string().default('18:00'),
  lateGracePeriodMinutes: z.coerce.number().min(0).default(5),
  employmentStatus: z.enum(['active', 'probation', 'inactive', 'resigned', 'terminated']).default('active'),
});

const DEPARTMENTS = [
  'Sales & Business Development',
  'Graphic Designing & Media',
  'Video Editing & Content Creation',
  'Team Leads & Project Management',
  'Custom Software Engineering',
  'Web & Mobile Development',
  'UI/UX Design',
  'Quality Assurance',
  'Operations & HR',
  'Executive & Management',
];

const COMMON_DESIGNATIONS = [
  'Sales Lead',
  'Sales Executive',
  'Graphic Designer',
  'Video Editor',
  'Team Lead',
  'Project Manager',
  'Senior Developer',
  'Content Creator',
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
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
      department: DEPARTMENTS[0],
      designation: '',
      role: 'employee',
      manager: '',
      shiftStartTime: '09:00',
      shiftEndTime: '18:00',
      lateGracePeriodMinutes: 5,
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
        department: initialData.department || DEPARTMENTS[0],
        designation: initialData.designation || '',
        role: initialData.role || 'employee',
        manager: initialData.manager?._id || initialData.manager || '',
        shiftStartTime: initialData.shiftStartTime || '09:00',
        shiftEndTime: initialData.shiftEndTime || '18:00',
        lateGracePeriodMinutes: initialData.lateGracePeriodMinutes !== undefined ? initialData.lateGracePeriodMinutes : 5,
        employmentStatus: initialData.employmentStatus || 'active',
      });
    } else {
      reset({
        fullName: '',
        email: '',
        password: 'Password123!',
        phoneNumber: '',
        department: DEPARTMENTS[0],
        designation: '',
        role: 'employee',
        manager: '',
        shiftStartTime: '09:00',
        shiftEndTime: '18:00',
        lateGracePeriodMinutes: 5,
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
      subtitle="Creates official employee record, custom shift timings, and user credentials"
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
              placeholder="e.g. Murtuza Khan"
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
              Department / Category *
            </label>
            <select
              {...register('department')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white font-medium"
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
              placeholder="e.g. Video Editor / Graphic Designer"
            />
            {/* Quick Designation Shortcuts */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {COMMON_DESIGNATIONS.map((title) => (
                <button
                  type="button"
                  key={title}
                  onClick={() => setValue('designation', title, { shouldValidate: true })}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 transition"
                >
                  +{title}
                </button>
              ))}
            </div>
            {errors.designation && (
              <p className="text-[11px] text-red-500 mt-1">{errors.designation.message}</p>
            )}
          </div>
        </div>

        {/* Work Hours & Attendance Late Threshold Settings */}
        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              Shift Timing & Late Rule (5-Min Threshold)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shift Start (HH:mm)
              </label>
              <input
                type="time"
                {...register('shiftStartTime')}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shift End (HH:mm)
              </label>
              <input
                type="time"
                {...register('shiftEndTime')}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Late Grace Limit (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                {...register('lateGracePeriodMinutes')}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-medium"
              />
            </div>
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            Agar employee start time ke 5 minute baad check-in karega, to system automatically <strong>LATE</strong> mark kar dega.
          </p>
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
              <option value="manager">Manager / Team Lead</option>
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

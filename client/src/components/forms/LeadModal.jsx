import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

const leadSchema = z.object({
  clientName: z.string().min(2, 'Client name must be at least 2 characters'),
  companyName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
  leadSource: z.string().default('Website Form'),
  interestedService: z.string().min(1, 'Interested service is required'),
  projectRequirements: z.string().optional(),
  estimatedBudget: z.coerce.number().min(0, 'Budget must be 0 or greater'),
  currency: z.string().default('USD'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z.string().optional(),
});

const SERVICES = [
  'Custom Software Development',
  'Web Application Development',
  'Mobile App Development (iOS & Android)',
  'UI/UX Design & Prototyping',
  'Enterprise CRM & ERP Systems',
  'Cloud Solutions & DevOps',
  'Quality Assurance & Testing',
];

const SOURCES = [
  'Website Form',
  'LinkedIn',
  'Referral',
  'Cold Outreach',
  'Upwork',
  'Inbound Call',
  'Google Ads',
  'Other',
];

export const LeadModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  employees = [],
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      clientName: '',
      companyName: '',
      email: '',
      phoneNumber: '',
      whatsappNumber: '',
      leadSource: 'Website Form',
      interestedService: SERVICES[0],
      projectRequirements: '',
      estimatedBudget: 5000,
      currency: 'USD',
      priority: 'medium',
      assignedTo: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        clientName: initialData.clientName || '',
        companyName: initialData.companyName || '',
        email: initialData.email || '',
        phoneNumber: initialData.phoneNumber || '',
        whatsappNumber: initialData.whatsappNumber || '',
        leadSource: initialData.leadSource || 'Website Form',
        interestedService: initialData.interestedService || SERVICES[0],
        projectRequirements: initialData.projectRequirements || '',
        estimatedBudget: initialData.estimatedBudget || 0,
        currency: initialData.currency || 'USD',
        priority: initialData.priority || 'medium',
        assignedTo: initialData.assignedTo?._id || initialData.assignedTo || '',
      });
    } else {
      reset({
        clientName: '',
        companyName: '',
        email: '',
        phoneNumber: '',
        whatsappNumber: '',
        leadSource: 'Website Form',
        interestedService: SERVICES[0],
        projectRequirements: '',
        estimatedBudget: 5000,
        currency: 'USD',
        priority: 'medium',
        assignedTo: '',
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
      title={initialData ? 'Edit Lead' : 'Add New CRM Lead'}
      subtitle="Complete lead details and project requirements"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client Contact Name *
            </label>
            <input
              type="text"
              {...register('clientName')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
              placeholder="e.g. John Doe"
            />
            {errors.clientName && (
              <p className="text-[11px] text-red-500 mt-1">{errors.clientName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Name
            </label>
            <input
              type="text"
              {...register('companyName')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
              placeholder="e.g. Acme Corp"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
              placeholder="client@company.com"
            />
            {errors.email && (
              <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              {...register('phoneNumber')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lead Source
            </label>
            <select
              {...register('leadSource')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Interested Service *
            </label>
            <select
              {...register('interestedService')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Estimated Budget
            </label>
            <input
              type="number"
              {...register('estimatedBudget')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Currency
            </label>
            <select
              {...register('currency')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="PKR">PKR (₨)</option>
              <option value="AED">AED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Assign To Employee
          </label>
          <select
            {...register('assignedTo')}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
          >
            <option value="">Unassigned (New Lead)</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.fullName} ({emp.department} - {emp.designation})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Project Scope & Requirements
          </label>
          <textarea
            rows={3}
            {...register('projectRequirements')}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            placeholder="Key deliverables, timeline expectations, tech stack..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {initialData ? 'Save Changes' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Clock, AlertCircle } from 'lucide-react';

const meetingSchema = z.object({
  title: z.string().min(2, 'Meeting title is required'),
  meetingType: z.enum([
    'client_call',
    'online_meeting',
    'physical_meeting',
    'internal_meeting',
    'follow_up_meeting',
  ]),
  startDate: z.string().min(1, 'Meeting date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  durationMinutes: z.coerce.number().min(15).default(45),
  timezone: z.string().default('Asia/Karachi'),
  meetingLink: z.string().optional(),
  location: z.string().optional(),
  assignedEmployee: z.string().min(1, 'Assigned employee is required'),
  agenda: z.string().optional(),
  relatedLead: z.string().optional(),
});

export const MeetingModal = ({
  isOpen,
  onClose,
  onSubmit,
  employees = [],
  leads = [],
  initialLeadId = '',
  isLoading = false,
}) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: '',
      meetingType: 'online_meeting',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '14:00',
      durationMinutes: 45,
      timezone: 'Asia/Karachi',
      meetingLink: 'https://meet.google.com/ams-',
      location: '',
      assignedEmployee: '',
      agenda: '',
      relatedLead: initialLeadId || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      reset({
        title: '',
        meetingType: 'online_meeting',
        startDate: new Date().toISOString().split('T')[0],
        startTime: '14:00',
        durationMinutes: 45,
        timezone: 'Asia/Karachi',
        meetingLink: 'https://meet.google.com/ams-',
        location: '',
        assignedEmployee: employees[0]?._id || '',
        agenda: '',
        relatedLead: initialLeadId || '',
      });
    }
  }, [isOpen, reset, initialLeadId, employees]);

  const handleFormSubmit = async (data) => {
    // Construct UTC start & end dates
    const startDateTime = new Date(`${data.startDate}T${data.startTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + data.durationMinutes * 60 * 1000);

    const payload = {
      title: data.title,
      meetingType: data.meetingType,
      startTimeUTC: startDateTime.toISOString(),
      endTimeUTC: endDateTime.toISOString(),
      timezone: data.timezone,
      meetingLink: data.meetingLink,
      location: data.location,
      assignedEmployee: data.assignedEmployee,
      agenda: data.agenda,
      relatedLead: data.relatedLead || null,
    };

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to schedule meeting'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Meeting"
      subtitle="Creates meeting invite with automated calendar sync & conflict detection"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Buffer policy note */}
        <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
            <strong>2-Hour Buffer Policy:</strong> Company rules strictly forbid back-to-back overlap. Every agent is guaranteed at least a 2-hour window between scheduled meetings.
          </div>
        </div>

        {/* Error notification banner if conflict exists */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 dark:text-rose-200 font-medium">
              {errorMessage}
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Meeting Title *
          </label>
          <input
            type="text"
            {...register('title')}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            placeholder="e.g. Technical Discovery & Solution Architecture"
          />
          {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Meeting Type
            </label>
            <select
              {...register('meetingType')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white capitalize"
            >
              <option value="online_meeting">Online Video Meeting</option>
              <option value="client_call">Client Phone Call</option>
              <option value="physical_meeting">Physical / In-Person</option>
              <option value="internal_meeting">Internal Team Sync</option>
              <option value="follow_up_meeting">Follow-up Call</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Employee *
            </label>
            <select
              {...register('assignedEmployee')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.fullName} ({emp.designation})
                </option>
              ))}
            </select>
            {errors.assignedEmployee && (
              <p className="text-[11px] text-red-500 mt-1">{errors.assignedEmployee.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date *
            </label>
            <input
              type="date"
              {...register('startDate')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              {...register('startTime')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Duration (Mins)
            </label>
            <input
              type="number"
              step="15"
              {...register('durationMinutes')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Meeting URL (Google Meet / Zoom)
            </label>
            <input
              type="text"
              {...register('meetingLink')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Linked CRM Lead
            </label>
            <select
              {...register('relatedLead')}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            >
              <option value="">None (Internal Meeting)</option>
              {leads.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.leadId} - {l.clientName} ({l.companyName || 'No Company'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Meeting Agenda & Objectives
          </label>
          <textarea
            rows={3}
            {...register('agenda')}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            placeholder="Key discussion topics, proposal review, client questions..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading || isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading || isSubmitting}>
            Schedule Meeting
          </Button>
        </div>
      </form>
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  List,
  Plus,
  ExternalLink,
  PhoneCall,
  Video,
  MapPin,
  Clock,
  User,
  CheckCircle,
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { MeetingCalendar } from '../../components/calendar/MeetingCalendar';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { MeetingModal } from '../../components/forms/MeetingModal';
import { Modal } from '../../components/common/Modal';

export const Meetings = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [meetings, setMeetings] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [outcomeMeeting, setOutcomeMeeting] = useState(null);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [nextAction, setNextAction] = useState('');

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const [meetingsRes, eventsRes] = await Promise.all([
        api.get('/meetings?limit=100'),
        api.get('/meetings/calendar'),
      ]);
      setMeetings(meetingsRes.data.data);
      setCalendarEvents(eventsRes.data.data);
    } catch (err) {
      toast.error('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHelpers = async () => {
    try {
      const [empRes, leadsRes] = await Promise.all([
        api.get('/employees?limit=100'),
        api.get('/leads?limit=100'),
      ]);
      setEmployees(empRes.data.data);
      setLeads(leadsRes.data.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchMeetings();
    fetchHelpers();
  }, [viewMode]);

  const handleCreateMeeting = async (meetingData) => {
    try {
      await api.post('/meetings', meetingData);
      toast.success('Meeting scheduled successfully');
      fetchMeetings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule meeting');
      throw err;
    }
  };

  const handleSaveOutcome = async (e) => {
    e.preventDefault();
    if (!outcomeMeeting) return;
    try {
      await api.patch(`/meetings/${outcomeMeeting._id}/status`, {
        status: 'completed',
        meetingOutcome: outcomeNotes,
        nextAction,
      });
      toast.success('Meeting outcome and next action recorded');
      setOutcomeMeeting(null);
      fetchMeetings();
    } catch (err) {
      toast.error('Failed to save outcome');
    }
  };

  const columns = [
    {
      header: 'Meeting ID',
      accessorKey: 'meetingId',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
          {row.original.meetingId}
        </span>
      ),
    },
    {
      header: 'Title & Agenda',
      accessorKey: 'title',
      cell: ({ row }) => (
        <div className="min-w-0">
          <span className="font-bold text-slate-800 dark:text-white block truncate text-xs md:text-sm">
            {row.original.title}
          </span>
          {row.original.agenda && (
            <span className="text-xs text-slate-400 truncate block">{row.original.agenda}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'meetingType',
      cell: ({ row }) => (
        <span className="capitalize text-xs font-medium text-slate-700 dark:text-slate-300">
          {row.original.meetingType.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Date & Time (Asia/Karachi)',
      accessorKey: 'startTimeUTC',
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800 dark:text-white block">
            {new Date(row.original.startTimeUTC).toLocaleDateString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span className="text-slate-400">
            {new Date(row.original.startTimeUTC).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            -{' '}
            {new Date(row.original.endTimeUTC).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      ),
    },
    {
      header: 'Assigned Host',
      accessorKey: 'assignedEmployee.fullName',
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.original.assignedEmployee?.fullName || 'Assigned'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.original.status} />,
    },
    {
      header: 'Link / Location',
      id: 'link',
      cell: ({ row }) =>
        row.original.meetingLink ? (
          <a
            href={row.original.meetingLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Join <ExternalLink size={12} />
          </a>
        ) : (
          <span className="text-xs text-slate-400">{row.original.location || '—'}</span>
        ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setOutcomeMeeting(row.original);
            setOutcomeNotes(row.original.meetingOutcome || '');
            setNextAction(row.original.nextAction || '');
          }}
          className="text-xs py-1 px-2.5"
        >
          Outcome
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings & Video Calendar"
        subtitle="Manage client discovery calls, internal syncs, and follow-ups with automated UTC storage"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <List size={16} /> List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <CalendarDays size={16} /> Calendar
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsModalOpen(true)}
            >
              Schedule Meeting
            </Button>
          </div>
        }
      />

      {viewMode === 'list' ? (
        <DataTable
          columns={columns}
          data={meetings}
          isLoading={isLoading}
          searchPlaceholder="Search meetings by title, agenda, host..."
        />
      ) : (
        <MeetingCalendar
          events={calendarEvents}
          onEventClick={(event) => {
            const m = meetings.find((item) => item._id === event.id);
            if (m) {
              setOutcomeMeeting(m);
              setOutcomeNotes(m.meetingOutcome || '');
              setNextAction(m.nextAction || '');
            }
          }}
        />
      )}

      {/* Schedule Meeting Modal */}
      <MeetingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateMeeting}
        employees={employees}
        leads={leads}
      />

      {/* Meeting Outcome & Next Action Modal */}
      <Modal
        isOpen={Boolean(outcomeMeeting)}
        onClose={() => setOutcomeMeeting(null)}
        title={`Meeting Outcome: ${outcomeMeeting?.title}`}
        subtitle="Record discussion outcomes, client interest level, and next required action"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveOutcome} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Discussion Outcome & Meeting Notes
            </label>
            <textarea
              rows={3}
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              placeholder="Summary of client questions, budget agreement, solution presented..."
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Next Action Item
            </label>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="e.g. Send revised formal contract by Friday"
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setOutcomeMeeting(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Outcome & Mark Completed
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

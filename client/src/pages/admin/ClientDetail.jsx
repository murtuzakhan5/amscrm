import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2,
  Mail,
  Phone,
  ArrowLeft,
  Briefcase,
  TrendingUp,
  Calendar,
  CheckCircle,
  PhoneCall,
  Clock,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Plus,
  CalendarClock,
  AlertCircle,
  User,
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { ScheduleCallModal } from '../../components/forms/ScheduleCallModal';

export const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'followups' | 'notes'

  // Modals
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchClient = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/clients/${id}`);
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load client details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading client profile...</div>;
  }

  const client = data?.client;
  const projects = data?.projects || [];
  const deals = data?.deals || [];
  const meetings = data?.meetings || [];
  const followUps = client?.followUps || [];
  const clientNotes = client?.clientNotes || [];

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Client record not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/clients')} className="mt-4">
          Back to Clients
        </Button>
      </div>
    );
  }

  // Quick 1-Month Call-Back Action (1-Click button)
  const handleQuick1MonthCall = async () => {
    try {
      setIsActionLoading(true);
      const d = new Date();
      d.setDate(d.getDate() + 30);
      const dateStr = d.toISOString().split('T')[0];

      await api.post(`/clients/${id}/schedule-call`, {
        followUpDate: dateStr,
        reason: 'Client requested call-back after 1 month',
        title: `1-Month Follow-Up Call with ${client.name}`,
        notes: 'Client specified to re-contact in 1 month to discuss next steps & budget.',
      });

      toast.success('1-Month Call-Back scheduled successfully!');
      fetchClient();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule call');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleScheduleCall = async (payload) => {
    try {
      setIsActionLoading(true);
      await api.post(`/clients/${id}/schedule-call`, payload);
      toast.success('Follow-up call scheduled!');
      fetchClient();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule call');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      setIsActionLoading(true);
      await api.post(`/clients/${id}/notes`, { text: noteText });
      toast.success('Note added to timeline');
      setNoteText('');
      setIsNoteModalOpen(false);
      fetchClient();
    } catch (err) {
      toast.error('Failed to add note');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteFollowUp = async (followUpId) => {
    try {
      await api.patch(`/clients/${id}/follow-ups/${followUpId}`, {
        status: 'completed',
        outcomeNotes: 'Call completed successfully by agent',
      });
      toast.success('Follow-up call marked as completed');
      fetchClient();
    } catch (err) {
      toast.error('Failed to update follow-up');
    }
  };

  // Calculate days remaining until next call
  const getCallCountdown = (targetDate) => {
    if (!targetDate) return null;
    const diffMs = new Date(targetDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} day(s) overdue`, isOverdue: true };
    if (diffDays === 0) return { text: 'Due Today', isToday: true };
    if (diffDays === 1) return { text: 'Tomorrow', isUpcoming: true };
    return { text: `In ${diffDays} days`, isUpcoming: true };
  };

  const countdown = getCallCountdown(client.nextFollowUpDate);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{client.name}</h2>
              <Badge status={client.status} />
              {client.isDirectClosed && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                  ⚡ Direct Won (${Number(client.dealValue || 0).toLocaleString()})
                </span>
              )}
              {client.nextFollowUpDate && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                  <PhoneCall size={11} /> {countdown?.text}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {client.companyName ? `${client.companyName} • ` : ''}Managed by{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {client.accountManager?.fullName || 'Direct'}
              </span>
              {client.closedBy && (
                <>
                  {' • '}Closed by{' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {client.closedBy?.fullName} {client.closedBy?.designation ? `(${client.closedBy.designation})` : ''}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={Sparkles}
            onClick={handleQuick1MonthCall}
            isLoading={isActionLoading}
            className="bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 font-bold"
          >
            Call in 1 Month
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={PhoneCall}
            onClick={() => setIsCallModalOpen(true)}
          >
            Schedule Call
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={MessageSquare}
            onClick={() => setIsNoteModalOpen(true)}
          >
            Add Note
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Calendar}
            onClick={() => navigate('/meetings')}
          >
            Book Meeting
          </Button>
        </div>
      </div>

      {/* Prominent Follow-up Call Reminder Banner */}
      {client.nextFollowUpDate && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm shrink-0">
              <PhoneCall size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                  Scheduled Follow-up Call ({countdown?.text})
                </h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                  {new Date(client.nextFollowUpDate).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200 mt-1">
                <strong>Discussion Purpose:</strong>{' '}
                {client.followUpReason || 'Client requested scheduled call-back'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {followUps.find((f) => f.status === 'pending') && (
              <Button
                size="sm"
                variant="success"
                icon={CheckCircle2}
                onClick={() => {
                  const pending = followUps.find((f) => f.status === 'pending');
                  if (pending) handleCompleteFollowUp(pending._id);
                }}
              >
                Mark Call Done
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCallModalOpen(true)}
              className="text-xs"
            >
              Reschedule
            </Button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={projects.length}
          icon={Briefcase}
          color="navy"
          subtitle="Client contracts"
        />
        <StatCard
          title="Deals in Pipeline"
          value={deals.length}
          icon={TrendingUp}
          color="blue"
          subtitle="Sales opportunities"
        />
        <StatCard
          title="Scheduled Calls"
          value={followUps.filter((f) => f.status === 'pending').length}
          icon={PhoneCall}
          color="amber"
          subtitle={client.nextFollowUpDate ? 'Call pending' : 'No calls pending'}
        />
        <StatCard
          title="Total Meetings"
          value={meetings.length}
          icon={Calendar}
          color="purple"
          subtitle="Touchpoints recorded"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Overview & Projects
        </button>
        <button
          onClick={() => setActiveTab('followups')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'followups'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PhoneCall size={14} /> Call History & Follow-ups ({followUps.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'notes'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare size={14} /> Client Notes ({clientNotes.length})
        </button>
      </div>

      {/* TAB 1: Overview & Projects */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Contact Details Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
              Contact & Manager Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Contact Email</span>
                <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Mail size={13} className="text-blue-500" /> {client.email}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Phone Number</span>
                <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Phone size={13} className="text-emerald-500" /> {client.phoneNumber || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Account Manager</span>
                <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <User size={13} className="text-indigo-500" />
                  {client.accountManager?.fullName || 'Direct to Executive'}
                  {client.accountManager?.designation && (
                    <span className="text-[10px] text-slate-500">({client.accountManager.designation})</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Related Projects List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Related Projects ({projects.length})
            </h3>

            <div className="space-y-3">
              {projects.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No projects linked to this client yet.</p>
              ) : (
                projects.map((p) => (
                  <div
                    key={p._id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.projectName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Deadline: {new Date(p.deadline).toLocaleDateString()} • Manager:{' '}
                        {p.projectManager?.fullName || 'Assigned'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        {p.progressPercentage}%
                      </span>
                      <Badge status={p.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Follow-ups & Call History */}
      {activeTab === 'followups' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Call Reminders & Schedule Log</h3>
              <p className="text-xs text-slate-500">History of future calls requested by the client and agent follow-ups</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              icon={PhoneCall}
              onClick={() => setIsCallModalOpen(true)}
            >
              Schedule New Call
            </Button>
          </div>

          <div className="space-y-3">
            {followUps.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500">No scheduled calls or follow-ups recorded yet.</p>
                <Button size="sm" variant="outline" onClick={handleQuick1MonthCall}>
                  Schedule 1-Month Call-Back
                </Button>
              </div>
            ) : (
              followUps.map((fu) => (
                <div
                  key={fu._id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {fu.title}
                      </span>
                      <Badge status={fu.status} />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {fu.reason}
                    </p>
                    {fu.notes && (
                      <p className="text-[11px] text-slate-500 whitespace-pre-wrap">{fu.notes}</p>
                    )}
                    <div className="text-[10px] text-slate-400 flex items-center gap-3 pt-0.5">
                      <span>Scheduled for: {new Date(fu.scheduledDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>• Created: {new Date(fu.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {fu.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="success"
                      icon={CheckCircle2}
                      onClick={() => handleCompleteFollowUp(fu._id)}
                      className="text-xs shrink-0"
                    >
                      Complete Call
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Client Notes */}
      {activeTab === 'notes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Interaction Notes Timeline</h3>
              <p className="text-xs text-slate-500">Record conversations, feedback, and customer requirements</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => setIsNoteModalOpen(true)}
            >
              Add Note
            </Button>
          </div>

          <div className="space-y-3">
            {clientNotes.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No interaction notes recorded yet.</p>
            ) : (
              clientNotes.map((n, i) => (
                <div
                  key={i}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-1"
                >
                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{n.text}</p>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>By: {n.author?.fullName || n.author?.email || 'Agent'}</span>
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Schedule Call Modal */}
      <ScheduleCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        onSubmit={handleScheduleCall}
        client={client}
      />

      {/* Add Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Interaction Note"
        subtitle={`Add a note to ${client.name}'s customer file`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddNote} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note Details *
            </label>
            <textarea
              rows={4}
              required
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Record details of conversation, client preferences, or requirements..."
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isActionLoading}>
              Save Note
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

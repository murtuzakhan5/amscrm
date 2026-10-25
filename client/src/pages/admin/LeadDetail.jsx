import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  User,
  Building2,
  DollarSign,
  CheckCircle2,
  XCircle,
  Plus,
  Send,
  PhoneCall,
  UserPlus,
  Sparkles,
  CalendarClock,
} from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConvertLeadModal } from '../../components/forms/ConvertLeadModal';
import { LostReasonModal } from '../../components/forms/LostReasonModal';
import { FutureLeadModal } from '../../components/forms/FutureLeadModal';
import { MeetingModal } from '../../components/forms/MeetingModal';
import { Modal } from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const PIPELINE_STAGES = [
  { key: 'new_lead', label: 'New' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'follow_up_required', label: 'Follow-up' },
  { key: 'meeting_scheduled', label: 'Meeting' },
  { key: 'proposal_sent', label: 'Proposal' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

export const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [leadData, setLeadData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [showFutureModal, setShowFutureModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  // Inline forms
  const [noteText, setNoteText] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  const fetchLeadDetails = async () => {
    try {
      setIsLoading(true);
      const [leadRes, empRes] = await Promise.all([
        api.get(`/leads/${id}`),
        api.get('/employees?limit=100'),
      ]);
      setLeadData(leadRes.data.data);
      setEmployees(empRes.data.data);
    } catch (err) {
      toast.error('Failed to load lead details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading lead profile...</div>;
  }

  const lead = leadData?.lead;
  const activities = leadData?.activities || [];
  const followUps = leadData?.followUps || [];
  const meetings = leadData?.meetings || [];
  const tasks = leadData?.tasks || [];

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Lead record not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/leads')} className="mt-4">
          Back to Leads
        </Button>
      </div>
    );
  }

  const handleUpdateStatus = async (status, payload = {}) => {
    try {
      await api.patch(`/leads/${id}/status`, { status, ...payload });
      toast.success(`Lead status updated to ${status.replace('_', ' ')}`);
      fetchLeadDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      await api.post(`/leads/${id}/notes`, { text: noteText });
      toast.success('Note added to timeline');
      setNoteText('');
      fetchLeadDetails();
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  const handleLogCall = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/leads/${id}/calls`, {
        notes: callNotes,
        outcome: 'Spoke with client regarding requirements',
      });
      toast.success('Call logged successfully');
      setCallNotes('');
      fetchLeadDetails();
    } catch (err) {
      toast.error('Failed to log call');
    }
  };

  const handleScheduleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpTitle || !followUpDate) return;
    try {
      await api.post(`/leads/${id}/follow-ups`, {
        title: followUpTitle,
        scheduledDate: followUpDate,
      });
      toast.success('Follow-up scheduled');
      setShowFollowUpModal(false);
      setFollowUpTitle('');
      setFollowUpDate('');
      fetchLeadDetails();
    } catch (err) {
      toast.error('Failed to schedule follow-up');
    }
  };

  const handleAssignLead = async (e) => {
    e.preventDefault();
    if (!assigneeId) return;
    try {
      await api.patch(`/leads/${id}/assign`, { assignedTo: assigneeId });
      toast.success('Lead assigned successfully');
      setShowAssignModal(false);
      fetchLeadDetails();
    } catch (err) {
      toast.error('Failed to assign lead');
    }
  };

  const handleConvertLead = async (formData) => {
    try {
      await api.post(`/leads/${id}/convert`, formData);
      toast.success('Lead converted into Client successfully!');
      fetchLeadDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Conversion failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Progression Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/leads')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {lead.leadId}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {lead.clientName}
              </h2>
              <Badge status={lead.status} />
              <Badge status={lead.priority} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lead.companyName || 'Independent Client'} • Source: {lead.leadSource}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {user?.role !== 'employee' && (
            <Button
              variant="outline"
              size="sm"
              icon={UserPlus}
              onClick={() => setShowAssignModal(true)}
            >
              {lead.assignedTo ? 'Reassign' : 'Assign'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            icon={Calendar}
            onClick={() => setShowMeetingModal(true)}
          >
            Meeting
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Clock}
            onClick={() => setShowFollowUpModal(true)}
          >
            Follow-up
          </Button>

          {lead.status !== 'won' && lead.status !== 'lost' && (
            <Button
              variant="outline"
              size="sm"
              icon={PhoneCall}
              onClick={async () => {
                const d = new Date();
                d.setDate(d.getDate() + 30);
                await handleUpdateStatus('in_future_interested', {
                  futureFollowUpDate: d.toISOString().split('T')[0],
                  futureReason: 'Client requested call-back after 1 month',
                  notes: 'Client specified to re-contact in 1 month.',
                });
                toast.success('1-Month Call-Back scheduled for this prospect!');
              }}
              className="border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold"
            >
              Call in 1 Mo
            </Button>
          )}

          {lead.status !== 'won' && lead.status !== 'lost' && (
            <Button
              variant="outline"
              size="sm"
              icon={Sparkles}
              onClick={() => setShowFutureModal(true)}
              className="border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
            >
              Future / Interested
            </Button>
          )}

          {lead.status !== 'won' && !lead.convertedClient && (
            <Button
              variant="success"
              size="sm"
              icon={CheckCircle2}
              onClick={() => setShowConvertModal(true)}
            >
              Convert to Client
            </Button>
          )}

          {lead.status !== 'lost' && (
            <Button
              variant="danger"
              size="sm"
              icon={XCircle}
              onClick={() => setShowLostModal(true)}
            >
              Mark Lost
            </Button>
          )}
        </div>
      </div>

      {/* Prominent Future Interested Banner */}
      {lead.status === 'in_future_interested' && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-sm shrink-0">
              <CalendarClock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-teal-950 dark:text-teal-100">
                  Future Prospect (Nurturing Pipeline)
                </h4>
                <Badge status="in_future_interested" />
              </div>
              <p className="text-xs text-teal-800 dark:text-teal-300 mt-1">
                This client requested follow-up at a later date. Planned re-contact date:{' '}
                <span className="font-bold underline">
                  {lead.futureFollowUpDate
                    ? new Date(lead.futureFollowUpDate).toLocaleDateString([], {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Not scheduled yet'}
                </span>
              </p>
              {lead.futureReason && (
                <p className="text-xs text-teal-700 dark:text-teal-400 mt-0.5">
                  <strong>Reason:</strong> {lead.futureReason}
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUpdateStatus('contacted')}
            className="shrink-0 border-teal-300 text-teal-800 dark:text-teal-200 bg-white dark:bg-slate-900 text-xs"
          >
            Re-open to Active Pipeline
          </Button>
        </div>
      )}

      {/* Stage Progression Pipeline Steps */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 overflow-x-auto">
        <div className="flex items-center min-w-[700px]">
          {PIPELINE_STAGES.slice(0, 8).map((stage, idx) => {
            const isCurrent = lead.status === stage.key;
            const isWon = lead.status === 'won';
            const isPast =
              PIPELINE_STAGES.findIndex((s) => s.key === lead.status) > idx || isWon;

            return (
              <React.Fragment key={stage.key}>
                <div
                  onClick={() => handleUpdateStatus(stage.key)}
                  className={`flex-1 flex flex-col items-center cursor-pointer group`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 transition ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
                {idx < 7 && (
                  <div
                    className={`h-0.5 flex-1 transition ${
                      isPast ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Details Left, Timeline & Actions Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Information Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
              Lead Information
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Specialist</span>
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <User size={14} className="text-blue-500" />
                  {lead.assignedTo?.fullName || (
                    <span className="text-amber-500 font-semibold">Unassigned</span>
                  )}
                </span>
                {lead.assignedTo?.designation && (
                  <span className="text-[11px] text-slate-400 pl-5 block">
                    {lead.assignedTo.designation}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Email</span>
                <a
                  href={`mailto:${lead.email}`}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 truncate"
                >
                  <Mail size={14} className="shrink-0" /> {lead.email}
                </a>
              </div>

              {lead.phoneNumber && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Phone</span>
                  <a
                    href={`tel:${lead.phoneNumber}`}
                    className="font-semibold text-slate-800 dark:text-white flex items-center gap-2"
                  >
                    <Phone size={14} className="text-emerald-500 shrink-0" /> {lead.phoneNumber}
                  </a>
                </div>
              )}

              {lead.whatsappNumber && (
                <div>
                  <span className="text-slate-400 block mb-0.5">WhatsApp</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-2">
                    <MessageSquare size={14} className="shrink-0" /> {lead.whatsappNumber}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block mb-0.5">Interested Service</span>
                <span className="font-semibold text-slate-800 dark:text-white block">
                  {lead.interestedService}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Estimated Budget</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-base">
                  {lead.currency} {(lead.estimatedBudget || 0).toLocaleString()}
                </span>
              </div>

              {lead.lostReason && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800">
                  <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block mb-1">
                    Recorded Lost Reason:
                  </span>
                  <p className="text-xs text-rose-700 dark:text-rose-200">{lead.lostReason}</p>
                </div>
              )}
            </div>

            {lead.projectRequirements && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Requirements & Scope</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  {lead.projectRequirements}
                </p>
              </div>
            )}
          </div>

          {/* Scheduled Follow-ups Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Follow-ups ({followUps.length})
              </h3>
              <button
                onClick={() => setShowFollowUpModal(true)}
                className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <Plus size={14} /> Schedule
              </button>
            </div>

            <div className="space-y-2.5">
              {followUps.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No pending follow-ups.</p>
              ) : (
                followUps.map((fu) => (
                  <div
                    key={fu._id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 dark:text-white">{fu.title}</span>
                      <Badge status={fu.status} />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {new Date(fu.scheduledDate).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Activity Timeline, Notes & Calls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Action Box: Add Note or Log Call */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Add Follow-up Note / Call Log
            </h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Record client feedback, pricing discussion notes, or next action items..."
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
              />
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={PhoneCall}
                  onClick={handleLogCall}
                  className="text-xs"
                >
                  Log Quick Call
                </Button>
                <Button type="submit" variant="primary" size="sm" icon={Send} className="text-xs">
                  Save Note
                </Button>
              </div>
            </form>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">
              Activity History Timeline
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">No logged activity yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act._id} className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {act.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {act.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Convert Lead to Client Modal */}
      <ConvertLeadModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        onConvert={handleConvertLead}
        lead={lead}
      />

      {/* Lost Reason Modal */}
      <LostReasonModal
        isOpen={showLostModal}
        onClose={() => setShowLostModal(false)}
        onSubmit={(payload) => handleUpdateStatus('lost', payload)}
        lead={lead}
      />

      {/* Future Prospect / Deferral Modal */}
      <FutureLeadModal
        isOpen={showFutureModal}
        onClose={() => setShowFutureModal(false)}
        onSubmit={(payload) => handleUpdateStatus('in_future_interested', payload)}
        lead={lead}
      />

      {/* Schedule Meeting Modal */}
      <MeetingModal
        isOpen={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        onSubmit={async (meetingData) => {
          await api.post('/meetings', meetingData);
          toast.success('Meeting scheduled successfully');
          fetchLeadDetails();
        }}
        employees={employees}
        initialLeadId={lead._id}
      />

      {/* Schedule Follow-up Modal */}
      <Modal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        title="Schedule Next Follow-Up"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleScheduleFollowUp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purpose / Title *
            </label>
            <input
              type="text"
              required
              value={followUpTitle}
              onChange={(e) => setFollowUpTitle(e.target.value)}
              placeholder="e.g. Call to discuss revised pricing"
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Scheduled Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setShowFollowUpModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Schedule Follow-Up
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reassign Lead Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Lead to Specialist"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAssignLead} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Employee *
            </label>
            <select
              required
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.fullName} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PhoneCall, Calendar, Clock, Sparkles } from 'lucide-react';

const COMMON_CALL_REASONS = [
  'Client requested call-back after 1 month',
  'Follow up on proposal & software agreement terms',
  'Client interested in services, reviewing internal budget',
  'Quarterly account check-in & relationship review',
  'Contract renewal and feature expansion discussion',
  'Other custom reason',
];

export const ScheduleCallModal = ({
  isOpen,
  onClose,
  onSubmit,
  client,
  isLoading = false,
}) => {
  // Default to 1 month from today
  const defaultDate = new Date();
  defaultDate.setMonth(defaultDate.getMonth() + 1);
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  const [followUpDate, setFollowUpDate] = useState(defaultDateStr);
  const [selectedReason, setSelectedReason] = useState(COMMON_CALL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');

  if (!client) return null;

  const setPresetDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other custom reason' ? customReason : selectedReason;
    if (!followUpDate) return;

    await onSubmit({
      followUpDate,
      reason: finalReason,
      title: `Call with ${client.name}`,
      notes,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Follow-up Call"
      subtitle={`Keep client relationship nurtured with automated reminder`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 flex items-start gap-3">
          <PhoneCall className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 dark:text-blue-200">
            Scheduling a call for <strong>{client.name}</strong> will create a reminder for the assigned agent and show up on the client calendar.
          </p>
        </div>

        {/* Quick Date Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Planned Call Date *
          </label>
          <div className="flex flex-wrap gap-2 mb-2.5">
            <button
              type="button"
              onClick={() => {
                setPresetDate(30);
                setSelectedReason('Client requested call-back after 1 month');
              }}
              className="px-2.5 py-1 text-xs font-bold bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 text-blue-800 dark:text-blue-300 rounded-lg transition flex items-center gap-1"
            >
              <Sparkles size={12} /> +1 Month (Requested)
            </button>
            <button
              type="button"
              onClick={() => setPresetDate(14)}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
            >
              +2 Weeks
            </button>
            <button
              type="button"
              onClick={() => setPresetDate(7)}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
            >
              +1 Week
            </button>
            <button
              type="button"
              onClick={() => setPresetDate(90)}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
            >
              +3 Months
            </button>
          </div>

          <input
            type="date"
            required
            min={new Date().toISOString().split('T')[0]}
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reason / Discussion Topic *
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
          >
            {COMMON_CALL_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {selectedReason === 'Other custom reason' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custom Discussion Details *
            </label>
            <textarea
              rows={2}
              required
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
              placeholder="What did the client specify for the upcoming call..."
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Call Preparation Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            placeholder="Key discussion points, budget figures, proposals to present..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading} icon={PhoneCall}>
            Schedule Call
          </Button>
        </div>
      </form>
    </Modal>
  );
};

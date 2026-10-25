import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CalendarClock, Sparkles } from 'lucide-react';

const COMMON_FUTURE_REASONS = [
  'Budget allocated for next financial quarter / year',
  'Decision postponed pending executive board approval',
  'Current vendor contract active until later this year',
  'Seasonal business cycle / Will commence next season',
  'Interested in AMS services, but internal team not ready yet',
  'Awaiting product launch before software development',
  'Other custom reason',
];

export const FutureLeadModal = ({
  isOpen,
  onClose,
  onSubmit,
  lead,
  isLoading = false,
}) => {
  // Default to 1 month from today
  const defaultDate = new Date();
  defaultDate.setMonth(defaultDate.getMonth() + 1);
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  const [futureDate, setFutureDate] = useState(defaultDateStr);
  const [selectedReason, setSelectedReason] = useState(COMMON_FUTURE_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');

  if (!lead) return null;

  const setPresetDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFutureDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other custom reason' ? customReason : selectedReason;
    if (!futureDate) return;

    await onSubmit({
      status: 'in_future_interested',
      futureFollowUpDate: futureDate,
      futureReason: finalReason,
      notes,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Defer Lead (Future Interested)"
      subtitle="Keep this prospect nurtured in the pipeline without losing track"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <p className="text-xs text-teal-900 dark:text-teal-200">
            <strong>{lead.clientName}</strong> is interested but won't close right now.
            Scheduling a future follow-up will preserve full history and auto-remind the assigned agent.
          </p>
        </div>

        {/* Future Follow-up Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Planned Re-contact Date *
          </label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setPresetDate(14)}
              className="px-2 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-slate-700 dark:text-slate-300 rounded-lg transition"
            >
              +2 Weeks
            </button>
            <button
              type="button"
              onClick={() => setPresetDate(30)}
              className="px-2 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-slate-700 dark:text-slate-300 rounded-lg transition"
            >
              +1 Month
            </button>
            <button
              type="button"
              onClick={() => setPresetDate(90)}
              className="px-2 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-slate-700 dark:text-slate-300 rounded-lg transition"
            >
              +3 Months (Q)
            </button>
            <button
              type="button"
              onClick={() => setPresetDate(180)}
              className="px-2 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-slate-700 dark:text-slate-300 rounded-lg transition"
            >
              +6 Months
            </button>
          </div>
          <input
            type="date"
            required
            value={futureDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setFutureDate(e.target.value)}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 dark:text-white"
          />
        </div>

        {/* Reason Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reason for Postponing Deal *
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 dark:text-white"
          >
            {COMMON_FUTURE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {selectedReason === 'Other custom reason' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custom Reason *
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 dark:text-white"
              placeholder="State why this client prefers a later date..."
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Additional Nurturing Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 dark:text-white"
            placeholder="Key discussion points to remember when following up..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white">
            Save as Future Prospect
          </Button>
        </div>
      </form>
    </Modal>
  );
};

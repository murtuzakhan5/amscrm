import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertCircle } from 'lucide-react';

const COMMON_REASONS = [
  'Budget was below AMS minimum project scope threshold',
  'Competitor offered lower pricing',
  'Client decided to build in-house',
  'Project cancelled or put on indefinite hold',
  'Client unresponsive after repeated follow-ups',
  'Required technology stack not aligned with AMS specialties',
  'Other custom reason',
];

export const LostReasonModal = ({
  isOpen,
  onClose,
  onSubmit,
  lead,
  isLoading = false,
}) => {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  if (!lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other custom reason' ? customReason : selectedReason;
    if (!finalReason.trim()) return;

    await onSubmit({
      status: 'lost',
      lostReason: finalReason,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Lost Reason"
      subtitle="A mandatory reason is required to maintain sales analytics integrity"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-900 dark:text-rose-300">
            Marking <strong>{lead.clientName}</strong> as Lost will close this lead pipeline cycle.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reason Category *
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-600 dark:text-white"
          >
            {COMMON_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {selectedReason === 'Other custom reason' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Specify Reason Details *
            </label>
            <textarea
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-600 dark:text-white"
              placeholder="Explain why this deal could not be closed..."
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" size="sm" isLoading={isLoading}>
            Mark as Lost
          </Button>
        </div>
      </form>
    </Modal>
  );
};

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CheckCircle2 } from 'lucide-react';

export const ConvertLeadModal = ({
  isOpen,
  onClose,
  onConvert,
  lead,
  isLoading = false,
}) => {
  const [notes, setNotes] = useState('');

  if (!lead) return null;

  const handleConvert = async (e) => {
    e.preventDefault();
    await onConvert({
      clientName: lead.clientName,
      companyName: lead.companyName,
      email: lead.email,
      phoneNumber: lead.phoneNumber,
      services: lead.interestedService ? [lead.interestedService] : [],
      notes,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert Lead into Official Client"
      subtitle="Creates a client record and updates lead to Won"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleConvert} className="space-y-4">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 dark:text-slate-300">
            <p className="font-bold text-slate-900 dark:text-white">
              Converting: {lead.clientName} ({lead.companyName || 'Independent'})
            </p>
            <p className="mt-1">
              This will create a new client account under your CRM database and mark this lead as{' '}
              <span className="font-semibold text-emerald-600">Won</span>. All activity history and
              notes will be fully preserved.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Conversion / Account Transition Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
            placeholder="Special onboarding conditions, agreed discount, project kickoff date..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="success" size="sm" isLoading={isLoading}>
            Confirm Conversion
          </Button>
        </div>
      </form>
    </Modal>
  );
};

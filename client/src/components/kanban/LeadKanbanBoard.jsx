import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../common/Badge';
import { DollarSign, User, Calendar, ExternalLink } from 'lucide-react';

const STAGE_CONFIG = [
  { key: 'new_lead', title: 'New Leads', color: 'border-t-blue-500' },
  { key: 'assigned', title: 'Assigned', color: 'border-t-indigo-500' },
  { key: 'contacted', title: 'Contacted', color: 'border-t-sky-500' },
  { key: 'follow_up_required', title: 'Follow-up Due', color: 'border-t-amber-500' },
  { key: 'meeting_scheduled', title: 'Meeting Set', color: 'border-t-purple-500' },
  { key: 'proposal_sent', title: 'Proposal Sent', color: 'border-t-cyan-500' },
  { key: 'negotiation', title: 'Negotiation', color: 'border-t-orange-500' },
  { key: 'in_future_interested', title: 'Interested (Future)', color: 'border-t-teal-500' },
  { key: 'won', title: 'Won / Client', color: 'border-t-emerald-500' },
  { key: 'lost', title: 'Lost', color: 'border-t-rose-500' },
];

export const LeadKanbanBoard = ({ kanbanData = {}, onStatusChange }) => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 select-none min-h-[600px]">
      {STAGE_CONFIG.map(({ key, title, color }) => {
        const leads = kanbanData[key] || [];

        return (
          <div
            key={key}
            className={`w-80 shrink-0 bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 border-t-4 ${color} flex flex-col max-h-[75vh]`}
          >
            {/* Column Header */}
            <div className="p-3.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-800/40 rounded-t-xl">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {title}
              </span>
              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center">
                {leads.length}
              </span>
            </div>

            {/* Column Content */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
              {leads.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No leads in this stage
                </div>
              ) : (
                leads.map((lead) => (
                  <div
                    key={lead._id}
                    onClick={() => navigate(`/leads/${lead._id}`)}
                    className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                        {lead.leadId}
                      </span>
                      <Badge status={lead.priority} />
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition truncate">
                      {lead.clientName}
                    </h4>
                    {lead.companyName && (
                      <p className="text-[11px] text-slate-500 truncate mb-2">
                        {lead.companyName}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium line-clamp-1 mb-2">
                      {lead.interestedService}
                    </p>

                    {lead.status === 'in_future_interested' && lead.futureFollowUpDate && (
                      <div className="mb-2 px-2 py-1 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-lg flex items-center gap-1.5 text-[10px] text-teal-700 dark:text-teal-300 font-medium">
                        <Calendar size={11} className="shrink-0" />
                        <span className="truncate">
                          Due: {new Date(lead.futureFollowUpDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {lead.currency} {(lead.estimatedBudget || 0).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1 truncate max-w-[120px]">
                        <User size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">
                          {lead.assignedTo?.fullName?.split(' ')[0] || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

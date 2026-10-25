import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Target,
  Plus,
  LayoutGrid,
  List,
  Eye,
  Mail,
  Phone,
  User,
  DollarSign,
  Download,
  Filter,
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { LeadKanbanBoard } from '../../components/kanban/LeadKanbanBoard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LeadModal } from '../../components/forms/LeadModal';
import { useAuthStore } from '../../store/authStore';

export const Leads = () => {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [leads, setLeads] = useState([]);
  const [kanbanData, setKanbanData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const isEmployee = user?.role === 'employee';

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      if (viewMode === 'table') {
        const res = await api.get('/leads', {
          params: {
            category: categoryFilter || undefined,
            status: statusFilter || undefined,
            priority: priorityFilter || undefined,
            assignedTo: assignedFilter || undefined,
            limit: 100,
          },
        });
        setLeads(res.data.data);
      } else {
        const res = await api.get('/leads/kanban');
        setKanbanData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load CRM leads');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees?limit=100');
      setEmployees(res.data.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchLeads();
  }, [viewMode, categoryFilter, statusFilter, priorityFilter, assignedFilter]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateLead = async (formData) => {
    try {
      await api.post('/leads', formData);
      toast.success('Lead created and logged into pipeline!');
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create lead');
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/leads/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ams_crafters_leads.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Leads exported to CSV');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const columns = [
    {
      header: 'Lead ID',
      accessorKey: 'leadId',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
          {row.original.leadId}
        </span>
      ),
    },
    {
      header: 'Client / Prospect',
      accessorKey: 'clientName',
      cell: ({ row }) => (
        <div className="min-w-0">
          <span
            onClick={() => navigate(`/leads/${row.original._id}`)}
            className="font-bold text-slate-800 dark:text-white hover:text-blue-600 cursor-pointer block truncate text-xs md:text-sm"
          >
            {row.original.clientName}
          </span>
          {row.original.companyName && (
            <span className="text-xs text-slate-500 truncate block">
              {row.original.companyName}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Service Interested',
      accessorKey: 'interestedService',
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium block truncate max-w-[200px]">
          {row.original.interestedService}
        </span>
      ),
    },
    {
      header: 'Budget',
      accessorKey: 'estimatedBudget',
      cell: ({ row }) => (
        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
          {row.original.currency} {(row.original.estimatedBudget || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: ({ row }) => <Badge status={row.original.priority} />,
    },
    {
      header: 'Stage Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <div className="space-y-1">
          <Badge status={row.original.status} />
          {row.original.status === 'in_future_interested' && row.original.futureFollowUpDate && (
            <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold whitespace-nowrap">
              Follow-up: {new Date(row.original.futureFollowUpDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Assigned To',
      accessorKey: 'assignedTo.fullName',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
          <User size={13} className="text-slate-400 shrink-0" />
          <span className="truncate">
            {row.original.assignedTo?.fullName || <span className="text-amber-500 font-semibold">Unassigned</span>}
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          icon={Eye}
          onClick={() => navigate(`/leads/${row.original._id}`)}
          className="text-xs py-1 px-2.5"
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Management Pipeline"
        subtitle="Track inquiries, assignments, client calls, proposals, and deal conversions"
        actions={
          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Table / Kanban */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <List size={16} /> Table
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <LayoutGrid size={16} /> Kanban
              </button>
            </div>

            {!isEmployee && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setIsModalOpen(true)}
              >
                Add Lead
              </Button>
            )}
          </div>
        }
      />

      {/* Quick Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: '', label: 'All Leads' },
          { key: 'active', label: 'Active Pipeline' },
          { key: 'future', label: '🌟 Interested (Future)' },
          { key: 'won', label: 'Won Deals' },
          { key: 'lost', label: 'Lost' },
        ].map((tab) => {
          const isActive = categoryFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setCategoryFilter(tab.key);
                if (tab.key === 'future') setStatusFilter('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? tab.key === 'future'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={leads}
          isLoading={isLoading}
          searchPlaceholder="Search leads by client name, email, company, ID..."
          onExportCsv={handleExportCsv}
          filterComponent={
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 capitalize"
              >
                <option value="">All Statuses</option>
                <option value="new_lead">New Lead</option>
                <option value="assigned">Assigned</option>
                <option value="contacted">Contacted</option>
                <option value="follow_up_required">Follow-up Required</option>
                <option value="meeting_scheduled">Meeting Scheduled</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="negotiation">Negotiation</option>
                <option value="in_future_interested">Interested (Future)</option>
                <option value="won">Won (Client)</option>
                <option value="lost">Lost</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 capitalize"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              {!isEmployee && (
                <select
                  value={assignedFilter}
                  onChange={(e) => setAssignedFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          }
        />
      ) : (
        <LeadKanbanBoard kanbanData={kanbanData} />
      )}

      {/* Add Lead Modal */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateLead}
        employees={employees}
      />
    </div>
  );
};

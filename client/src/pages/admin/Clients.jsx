import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2,
  Plus,
  Mail,
  Phone,
  Eye,
  User,
  Briefcase,
  CalendarDays,
  List,
  Users,
  CalendarCheck2,
  PhoneCall,
  Clock,
  Sparkles,
  Zap,
  DollarSign,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { MeetingCalendar } from '../../components/calendar/MeetingCalendar';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

export const Clients = () => {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [clients, setClients] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarMeta, setCalendarMeta] = useState({ totalClients: 0, daysWithOnboarding: 0 });
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'direct_closed' | 'active' | 'scheduled_calls' | 'archived'
  const [filterAgent, setFilterAgent] = useState('all');

  // Date drill-down modal for calendar
  const [selectedCalendarItem, setSelectedCalendarItem] = useState(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  const navigate = useNavigate();
  const isEmployee = user?.role === 'employee';

  // New Client Form State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountManager, setAccountManager] = useState('');
  const [isDirectClosed, setIsDirectClosed] = useState(false);
  const [closedBy, setClosedBy] = useState('');
  const [dealValue, setDealValue] = useState(1000);
  const [actualRevenue, setActualRevenue] = useState(1000);
  const [paymentStatus, setPaymentStatus] = useState('fully_paid');
  const [selectedService, setSelectedService] = useState('Video Editing');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [followUpReason, setFollowUpReason] = useState('Client requested call-back after 1 month');

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const params = { limit: 100 };
      if (filterTab === 'active') params.status = 'active';
      if (filterTab === 'archived') params.status = 'archived';
      if (filterTab === 'scheduled_calls') params.hasFollowUp = 'true';
      if (filterTab === 'direct_closed') params.directClosed = 'true';
      if (filterAgent !== 'all') params.closedBy = filterAgent;

      const res = await api.get('/clients', { params });
      setClients(res.data.data);
    } catch (err) {
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    try {
      const res = await api.get('/clients/calendar');
      setCalendarEvents(res.data.data || []);
      setCalendarMeta(res.data.meta || { totalClients: 0, daysWithOnboarding: 0 });
    } catch (err) {
      toast.error('Failed to load client calendar records');
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees?limit=100');
      setEmployees(res.data.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchClients();
  }, [filterTab, filterAgent]);

  useEffect(() => {
    fetchCalendarData();
    fetchEmployees();
  }, []);

  // Quick 1-Month Call button from table
  const handleQuick1MonthSchedule = async (clientId, clientName) => {
    try {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      const dateStr = d.toISOString().split('T')[0];

      await api.post(`/clients/${clientId}/schedule-call`, {
        followUpDate: dateStr,
        reason: 'Client requested call-back after 1 month',
        title: `1-Month Follow-Up with ${clientName}`,
      });

      toast.success(`1-Month call scheduled for ${clientName}!`);
      fetchClients();
      fetchCalendarData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule call');
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const userEmpId = user?.employee?._id || user?.employee;
      await api.post('/clients', {
        name,
        companyName,
        email,
        phoneNumber,
        accountManager: isEmployee ? userEmpId : (accountManager || null),
        closedBy: isDirectClosed ? (closedBy || userEmpId || null) : (closedBy || null),
        dealValue: isDirectClosed ? Number(dealValue) || 0 : 0,
        actualRevenue: isDirectClosed ? Number(actualRevenue) || 0 : 0,
        paymentStatus: isDirectClosed ? paymentStatus : 'fully_paid',
        isDirectClosed,
        services: selectedService ? [selectedService] : [],
        nextFollowUpDate: nextFollowUpDate || null,
        followUpReason: nextFollowUpDate ? followUpReason : '',
      });
      toast.success(
        isDirectClosed
          ? 'Direct closed client & won sale recorded!'
          : 'Client profile created successfully'
      );
      setIsModalOpen(false);
      setName('');
      setCompanyName('');
      setEmail('');
      setPhoneNumber('');
      setIsDirectClosed(false);
      setDealValue(1000);
      setActualRevenue(1000);
      setClosedBy('');
      setNextFollowUpDate('');
      setFollowUpReason('Client requested call-back after 1 month');
      fetchClients();
      fetchCalendarData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create client');
    }
  };

  const handleEventClick = (event) => {
    const props = event.extendedProps;
    setSelectedCalendarItem({
      type: props.type || 'onboarding',
      date: props.date,
      count: props.count || 1,
      clients: props.clients || (props.client ? [props.client] : []),
      title: event.title,
    });
    setIsDateModalOpen(true);
  };

  const handleDateSelect = (selectInfo) => {
    const dateStr = selectInfo.startStr;
    const existing = calendarEvents.filter((e) => e.start === dateStr);
    if (existing.length > 0) {
      const first = existing[0];
      setSelectedCalendarItem({
        type: first.extendedProps.type || 'onboarding',
        date: dateStr,
        count: first.extendedProps.count || existing.length,
        clients: first.extendedProps.clients || existing.map((e) => e.extendedProps.client).filter(Boolean),
        title: first.title,
      });
    } else {
      setSelectedCalendarItem({
        type: 'onboarding',
        date: dateStr,
        count: 0,
        clients: [],
      });
    }
    setIsDateModalOpen(true);
  };

  const getCallCountdown = (targetDate) => {
    if (!targetDate) return null;
    const diffMs = new Date(targetDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    if (diffDays === 0) return { text: 'Today', isToday: true };
    if (diffDays === 1) return { text: 'Tomorrow', isUpcoming: true };
    return { text: `In ${diffDays}d`, isUpcoming: true };
  };

  const columns = [
    {
      header: 'Client / Company',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="min-w-0">
          <span
            onClick={() => navigate(`/clients/${row.original._id}`)}
            className="font-bold text-slate-800 dark:text-white hover:text-blue-600 cursor-pointer block truncate text-xs md:text-sm"
          >
            {row.original.name}
          </span>
          {row.original.companyName && (
            <span className="text-xs text-slate-500 truncate block">
              {row.original.companyName}
            </span>
          )}
          {row.original.services?.length > 0 && (
            <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
              {row.original.services.join(', ')}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Email & Phone',
      accessorKey: 'email',
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <span className="text-slate-600 dark:text-slate-300 font-medium block truncate max-w-[180px]">
            {row.original.email}
          </span>
          {row.original.phoneNumber && (
            <span className="text-slate-400 text-[11px] block">{row.original.phoneNumber}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Sale & Closing Agent',
      accessorKey: 'closedBy',
      cell: ({ row }) => {
        const c = row.original;
        const agent = c.closedBy || c.accountManager;
        return (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              {c.dealValue > 0 ? (
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                  ${Number(c.dealValue).toLocaleString()}
                </span>
              ) : (
                <span className="text-slate-400 text-xs">Standard Account</span>
              )}
              {c.isDirectClosed && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40">
                  ⚡ Direct Won
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              <User size={12} className="text-blue-500 shrink-0" />
              <span>{agent?.fullName || 'Direct / Management'}</span>
              {agent?.designation && (
                <span className="text-[10px] text-slate-400 font-normal truncate max-w-[110px]">
                  • {agent.designation}
                </span>
              )}
            </div>

            {c.paymentStatus && c.dealValue > 0 && (
              <span
                className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  c.paymentStatus === 'fully_paid'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : c.paymentStatus === 'partially_paid'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                }`}
              >
                {c.paymentStatus === 'fully_paid'
                  ? '✓ Fully Paid'
                  : c.paymentStatus === 'partially_paid'
                  ? '⏳ Partial Paid'
                  : '✕ Unpaid'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Account Manager',
      accessorKey: 'accountManager.fullName',
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.original.accountManager?.fullName || '— (Direct)'}
        </span>
      ),
    },
    {
      header: 'Next Call-Back',
      accessorKey: 'nextFollowUpDate',
      cell: ({ row }) => {
        const c = row.original;
        if (!c.nextFollowUpDate) {
          return (
            <button
              onClick={() => handleQuick1MonthSchedule(c._id, c.name)}
              className="px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded-lg transition flex items-center gap-1"
              title="Schedule a 1-month call-back"
            >
              <PhoneCall size={11} /> + 1 Mo Call
            </button>
          );
        }

        const cd = getCallCountdown(c.nextFollowUpDate);
        return (
          <div className="space-y-0.5">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                cd?.isOverdue
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
              }`}
            >
              <PhoneCall size={10} /> {cd?.text}
            </span>
            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
              {new Date(c.nextFollowUpDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.original.status} />,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          icon={Eye}
          onClick={() => navigate(`/clients/${row.original._id}`)}
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
        title="Client Accounts & Sales Closure"
        subtitle="Manage customer profiles, direct closed deals, sales agent performance, and call schedules"
        actions={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* View Mode Toggle: List / Calendar */}
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

            {/* Direct Close Client Button */}
            <button
              type="button"
              onClick={() => {
                setIsDirectClosed(true);
                setDealValue(1000);
                setActualRevenue(1000);
                setPaymentStatus('fully_paid');
                if (isEmployee) {
                  setClosedBy(user?.employee?._id || user?.employee || '');
                  setAccountManager(user?.employee?._id || user?.employee || '');
                }
                setIsModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md flex items-center gap-1.5 transition transform active:scale-95"
            >
              <Zap size={14} className="fill-current" /> Direct Close Client
            </button>

            {/* Standard Add Client Button */}
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => {
                setIsDirectClosed(false);
                setDealValue(0);
                setActualRevenue(0);
                if (isEmployee) {
                  setAccountManager(user?.employee?._id || user?.employee || '');
                }
                setIsModalOpen(true);
              }}
            >
              Add Client
            </Button>
          </div>
        }
      />

      {/* Filter Tabs & Closing Agent Filter */}
      {viewMode === 'list' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'all', label: 'All Accounts' },
              { key: 'direct_closed', label: '⚡ Direct Won Deals' },
              { key: 'active', label: 'Active Accounts' },
              { key: 'scheduled_calls', label: '📞 Call-Back Scheduled' },
              { key: 'archived', label: 'Archived' },
            ].map((tab) => {
              const isActive = filterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? tab.key === 'direct_closed'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : tab.key === 'scheduled_calls'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <User size={14} className="text-slate-400 hidden sm:block" />
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="all">Filter by Closing Agent (All)</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.fullName} ({emp.designation || emp.department})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        <DataTable
          columns={columns}
          data={clients}
          isLoading={isLoading}
          searchPlaceholder="Search clients by name, company, email, phone..."
        />
      ) : (
        <div className="space-y-5">
          {/* Calendar Top KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <Users size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Clients</p>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {calendarMeta.totalClients || clients.length}
                </h4>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CalendarCheck2 size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Onboarding Events</p>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {calendarMeta.daysWithOnboarding || 0}
                </h4>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                <PhoneCall size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Scheduled Call-Backs</p>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {calendarMeta.scheduledCalls || 0}
                </h4>
              </div>
            </div>
          </div>

          {/* FullCalendar Component */}
          <MeetingCalendar
            events={calendarEvents}
            onEventClick={handleEventClick}
            onDateSelect={handleDateSelect}
          />
        </div>
      )}

      {/* Date Drill-Down Modal */}
      <Modal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        title={
          selectedCalendarItem?.date
            ? `Client Events — ${new Date(selectedCalendarItem.date + 'T00:00:00').toLocaleDateString([], {
                weekday: 'short',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}`
            : 'Client Details'
        }
        subtitle={
          selectedCalendarItem?.type === 'follow_up_call'
            ? 'Scheduled Client Follow-up Call'
            : `${selectedCalendarItem?.count || 0} client(s) on this date`
        }
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {(!selectedCalendarItem || selectedCalendarItem.clients.length === 0) ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No clients or scheduled calls found on this date.
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {selectedCalendarItem.clients.map((c) => (
                <div
                  key={c._id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-blue-400 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {c.name}
                      </span>
                      <Badge status={c.status} />
                      {c.followUpReason && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          📞 Call: {c.followUpReason}
                        </span>
                      )}
                    </div>

                    {c.companyName && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {c.companyName}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {c.email}
                      </span>
                      {c.phoneNumber && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {c.phoneNumber}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <User size={12} /> Manager: {c.accountManager}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={Eye}
                    onClick={() => {
                      setIsDateModalOpen(false);
                      navigate(`/clients/${c._id}`);
                    }}
                    className="shrink-0 text-xs py-1.5"
                  >
                    View Account
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsDateModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Client / Direct Close Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isDirectClosed ? '⚡ Direct Closed Client & Won Sale' : 'Create Client Account'}
        subtitle={
          isDirectClosed
            ? 'Instantly records client profile & logs a Won Deal in Sales Pipeline under the closing agent'
            : 'Add a direct client or enterprise customer'
        }
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          {/* Direct Close Toggle Banner */}
          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                <Zap size={16} />
              </span>
              <div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                  Direct Closed Deal / Instant Won Sale
                </span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Logs direct sale revenue and credits the closing agent automatically
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isDirectClosed}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsDirectClosed(val);
                  if (val && !dealValue) setDealValue(1000);
                  if (val && !actualRevenue) setActualRevenue(1000);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Direct Closed Details Section */}
          {isDirectClosed && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign size={14} className="text-emerald-600" /> Sale & Closing Details
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Won Deal
                </span>
              </div>

              {/* Closing Agent (Kis agent ne close kia) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Closed By Sales Agent / Representative *
                </label>
                <select
                  required={isDirectClosed}
                  value={closedBy}
                  onChange={(e) => setClosedBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Agent Who Closed This Deal *</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName} — {emp.designation || emp.department}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  This agent will receive full conversion credit in analytics and reports.
                </p>
              </div>

              {/* Deal Value & Actual Revenue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Sale / Contract Value ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required={isDirectClosed}
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder="1000"
                    className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Actual Revenue Received ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required={isDirectClosed}
                    value={actualRevenue}
                    onChange={(e) => setActualRevenue(e.target.value)}
                    placeholder="1000"
                    className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Collection Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                >
                  <option value="fully_paid">✓ Fully Paid (100% Received in Bank)</option>
                  <option value="partially_paid">⏳ Partially Paid (Advance / Milestone Received)</option>
                  <option value="unpaid">✕ Unpaid (Invoice Dispatched, Payment Pending)</option>
                </select>
              </div>

              {/* Service Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Closed
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Video Editing',
                    'Graphic Designing',
                    'Social Media Marketing',
                    'Web Development',
                    'Full Agency Retainer',
                  ].map((srv) => (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => setSelectedService(srv)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                        selectedService === srv
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {srv}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Client Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mark Robinson"
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company / Brand Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex FinTech Solutions"
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@company.com"
                  className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>
            </div>

            {!isEmployee && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Account Manager
                </label>
                <select
                  value={accountManager}
                  onChange={(e) => setAccountManager(e.target.value)}
                  className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                >
                  <option value="">None (Executive Managed)</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Initial Call-Back Option */}
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                <Clock size={13} /> Scheduled Future Call-Back
              </span>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 30);
                  setNextFollowUpDate(d.toISOString().split('T')[0]);
                }}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                +1 Month
              </button>
            </div>
            <input
              type="date"
              value={nextFollowUpDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded-lg dark:text-white"
            />
            {nextFollowUpDate && (
              <input
                type="text"
                value={followUpReason}
                onChange={(e) => setFollowUpReason(e.target.value)}
                placeholder="Reason (e.g. Client requested call after 1 month)"
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded-lg dark:text-white"
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className={isDirectClosed ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {isDirectClosed ? '⚡ Save Direct Closed Client & Deal' : 'Create Client'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

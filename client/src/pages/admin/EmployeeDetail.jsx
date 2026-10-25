import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
  Shield,
  ArrowLeft,
  Clock,
  Target,
  CheckSquare,
  Building2,
  Plus,
  PhoneCall,
  Eye,
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';

export const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add Client Modal for this employee
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [nextCallDate, setNextCallDate] = useState('');
  const [callReason, setCallReason] = useState('Client requested call-back after 1 month');

  const fetchEmployee = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/employees/${id}`);
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load employee details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', {
        name: clientName,
        companyName,
        email: clientEmail,
        phoneNumber: clientPhone,
        accountManager: id,
        nextFollowUpDate: nextCallDate || null,
        followUpReason: nextCallDate ? callReason : '',
      });
      toast.success('Client added to employee roster successfully');
      setIsClientModalOpen(false);
      setClientName('');
      setCompanyName('');
      setClientEmail('');
      setClientPhone('');
      setNextCallDate('');
      fetchEmployee();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add client');
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading employee profile...</div>;
  }

  const employee = data?.employee;
  const stats = data?.stats || {};
  const clients = data?.clients || [];

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Employee record not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/employees')} className="mt-4">
          Back to Employee List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/employees')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{employee.fullName}</h2>
              <Badge status={employee.employmentStatus} />
            </div>
            <p className="text-xs text-slate-500 font-mono">{employee.employeeId} • {employee.department}</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsClientModalOpen(true)}
        >
          Add Client for {employee.fullName.split(' ')[0]}
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Assigned Leads"
          value={stats.assignedLeads || 0}
          icon={Target}
          color="blue"
          subtitle="CRM leads in pipeline"
        />
        <StatCard
          title="Managed Clients"
          value={stats.managedClients || clients.length || 0}
          icon={Building2}
          color="navy"
          subtitle="Active client accounts"
        />
        <StatCard
          title="Assigned Tasks"
          value={stats.assignedTasks || 0}
          icon={CheckSquare}
          color="green"
          subtitle="Active & completed"
        />
        <StatCard
          title="Meetings Scheduled"
          value={stats.totalMeetings || 0}
          icon={Calendar}
          color="purple"
          subtitle="Client & team calls"
        />
        <StatCard
          title="Status"
          value={employee.employmentStatus.toUpperCase()}
          icon={Shield}
          color="navy"
          subtitle="Employment standing"
        />
      </div>

      {/* Managed Clients Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Assigned & Managed Clients ({clients.length})
            </h3>
            <p className="text-xs text-slate-500">Clients under the direct account management of this employee</p>
          </div>

          <Button
            size="sm"
            variant="outline"
            icon={Plus}
            onClick={() => setIsClientModalOpen(true)}
            className="text-xs"
          >
            Add Client
          </Button>
        </div>

        {clients.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500">No clients assigned to this employee yet.</p>
            <Button size="sm" variant="outline" onClick={() => setIsClientModalOpen(true)}>
              Assign First Client
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {clients.map((c) => (
              <div
                key={c._id}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between gap-3 hover:border-blue-300 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {c.name}
                    </h4>
                    <Badge status={c.status} />
                  </div>
                  {c.companyName && (
                    <p className="text-[11px] text-slate-500 truncate">{c.companyName}</p>
                  )}
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{c.email}</p>

                  {c.nextFollowUpDate && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                      <PhoneCall size={10} />
                      <span>Next Call: {new Date(c.nextFollowUpDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    Added: {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    onClick={() => navigate(`/clients/${c._id}`)}
                    className="text-[11px] py-1 px-2.5"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Details Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800">
          Employment & Contact Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Official Email</span>
            <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Mail size={14} className="text-blue-500" /> {employee.email}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Contact Phone</span>
            <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Phone size={14} className="text-emerald-500" /> {employee.phoneNumber || 'Not provided'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Designation</span>
            <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Briefcase size={14} className="text-indigo-500" /> {employee.designation}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Department</span>
            <span className="font-semibold text-slate-800 dark:text-white">
              {employee.department}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Reporting Manager</span>
            <span className="font-semibold text-slate-800 dark:text-white">
              {employee.manager?.fullName || '— (Direct to Executive)'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Joining Date</span>
            <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar size={14} className="text-amber-500" />{' '}
              {new Date(employee.joiningDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {employee.emergencyContact && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-2">Emergency Contact</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {employee.emergencyContact.name} ({employee.emergencyContact.relationship || 'Contact'}) •{' '}
              {employee.emergencyContact.phone}
            </p>
          </div>
        )}
      </div>

      {/* Recent Attendance Records */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
          Recent Attendance Records
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {stats.recentAttendance?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No recent attendance recorded.</p>
          ) : (
            stats.recentAttendance?.map((att) => (
              <div key={att._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-white">{att.date}</span>
                  <span className="text-slate-400 ml-3">
                    In:{' '}
                    {att.checkInTime
                      ? new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}{' '}
                    | Out:{' '}
                    {att.checkOutTime
                      ? new Date(att.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {att.workingHours > 0 && (
                    <span className="text-slate-500 font-medium">{att.workingHours} hrs</span>
                  )}
                  <Badge status={att.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Client Modal for this Employee */}
      <Modal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        title={`Add Client for ${employee.fullName}`}
        subtitle="Directly link this customer account to this employee"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contact Name *
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Cloud Matrix Ltd"
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="alex@cloudmatrix.com"
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
          </div>

          {/* Quick Call-back schedule */}
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
                  setNextCallDate(d.toISOString().split('T')[0]);
                }}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                +1 Month
              </button>
            </div>
            <input
              type="date"
              value={nextCallDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setNextCallDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded-lg dark:text-white"
            />
            {nextCallDate && (
              <input
                type="text"
                value={callReason}
                onChange={(e) => setCallReason(e.target.value)}
                placeholder="Reason (e.g. Client requested call after 1 month)"
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded-lg dark:text-white"
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsClientModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add Client
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

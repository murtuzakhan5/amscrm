import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Target,
  CheckSquare,
  PhoneCall,
  Clock,
  CheckCircle2,
  ExternalLink,
  LogOut,
  Calendar,
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuthStore } from '../../store/authStore';

export const EmployeeDashboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/reports/employee-dashboard');
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load personal dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCheckIn = async () => {
    try {
      setIsPunching(true);
      const res = await api.post('/attendance/check-in');
      toast.success(res.data.message);
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setIsPunching(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsPunching(true);
      const res = await api.post('/attendance/check-out');
      toast.success(res.data.message);
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setIsPunching(false);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading your workspace...</div>;
  }

  const cards = data?.cards || {};
  const attendance = data?.attendanceToday;
  const recentLeads = data?.recentLeads || [];
  const myTasks = data?.myTasks || [];
  const myMeetings = data?.myMeetings || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${user?.employee?.fullName || 'Employee'}!`}
        subtitle="Your daily workspace overview, assigned leads, and task deliverables"
      />

      {/* Daily Attendance Action Box */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Daily Attendance Check-In
            </h3>
            <p className="text-xs text-slate-500">
              {attendance?.checkInTime
                ? `Checked in at ${new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'You have not checked in for today yet.'}
            </p>
          </div>
        </div>

        <div>
          {!attendance?.checkInTime ? (
            <Button
              variant="primary"
              size="md"
              icon={CheckCircle2}
              onClick={handleCheckIn}
              isLoading={isPunching}
            >
              Punch In (Start Day)
            </Button>
          ) : !attendance.checkOutTime ? (
            <div className="flex items-center gap-3">
              <Badge status={attendance.status} />
              <Button
                variant="outline"
                size="md"
                icon={LogOut}
                onClick={handleCheckOut}
                isLoading={isPunching}
              >
                Punch Out (End Day)
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge status="completed" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {attendance.workingHours} Hours Logged
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Personal Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Leads"
          value={cards.totalAssignedLeads || 0}
          icon={Target}
          color="blue"
          subtitle={`${cards.wonLeads || 0} won deals`}
        />
        <StatCard
          title="Active Tasks"
          value={cards.activeTasks || 0}
          icon={CheckSquare}
          color="amber"
          subtitle={`${cards.completedTasks || 0} completed`}
        />
        <StatCard
          title="Today's Meetings"
          value={cards.todayMeetingsCount || 0}
          icon={PhoneCall}
          color="purple"
          subtitle="Client calls today"
        />
        <StatCard
          title="Conversion Wins"
          value={cards.wonLeads || 0}
          icon={CheckCircle2}
          color="green"
          subtitle="Closed won clients"
        />
      </div>

      {/* Split Feeds: My Assigned Leads & My Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Leads */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              My Assigned Leads ({recentLeads.length})
            </h3>
            <button
              onClick={() => navigate('/leads')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentLeads.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No assigned leads currently.</p>
            ) : (
              recentLeads.map((l) => (
                <div
                  key={l._id}
                  onClick={() => navigate(`/leads/${l._id}`)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                      {l.clientName}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {l.companyName || 'Individual'} • {l.interestedService}
                    </span>
                  </div>
                  <Badge status={l.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              My Tasks ({myTasks.length})
            </h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No pending tasks.</p>
            ) : (
              myTasks.slice(0, 5).map((t) => (
                <div
                  key={t._id}
                  onClick={() => navigate('/tasks')}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                      {t.title}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Due: {new Date(t.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge status={t.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

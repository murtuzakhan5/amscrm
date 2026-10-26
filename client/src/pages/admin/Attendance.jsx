import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Clock, CheckCircle2, AlertCircle, LogOut, Download, Filter, Users, UserCheck, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuthStore } from '../../store/authStore';

export const Attendance = () => {
  const { user } = useAuthStore();
  const [todayRecord, setTodayRecord] = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/attendance/today');
      setTodayRecord(res.data.data.record);
    } catch (err) {}
  };

  const fetchAnalytics = async () => {
    if (!isAdminOrManager) return;
    try {
      const res = await api.get('/attendance/analytics');
      setAnalytics(res.data.data);
    } catch (err) {}
  };

  const fetchAllAttendance = async () => {
    try {
      setIsLoading(true);
      if (isAdminOrManager) {
        const res = await api.get('/attendance/all', {
          params: {
            date: dateFilter || undefined,
            status: statusFilter || undefined,
            limit: 100,
          },
        });
        setAllRecords(res.data.data);
      } else {
        const res = await api.get('/attendance/my-history');
        setAllRecords(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchAnalytics();
    fetchAllAttendance();
  }, [dateFilter, statusFilter]);

  const handleCheckIn = async () => {
    try {
      setIsActionLoading(true);
      const res = await api.post('/attendance/check-in');
      toast.success(res.data.message);
      fetchTodayStatus();
      fetchAnalytics();
      fetchAllAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsActionLoading(true);
      const res = await api.post('/attendance/check-out');
      toast.success(res.data.message);
      fetchTodayStatus();
      fetchAnalytics();
      fetchAllAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: ({ row }) => (
        <span className="font-bold text-slate-800 dark:text-white text-xs">
          {row.original.date}
        </span>
      ),
    },
    ...(isAdminOrManager
      ? [
          {
            header: 'Employee',
            accessorKey: 'employee.fullName',
            cell: ({ row }) => (
              <div className="min-w-0">
                <span className="font-bold text-slate-800 dark:text-white block text-xs">
                  {row.original.employee?.fullName || 'User'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {row.original.employee?.department} • {row.original.employee?.employeeId}
                </span>
              </div>
            ),
          },
          {
            header: 'Assigned Shift',
            accessorKey: 'employee.shiftStartTime',
            cell: ({ row }) => (
              <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                {row.original.employee?.shiftStartTime || '09:00'} – {row.original.employee?.shiftEndTime || '18:00'}
                <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-sans font-medium">
                  {row.original.employee?.lateGracePeriodMinutes ?? 5}m late rule
                </span>
              </span>
            ),
          },
        ]
      : []),
    {
      header: 'Check-In Time',
      accessorKey: 'checkInTime',
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          {row.original.checkInTime
            ? new Date(row.original.checkInTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </span>
      ),
    },
    {
      header: 'Check-Out Time',
      accessorKey: 'checkOutTime',
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          {row.original.checkOutTime
            ? new Date(row.original.checkOutTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </span>
      ),
    },
    {
      header: 'Hours Logged',
      accessorKey: 'workingHours',
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {row.original.workingHours > 0 ? `${row.original.workingHours} hrs` : 'In Session'}
        </span>
      ),
    },
    {
      header: 'Late Status',
      accessorKey: 'lateMinutes',
      cell: ({ row }) =>
        row.original.lateMinutes > 0 ? (
          <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <AlertTriangle size={11} /> +{row.original.lateMinutes} min Late
          </span>
        ) : (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
            On Time
          </span>
        ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.original.status} />,
    },
  ];

  const todayStats = analytics?.today || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Time Tracking"
        subtitle="Daily automated check-in/out records with strict 5-minute late threshold calculations"
      />

      {/* Admin Analytics Highlights */}
      {isAdminOrManager && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Team
              </span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {todayStats.totalActiveEmployees || 0}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                On-Time Present
              </span>
              <span className="text-xl font-extrabold text-emerald-600">
                {todayStats.present || 0}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Late Arrivals (&gt;5m)
              </span>
              <span className="text-xl font-extrabold text-amber-600">
                {todayStats.late || 0}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Punctuality Rate
              </span>
              <span className="text-xl font-extrabold text-purple-600">
                {todayStats.onTimeRate || 100}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Employee Quick Check-in/out Box */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Today's Attendance Status
            </h3>
            <p className="text-xs text-slate-500">
              Standard Shift Timing: 09:00 AM – 06:00 PM <span className="text-amber-600 font-semibold">(5-minute strict late threshold)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!todayRecord ? (
            <Button
              variant="primary"
              size="md"
              icon={CheckCircle2}
              onClick={handleCheckIn}
              isLoading={isActionLoading}
            >
              Punch In (Check-In)
            </Button>
          ) : !todayRecord.checkOutTime ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-800 dark:text-white block">
                  Checked in at{' '}
                  {new Date(todayRecord.checkInTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <Badge status={todayRecord.status} />
              </div>
              <Button
                variant="outline"
                size="md"
                icon={LogOut}
                onClick={handleCheckOut}
                isLoading={isActionLoading}
              >
                Punch Out (Check-Out)
              </Button>
            </div>
          ) : (
            <div className="text-right flex items-center gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-600 block">
                  Day Completed: {todayRecord.workingHours} Hours
                </span>
                <span className="text-[11px] text-slate-400">
                  Checked out at{' '}
                  {new Date(todayRecord.checkOutTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <Badge status={todayRecord.status} />
            </div>
          )}
        </div>
      </div>

      {/* Detailed Attendance Logs DataTable */}
      <DataTable
        columns={columns}
        data={allRecords}
        isLoading={isLoading}
        searchPlaceholder="Filter records by date or employee..."
        filterComponent={
          isAdminOrManager && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
              >
                <option value="">All Statuses</option>
                <option value="present">Present (On Time)</option>
                <option value="late">Late Arrival</option>
                <option value="half_day">Half Day</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          )
        }
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Users,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserX,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/common/Button';
import { LeadGrowthChart } from '../../components/charts/LeadGrowthChart';
import { LeadsByStatusChart } from '../../components/charts/LeadsByStatusChart';
import { EmployeePerformanceChart } from '../../components/charts/EmployeePerformanceChart';

export const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('this_month');

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/reports/dashboard');
      setReportData(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load reports';
      toast.error(msg);
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/leads/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ams_crafters_analytics_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Analytics exported to CSV');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const charts = reportData?.charts || {};
  const cards = reportData?.cards || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics Dashboard"
        subtitle="Workforce punctuality, conversion metrics, deal projections, and team performance"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchReports}
              disabled={isLoading}
            >
              Refresh
            </Button>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="today">Today</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Workforce & Attendance Analytics */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Today's Attendance & Shift Punctuality
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Strict 5-minute late rule monitoring across Sales, Video, Graphics & Management teams
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
              {cards.onTimeRate ?? 100}% On-Time Rate
            </span>
            <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {cards.totalCheckedIn ?? 0} / {cards.activeEmployees ?? 0} Checked In
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">On-Time Present</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {cards.todayPresent ?? 0}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Checked in within ≤5m grace period
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Late Arrivals (&gt;5m)</span>
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {cards.todayLate ?? 0}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Exceeded assigned shift start by &gt;5 mins
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Half-Day / Partial</span>
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {cards.todayHalfDay ?? 0}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Recorded half-day or approved leave
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Absent / Not In Yet</span>
              <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {cards.todayAbsent ?? 0}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Pending check-in from active staff
            </span>
          </div>
        </div>
      </div>

      {/* Conversion Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Lead Win Conversion Rate
          </span>
          <span className="text-4xl font-extrabold text-emerald-600 tracking-tight">
            {cards.conversionRate || 0}%
          </span>
          <p className="text-xs text-slate-500 mt-2">
            {cards.convertedLeads || 0} won deals out of {cards.totalLeads || 0} total leads
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Total Won Contracts
          </span>
          <span className="text-4xl font-extrabold text-blue-600 tracking-tight">
            ${((cards.wonDealValue || 0) / 1000).toFixed(1)}k
          </span>
          <p className="text-xs text-slate-500 mt-2">
            From ${((cards.totalDealValue || 0) / 1000).toFixed(1)}k total projected pipeline
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Actual Collected Revenue
          </span>
          <span className="text-4xl font-extrabold text-[#17365D] dark:text-blue-400 tracking-tight">
            ${((cards.actualRevenueReceived || 0) / 1000).toFixed(1)}k
          </span>
          <p className="text-xs text-slate-500 mt-2">Verified invoice deposits in corporate account</p>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Lead Pipeline Growth Trend
          </h3>
          <LeadGrowthChart data={charts.monthlyGrowth} />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Stage Distribution
          </h3>
          <LeadsByStatusChart data={charts.leadsByStatus} />
        </div>
      </div>

      {/* Employee Efficiency Performance */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Individual Employee Conversion Efficiency
        </h3>
        <EmployeePerformanceChart data={charts.employeePerformance} />
      </div>
    </div>
  );
};

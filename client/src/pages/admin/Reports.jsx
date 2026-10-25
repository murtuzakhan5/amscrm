import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { BarChart3, Download, Calendar, Filter, Users, Target, TrendingUp } from 'lucide-react';
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
      toast.error('Failed to load reports');
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
        subtitle="MongoDB aggregation pipelines for conversion rates, deal projections, and team efficiency"
        actions={
          <div className="flex items-center gap-2">
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
              Export Report CSV
            </Button>
          </div>
        }
      />

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

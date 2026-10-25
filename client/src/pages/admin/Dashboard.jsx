import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  Target,
  PhoneCall,
  CheckSquare,
  Briefcase,
  TrendingUp,
  Clock,
  RefreshCw,
  ExternalLink,
  Plus,
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LeadGrowthChart } from '../../components/charts/LeadGrowthChart';
import { LeadsByStatusChart } from '../../components/charts/LeadsByStatusChart';
import { EmployeePerformanceChart } from '../../components/charts/EmployeePerformanceChart';
import { CardSkeleton } from '../../components/common/Skeleton';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/reports/dashboard');
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const cards = data?.cards || {};
  const charts = data?.charts || {};
  const recent = data?.recent || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Executive Dashboard"
        subtitle="Real-time MongoDB aggregated CRM metrics and employee operations overview"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchDashboardData}
              isLoading={isLoading}
            >
              Refresh Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => navigate('/leads')}
            >
              New Lead
            </Button>
          </div>
        }
      />

      {/* 15 Real Statistics Cards in clean responsive grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {Array.from({ length: 15 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          <StatCard
            title="Total Employees"
            value={cards.totalEmployees}
            icon={Users}
            color="navy"
            subtitle={`${cards.activeEmployees || 0} active on roster`}
          />
          <StatCard
            title="Total Leads"
            value={cards.totalLeads}
            icon={Target}
            color="blue"
            subtitle={`${cards.conversionRate || 0}% conversion rate`}
          />
          <StatCard
            title="New Leads"
            value={cards.newLeads}
            icon={Target}
            color="purple"
            subtitle="Awaiting outreach"
          />
          <StatCard
            title="In Progress"
            value={cards.leadsInProgress}
            icon={Target}
            color="amber"
            subtitle="Active discussions"
          />
          <StatCard
            title="Future Prospects"
            value={cards.futureLeads || 0}
            icon={Target}
            color="amber"
            subtitle="Nurturing / Interested"
          />
          <StatCard
            title="Converted Won"
            value={cards.convertedLeads}
            icon={TrendingUp}
            color="green"
            subtitle="Clients onboarded"
          />
          <StatCard
            title="Lost Leads"
            value={cards.lostLeads}
            icon={Target}
            color="red"
            subtitle="Categorized losses"
          />
          <StatCard
            title="Deal Value"
            value={`$${((cards.totalDealValue || 0) / 1000).toFixed(0)}k`}
            icon={TrendingUp}
            color="blue"
            subtitle={`$${((cards.wonDealValue || 0) / 1000).toFixed(0)}k closed`}
          />
          <StatCard
            title="Today's Meetings"
            value={cards.todayMeetings}
            icon={PhoneCall}
            color="purple"
            subtitle="Scheduled for today"
          />
          <StatCard
            title="Upcoming Mtgs"
            value={cards.upcomingMeetings}
            icon={PhoneCall}
            color="blue"
            subtitle="Next 7 days"
          />
          <StatCard
            title="Pending Followups"
            value={cards.pendingFollowups}
            icon={Clock}
            color="amber"
            subtitle="Due for call"
          />
          <StatCard
            title="Pending Tasks"
            value={cards.pendingTasks}
            icon={CheckSquare}
            color="blue"
            subtitle="In progress & review"
          />
          <StatCard
            title="Completed Tasks"
            value={cards.completedTasks}
            icon={CheckSquare}
            color="green"
            subtitle="Finished work"
          />
          <StatCard
            title="Active Projects"
            value={cards.activeProjects}
            icon={Briefcase}
            color="navy"
            subtitle="Development stage"
          />
          <StatCard
            title="Received Revenue"
            value={`$${((cards.actualRevenueReceived || 0) / 1000).toFixed(0)}k`}
            icon={TrendingUp}
            color="green"
            subtitle="Actual collected"
          />
        </div>
      )}

      {/* Main Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Lead Growth & Conversions
              </h3>
              <p className="text-xs text-slate-400">Total incoming leads vs won deals per month</p>
            </div>
          </div>
          <LeadGrowthChart data={charts.monthlyGrowth} />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pipeline Stages Breakdown
              </h3>
              <p className="text-xs text-slate-400">Distribution across 9 lead statuses</p>
            </div>
          </div>
          <LeadsByStatusChart data={charts.leadsByStatus} />
        </div>
      </div>

      {/* Employee Performance Chart & Recent Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Employee Sales Performance
              </h3>
              <p className="text-xs text-slate-400">Assigned leads vs won conversions by team member</p>
            </div>
          </div>
          <EmployeePerformanceChart data={charts.employeePerformance} />
        </div>

        {/* Today & Upcoming Meetings Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Today's Meetings
              </h3>
              <button
                onClick={() => navigate('/meetings')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {recent.meetings?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No upcoming meetings scheduled for today.
                </p>
              ) : (
                recent.meetings?.slice(0, 4).map((m) => (
                  <div
                    key={m._id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {m.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(m.startTimeUTC).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • {m.assignedEmployee?.fullName || 'Assigned'}
                      </p>
                    </div>
                    {m.meetingLink && (
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg shrink-0 flex items-center gap-1 hover:bg-blue-100 transition"
                      >
                        Join <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/calendar')}
            >
              Open Full Interactive Calendar
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Leads & Recent Tasks Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Leads</h3>
            <button
              onClick={() => navigate('/leads')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              View Pipeline
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent.leads?.map((lead) => (
              <div
                key={lead._id}
                onClick={() => navigate(`/leads/${lead._id}`)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {lead.clientName}
                    </span>
                    <Badge status={lead.status} />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {lead.companyName || 'Individual'} • {lead.interestedService}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    ${(lead.estimatedBudget || 0).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {lead.assignedTo?.fullName || 'Unassigned'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Tasks</h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              View Kanban
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent.tasks?.map((task) => (
              <div
                key={task._id}
                onClick={() => navigate('/tasks')}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {task.title}
                    </span>
                    <Badge status={task.priority} />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Due: {new Date(task.dueDate).toLocaleDateString()} • Assigned to{' '}
                    {task.assignedTo?.fullName || 'User'}
                  </p>
                </div>
                <Badge status={task.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

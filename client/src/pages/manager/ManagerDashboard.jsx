import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users, Target, CheckSquare, Calendar, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/reports/manager-dashboard');
        setData(res.data.data);
      } catch (err) {
        toast.error('Failed to load team dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchManagerData();
  }, []);

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading manager portal...</div>;
  }

  const teamMembers = data?.teamMembers || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Manager Dashboard"
        subtitle="Monitor team activities, track sales conversions, and manage project workloads"
      />

      {/* Team Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Team Members"
          value={data?.teamMembersCount || 0}
          icon={Users}
          color="navy"
          subtitle="Direct reports"
        />
        <StatCard
          title="Team Leads"
          value={data?.totalTeamLeads || 0}
          icon={Target}
          color="blue"
          subtitle={`${data?.wonTeamLeads || 0} converted won`}
        />
        <StatCard
          title="Pending Tasks"
          value={data?.pendingTeamTasks || 0}
          icon={CheckSquare}
          color="amber"
          subtitle={`${data?.completedTeamTasks || 0} completed`}
        />
        <StatCard
          title="Team Meetings"
          value={data?.teamMeetingsCount || 0}
          icon={Calendar}
          color="purple"
          subtitle="Client consultations"
        />
      </div>

      {/* Team Members Roster */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
          Assigned Team Members Roster
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {teamMembers.map((emp) => (
            <div
              key={emp._id}
              onClick={() => navigate(`/employees/${emp._id}`)}
              className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-600 flex items-center justify-center font-bold text-xs">
                  {emp.fullName[0]}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {emp.fullName}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {emp.designation} • {emp.department}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400">{emp.employeeId}</span>
                <Badge status={emp.employmentStatus} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

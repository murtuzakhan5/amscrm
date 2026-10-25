import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Briefcase, Plus, Calendar, DollarSign, User, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [clientId, setClientId] = useState('');
  const [projectManagerId, setProjectManagerId] = useState('');
  const [budget, setBudget] = useState(15000);
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/projects?limit=100');
      setProjects(res.data.data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHelpers = async () => {
    try {
      const [cRes, eRes] = await Promise.all([
        api.get('/clients?limit=100'),
        api.get('/employees?limit=100'),
      ]);
      setClients(cRes.data.data);
      setEmployees(eRes.data.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchProjects();
    fetchHelpers();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', {
        projectName,
        client: clientId,
        projectManager: projectManagerId,
        budget: Number(budget),
        deadline,
        description,
      });
      toast.success('Project created successfully');
      setIsModalOpen(false);
      setProjectName('');
      setClientId('');
      setProjectManagerId('');
      setDescription('');
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleUpdateProgress = async (projectId, progressPercentage) => {
    try {
      await api.patch(`/projects/${projectId}`, { progressPercentage });
      toast.success(`Progress set to ${progressPercentage}%`);
      fetchProjects();
    } catch (err) {
      toast.error('Failed to update progress');
    }
  };

  const columns = [
    {
      header: 'Project Name',
      accessorKey: 'projectName',
      cell: ({ row }) => (
        <div className="min-w-0">
          <span className="font-bold text-slate-800 dark:text-white block truncate text-xs md:text-sm">
            {row.original.projectName}
          </span>
          {row.original.client && (
            <span className="text-xs text-slate-500 truncate block">
              {row.original.client?.companyName || row.original.client?.name}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Project Manager',
      accessorKey: 'projectManager.fullName',
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.original.projectManager?.fullName || 'Assigned'}
        </span>
      ),
    },
    {
      header: 'Budget',
      accessorKey: 'budget',
      cell: ({ row }) => (
        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
          {row.original.currency} {(row.original.budget || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Deadline',
      accessorKey: 'deadline',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {new Date(row.original.deadline).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Progress',
      accessorKey: 'progressPercentage',
      cell: ({ row }) => (
        <div className="w-32">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
            <span>{row.original.progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{ width: `${row.original.progressPercentage}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.original.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Management"
        subtitle="Track software deliverables, team allocations, timelines, and milestones"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            New Project
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={projects}
        isLoading={isLoading}
        searchPlaceholder="Search projects by name, client..."
      />

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
        subtitle="Configure client project, budget, and assigned management team"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Apex FinTech Core Engine"
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Account *
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Manager *
              </label>
              <select
                required
                value={projectManagerId}
                onChange={(e) => setProjectManagerId(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              >
                <option value="">Select Manager</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName} ({emp.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Budget (USD) *
              </label>
              <input
                type="number"
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deadline *
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope, deliverables, architecture..."
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

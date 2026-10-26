import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Edit2,
  Eye,
  UserX,
  UserCheck,
  Shield,
  Briefcase,
  Mail,
  Phone,
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmployeeModal } from '../../components/forms/EmployeeModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuthStore } from '../../store/authStore';

export const Employees = () => {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [confirmStatusEmployee, setConfirmStatusEmployee] = useState(null);

  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/employees', {
        params: {
          department: departmentFilter || undefined,
          status: statusFilter || undefined,
          limit: 100,
        },
      });
      setEmployees(res.data.data);
    } catch (err) {
      toast.error('Failed to load employee list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [departmentFilter, statusFilter]);

  const handleCreateOrUpdateEmployee = async (formData) => {
    try {
      if (selectedEmployee) {
        await api.patch(`/employees/${selectedEmployee._id}`, formData);
        toast.success('Employee updated successfully');
      } else {
        await api.post('/employees', formData);
        toast.success('Employee account created successfully');
      }
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmStatusEmployee) return;
    try {
      const nextStatus =
        confirmStatusEmployee.employmentStatus === 'active' ? 'inactive' : 'active';
      await api.patch(`/employees/${confirmStatusEmployee._id}/status`, {
        status: nextStatus,
      });
      toast.success(`Employee marked as ${nextStatus}`);
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to update employee status');
    } finally {
      setConfirmStatusEmployee(null);
    }
  };

  const columns = [
    {
      header: 'Employee ID',
      accessorKey: 'employeeId',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
          {row.original.employeeId}
        </span>
      ),
    },
    {
      header: 'Employee',
      accessorKey: 'fullName',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#17365D] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            {row.original.fullName[0]}
          </div>
          <div className="min-w-0">
            <span
              onClick={() => navigate(`/employees/${row.original._id}`)}
              className="font-bold text-slate-800 dark:text-white hover:text-blue-600 cursor-pointer block truncate"
            >
              {row.original.fullName}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
              <Mail size={12} /> {row.original.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      accessorKey: 'department',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {row.original.department}
        </span>
      ),
    },
    {
      header: 'Designation',
      accessorKey: 'designation',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          {row.original.designation}
        </span>
      ),
    },
    {
      header: 'Shift Timing',
      accessorKey: 'shiftStartTime',
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">
          {row.original.shiftStartTime || '09:00'} – {row.original.shiftEndTime || '18:00'}
          <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-sans font-semibold">
            {row.original.lateGracePeriodMinutes ?? 5}m grace
          </span>
        </span>
      ),
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ row }) => (
        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {row.original.role}
        </span>
      ),
    },
    {
      header: 'Manager',
      accessorKey: 'manager.fullName',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">
          {row.original.manager?.fullName || '— (Executive)'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'employmentStatus',
      cell: ({ row }) => <Badge status={row.original.employmentStatus} />,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/employees/${row.original._id}`)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setSelectedEmployee(row.original);
                  setIsModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Edit Employee"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => setConfirmStatusEmployee(row.original)}
                className={`p-1.5 rounded-lg transition ${
                  row.original.employmentStatus === 'active'
                    ? 'text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                    : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
                title={
                  row.original.employmentStatus === 'active'
                    ? 'Deactivate Account'
                    : 'Activate Account'
                }
              >
                {row.original.employmentStatus === 'active' ? (
                  <UserX size={16} />
                ) : (
                  <UserCheck size={16} />
                )}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        subtitle="Manage company staff, assignments, departments, and account access permissions"
        actions={
          isAdmin && (
            <Button
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={() => {
                setSelectedEmployee(null);
                setIsModalOpen(true);
              }}
            >
              Add Employee
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        searchPlaceholder="Search employees by name, email, department..."
        filterComponent={
          <div className="flex items-center gap-2">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
            >
              <option value="">All Departments</option>
              <option value="Sales & Business Development">Sales & Marketing</option>
              <option value="Graphic Designing & Media">Graphic Designing</option>
              <option value="Video Editing & Content Creation">Video Editing</option>
              <option value="Team Leads & Project Management">Team Leads & PM</option>
              <option value="Custom Software Engineering">Engineering</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Operations & HR">HR / Ops</option>
              <option value="Executive & Management">Executive</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        }
      />

      {/* Add / Edit Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSubmit={handleCreateOrUpdateEmployee}
        initialData={selectedEmployee}
        managers={employees.filter((e) => e.role === 'admin' || e.role === 'manager')}
      />

      {/* Confirm Deactivation / Activation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmStatusEmployee)}
        onClose={() => setConfirmStatusEmployee(null)}
        onConfirm={handleToggleStatus}
        title={
          confirmStatusEmployee?.employmentStatus === 'active'
            ? 'Deactivate Employee Account?'
            : 'Reactivate Employee Account?'
        }
        message={
          confirmStatusEmployee?.employmentStatus === 'active'
            ? `Are you sure you want to deactivate ${confirmStatusEmployee?.fullName}'s account? They will no longer be able to log in to AMS Crafters.`
            : `Are you sure you want to reactivate ${confirmStatusEmployee?.fullName}'s account? Login access will be restored.`
        }
        confirmText={
          confirmStatusEmployee?.employmentStatus === 'active' ? 'Deactivate' : 'Reactivate'
        }
        confirmVariant={
          confirmStatusEmployee?.employmentStatus === 'active' ? 'danger' : 'success'
        }
      />
    </div>
  );
};

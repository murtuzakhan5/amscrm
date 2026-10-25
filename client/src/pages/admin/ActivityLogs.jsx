import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { History, Shield, Clock, User, Filter } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/tables/DataTable';

export const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/audit-logs?limit=100');
      setLogs(res.data.data);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    {
      header: 'Timestamp',
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg">
          {row.original.action}
        </span>
      ),
    },
    {
      header: 'Entity Type',
      accessorKey: 'entityType',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {row.original.entityType}
        </span>
      ),
    },
    {
      header: 'Performed By',
      accessorKey: 'performedBy.email',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
          {row.original.performedBy?.email || 'System'}
        </span>
      ),
    },
    {
      header: 'IP Address',
      accessorKey: 'ipAddress',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-400">
          {row.original.ipAddress || '127.0.0.1'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & System Audit Logs"
        subtitle="Immutable database activity log tracking logins, lead modifications, and permission actions"
      />

      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        searchPlaceholder="Search audit events by action, entity..."
      />
    </div>
  );
};

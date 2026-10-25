import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  CheckSquare,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  User,
  MessageSquare,
  Edit2,
  CheckCircle,
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { TaskKanbanBoard } from '../../components/kanban/TaskKanbanBoard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { TaskModal } from '../../components/forms/TaskModal';
import { Modal } from '../../components/common/Modal';

export const Tasks = () => {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [tasks, setTasks] = useState([]);
  const [kanbanData, setKanbanData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Comments modal state
  const [commentTask, setCommentTask] = useState(null);
  const [commentText, setCommentText] = useState('');

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      if (viewMode === 'table') {
        const res = await api.get('/tasks?limit=100');
        setTasks(res.data.data);
      } else {
        const res = await api.get('/tasks/kanban');
        setKanbanData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees?limit=100');
      setEmployees(res.data.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchTasks();
  }, [viewMode]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateOrUpdateTask = async (formData) => {
    try {
      if (selectedTask) {
        await api.patch(`/tasks/${selectedTask._id}`, formData);
        toast.success('Task updated successfully');
      } else {
        await api.post('/tasks', formData);
        toast.success('Task created and assigned');
      }
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !commentTask) return;
    try {
      await api.post(`/tasks/${commentTask._id}/comments`, { text: commentText });
      toast.success('Comment posted');
      setCommentText('');
      setCommentTask(null);
      fetchTasks();
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status });
      toast.success(`Task moved to ${status.replace('_', ' ')}`);
      fetchTasks();
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  const columns = [
    {
      header: 'Task ID',
      accessorKey: 'taskId',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
          {row.original.taskId}
        </span>
      ),
    },
    {
      header: 'Task Title',
      accessorKey: 'title',
      cell: ({ row }) => (
        <div className="min-w-0">
          <span className="font-bold text-slate-800 dark:text-white block truncate text-xs md:text-sm">
            {row.original.title}
          </span>
          {row.original.description && (
            <span className="text-xs text-slate-400 truncate block">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Assigned To',
      accessorKey: 'assignedTo.fullName',
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.original.assignedTo?.fullName || 'Assigned'}
        </span>
      ),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: ({ row }) => <Badge status={row.original.priority} />,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.original.status} />,
    },
    {
      header: 'Due Date',
      accessorKey: 'dueDate',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {new Date(row.original.dueDate).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCommentTask(row.original)}
            className="text-xs py-1 px-2"
          >
            Comment
          </Button>
          {row.original.status !== 'completed' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleUpdateStatus(row.original._id, 'completed')}
              className="text-xs py-1 px-2"
            >
              Done
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Tasks & Workflows"
        subtitle="Organize team workloads, prioritize deliverables, and track completion progress"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <LayoutGrid size={16} /> Kanban
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <List size={16} /> Table
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setSelectedTask(null);
                setIsModalOpen(true);
              }}
            >
              New Task
            </Button>
          </div>
        }
      />

      {viewMode === 'kanban' ? (
        <TaskKanbanBoard
          kanbanData={kanbanData}
          onTaskClick={(task) => {
            setSelectedTask(task);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={tasks}
          isLoading={isLoading}
          searchPlaceholder="Search tasks by title, assignee..."
        />
      )}

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={handleCreateOrUpdateTask}
        initialData={selectedTask}
        employees={employees}
      />

      {/* Task Comments Modal */}
      <Modal
        isOpen={Boolean(commentTask)}
        onClose={() => setCommentTask(null)}
        title={`Task Comments: ${commentTask?.title}`}
        subtitle="Discussion thread and progress updates"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-3">
            {commentTask?.comments?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No comments yet.</p>
            ) : (
              commentTask?.comments?.map((c, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
                  <p className="text-slate-700 dark:text-slate-200">{c.text}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <textarea
              rows={2}
              required
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a progress comment..."
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setCommentTask(null)}>
                Close
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Post Comment
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

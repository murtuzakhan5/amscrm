import React from 'react';
import { Badge } from '../common/Badge';
import { Calendar, User, MessageSquare } from 'lucide-react';

const COLUMNS = [
  { key: 'todo', title: 'To Do', color: 'border-t-slate-400' },
  { key: 'in_progress', title: 'In Progress', color: 'border-t-blue-500' },
  { key: 'in_review', title: 'In Review', color: 'border-t-amber-500' },
  { key: 'completed', title: 'Completed', color: 'border-t-emerald-500' },
];

export const TaskKanbanBoard = ({ kanbanData = {}, onTaskClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 select-none">
      {COLUMNS.map(({ key, title, color }) => {
        const tasks = kanbanData[key] || [];

        return (
          <div
            key={key}
            className={`bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 border-t-4 ${color} flex flex-col min-h-[500px] max-h-[75vh]`}
          >
            <div className="p-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 rounded-t-xl">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {title}
              </span>
              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center">
                {tasks.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
              {tasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No tasks
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => onTaskClick && onTaskClick(task)}
                    className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                        {task.taskId}
                      </span>
                      <Badge status={task.priority} />
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition line-clamp-2 mb-2">
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {task.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar size={12} />
                        <span>{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {task.comments?.length > 0 && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <MessageSquare size={12} />
                            <span>{task.comments.length}</span>
                          </div>
                        )}
                        <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">
                          {task.assignedTo?.fullName?.split(' ')[0] || 'User'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

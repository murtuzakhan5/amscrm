import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, CheckCircle, ExternalLink } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { useNotificationStore } from '../store/notificationStore';

export const NotificationsPage = () => {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, isLoading } =
    useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Notifications Center"
        subtitle="Real-time alert notifications for lead assignments, upcoming meetings, and due tasks"
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={CheckCheck}
              onClick={markAllAsRead}
            >
              Mark All as Read
            </Button>
          )
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 text-center">No notifications in your inbox.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => {
                if (!n.isRead) markAsRead(n._id);
                if (n.link) navigate(n.link);
              }}
              className={`py-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-2xl transition ${
                !n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
                    {n.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-2 ring-4 ring-blue-100 dark:ring-blue-900/40" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

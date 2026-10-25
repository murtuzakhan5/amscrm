import React from 'react';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  color = 'blue',
  subtitle,
}) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    navy: 'bg-[#17365D]/10 text-[#17365D] dark:bg-blue-900/40 dark:text-blue-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    red: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              colorMap[color] || colorMap.blue
            }`}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value !== undefined && value !== null ? value : '—'}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trendDirection === 'up'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                : trendDirection === 'down'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};

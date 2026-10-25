import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  Building2,
  PhoneCall,
  CalendarDays,
  CheckSquare,
  Briefcase,
  TrendingUp,
  Clock,
  BarChart3,
  Bell,
  History,
  Settings,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role || 'employee';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 16 Main Navigation modules strictly mapped to prompt requirements & RBAC
  const navItems = [
    {
      name: 'Dashboard',
      path: role === 'admin' ? '/admin/dashboard' : role === 'manager' ? '/manager/dashboard' : '/employee/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Employees',
      path: '/employees',
      icon: Users,
      roles: ['admin', 'manager'],
    },
    {
      name: 'Leads Management',
      path: '/leads',
      icon: Target,
      roles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Clients',
      path: '/clients',
      icon: Building2,
      roles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Meetings',
      path: '/meetings',
      icon: PhoneCall,
      roles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Calendar',
      path: '/calendar',
      icon: CalendarDays,
      roles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Tasks',
      path: '/tasks',
      icon: CheckSquare,
      roles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Projects',
      path: '/projects',
      icon: Briefcase,
      roles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Sales Pipeline',
      path: '/pipeline',
      icon: TrendingUp,
      roles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Attendance',
      path: '/attendance',
      icon: Clock,
      roles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: ['admin', 'manager'],
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      roles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Activity Logs',
      path: '/activity-logs',
      icon: History,
      roles: ['admin'],
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['admin'],
    },
    {
      name: 'My Profile',
      path: '/profile',
      icon: UserCheck,
      roles: ['admin', 'manager', 'employee'],
    },
  ];

  const authorizedNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 bg-[#17365D] text-white flex flex-col transition-all duration-300 shadow-xl ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-blue-900/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shrink-0 shadow-md">
            <span className="font-bold text-white text-lg tracking-wider">AMS</span>
          </div>
          {isOpen && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-bold text-base tracking-wide text-white">AMS Crafters</span>
              <span className="text-[10px] text-blue-300 font-medium tracking-wider uppercase">
                CRM & Management
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-blue-800/40 transition"
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Role Pill */}
      {isOpen && (
        <div className="px-4 py-2 bg-blue-950/40 mx-3 mt-3 rounded-lg border border-blue-800/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-400" />
            <span className="text-xs font-semibold text-blue-200 capitalize">
              {role === 'admin' ? 'Super Admin' : role} Portal
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {authorizedNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-blue-200/80 hover:bg-blue-900/40 hover:text-white'
              } ${!isOpen ? 'justify-center' : ''}`
            }
            title={!isOpen ? item.name : undefined}
          >
            <item.icon size={20} className="shrink-0" />
            {isOpen && <span className="truncate">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Footer & Logout */}
      <div className="p-3 border-t border-blue-900/50 bg-[#122a49]">
        <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
          {isOpen && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400/30 flex items-center justify-center font-bold text-sm text-blue-200">
                {user?.employee?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-white truncate">
                  {user?.employee?.fullName || user?.email}
                </span>
                <span className="text-[11px] text-blue-300 capitalize">{user?.role}</span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition shrink-0"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

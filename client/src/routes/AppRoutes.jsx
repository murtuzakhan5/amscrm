import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { AppLayout } from '../components/layout/AppLayout';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';

// Dashboards
import { Dashboard as AdminDashboard } from '../pages/admin/Dashboard';
import { ManagerDashboard } from '../pages/manager/ManagerDashboard';
import { EmployeeDashboard } from '../pages/employee/EmployeeDashboard';

// Module Pages
import { Employees } from '../pages/admin/Employees';
import { EmployeeDetail } from '../pages/admin/EmployeeDetail';
import { Leads } from '../pages/admin/Leads';
import { LeadDetail } from '../pages/admin/LeadDetail';
import { Clients } from '../pages/admin/Clients';
import { ClientDetail } from '../pages/admin/ClientDetail';
import { Meetings } from '../pages/admin/Meetings';
import { Tasks } from '../pages/admin/Tasks';
import { Projects } from '../pages/admin/Projects';
import { SalesPipeline } from '../pages/admin/SalesPipeline';
import { Attendance } from '../pages/admin/Attendance';
import { Reports } from '../pages/admin/Reports';
import { ActivityLogs } from '../pages/admin/ActivityLogs';
import { Settings } from '../pages/admin/Settings';
import { MyProfile } from '../pages/employee/MyProfile';
import { NotificationsPage } from '../pages/NotificationsPage';

// Default Index Dispatcher
const RoleRedirect = () => {
  const { user } = useAuthStore();
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected CRM App Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRedirect />} />

        {/* Dashboards */}
        <Route
          path="admin/dashboard"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="manager/dashboard"
          element={
            <RoleGuard allowedRoles={['admin', 'manager']}>
              <ManagerDashboard />
            </RoleGuard>
          }
        />
        <Route path="employee/dashboard" element={<EmployeeDashboard />} />

        {/* 16 Navigation Modules */}
        <Route
          path="employees"
          element={
            <RoleGuard allowedRoles={['admin', 'manager']}>
              <Employees />
            </RoleGuard>
          }
        />
        <Route
          path="employees/:id"
          element={
            <RoleGuard allowedRoles={['admin', 'manager']}>
              <EmployeeDetail />
            </RoleGuard>
          }
        />

        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadDetail />} />

        <Route
          path="clients"
          element={
            <RoleGuard allowedRoles={['admin', 'manager', 'employee']}>
              <Clients />
            </RoleGuard>
          }
        />
        <Route
          path="clients/:id"
          element={
            <RoleGuard allowedRoles={['admin', 'manager', 'employee']}>
              <ClientDetail />
            </RoleGuard>
          }
        />

        <Route path="meetings" element={<Meetings />} />
        <Route path="calendar" element={<Meetings />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="projects" element={<Projects />} />
        <Route path="pipeline" element={<SalesPipeline />} />
        <Route path="attendance" element={<Attendance />} />

        <Route
          path="reports"
          element={
            <RoleGuard allowedRoles={['admin', 'manager']}>
              <Reports />
            </RoleGuard>
          }
        />

        <Route path="notifications" element={<NotificationsPage />} />

        <Route
          path="activity-logs"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <ActivityLogs />
            </RoleGuard>
          }
        />

        <Route
          path="settings"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <Settings />
            </RoleGuard>
          }
        />

        <Route path="profile" element={<MyProfile />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

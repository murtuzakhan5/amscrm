import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Lock, Mail, Shield, CheckCircle2, UserCheck, Briefcase } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/common/Button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const Login = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@amscrafters.com',
      password: 'AdminPassword123!',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await login(data.email, data.password);
    setIsLoading(false);

    if (result.success) {
      toast.success(`Welcome back, ${result.user.employee?.fullName || result.user.email}!`);
      if (result.user.role === 'admin') navigate('/admin/dashboard');
      else if (result.user.role === 'manager') navigate('/manager/dashboard');
      else navigate('/employee/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  const setDemoCredentials = (email, password) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#17365D] to-[#2563EB] mx-auto flex items-center justify-center shadow-lg shadow-blue-900/20 mb-4">
          <span className="font-extrabold text-2xl text-white tracking-wider">AMS</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#17365D] dark:text-white tracking-tight">
          AMS Crafters
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Employee Management & CRM Enterprise Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 rounded-3xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
                  placeholder="admin@amscrafters.com"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  {...register('password')}
                  className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-white"
                  placeholder="••••••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full py-3 text-sm font-bold"
              isLoading={isLoading}
            >
              Sign In to AMS Workspace
            </Button>
          </form>

          {/* 1-Click Role Quick-Fill Buttons for testing */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Quick Test Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin@amscrafters.com', 'AdminPassword123!')}
                className="p-2 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-900 dark:text-blue-200 text-[11px] font-semibold flex flex-col items-center gap-1 transition"
              >
                <Shield size={14} className="text-blue-600" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('sarah.jenkins@amscrafters.com', 'Password123!')}
                className="p-2 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 text-[11px] font-semibold flex flex-col items-center gap-1 transition"
              >
                <Briefcase size={14} className="text-indigo-600" />
                <span>Manager</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('ali.hassan@amscrafters.com', 'Password123!')}
                className="p-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 text-[11px] font-semibold flex flex-col items-center gap-1 transition"
              >
                <UserCheck size={14} className="text-emerald-600" />
                <span>Employee</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Protected by HttpOnly JWT & Role-Based Authorization
        </p>
      </div>
    </div>
  );
};

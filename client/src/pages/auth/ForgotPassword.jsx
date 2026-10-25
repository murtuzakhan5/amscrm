import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/common/Button';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', data);
      setIsSent(true);
      if (res.data?.data?.devResetUrl) {
        setDevResetUrl(res.data.data.devResetUrl);
      }
      toast.success('Password reset instructions sent!');
    } catch (err) {
      toast.error('Failed to request password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#17365D] mx-auto flex items-center justify-center text-white font-extrabold text-xl shadow-lg mb-3">
          AMS
        </div>
        <h2 className="text-2xl font-bold text-[#17365D] dark:text-white">Reset Password</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your registered work email to receive a secure reset link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl sm:px-10">
          {isSent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Check Your Inbox</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                If an account exists, password reset instructions have been dispatched.
              </p>

              {devResetUrl && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-left border border-blue-200 dark:border-blue-800">
                  <p className="text-[11px] font-bold text-blue-900 dark:text-blue-200 mb-1">
                    Development Direct Link:
                  </p>
                  <a
                    href={devResetUrl}
                    className="text-xs text-blue-600 dark:text-blue-400 underline break-all"
                  >
                    Click to Open Password Reset Screen
                  </a>
                </div>
              )}

              <div className="pt-4">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
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
                    placeholder="name@amscrafters.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full py-2.5"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

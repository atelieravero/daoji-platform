'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login } from './actions';
import { Loader2, Lock, Mail, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorParam = searchParams.get('error');

  const getUrlErrorMessage = (param: string | null) => {
    if (!param) return null;
    switch (param) {
      case 'account_suspended':
        return 'This account has been suspended or is not active. Please contact an administrator.';
      case 'unauthorized':
        return 'You do not have permission to access the requested resource.';
      case 'Invalid_or_expired_link':
        return 'Your verification or invite link is invalid or has expired.';
      default:
        return decodeURIComponent(param.replace(/_/g, ' '));
    }
  };

  const displayedError = error || getUrlErrorMessage(errorParam);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await login(formData);

    if (res.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      // Route through /admin so AdminRootRedirect sends the user to their authorized dashboard
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Sign In</h1>
        <p className="text-sm text-gray-500 mt-2">Daoji Platform Management</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input 
              type="email" 
              name="email"
              required 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-white"
              placeholder="admin@example.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Link 
              href="/admin/forgot-password" 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              tabIndex={-1}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input 
              type="password" 
              name="password"
              required 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-white"
              placeholder="••••••••"
            />
          </div>
        </div>

        {displayedError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start font-medium border border-red-200">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-red-600" />
            <span>{displayedError}</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
      <Suspense fallback={
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
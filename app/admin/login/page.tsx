'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from './actions';
import { Loader2, Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push('/admin/forms');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center font-medium">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {error}
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
    </div>
  );
}
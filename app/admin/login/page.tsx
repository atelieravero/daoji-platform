'use client';

import React, { useState } from 'react';
import { Mail, ArrowRight, Leaf, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    // MOCK: Simulate network request to Supabase auth.admin.inviteUserByEmail / signInWithOtp
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
            <Leaf className="w-7 h-7 text-indigo-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Daoji Admin
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Secure, passwordless access to the platform.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {status === 'success' ? (
            <div className="text-center animate-in fade-in zoom-in duration-300">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Check your inbox</h3>
              <p className="text-sm text-gray-500 mb-6">
                We've sent a secure magic link to <span className="font-medium text-gray-900">{email}</span>. Click the link to instantly log in.
              </p>
              <button 
                onClick={() => {
                  setStatus('idle');
                  setEmail('');
                }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                &larr; Try a different email
              </button>
            </div>
          ) : (
            <form className="space-y-6 animate-in fade-in duration-300" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400"
                    placeholder="admin@daoji.org"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={status === 'loading' || !email}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      Send Magic Link
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Security Note */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-start">
            <ShieldAlert className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs text-gray-500">
              Only authorized emails present in the system database will receive a login link. If you are a new team member, please contact your Super Admin for an invitation.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
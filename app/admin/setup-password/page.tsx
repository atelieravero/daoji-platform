'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { completePasswordSetup } from '@/app/admin/(dashboard)/team/actions';
import { FormInput } from '@/components/ui/FormControls';
import { Shield, Loader2, CheckCircle2, AlertCircle, User } from 'lucide-react';

export default function SetupPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const initSession = async () => {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const errorDesc = params.get('error_description');

        if (errorDesc) {
          setError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
          setIsCheckingSession(false);
          return;
        }

        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            setError(sessionError.message);
          } else if (data.session?.user) {
            setUserId(data.session.user.id);
            setUserEmail(data.session.user.email ?? null);
            window.history.replaceState(null, '', window.location.pathname);
          }
          setIsCheckingSession(false);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
      } else {
        setError('No active invite session found. Please click the link sent to your email.');
      }
      setIsCheckingSession(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Deterministically activate the user in team_members
      if (userId || data.user?.id) {
        await completePasswordSetup(userId || data.user!.id);
      }

      setSuccess(true);
      router.refresh();

      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to set password. Your invite link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Password Set!</h2>
          <p className="text-gray-500">Redirecting you to the admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Set Account Password
          </h1>
          <p className="text-sm text-gray-500">
            Please enter a secure password for your admin account.
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-sm text-red-800">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center">
            <div className="bg-white p-2 rounded-md shadow-sm border border-gray-200 mr-3">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Account Email</p>
              {isCheckingSession ? (
                <div className="flex items-center text-sm text-gray-900">
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 text-indigo-600" />
                  Verifying invite link...
                </div>
              ) : userEmail ? (
                <p className="text-sm font-bold text-gray-900 truncate">{userEmail}</p>
              ) : (
                <p className="text-sm font-medium text-red-600">No valid session found.</p>
              )}
            </div>
          </div>

          <FormInput
            label="New Password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            disabled={!userEmail || isCheckingSession}
          />

          <button
            type="submit"
            disabled={isSubmitting || password.length < 6 || !userEmail || isCheckingSession}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isSubmitting ? 'Saving...' : 'Save Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FormInput } from '@/components/ui/FormControls';
import { Shield, Loader2, CheckCircle2, AlertCircle, User } from 'lucide-react';

export default function SetupPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // Wrapped in useState to prevent Next.js Strict Mode from destroying the client on re-renders
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const initializeSession = async () => {
      // 1. MANUAL OVERRIDE: Forcibly extract tokens from the URL hash
      const hash = window.location.hash;
      
      if (hash) {
        // Remove the leading '#' so URLSearchParams can parse it
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const errorDesc = params.get('error_description');

        // If the token was already burned (e.g., clicked twice), Supabase sends an error
        if (errorDesc) {
          setError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
          setIsCheckingSession(false);
          return;
        }

        // If we found fresh tokens, manually inject them into the session
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            setError(sessionError.message);
          } else if (data.session?.user) {
            setUserEmail(data.session.user.email ?? null);
            // Clean up the URL so the hash isn't accidentally bookmarked
            window.history.replaceState(null, '', window.location.pathname);
          }
          
          setIsCheckingSession(false);
          return; // Stop execution, session is securely established
        }
      }

      // 2. FALLBACK: Check existing cookies if no hash was present in the URL
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email ?? null);
      }
      setIsCheckingSession(false);
    };

    initializeSession();

    // 3. Keep the listener as a backup for future state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
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
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;
      
      setSuccess(true);
      router.refresh();

      setTimeout(() => {
        router.push('/admin/team');
      }, 2000);

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
          <p className="text-gray-500">Redirecting you to the admin dashboard...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Welcome to the Team</h1>
          <p className="text-sm text-gray-500">Please set a secure password to activate your admin account.</p>
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
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Setting password for</p>
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
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {isSubmitting ? 'Saving...' : 'Set Password & Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
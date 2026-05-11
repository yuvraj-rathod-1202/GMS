'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import Alert from '@/components/ui/Alert';

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin, loading, error, clearError } = useAuth();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // If already logged in and not expired, redirect away from login
  useEffect(() => {
    if (!hydrated) return;
    const cookie = typeof document !== 'undefined' ? document.cookie : '';
    const hasToken = /(?:^|;\s*)authToken=/.test(cookie);
    const last = typeof window !== 'undefined' ? localStorage.getItem('lastLogin') : null;
    const msInDay = 24 * 60 * 60 * 1000;
    const expired = last ? Date.now() - Date.parse(last) > msInDay : true;
    if (hasToken && !expired) {
      router.replace('/');
    }
  }, [hydrated, router]);

  /*
  async function handleSubmit(id: number, password: string) {
    try {
      await login(id, password);
      router.push('/');
    } catch (err) {
      // hook exposes error state; LoginForm will show it
    }
  }
  */

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        await googleLogin(credentialResponse.credential);
        router.push('/');
      } catch (err) {
        console.error('Google Login Error:', err);
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-96 p-8 border border-gray-200 rounded-2xl shadow-xl bg-white items-center text-center">
        <h1 className="m-0 mb-6 text-gray-900 text-2xl font-bold tracking-tight">Welcome Back</h1>
        <p className="text-gray-500 text-sm mb-8">Please sign in to your account</p>
        
        {/* <LoginForm onSubmit={handleSubmit} loading={loading} error={error} /> */}
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="mt-8 flex flex-col items-center gap-6">
          {/* 
          <div className="relative w-full flex items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Or continue with</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>
          */}

          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log('Login Failed')}
              useOneTap
              theme="outline"
              size="large"
              width="100%"
              shape="pill"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-50">
          <button
            onClick={() => router.push('/feedback')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center cursor-pointer justify-center gap-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Report a Bug
          </button>
        </div>
      </div>
    </main>
  );
}

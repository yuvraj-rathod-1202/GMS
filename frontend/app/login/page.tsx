'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAuth();
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

  async function handleSubmit(id: number, password: string) {
    try {
      await login(id, password);
      router.push('/');
    } catch (err) {
      // hook exposes error state; LoginForm will show it
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-90 p-6 border border-zinc-200 rounded-xl shadow-lg bg-white items-center text-center">
        <h1 className="m-0 mb-3 text-black text-xl font-bold">Login</h1>
        <LoginForm onSubmit={handleSubmit} loading={loading} error={error} />
        <div className="mt-4">
          <button
            onClick={() => router.push('/feedback')}
            className="text-sm text-gms-blue hover:text-gms-indigo underline transition-colors"
          >
            Report a Bug
          </button>
        </div>
      </div>
    </main>
  );
}

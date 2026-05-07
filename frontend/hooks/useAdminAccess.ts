'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CoursesApi } from '@/lib/api/courses';

export function useAdminAccess(redirectTo?: string) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Call verify admin endpoint
        const response = await CoursesApi.VerifyAdmin();

        if (response && (response as any).isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          // Redirect if not admin
          if (redirectTo) {
            router.push(redirectTo);
          } else {
            router.push('/dashboard');
          }
        }
      } catch (err: any) {
        if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
          console.error('Admin verification error:', err);
        }
        setError(err?.message || 'Failed to verify admin status');
        setIsAdmin(false);
        // Redirect on error
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push('/dashboard');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [router, redirectTo]);

  return {
    isAdmin,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

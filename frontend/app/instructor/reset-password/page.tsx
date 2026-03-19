'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InstructorResetPasswordForm from '@/components/InstructorResetPasswordForm';
import { Authapi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth';
import { useCoursesStore } from '@/lib/store/courses';

export default function InstructorResetPasswordPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const courses = useCoursesStore((s) => s.courses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isInstructorOrTa, setIsInstructorOrTa] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user is an instructor in any course
    const hasInstructorOrTaRole = courses.some((course) => course.role === 'instructor' || course.role === 'ta');
    setIsInstructorOrTa(hasInstructorOrTaRole);

    // Redirect non-instructors
    if (courses.length > 0 && !hasInstructorOrTaRole) {
      router.push('/');
    }
  }, [user, courses, router]);

  async function handleSubmit(userId: number, newPassword: string) {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await Authapi.instructorResetPassword({
        target_user_id: userId,
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  // Show loading while checking authorization
  if (!user || isInstructorOrTa === null) {
    return null;
  }

  // Prevent rendering if not authorized
  if (!isInstructorOrTa) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 border border-gray-200 rounded-lg bg-white">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 cursor-pointer flex flex-row gap-2 hover:text-gray-800 text-sm mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Reset User Password</h1>
          <p className="text-sm text-gray-600 mt-2">
            As an instructor or TA, you can reset a user&apos;s password by entering their user ID(Roll No)
          </p>
        </div>
        <InstructorResetPasswordForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          success={success}
        />
      </div>
    </main>
  );
}

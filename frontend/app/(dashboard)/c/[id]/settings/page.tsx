'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import InstructorNavbar from '@/components/Course/InstructorNavbar';
import { CourseFeatureFlags } from '@/components/Course/CourseFeatureFlags';

export default function CourseSettingsPage() {
  const params = useParams();
  const courseId = Number(params.id);

  const { role, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['instructor'],
    courseId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-10">
        <div className="text-gray-900 text-lg animate-pulse">Loading settings...</div>
      </div>
    );
  }

  if (!hasAccess || role !== 'instructor') {
    return null;
  }

  return (
    <>
      <InstructorNavbar />
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Course Settings</h1>
          <p className="text-gray-500 mt-2">
            Configure feature flags and other course-specific parameters.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-8">
            <CourseFeatureFlags courseId={courseId.toString()} />
          </div>
        </div>
      </div>
    </>
  );
}

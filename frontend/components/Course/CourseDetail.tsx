'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUserRoleInCourse } from '@/hooks/useUserRoleInCourse';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import StudentCourseView from './StudentCourseView';
import TACourseView from './TACourseView';
import InstructorCourseView from './InstructorCourseView';

export default function CourseDetail() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const [isTimeout, setIsTimeout] = useState(false);

  // Get role and course from the hook
  const { role, course, isLoading } = useUserRoleInCourse(courseId);

  // Access shared store
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);

  useEffect(() => {
    // If not loading and course not found -> Redirect
    if (!isLoading && !course) {
      router.push('/');
      return;
    }

    // Safety timeout for loading state
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsTimeout(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, course, router]);

  // Handle timeout redirect
  useEffect(() => {
    if (isTimeout && !course) {
      router.push('/');
    }
  }, [isTimeout, course, router]);

  if (isLoading || !currentCourse || !role) {
    return (
      <div className="flex justify-center items-center h-full p-10">
        <div className="text-gray-900 text-lg animate-pulse">Loading course...</div>
      </div>
    );
  }

  // Render role-specific view
  switch (role) {
    case 'student':
      return <StudentCourseView />;
    case 'ta':
      return <TACourseView />;
    case 'instructor':
      return <InstructorCourseView />;
    default:
      router.push('/');
      return null;
  }
}

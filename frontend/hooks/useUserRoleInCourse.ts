'use client';
import { useEffect } from 'react';
import { useCoursesStore } from '@/lib/store/courses';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import { CourseDBObject } from '@/lib/types/courses';

/**
 * Hook to get user's role in the current course
 * Returns the role and the course object
 */
export function useUserRoleInCourse(
  courseId: number,
  assessmentId?: number
): {
  role: 'instructor' | 'ta' | 'student' | null;
  course: CourseDBObject | null;
  assessment: any | null;
  isLoading: boolean;
} {
  const courses = useCoursesStore((s) => s.courses);
  const assessments = useCourseDetailStore((s) => s.taData?.assessments);
  const setCurrentCourse = useCourseDetailStore((s) => s.setCurrentCourse);
  const setCurrentAssessment = useCourseDetailStore((s) => s.setCurrentAssessment);

  const course = courses.find((c) => c.id === courseId) || null;
  const assessment = assessments?.find((a) => a.id === assessmentId) || null;
  const role = course?.role || null;

  // Update the shared store whenever course changes
  useEffect(() => {
    if (course) {
      setCurrentCourse(course);
    }
  }, [course, setCurrentCourse]);

  useEffect(() => {
    if (assessment) {
      setCurrentAssessment(assessment);
    }
  }, [assessment, setCurrentAssessment]);

  return {
    role,
    course,
    assessment,
    isLoading: courses.length === 0,
  };
}

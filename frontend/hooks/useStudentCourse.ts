'use client';
import { useState, useCallback } from 'react';
import { MarksApi } from '@/lib/api/marks';
import { PolicyApi } from '@/lib/api/policy';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import { useAuthStore } from '@/lib/store/auth';
import { useFeatureFlags } from './useFeatureFlags';

export function useStudentCourse() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStudentData = useCourseDetailStore((s) => s.setStudentData);
  const hasFetchedInSession = useCourseDetailStore((s) => s.hasFetchedStudentDataInSession);
  const setHasFetchedInSession = useCourseDetailStore((s) => s.setHasFetchedStudentDataInSession);
  const user = useAuthStore((s) => s.user);
  const { isFeatureEnabled } = useFeatureFlags(
    useCourseDetailStore.getState().currentCourse?.id || 0
  );

  const fetchStudentCourseData = useCallback(
    async (courseId: number) => {
      // If already fetched in this session, skip fetch
      if (hasFetchedInSession) {
        return useCourseDetailStore.getState().studentData;
      }

      if (!user?.id) {
        setError('User not found');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch student's marks for this course
        const marksData = await MarksApi.GetStudentMarks(courseId, user.id);
        const marksList = (marksData as any)?.marks || [];
        const analyticsList = (marksData as any)?.analytics || [];

        // Fetch total marks if enabled
        let totalMarks = undefined;
        if (isFeatureEnabled('course.total_marks_visibility')) {
          try {
            const totalData = await PolicyApi.GetTotalByStudentId(courseId, user.id);
            totalMarks = (totalData as any)?.totals?.[0] || (totalData as any)?.totals;
          } catch (e) {
            console.error('Failed to fetch total marks:', e);
          }
        }

        // Store in the shared store
        setStudentData({
          marks: marksList,
          analytics: analyticsList,
          totalMarks: totalMarks,
        });

        // Mark as fetched in this session
        setHasFetchedInSession(true);

        return marksData;
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to fetch student course data';
        setError(errorMessage);
        if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
          console.error('Error fetching student course data:', err);
          throw err;
        }
      } finally {
        setLoading(false);
      }
    },
    [user?.id, setStudentData, hasFetchedInSession, setHasFetchedInSession]
  );

  return {
    fetchStudentCourseData,
    loading,
    error,
  };
}

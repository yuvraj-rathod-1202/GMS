import { useEffect } from 'react';
import { useFeatureFlagsStore } from '@/lib/store/featureFlags';

export const useFeatureFlags = (courseId?: string | number | null) => {
  const flags = useFeatureFlagsStore((s) => s.flags);
  const isLoading = useFeatureFlagsStore((s) => s.isLoading);
  const error = useFeatureFlagsStore((s) => s.error);
  const fetchFlags = useFeatureFlagsStore((s) => s.fetchFlags);
  const currentCourseId = useFeatureFlagsStore((s) => s.currentCourseId);

  useEffect(() => {
    const normalizedCourseId = courseId ? Number(courseId) : null;
    const shouldFetch = Object.keys(flags).length === 0 || normalizedCourseId !== currentCourseId;
    
    if (shouldFetch && !isLoading) {
      fetchFlags(normalizedCourseId);
    }
  }, [flags, isLoading, fetchFlags, courseId, currentCourseId]);

  return {
    flags,
    isLoading,
    error,
    isFeatureEnabled: (name: string) => !!flags[name],
    refreshFlags: () => fetchFlags(courseId)
  };
};

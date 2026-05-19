import { useEffect } from 'react';
import { useFeatureFlagsStore } from '@/lib/store/featureFlags';

export const useFeatureFlags = (courseId?: string | number | null) => {
  const flags = useFeatureFlagsStore((s) => s.flags);
  const isLoading = useFeatureFlagsStore((s) => s.isLoading);
  const error = useFeatureFlagsStore((s) => s.error);
  const fetchFlags = useFeatureFlagsStore((s) => s.fetchFlags);
  const isFeatureEnabled = useFeatureFlagsStore((s) => s.isFeatureEnabled);
  const currentCourseId = useFeatureFlagsStore((s) => s.currentCourseId);

  useEffect(() => {
    // Fetch if flags are empty OR if the courseId has changed
    const shouldFetch = Object.keys(flags).length === 0 || courseId !== currentCourseId;

    if (shouldFetch && !isLoading) {
      fetchFlags(courseId);
    }
  }, [flags, isLoading, fetchFlags, courseId, currentCourseId]);

  return {
    flags,
    isLoading,
    error,
    isFeatureEnabled,
    refreshFlags: () => fetchFlags(courseId),
  };
};

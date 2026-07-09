import React from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface FeatureFlagGateProps {
  flagName: string;
  courseId?: string | number | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FeatureFlagGate: React.FC<FeatureFlagGateProps> = ({
  flagName,
  courseId = null,
  children,
  fallback = null,
}) => {
  const { isFeatureEnabled, isLoading } = useFeatureFlags(courseId);

  if (isLoading) {
    return null; // Or a subtle skeleton
  }

  if (isFeatureEnabled(flagName)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default FeatureFlagGate;

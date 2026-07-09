'use client';

import { useState, useEffect, useCallback } from 'react';
import { PolicyApi } from '@/lib/api/policy';

export interface AssessmentCategory {
  id: number;
  type: string;
}

export function useAssessmentCategories(courseId: number | null) {
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(
    async (showLoading = true) => {
      if (!courseId) return;
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const response = await PolicyApi.FetchAssessmentCategories(courseId);
        const categoryList = Array.isArray(response)
          ? response
          : (response as any)?.categories || [];
        setCategories(categoryList);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch assessment categories');
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [courseId]
  );

  const createCategory = useCallback(
    async (type: string) => {
      if (!courseId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await PolicyApi.CreateAssessmentCategory(courseId, type);
        await fetchCategories(false);
        return response;
      } catch (err: any) {
        setError(err?.message || 'Failed to create assessment category');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [courseId, fetchCategories]
  );

  useEffect(() => {
    fetchCategories();
  }, [courseId, fetchCategories]);

  return {
    categories,
    loading,
    error,
    createCategory,
    refresh: () => fetchCategories(false),
  };
}

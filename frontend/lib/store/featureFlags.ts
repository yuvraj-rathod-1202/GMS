import { create } from 'zustand';
import { FlagsApi } from '../api/flags';

interface FeatureFlagsState {
  flags: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
  currentCourseId: string | number | null;
  fetchFlags: (courseId?: string | number | null) => Promise<void>;
  isFeatureEnabled: (name: string) => boolean;
}

export const useFeatureFlagsStore = create<FeatureFlagsState>((set, get) => ({
  flags: {},
  isLoading: false,
  error: null,
  currentCourseId: null,

  fetchFlags: async (courseId: string | number | null = null) => {
    set({ isLoading: true, error: null, currentCourseId: courseId });
    try {
      const data = await FlagsApi.GetActiveFlags(courseId);
      set({ flags: data as Record<string, boolean>, isLoading: false });
    } catch (err: any) {
      console.error('Error fetching feature flags:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  isFeatureEnabled: (name: string) => {
    return !!get().flags[name];
  }
}));

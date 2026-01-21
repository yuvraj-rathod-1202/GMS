"use client";
import { useState } from "react";
import { Authapi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth";
import { useCoursesStore } from "@/lib/store/courses";
import { useCourseDetailStore } from "@/lib/store/courseDetail";

export function useAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const clearCourses = useCoursesStore((s) => s.clearCourses);
  const clearCourseDetail = useCourseDetailStore((s) => s.clearCourseDetail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(id: number, password: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await Authapi.login(id, password);
      // Expecting { user, token } 
      const user = (data as any).user ?? null;
      const token = (data as any).token ?? null;
      if (!token) throw new Error("Invalid login response");
      setAuth(user, token);
      const lastLogin = new Date().toISOString();
      // Persist last login locally
      try {
        localStorage.setItem('lastLogin', lastLogin);
      } catch {}
      // Ensure server sets cookie so middleware can read it
      try {
        await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, lastLogin }),
        });
      } catch {}
      return { user, token };
    } catch (err: any) {
      setError(err?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    login,
    logout: async () => {
      try {
        await fetch('/api/session', { method: 'DELETE' });
        clearCourses();
        clearCourseDetail();
      } catch {}
      try { localStorage.removeItem('lastLogin'); } catch {}
      logout();
    },
    loading,
    error,
    clearError: () => setError(null),
  };
}

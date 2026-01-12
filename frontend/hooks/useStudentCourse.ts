"use client";
import { useState, useCallback } from "react";
import { MarksApi } from "@/lib/api/marks";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import { useAuthStore } from "@/lib/store/auth";

export function useStudentCourse() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const setStudentData = useCourseDetailStore((s) => s.setStudentData);
  const hasFetchedInSession = useCourseDetailStore((s) => s.hasFetchedStudentDataInSession);
  const setHasFetchedInSession = useCourseDetailStore((s) => s.setHasFetchedStudentDataInSession);
  const user = useAuthStore((s) => s.user);

  const fetchStudentCourseData = useCallback(async (courseId: number) => {
    // If already fetched in this session, skip fetch
    if (hasFetchedInSession) {
      return useCourseDetailStore.getState().studentData;
    }

    if (!user?.id) {
      setError("User not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch student's marks for this course
      const marksData = await MarksApi.GetStudentMarks(courseId, user.id);
      const marksList = Array.isArray(marksData) ? marksData : (marksData as any)?.marks || [];
      console.log("Fetched student marks data:", marksList);
      
      // Store in the shared store
      setStudentData({
        marks: marksList,
      });
      
      // Mark as fetched in this session
      setHasFetchedInSession(true);

      return marksData;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to fetch student course data";
      setError(errorMessage);
      console.error("Error fetching student course data:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, setStudentData, hasFetchedInSession, setHasFetchedInSession]);

  return {
    fetchStudentCourseData,
    loading,
    error,
  };
}

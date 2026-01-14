"use client";
import { useState, useCallback } from "react";
import { CoursesApi } from "@/lib/api/courses";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import { useAuthStore } from "@/lib/store/auth";
import { EnrollStudentRequest } from "@/lib/types/courses";

type UserRole = 'instructor' | 'ta' | 'student';

interface CourseRoleData {
  students: Array<{ user_id: number; email: string | null }>;
}

export function useCourseManagement(role: UserRole) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const taData = useCourseDetailStore((s) => s.taData);
  const setTaData = useCourseDetailStore((s) => s.setTAData);
  const hasFetchedInSession = useCourseDetailStore((s) => s.hasFetchedTADataInSession);
  const setHasFetchedInSession = useCourseDetailStore((s) => s.setHasFetchedTADataInSession);

  const fetchCourseRoles = useCallback(async (courseId: number, forceRefresh = false): Promise<CourseRoleData | undefined> => {
    if (!forceRefresh && hasFetchedInSession["courseRoles"]) {
      return useCourseDetailStore.getState().taData?.CourseRoles || undefined;
    }

    if (!user?.id) {
      setError("User not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const studentResponse = await CoursesApi.GetCourseRoles(courseId, 'student');
      const studentList = Array.isArray(studentResponse) ? studentResponse : (studentResponse as any)?.roles || [];
      
      setTaData({
        assessments: taData?.assessments || [],
        assesmentMarks: taData?.assesmentMarks || {},
        totalMarks: taData?.totalMarks || [],
        marksChanges: taData?.marksChanges || {},
        CourseRoles: {
          students: studentList,
        }
      });
      
      setHasFetchedInSession("courseRoles", true);
      
      return {
        students: studentList,
      };
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to fetch course roles";
      setError(errorMessage);
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error("Error fetching course roles:", err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, hasFetchedInSession, setHasFetchedInSession, taData, setTaData]);

  const enrollStudent = useCallback(async (courseId: number, enrollData: EnrollStudentRequest) => {
    if (!user?.id) {
      setError("User not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await CoursesApi.EnrollStudent(courseId, enrollData);
      return response;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to enroll student";
      setError(errorMessage);
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error("Error enrolling student:", err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const unenrollStudent = useCallback(async (courseId: number, studentId: number) => {
    if (!user?.id) {
      setError("User not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await CoursesApi.UnEnrollStudent(courseId, studentId);
      return response;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to unenroll student";
      setError(errorMessage);
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error("Error unenrolling student:", err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return {
    loading,
    error,
    fetchCourseRoles,
    enrollStudent,
    unenrollStudent,
    courseRoles: taData?.CourseRoles,
  };
}

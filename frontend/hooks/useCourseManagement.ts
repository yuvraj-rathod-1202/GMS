"use client";
import { useState, useCallback } from "react";
import { CoursesApi } from "@/lib/api/courses";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import { useAuthStore } from "@/lib/store/auth";
import { EnrollStudentRequest, AddTARequest } from "@/lib/types/courses";
import { MarksApi } from "@/lib/api/marks";
import { AddMarksRequest } from "@/lib/types/marks";

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
  const instructorData = useCourseDetailStore((s) => s.instructorData);
  const setInstructorData = useCourseDetailStore((s) => s.setInstructorData);
  const hasFetchedInSession = useCourseDetailStore((s) => s.hasFetchedTADataInSession);
  const setHasFetchedInSession = useCourseDetailStore((s) => s.setHasFetchedTADataInSession);

  const fetchCourseRoles = useCallback(async (courseId: number, forceRefresh = false, isInstructor = false): Promise<CourseRoleData | undefined> => {
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
      let taList = null;
      if (isInstructor) {
        console.log("Fetching TA data for instructor");
        const taResponse = await CoursesApi.GetCourseRoles(courseId, 'ta');
        taList = Array.isArray(taResponse) ? taResponse : (taResponse as any)?.roles || [];

      }
      if (role === 'ta') {
        setTaData({
          assessments: taData?.assessments || [],
          assessmentMarks: taData?.assessmentMarks || {},
          totalMarks: taData?.totalMarks || [],
          marksChanges: taData?.marksChanges || {},
          CourseRoles: {
            students: studentList,
          },
        });
      } else if (role === 'instructor') {
        setInstructorData({
          assessments: instructorData?.assessments || [],
          assessmentMarks: instructorData?.assessmentMarks || {},
          totalMarks: instructorData?.totalMarks || [],
          marksChanges: instructorData?.marksChanges || {},
          CourseRoles: {
            students: studentList,
            tas: taList
          },
        });
      }
      
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

  const fetchAllAssessments = useCallback(async (courseId: number, forceRefresh = false) => {
    
    if(!forceRefresh && hasFetchedInSession["assessments"]){
      return useCourseDetailStore.getState().taData?.assessments || [];
    }

    if (!user?.id) {
      setError("User not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {

      const assessments = await MarksApi.GetAllAssessments(courseId);
      const assessmentList = Array.isArray(assessments) ? assessments : (assessments as any)?.assessments || [];
      if (role == 'ta'){
        setTaData({
          assessments: assessmentList,
          assessmentMarks: taData?.assessmentMarks || {},
          totalMarks: taData?.totalMarks || [],
          marksChanges: taData?.marksChanges || {},
          CourseRoles: taData?.CourseRoles || null,
        });
      } else if (role == 'instructor') {
        setInstructorData({
          assessments: assessmentList,
          assessmentMarks: instructorData?.assessmentMarks || {},
          totalMarks: instructorData?.totalMarks || [],
          marksChanges: instructorData?.marksChanges || {},
          CourseRoles: instructorData?.CourseRoles || null,
        })
      }

      setHasFetchedInSession("assessments", true);
      return assessmentList;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to fetch assessments";
      setError(errorMessage);
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error("Error fetching assessments:", err);
        throw err;
      }
    } finally {
      setLoading(false);
    }

  }, [user?.id, hasFetchedInSession, setHasFetchedInSession, taData, setTaData]);

  const getmarksofassessment = useCallback(async (courseId: number, assessmentId: number, forceRefresh = false) => {
    
    if (!forceRefresh && hasFetchedInSession["marks_" + assessmentId]) {
      return useCourseDetailStore.getState().taData?.assessmentMarks[assessmentId] || [];
    }

    if (!user?.id) {
      setError("User not found");
      return useCourseDetailStore.getState().taData?.assessmentMarks[assessmentId] || [];
    }

    setLoading(true);
    setError(null);

    try {

      const marks = await MarksApi.GetAllMarks(courseId, assessmentId);
      const marksList = Array.isArray(marks) ? marks : (marks as any)?.marks || [];
      if(role == 'ta'){
        setTaData({
          assessments: taData?.assessments || [],
          assessmentMarks: { ...(taData?.assessmentMarks || {}), [assessmentId]: marksList },
          totalMarks: taData?.totalMarks || [],
          marksChanges: taData?.marksChanges || {},
          CourseRoles: taData?.CourseRoles || null,
        });
      } else if (role == 'instructor') {
        setInstructorData({
          assessments: instructorData?.assessments || [],
          assessmentMarks: { ...(instructorData?.assessmentMarks || {}), [assessmentId]: marksList },
          totalMarks: instructorData?.totalMarks || [],
          marksChanges: instructorData?.marksChanges || {},
          CourseRoles: instructorData?.CourseRoles || null,
        });
      }

      setHasFetchedInSession("marks_" + assessmentId, true);
      return marksList;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to fetch marks";
      setError(errorMessage);
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error("Error fetching marks:", err);
        throw err;
      }
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

  const BulkEnrollStudent = useCallback(async (courseId: number, enrollData: EnrollStudentRequest[]) => {
    if (!user?.id) {
      setError("User not found");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await CoursesApi.BulkEnrollStudents(courseId, enrollData);
      return response;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to enroll students";
      setError(errorMessage);
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error("Error enrolling students:", err);
        throw err;
      }
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

  const AddTA = useCallback(async (courseId: number, taData: AddTARequest) => {
    if (!user?.id) {
      setError("User not found");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await CoursesApi.AddTa(courseId, taData);
      return response;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to add TA";
      setError(errorMessage);
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error("Error adding TA:", err);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const RemoveTA = useCallback(async (courseId: number, taId: number) => {
    if (!user?.id) {
      setError("User not found");
      return;
    }
    setLoading(true);
    setError(null);

    try {

      const response = await CoursesApi.RemoveTa(courseId, taId);
      return response;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to remove TA";
      setError(errorMessage);
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error("Error removing TA:", err);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const saveMarks = useCallback(async (courseId: number, assessmentId: number, marksData: AddMarksRequest) => {
    if (!user?.id) {
      setError("User not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await MarksApi.AddMarks(courseId, assessmentId, marksData);
      // Invalidate the cache for this assessment's marks so they are fetched again perfectly
      setHasFetchedInSession("marks_" + assessmentId, false);
      return response;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to save marks";
      setError(errorMessage);
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error("Error saving marks:", err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, setHasFetchedInSession]);

  return {
    loading,
    error,
    fetchCourseRoles,
    fetchAllAssessments,
    getmarksofassessment,
    enrollStudent,
    BulkEnrollStudent,
    unenrollStudent,
    AddTA,
    RemoveTA,
    saveMarks,
    courseRoles: taData?.CourseRoles || instructorData?.CourseRoles || null,
  };
}

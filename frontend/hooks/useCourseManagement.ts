'use client';
import { useState, useCallback } from 'react';
import { CoursesApi } from '@/lib/api/courses';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import { useAuthStore } from '@/lib/store/auth';
import { EnrollStudentRequest, AddTARequest } from '@/lib/types/courses';
import { MarksApi } from '@/lib/api/marks';
import { AddMarksRequest } from '@/lib/types/marks';
import { PolicyApi } from '@/lib/api/policy';
import {
  AddPolicyComponentsRequest,
  AssignPolicyRequest,
  CreatePolicyRequest,
  UpdatePolicyComponentsRequest,
  UpdatePolicyRequest,
} from '@/lib/types/policy';

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

  // Generic API request wrapper
  const executeRequest = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      errorMessage: string,
      shouldCheckUser: boolean = true
    ): Promise<T | undefined> => {
      if (shouldCheckUser && !user?.id) {
        setError('User not found');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiCall();
        return response;
      } catch (err: any) {
        const finalError = err?.message || errorMessage;
        setError(finalError);
        if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
          console.error(errorMessage, err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  // Update store data helper
  const updateStoreData = useCallback(
    (updates: any) => {
      const currentData = role === 'ta' ? taData : instructorData;
      const setData = role === 'ta' ? setTaData : setInstructorData;

      setData({
        assessments: currentData?.assessments || [],
        assessmentMarks: currentData?.assessmentMarks || {},
        totalMarks: currentData?.totalMarks || [],
        marksChanges: currentData?.marksChanges || {},
        CourseRoles: currentData?.CourseRoles || null,
        policies: updates?.policies ?? currentData?.policies ?? [],
        ...(role === 'instructor' && {
          studentPolicyMap: updates?.studentPolicyMap ?? instructorData?.studentPolicyMap ?? {},
        }),
        ...updates,
      } as any);
    },
    [role, taData, instructorData, setTaData, setInstructorData]
  );

  const fetchCourseRoles = useCallback(
    async (
      courseId: number,
      forceRefresh = false,
      isInstructor = false
    ): Promise<CourseRoleData | undefined> => {
      const cacheKey = 'courseRoles';
      if (!forceRefresh && hasFetchedInSession[cacheKey]) {
        return useCourseDetailStore.getState().taData?.CourseRoles || undefined;
      }

      return executeRequest(async () => {
        const studentResponse = await CoursesApi.GetCourseRoles(courseId, 'student');
        const studentList = Array.isArray(studentResponse)
          ? studentResponse
          : (studentResponse as any)?.roles || [];

        let taList = null;
        if (isInstructor) {
          const taResponse = await CoursesApi.GetCourseRoles(courseId, 'ta');
          taList = Array.isArray(taResponse) ? taResponse : (taResponse as any)?.roles || [];
        }

        updateStoreData({
          CourseRoles: {
            students: studentList,
            ...(isInstructor && { tas: taList }),
          } as any,
        });

        setHasFetchedInSession(cacheKey, true);
        return { students: studentList };
      }, 'Failed to fetch course roles');
    },
    [hasFetchedInSession, setHasFetchedInSession, updateStoreData, executeRequest]
  );

  const fetchAllAssessments = useCallback(
    async (courseId: number, forceRefresh = false) => {
      const cacheKey = 'assessments';
      if (!forceRefresh && hasFetchedInSession[cacheKey]) {
        return useCourseDetailStore.getState().taData?.assessments || [];
      }

      return executeRequest(async () => {
        const assessments = await MarksApi.GetAllAssessments(courseId);
        const assessmentList = Array.isArray(assessments)
          ? assessments
          : (assessments as any)?.assessments || [];

        updateStoreData({ assessments: assessmentList });
        setHasFetchedInSession(cacheKey, true);

        return assessmentList;
      }, 'Failed to fetch assessments');
    },
    [hasFetchedInSession, setHasFetchedInSession, updateStoreData, executeRequest]
  );

  const getmarksofassessment = useCallback(
    async (courseId: number, assessmentId: number, forceRefresh = false) => {
      const cacheKey = `marks_${assessmentId}`;
      const currentData = role === 'ta' ? taData : instructorData;

      if (!forceRefresh && hasFetchedInSession[cacheKey]) {
        return currentData?.assessmentMarks[assessmentId] || [];
      }

      return (
        executeRequest(
          async () => {
            const marks = await MarksApi.GetAllMarks(courseId, assessmentId);
            const marksList = Array.isArray(marks) ? marks : (marks as any)?.marks || [];

            updateStoreData({
              assessmentMarks: {
                ...(currentData?.assessmentMarks || {}),
                [assessmentId]: marksList,
              },
            });

            setHasFetchedInSession(cacheKey, true);
            return marksList;
          },
          'Failed to fetch marks',
          false
        ) ||
        currentData?.assessmentMarks[assessmentId] ||
        []
      );
    },
    [
      role,
      taData,
      instructorData,
      hasFetchedInSession,
      setHasFetchedInSession,
      updateStoreData,
      executeRequest,
    ]
  );

  const getallassessmentmarks = useCallback(
    async (courseId: number, forcedRefresh = false) => {
      const cacheKey = `marks_all`;
      const currentData = role === 'ta' ? taData : instructorData;

      if (!forcedRefresh && hasFetchedInSession[cacheKey]) {
        return currentData?.assessmentMarks || {};
      }

      return executeRequest(async () => {
        const marks = await MarksApi.GetAllAssessmentMarks(courseId);
        const marksDict = Array.isArray(marks) ? marks : (marks as any)?.marks?.marks || [];

        updateStoreData({
          assessmentMarks: marksDict,
        });

        setHasFetchedInSession(cacheKey, true);
        return marksDict;
      }, 'Failed to fetch all marks');
    },
    [
      role,
      taData,
      instructorData,
      hasFetchedInSession,
      setHasFetchedInSession,
      updateStoreData,
      executeRequest,
    ]
  );

  const fetchTotalMarks = useCallback(
    async (courseId: number, forceRefresh = false) => {
      const cacheKey = 'total_marks';
      const currentData = role == 'ta' ? taData : instructorData;

      if (!forceRefresh && hasFetchedInSession[cacheKey]) {
        return currentData?.totalMarks || [];
      }

      return executeRequest(async () => {
        const marks = await PolicyApi.GetTotalOfAllStudents(courseId);
        const marksList = Array.isArray(marks) ? marks : (marks as any)?.totals || [];

        updateStoreData({ totalMarks: marksList });
        setHasFetchedInSession(cacheKey, true);
        return marksList;
      }, 'Failed to fetch total marks');
    },
    [
      role,
      taData,
      instructorData,
      hasFetchedInSession,
      setHasFetchedInSession,
      updateStoreData,
      executeRequest,
    ]
  );

  const fetchStudentPolicyMap = useCallback(
    async (courseId: number, forceRefresh = false) => {
      const cacheKey = 'student_policy_map';
      const currentData = instructorData;
      if (!forceRefresh && hasFetchedInSession[cacheKey]) {
        return currentData?.studentPolicyMap || {};
      }
      return executeRequest(async () => {
        const policyMap = await PolicyApi.GetPolicyAssignments(courseId);
        const policyMapData = (policyMap as any)?.assignments ?? {};
        updateStoreData({ studentPolicyMap: policyMapData });
        setHasFetchedInSession(cacheKey, true);
        return policyMapData;
      }, 'Failed to fetch student policy map');
    },
    [
      role,
      taData,
      instructorData,
      hasFetchedInSession,
      setHasFetchedInSession,
      updateStoreData,
      executeRequest,
    ]
  );

  const enrollStudent = useCallback(
    (courseId: number, enrollData: EnrollStudentRequest) =>
      executeRequest(
        () => CoursesApi.EnrollStudent(courseId, enrollData),
        'Failed to enroll student'
      ),
    [executeRequest]
  );

  const BulkEnrollStudent = useCallback(
    (courseId: number, enrollData: EnrollStudentRequest[]) =>
      executeRequest(
        () => CoursesApi.BulkEnrollStudents(courseId, enrollData),
        'Failed to enroll students'
      ),
    [executeRequest]
  );

  const UnEnrollAllStudents = useCallback(
    (courseId: number) =>
      executeRequest(
        () => CoursesApi.UnEnrollAllStudents(courseId),
        'Failed to unenroll all students'
      ),
    [executeRequest]
  );

  const unenrollStudent = useCallback(
    (courseId: number, studentId: number) =>
      executeRequest(
        () => CoursesApi.UnEnrollStudent(courseId, studentId),
        'Failed to unenroll student'
      ),
    [executeRequest]
  );

  const AddTA = useCallback(
    (courseId: number, taData: AddTARequest) =>
      executeRequest(() => CoursesApi.AddTa(courseId, taData), 'Failed to add TA'),
    [executeRequest]
  );

  const RemoveTA = useCallback(
    (courseId: number, taId: number) =>
      executeRequest(() => CoursesApi.RemoveTa(courseId, taId), 'Failed to remove TA'),
    [executeRequest]
  );

  const saveMarks = useCallback(
    async (courseId: number, assessmentId: number, marksData: AddMarksRequest) => {
      return executeRequest(
        () => MarksApi.AddMarks(courseId, assessmentId, marksData),
        'Failed to save marks'
      );
    },
    [executeRequest]
  );

  const fetchAllPolicy = useCallback(
    async (courseId: number, forceRefresh: boolean = false) => {
      const cacheKey = 'policies';
      if (hasFetchedInSession[cacheKey] && !forceRefresh) {
        return useCourseDetailStore.getState().instructorData?.policies || [];
      }

      return executeRequest(async () => {
        const policies = await PolicyApi.GetAllPolicy(courseId);
        const policyList = Array.isArray(policies) ? policies : (policies as any)?.policy || [];

        if (role === 'instructor' || role === 'ta') {
          updateStoreData({ policies: policyList });
        }

        setHasFetchedInSession(cacheKey, true);
        return policyList;
      }, 'Failed to fetch policies');
    },
    [role, hasFetchedInSession, setHasFetchedInSession, updateStoreData, executeRequest]
  );

  const setDefaultPolicy = useCallback(
    (courseId: number, policyId: number) =>
      executeRequest(
        () => PolicyApi.SetDefaultPolicy(courseId, policyId),
        'Failed to set default policy'
      ),
    [executeRequest]
  );

  const createPolicy = useCallback(
    (courseId: number, policyData: CreatePolicyRequest) =>
      executeRequest(() => PolicyApi.CreatePolicy(courseId, policyData), 'Failed to create policy'),
    [executeRequest]
  );

  const updatePolicy = useCallback(
    (courseId: number, policyData: UpdatePolicyRequest) =>
      executeRequest(() => PolicyApi.UpdatePolicy(courseId, policyData), 'Failed to update policy'),
    [executeRequest]
  );

  const updatePolicyComponent = useCallback(
    (
      courseId: number,
      policyId: number,
      componentId: number,
      componentData: UpdatePolicyComponentsRequest
    ) =>
      executeRequest(
        () => PolicyApi.UpdatePolicyComponents(courseId, policyId, componentId, componentData),
        'Failed to update policy component'
      ),
    [executeRequest]
  );

  const AssignPolicyToStudent = useCallback(
    (courseId: number, studentData: AssignPolicyRequest) =>
      executeRequest(
        () => PolicyApi.AssignPolicyToStudent(courseId, studentData),
        'Failed to assign policy to student'
      ),
    [executeRequest]
  );

  const AddPolicyComponent = useCallback(
    (courseId: number, policyId: number, componentData: AddPolicyComponentsRequest) =>
      executeRequest(
        () => PolicyApi.AddPolicyComponents(courseId, policyId, componentData),
        'Failed to add policy component'
      ),
    [executeRequest]
  );

  const DeletePolicyComponent = useCallback(
    (courseId: number, policyId: number, componentId: number) =>
      executeRequest(
        () => PolicyApi.DeletePolicyComponent(courseId, policyId, componentId),
        'Failed to delete policy component'
      ),
    [executeRequest]
  );

  const DeletePolicy = useCallback(
    (courseId: number, policyId: number) =>
      executeRequest(() => PolicyApi.DeletePolicy(courseId, policyId), 'Failed to delete policy'),
    [executeRequest]
  );

  const RecalculateTotal = useCallback(
    (courseId: number) =>
      executeRequest(
        () => PolicyApi.RecalculateTotal(courseId),
        'Failed to recalculate total marks'
      ),
    [executeRequest]
  );

  const updateStudentPolicy = useCallback(
    async (courseId: number, studentId: number, policyId: number) => {
      return executeRequest(async () => {
        const response = await PolicyApi.AssignPolicyToStudent(courseId, {
          mapping: [{ student_id: studentId, course_policy_id: policyId }],
        });

        // Update local store with new mapping
        const currentData = instructorData;
        if (currentData) {
          updateStoreData({
            studentPolicyMap: {
              ...currentData.studentPolicyMap,
              [studentId]: policyId,
            },
          });
        }

        return response;
      }, 'Failed to update student policy');
    },
    [executeRequest, instructorData, updateStoreData]
  );

  return {
    loading,
    error,
    fetchCourseRoles,
    fetchAllAssessments,
    getmarksofassessment,
    getallassessmentmarks,
    fetchTotalMarks,
    fetchStudentPolicyMap,
    enrollStudent,
    BulkEnrollStudent,
    unenrollStudent,
    UnEnrollAllStudents,
    AddTA,
    RemoveTA,
    saveMarks,
    fetchAllPolicy,
    setDefaultPolicy,
    createPolicy,
    updatePolicy,
    updatePolicyComponent,
    AddPolicyComponent,
    DeletePolicyComponent,
    AssignPolicyToStudent,
    DeletePolicy,
    RecalculateTotal,
    updateStudentPolicy,
    courseRoles: taData?.CourseRoles || instructorData?.CourseRoles || null,
  };
}

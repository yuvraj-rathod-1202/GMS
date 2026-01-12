"use client";
import { useState, useCallback } from "react";
import { MarksApi } from "@/lib/api/marks";
import { CoursesApi } from "@/lib/api/courses";
import {PolicyApi} from "@/lib/api/policy";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import { useAuthStore } from "@/lib/store/auth";
import {AddMarksRequest} from "@/lib/types/marks";
import {EnrollStudentRequest} from "@/lib/types/courses";

export function useTACourse() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setTaData = useCourseDetailStore((s) => s.setTAData);
    const hasFetchedInSession = useCourseDetailStore((s) => s.hasFetchedTADataInSession);
    const setHasFetchedInSession = useCourseDetailStore((s) => s.setHasFetchedTADataInSession);
    const user = useAuthStore((s) => s.user);
    
    const AddMarks = useCallback(async (courseId: number, assessment_id: number, marksData: AddMarksRequest) => {
        if (!user?.id) {
            setError("User not found");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await MarksApi.AddMarks(courseId, assessment_id, marksData);
            return response;
        } catch (err: any) {
            const errorMessage = err?.message || "Failed to add marks";
            setError(errorMessage);
            console.error("Error adding marks:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const EnrollStudent = useCallback(async (courseId: number, EnrollStudentData: EnrollStudentRequest) => {
        if (!user?.id) {
            setError("User not found");
            return;
        };

        try {
            const response = await CoursesApi.EnrollStudent(courseId, EnrollStudentData);
            return response;
        } catch (err: any) {
            const errorMessage = err?.message || "Failed to enroll student";
            setError(errorMessage);
            console.error("Error enrolling student:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const UnEnrollStudent = useCallback(async (courseId: number, student_id: number) => {
        if (!user?.id) {
            setError("User not found");
            return;
        }

        setLoading(true);
        setError(null);

        try {

            const response = await CoursesApi.UnEnrollStudent(courseId, student_id);
            return response;

        } catch (err: any) {

            const errorMessage = err?.message || "Failed to unenroll student";
            setError(errorMessage);
            console.error("Error unenrolling student:", err);
            throw err;

        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const GetMarksOfAssessment = useCallback(async (courseId: number, assessment_id: number) => {
        
        if (hasFetchedInSession) {
            return useCourseDetailStore.getState().taData;
        }

        if (!user?.id) {
            setError("User not found");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const marksData = await MarksApi.GetAllMarks(courseId, assessment_id);
            const marksList = Array.isArray(marksData) ? marksData : (marksData as any)?.marks || [];
            console.log("Fetched TA marks data:", marksList);
            // setTaData({
            //     marks: marksList,
            // });
            setHasFetchedInSession(true);
            return marksData;
        } catch (err: any) {
            const errorMessage = err?.message || "Failed to fetch marks for assessment";
            setError(errorMessage);
            console.error("Error fetching marks for assessment:", err);
            throw err;
        } finally {
            setLoading(false);
        }
        
    }, [user?.id, hasFetchedInSession, setHasFetchedInSession]);

    const DeleteStudentMarks = useCallback(async (courseId: number, assessment_id: number, student_id: number) => {
        if (!user?.id) {
            setError("User not found");
            return;
        }

        setLoading(true);
        setError(null);

        try {

            const response = await MarksApi.DeleteMarks(courseId, assessment_id, student_id);
            return response;
        } catch (err: any) {
            const errorMessage = err?.message || "Failed to delete student marks";
            setError(errorMessage);
            console.error("Error deleting student marks:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const PublishMarks = useCallback(async (courseId: number, assessment_id: number) => {
        if (!user?.id) {
            setError("User not found");
            return;
        }

        setLoading(true);
        setError(null);

        try {

            const response = await MarksApi.PublishMarks(courseId, assessment_id);
            return response;

        } catch (err: any) {
            const errorMessage = err?.message || "Failed to publish marks";
            setError(errorMessage);
            console.error("Error publishing marks:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const UnpublishMarks = useCallback(async (courseId: number, assessment_id: number) => {
        if (!user?.id) {
            setError("User not found");
            return;
        }

        setLoading(true);
        setError(null);

        try {

            const response = await MarksApi.UnpublishMarks(courseId, assessment_id);
            return response;

        } catch (err: any) {
            const errorMessage = err?.message || "Failed to unpublish marks";
            setError(errorMessage);
            console.error("Error unpublishing marks:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const GetAllAssessments = useCallback(async (courseId: number) => {
        if (!user?.id) {
            setError("User not found");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await MarksApi.GetAllAssessments(courseId);
            const assessmentsList = Array.isArray(response) ? response : (response as any)?.assessments || [];
            setTaData({
                assessments: assessmentsList,
            })

            return assessmentsList;
        } catch (err: any) {
            const errorMessage = err?.message || "Failed to fetch assessments";
            setError(errorMessage);
            console.error("Error fetching assessments:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const GetAllPolicy = useCallback(async (courseId: number) => {
        if (!user?.id) {
            setError("User not found");
            return;
        }

        setLoading(true);
        setError(null);

        try {

            const response = await PolicyApi.GetAllPolicy(courseId);
            const policyList = Array.isArray(response) ? response : (response as any)?.policies || [];
            return policyList;
        } catch (err: any) {
            const errorMessage = err?.message || "Failed to fetch policies";
            setError(errorMessage);
            console.error("Error fetching policies:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const GetPolicyById = useCallback(async (courseId: number, policy_id: number) => {
        if (!user?.id) {
            setError("User not found");
            return;
        }

        setLoading(true);
        setError(null);

        try {

            const response = await PolicyApi.GetPolicyById(courseId, policy_id);
            return response;
        } catch (err: any) {
            const errorMessage = err?.message || "Failed to fetch policy";
            setError(errorMessage);
            console.error("Error fetching policy:", err);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, [user?.id]);

    const GetTotalScores = useCallback(async (courseId: number) => {
        if (!user?.id) {
            setError("User not found");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await PolicyApi.GetTotalOfAllStudents(courseId);
            const MarksList = Array.isArray(response) ? response : (response as any)?.marks || [];
            return MarksList;
        } catch (err: any) {
            const errorMessage = err?.message || "Failed to fetch total scores";
            setError(errorMessage);
            console.error("Error fetching total scores:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    return {
        AddMarks,
        EnrollStudent,
        UnEnrollStudent,
        GetMarksOfAssessment,
        DeleteStudentMarks,
        PublishMarks,
        UnpublishMarks,
        GetAllAssessments,
        GetAllPolicy,
        GetPolicyById,
        GetTotalScores,
        loading,
        error,
    };
}
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GradeSheet from "@/components/ui/GradeSheet";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import { GradeSheetHeader } from "@/components/ui/GradeSheetHeader";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useCourseManagement } from "@/hooks/useCourseManagement";

const getAssessmentTypeLabel = (typeId: number): string => {
  const types: { [key: number]: string } = {
    1: "Assignment",
    2: "Quiz",
    3: "Midsem",
    4: "EndSem",
    5: "Project",
    6: "Lab",
    7: "Attendance",
  };
  return types[typeId] || `Type ${typeId}`;
};

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const assessmentId = Number(params.assessmentid);
  const [isFetchingMarks, setIsFetchingMarks] = useState(false);
  const [isFetchingRoles, setIsFetchingRoles] = useState(false);
  const [isFetchingAssessments, setIsFetchingAssessments] = useState(false);

  const [isAssessmentsFetched, setIsAssessmentsFetched] = useState(false);
  const [isRolesFetched, setIsRolesFetched] = useState(false);
  const [isMarksFetched, setIsMarksFetched] = useState(false);

  const [mergedData, setMergedData] = useState<Array<{
    student_id: number;
    email: string | null;
    marks_obtained: number | null;
  }>>([]);
  
  const { role, course, assessment, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['ta'],
    courseId,
    assessmentId,
  });

  const {loading: managementLoading, getmarksofassessment, fetchCourseRoles, fetchAllAssessments} = useCourseManagement(role || 'ta');

  useEffect(() => {
    if (!isLoading && hasAccess && !isFetchingAssessments) {  
      const fetchAssessments = async () => {
        setIsFetchingAssessments(true);
        try {
          await fetchAllAssessments(courseId);
          setIsAssessmentsFetched(true);
        }
        catch (error) {
          if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
            console.error("Error fetching assessments:", error);
          }
        } finally {
          setIsFetchingAssessments(false);
        }
      }
      fetchAssessments();
    };
  }, [isLoading, courseId, role]);

  const currentAssessment = useCourseDetailStore((s) => s.currentAssessment);
  const taData = useCourseDetailStore((s) => s.taData);

  useEffect(() => {
    if (!isLoading && hasAccess && !isFetchingRoles && isAssessmentsFetched) {  
      const fetchRoles = async () => {
        setIsFetchingRoles(true);
        try {
          await fetchCourseRoles(courseId);
          setIsRolesFetched(true);
        }
        catch (error) {
          if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
            console.error("Error fetching course roles:", error);
          }
        } finally {
          setIsFetchingRoles(false);
        }
      }
      fetchRoles();
    };
  }, [isLoading, courseId, role, isAssessmentsFetched]);

    useEffect(() => {
    const fetchMarks = async () => {
      if (!isLoading && hasAccess && !isFetchingMarks && isAssessmentsFetched && isRolesFetched) {
        setIsFetchingMarks(true);
        try {
          await getmarksofassessment(courseId, assessmentId);
          setIsMarksFetched(true);
        } catch (error) {
          if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
            console.error("Error fetching marks data:", error);
          }
        } finally {
          setIsFetchingMarks(false);
        }
      }
    };

    fetchMarks();
  }, [isLoading, role, courseId, assessmentId, isAssessmentsFetched, isRolesFetched]);

  useEffect(() => {
    if (taData?.assessmentMarks && taData.assessments) {
      const marksData = taData.assessmentMarks[assessmentId] || [];
      const merged = taData.CourseRoles?.students.map((student) => {
        const markEntry = marksData.find(m => m.student_id === student.user_id);
        return {
          student_id: student.user_id,
          email: student.email || null,
          marks_obtained: markEntry ? markEntry.marks_obtained : null,
        };
      }) || [];
      setMergedData(merged);
    }
  }, [taData, assessmentId]);

  if (isLoading || !role) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (role !== 'ta') {
    return null;
  }

  // Show loading while fetching assessments or if current assessment is not available yet
  if (isFetchingAssessments || !currentAssessment) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const isLoadingData = managementLoading || isFetchingMarks || isFetchingRoles || isFetchingAssessments;

  const columns = [
    { header: "Student ID", key: "student_id"},
    { header: "Email", key: "email"},
    { header: "Marks Obtained", key: "marks_obtained", editable: true },
  ];

  const handleBackClick = () => {
    router.push(`/c/${courseId}/g`);
  };

  const formattedDate = currentAssessment 
    ? new Date(currentAssessment.assessment_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="p-6 h-[calc(100vh-48px)] overflow-y-auto">
      <GradeSheetHeader  
        handleBackClick={handleBackClick}
        currentAssessment={currentAssessment}
        isLoadingData={isLoadingData}
        getAssessmentTypeLabel={getAssessmentTypeLabel}
        formattedDate={formattedDate}
      />
      {/* Grade Sheet */}
      <GradeSheet columns={columns} data={mergedData} />
    </div>
  );
}
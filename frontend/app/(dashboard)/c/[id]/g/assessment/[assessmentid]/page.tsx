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
  
  const { role, course, assessment, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['ta'],
    courseId,
    assessmentId,
  });

  const currentAssessment = useCourseDetailStore((s) => s.currentAssessment);
  const taData = useCourseDetailStore((s) => s.taData);
  const {loading: managementLoading, getmarksofassessment, fetchCourseRoles} = useCourseManagement(role || 'ta');



  useEffect(() => {
    const fetchRoles = async () => {
      if (!isLoading && hasAccess && !isFetchingRoles) {
        setIsFetchingRoles(true);
        try {
          await fetchCourseRoles(courseId);
        }
        catch (error) {
          if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
            console.error("Error fetching course roles:", error);
          }
        } finally {
          setIsFetchingRoles(false);
        }
      }
    };

    fetchRoles();
  }, [role, isLoading, courseId]);


  const exmapleMarksData = [
    {student_id: 2411004, marks_obtained: 85, recorded_by_id: 101, updated_at: new Date()},
    {student_id: 2411005, marks_obtained: 90, recorded_by_id: 102, updated_at: new Date()},
  ];

  const mergedData = (taData?.CourseRoles?.students || []).map(student => {
    const marksRecord = exmapleMarksData.find(mark => mark.student_id === student.user_id);
    return {
      student_id: student.user_id,
      email: student.email,
      marks_obtained: marksRecord ? marksRecord.marks_obtained : null,
    };
  });


  useEffect(() => {
    const fetchMarks = async () => {
      if (!isLoading && hasAccess && !isFetchingMarks) {
        setIsFetchingMarks(true);
        try {
          await getmarksofassessment(courseId, assessmentId);
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
  }, [role, isLoading, courseId, assessmentId]);

  if (isLoading || !currentAssessment || !role) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (role !== 'ta') {
    return null;
  }

  const isLoadingData = managementLoading || isFetchingMarks;

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
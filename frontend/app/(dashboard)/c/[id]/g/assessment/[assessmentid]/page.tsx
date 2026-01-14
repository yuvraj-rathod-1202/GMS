"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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

  // Local state for tracking changes
  const [changedMarks, setChangedMarks] = useState<Map<number, number>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { role, course, assessment, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['ta'],
    courseId,
    assessmentId,
  });

  const {loading: managementLoading, getmarksofassessment, fetchCourseRoles, fetchAllAssessments, saveMarks} = useCourseManagement(role || 'ta');

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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

  const isLoadingData = managementLoading || isFetchingMarks || isFetchingRoles || isFetchingAssessments;

  // Handle local mark changes
  const handleMarkChange = useCallback((newValue: any, oldValue: any, row: any) => {
    const newMark = Number(newValue);
    // basic validation
    if (isNaN(newMark) || newMark > currentAssessment?.max_marks) return; // Allow 0
    
    setChangedMarks(prev => {
      const next = new Map(prev);
      next.set(row.student_id, newMark);
      return next;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Merge server data with local changes
  const displayData = useMemo(() => {
    return mergedData.map(row => {
      if (changedMarks.has(row.student_id)) {
        return { ...row, marks_obtained: changedMarks.get(row.student_id)! };
      }
      return row;
    });
  }, [mergedData, changedMarks]);

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

  const handleSave = async () => {
    if (!hasUnsavedChanges || isSaving) return;
    
    setIsSaving(true);
    try {
      const marksPayload = Array.from(changedMarks.entries()).map(([student_id, marks_obtained]) => ({
        student_id,
        marks_obtained
      }));
      
      await saveMarks(courseId, assessmentId, { marks: marksPayload });
      await getmarksofassessment(courseId, assessmentId, true);
      // Clear local state after successful save
      setChangedMarks(new Map());
      setHasUnsavedChanges(false);
      
      // Refresh data
      await getmarksofassessment(courseId, assessmentId);
    } catch (error) {
      console.error("Failed to save marks:", error);
      // alert("Failed to save marks. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard your changes?")) {
      setChangedMarks(new Map());
      setHasUnsavedChanges(false);
    }
  };

  const columns = [
    { header: "Student ID", key: "student_id"},
    { header: "Email", key: "email"},
    { header: "Marks Obtained", key: "marks_obtained", editable: true, onEditComplete: handleMarkChange },
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
      <GradeSheet columns={columns} data={displayData} />

      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6 bg-white p-4 shadow-lg rounded-lg border border-yellow-200 flex gap-4 items-center animate-in slide-in-from-bottom-5 z-50">
          <span className="text-sm font-medium text-amber-700">You have unsaved changes</span>
          <div className="flex gap-2">
            <button 
              onClick={handleDiscard}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isSaving}
            >
              Discard
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
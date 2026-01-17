"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useCourseManagement } from "@/hooks/useCourseManagement";
import InstructorNavbar from "../Course/InstructorNavbar";
import InstructorAssessmentCard from "./InstructorAssessmentCard";
import AssessmentDialog, { AssessmentFormData } from "./AssessmentDialog";
import { MarksApi } from "@/lib/api/marks";
import { AssessmentDBObject } from "@/lib/types/assessments";
import Link from "next/link";

export default function InstructorGradePage() {
  const params = useParams();
  const courseId = Number(params.id);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentDBObject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { role, course, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['instructor'],
    courseId,
  });

  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const instructorData = useCourseDetailStore((s) => s.instructorData);
  const {loading: managementLoading, fetchAllAssessments} = useCourseManagement(role || 'instructor');

  // Fetch assessments and course roles when TA role is confirmed
  useEffect(() => {
    if (!isLoading && hasAccess && !isFetchingData) {
      const fetchData = async () => {
        setIsFetchingData(true);
        try {
          await fetchAllAssessments(courseId);
        } catch (error) {
          if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
            console.error("Error fetching TA data:", error);
          }
        } finally {
          setIsFetchingData(false);
        }
      }
      fetchData();
    };
  }, [role, isLoading, courseId]);

  if (isLoading || !currentCourse || !role) {
    return (
      <div className="flex justify-center items-center h-full p-10">
        <div className="text-gray-900 text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (role !== 'instructor') {
    return null;
  }

  const isLoadingData = managementLoading || isFetchingData;

  const handlePublishToggle = async () => {
    // Refresh assessments after publish/unpublish
    try {
      await fetchAllAssessments(courseId, true);
    } catch (error) {
      if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
        console.error("Error refreshing assessments:", error);
      }
    }
  };

  const handleCreateAssessment = () => {
    setEditingAssessment(null);
    setShowAssessmentDialog(true);
  };

  const handleEditAssessment = (assessment: AssessmentDBObject) => {
    setEditingAssessment(assessment);
    setShowAssessmentDialog(true);
  };

  const handleSubmitAssessment = async (data: AssessmentFormData) => {
    setIsSubmitting(true);
    try {
      const assessmentData = {
        ...data,
        assessment_date: new Date(data.assessment_date),
      };

      if (editingAssessment) {
        // Update existing assessment
        await MarksApi.UpdateAssessment(courseId, editingAssessment.id, assessmentData);
        alert("Assessment updated successfully!");
      } else {
        // Create new assessment
        await MarksApi.CreateAssessment(courseId, assessmentData);
        alert("Assessment created successfully!");
      }

      // Refresh assessments list
      await fetchAllAssessments(courseId, true);
      setShowAssessmentDialog(false);
    } catch (error: any) {
      console.error("Error submitting assessment:", error);
      alert(error?.message || "Failed to save assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <InstructorNavbar />
      <div className="max-h-[calc(100vh-96px)] overflow-y-auto w-full md:max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="space-y-6 md:space-y-8">
          {/* Page Header */}
          <div className="flex flex-row justify-between items-center mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Grades</h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">
                View and manage student grades for assessments in this course.
              </p>
            </div>
            <div>
              <Link href={`/c/${courseId}/gb`}><button className="flex cursor-pointer flex-row items-center gap-2 rounded-lg bg-gray-300 p-2 hover:bg-gray-400">Open Grade Sheet</button></Link>
            </div>
          </div>

          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Course Overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
                  Total Students
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {currentCourse?.total_students || 0}
                </div>
              </div>
              <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
                  Total Assessments
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {instructorData?.assessments?.length || 0}
                </div>
              </div>
              <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
                  Published Assessments
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {instructorData?.assessments?.filter(a => a.is_marks_published).length || 0}
                </div>
              </div>
              <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
                  Unpublished Assessments
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {instructorData?.assessments?.filter(a => !a.is_marks_published).length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Assessments Section */}
          <div>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Assessments</h2>
              <button
                onClick={handleCreateAssessment}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Assessment
              </button>
            </div>
            {isLoadingData ? (
              <div className="border border-gray-300 rounded-2xl bg-white px-4 sm:px-6 py-6 sm:py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
                <div className="animate-pulse">Loading assessments...</div>
              </div>
            ) : !instructorData?.assessments || instructorData.assessments.length === 0 ? (
              <div className="border border-gray-300 rounded-2xl bg-white px-4 sm:px-6 py-6 sm:py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
                No assessments available yet
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                {instructorData.assessments.map((assessment) => (
                  <InstructorAssessmentCard
                    key={assessment.id}
                    assessment={assessment}
                    onClick={() => {}}
                    onPublishToggle={handlePublishToggle}
                    onEdit={() => handleEditAssessment(assessment)}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Assessment Dialog */}
      <AssessmentDialog
        isOpen={showAssessmentDialog}
        onClose={() => setShowAssessmentDialog(false)}
        onSubmit={handleSubmitAssessment}
        assessment={editingAssessment}
        isLoading={isSubmitting}
      />
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GradeSheet from '@/components/ui/GradeSheet';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import { GradeSheetHeader } from '@/components/ui/GradeSheetHeader';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useCourseManagement } from '@/hooks/useCourseManagement';
import GradeSheetButtons from '@/components/ui/GradeSheetButtons';
import { useTACourse } from '@/hooks/useTACourse';
import UnenrolledStudentsDialog from '@/components/ui/UnenrolledStudentsDialog';
import * as XLSX from 'xlsx';

const getAssessmentTypeLabel = (typeId: number): string => {
  const types: { [key: number]: string } = {
    1: 'Quiz',
    2: 'Assignment',
    3: 'Midsem',
    4: 'EndSem',
    5: 'Project',
    6: 'Attendance',
    7: 'Lab',
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

  const [mergedData, setMergedData] = useState<
    Array<{
      student_id: number;
      email: string | null;
      marks_obtained: number | null;
    }>
  >([]);

  // Local state for tracking changes
  const [changedMarks, setChangedMarks] = useState<Map<number, number>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Bulk upload state
  const [unenrolledStudents, setUnenrolledStudents] = useState<
    Array<{ student_id: number; email: string; marks_obtained: number }>
  >([]);
  const [showUnenrolledDialog, setShowUnenrolledDialog] = useState(false);
  const [pendingMarksData, setPendingMarksData] = useState<
    Array<{ student_id: number; email: string; marks_obtained: number }>
  >([]);
  const [isProcessingEnrollment, setIsProcessingEnrollment] = useState(false);

  const { role, course, assessment, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['ta'],
    courseId,
    assessmentId,
  });

  const {
    loading: managementLoading,
    getmarksofassessment,
    fetchCourseRoles,
    fetchAllAssessments,
    saveMarks,
    BulkEnrollStudent,
  } = useCourseManagement(role || 'ta');
  const { PublishMarks, UnpublishMarks } = useTACourse();

  useEffect(() => {
    if (!isLoading && hasAccess && !isFetchingAssessments) {
      const fetchAssessments = async () => {
        setIsFetchingAssessments(true);
        try {
          await fetchAllAssessments(courseId);
          setIsAssessmentsFetched(true);
        } catch (error) {
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.error('Error fetching assessments:', error);
          }
        } finally {
          setIsFetchingAssessments(false);
        }
      };
      fetchAssessments();
    }
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
        } catch (error) {
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.error('Error fetching course roles:', error);
          }
        } finally {
          setIsFetchingRoles(false);
        }
      };
      fetchRoles();
    }
  }, [isLoading, courseId, role, isAssessmentsFetched]);

  useEffect(() => {
    const fetchMarks = async () => {
      if (!isLoading && hasAccess && !isFetchingMarks && isAssessmentsFetched && isRolesFetched) {
        setIsFetchingMarks(true);
        try {
          await getmarksofassessment(courseId, assessmentId);
          setIsMarksFetched(true);
        } catch (error) {
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.error('Error fetching marks data:', error);
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
      const merged =
        taData.CourseRoles?.students.map((student) => {
          const markEntry = marksData.find((m) => m.student_id === student.user_id);
          return {
            student_id: student.user_id,
            email: student.email || null,
            marks_obtained: markEntry ? markEntry.marks_obtained : null,
          };
        }) || [];
      setMergedData(merged);
    }
  }, [taData, assessmentId]);

  const isLoadingData =
    managementLoading || isFetchingMarks || isFetchingRoles || isFetchingAssessments;

  // Handle local mark changes
  const handleMarkChange = useCallback((newValue: any, oldValue: any, row: any) => {
    const newMark = Number(newValue);
    if (isNaN(newMark) || (currentAssessment && newMark > currentAssessment?.max_marks)) return;

    setChangedMarks((prev) => {
      const next = new Map(prev);
      next.set(row.student_id, newMark);
      return next;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Merge server data with local changes
  const displayData = useMemo(() => {
    return mergedData.map((row) => {
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
      const marksPayload = Array.from(changedMarks.entries()).map(
        ([student_id, marks_obtained]) => ({
          student_id,
          marks_obtained,
        })
      );

      await saveMarks(courseId, assessmentId, { marks: marksPayload });
      await getmarksofassessment(courseId, assessmentId, true);
      // Clear local state after successful save
      setChangedMarks(new Map());
      setHasUnsavedChanges(false);

      // Refresh data
      await getmarksofassessment(courseId, assessmentId);
    } catch (error) {
      console.error('Failed to save marks:', error);
      // alert("Failed to save marks. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    const action = assessment.is_marks_published ? 'unpublish' : 'publish';
    const message = assessment.is_marks_published
      ? `Are you sure you want to unpublish marks for "${assessment.name}"? Students will no longer be able to view their marks.`
      : `Are you sure you want to publish marks for "${assessment.name}"? Students will be able to view their marks.`;

    const confirmed = window.confirm(message);

    if (!confirmed) {
      return;
    }

    setIsPublishing(true);

    try {
      if (assessment.is_marks_published) {
        await UnpublishMarks(assessment.course_id, assessment.id);
      } else {
        await PublishMarks(assessment.course_id, assessment.id);
      }
      // Refresh assessment data
      await fetchAllAssessments(courseId, true);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error toggling publish status:', error);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard your changes?')) {
      setChangedMarks(new Map());
      setHasUnsavedChanges(false);
    }
  };

  const parseCSV = (
    text: string
  ): Array<{ student_id: number; email: string; marks_obtained: number }> => {
    const lines = text.trim().split('\n');
    const data: Array<{ student_id: number; email: string; marks_obtained: number }> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map((v) => v.trim());
      if (values.length >= 3) {
        const studentId = parseInt(values[0]);
        const email = values[1];
        const marks = parseFloat(values[2]);

        if (!isNaN(studentId) && !isNaN(marks)) {
          data.push({
            student_id: studentId,
            email: email,
            marks_obtained: marks,
          });
        }
      }
    }

    return data;
  };

  const parseExcel = async (
    file: File
  ): Promise<Array<{ student_id: number; email: string; marks_obtained: number }>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

          const parsedData: Array<{ student_id: number; email: string; marks_obtained: number }> =
            [];

          // Skip header row (index 0)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length < 3) continue;

            const studentId = parseInt(String(row[0]));
            const email = String(row[1]);
            const marks = parseFloat(String(row[2]));

            if (!isNaN(studentId) && !isNaN(marks)) {
              parsedData.push({
                student_id: studentId,
                email: email,
                marks_obtained: marks,
              });
            }
          }

          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const handleBulkUpload = async (file: File) => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }

      let parsedData: Array<{ student_id: number; email: string; marks_obtained: number }> = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        parsedData = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsedData = await parseExcel(file);
      } else {
        alert('Only CSV and Excel files are supported.');
        return;
      }

      if (parsedData.length === 0) {
        alert('No valid data found in file. Please check the format.');
        return;
      }

      if (currentAssessment?.max_marks) {
        const invalidMarks = parsedData.filter(
          (d) => d.marks_obtained > currentAssessment.max_marks
        );
        if (invalidMarks.length > 0) {
          alert(
            `${invalidMarks.length} entries have marks exceeding maximum (${currentAssessment.max_marks}). Please correct the file.`
          );
          return;
        }
      }

      const enrolledIds = new Set(mergedData.map((s) => s.student_id));
      const enrolled = parsedData.filter((d) => enrolledIds.has(d.student_id));
      const unenrolled = parsedData.filter((d) => !enrolledIds.has(d.student_id));

      setPendingMarksData(parsedData);

      if (unenrolled.length > 0) {
        setUnenrolledStudents(unenrolled);
        setShowUnenrolledDialog(true);
      } else {
        await importMarks(enrolled);
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      alert('Failed to process file. Please check the format and try again.');
    }
  };

  const importMarks = async (
    marksData: Array<{ student_id: number; email: string; marks_obtained: number }>
  ) => {
    try {
      const newChanges = new Map(changedMarks);
      marksData.forEach((mark) => {
        newChanges.set(mark.student_id, mark.marks_obtained);
      });

      setChangedMarks(newChanges);
      setHasUnsavedChanges(true);

      alert(
        `Successfully imported marks for ${marksData.length} student${marksData.length > 1 ? 's' : ''}. Click "Save Marks" to apply changes.`
      );
    } catch (error) {
      console.error('Import marks error:', error);
      alert('Failed to import marks. Please try again.');
    }
  };

  const handleEnrollAndImport = async (selected: { student_id: number; email: string }[]) => {
    setIsProcessingEnrollment(true);
    try {
      const enrollData = selected.map((s) => ({ student_id: s.student_id, email: s.email }));
      await BulkEnrollStudent(courseId, enrollData);
      await fetchCourseRoles(courseId, true);

      const enrolledIds = new Set(mergedData.map((s) => s.student_id));
      const toImport = pendingMarksData.filter(
        (d) => enrolledIds.has(d.student_id) || selected.some((s) => s.student_id === d.student_id)
      );

      setShowUnenrolledDialog(false);
      await importMarks(toImport);

      await fetchCourseRoles(courseId);
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Failed to enroll students. Please try again.');
    } finally {
      setIsProcessingEnrollment(false);
    }
  };

  const handleSkipUnenrolled = async () => {
    const enrolledIds = new Set(mergedData.map((s) => s.student_id));
    const toImport = pendingMarksData.filter((d) => enrolledIds.has(d.student_id));

    setShowUnenrolledDialog(false);
    await importMarks(toImport);
  };

  const columns = [
    { header: 'Student ID', key: 'student_id' },
    { header: 'Email', key: 'email' },
    {
      header: 'Marks Obtained',
      key: 'marks_obtained',
      editable: true,
      onEditComplete: handleMarkChange,
    },
  ];

  const handleBackClick = () => {
    router.push(`/c/${courseId}/g`);
  };

  const formattedDate = currentAssessment
    ? new Date(currentAssessment.assessment_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="p-6 h-[calc(100vh-48px)] overflow-y-auto">
      <GradeSheetHeader
        handleBackClick={handleBackClick}
        currentAssessment={currentAssessment}
        isLoadingData={isLoadingData}
        getAssessmentTypeLabel={getAssessmentTypeLabel}
        formattedDate={formattedDate}
      />
      <GradeSheetButtons
        handleSave={handleSave}
        handleDiscard={handleDiscard}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        assessment={currentAssessment}
        handlePublishToggle={handlePublishToggle}
        isPublishing={isPublishing}
        handleBulkUpload={handleBulkUpload}
      />
      <GradeSheet
        columns={columns}
        data={displayData}
        max_marks={currentAssessment ? currentAssessment.max_marks : undefined}
      />

      {/* Unenrolled Students Dialog */}
      {showUnenrolledDialog && (
        <UnenrolledStudentsDialog
          students={unenrolledStudents}
          onEnrollAll={() =>
            handleEnrollAndImport(
              unenrolledStudents.map((s) => ({ student_id: s.student_id, email: s.email }))
            )
          }
          onSkipAll={handleSkipUnenrolled}
          onSelectiveEnroll={handleEnrollAndImport}
          onClose={() => setShowUnenrolledDialog(false)}
          isProcessing={isProcessingEnrollment}
        />
      )}
    </div>
  );
}

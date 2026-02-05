'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InstructorCourseData, useCourseDetailStore } from '@/lib/store/courseDetail';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useCourseManagement } from '@/hooks/useCourseManagement';
import { useTACourse } from '@/hooks/useTACourse';
import UnenrolledStudentsDialog from '@/components/ui/UnenrolledStudentsDialog';
import BulkUploadDialog from '@/components/ui/BulkUploadDialog';
import IGradeSheet from '@/components/ui/IGradeSheet';
import { IGradeSheetButtons } from '@/components/Grade/IGradeSheetButtons';
import * as XLSX from 'xlsx';
import { BiArrowBack, BiDotsVerticalRounded, BiHide, BiShow, BiSliderAlt } from 'react-icons/bi';
import { exportGradeBookToExcel } from '@/components/Grade/ExportGradeBook';

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

export default function GradeSheetView() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const [assessmentId, setAssessmentId] = useState<number>(Number(params.assessmentId));
  const [isFetchingMarks, setIsFetchingMarks] = useState(false);
  const [isFetchingRoles, setIsFetchingRoles] = useState(false);
  const [isFetchingAssessments, setIsFetchingAssessments] = useState(false);
  const [isFetchingPolicy, setIsFetchingPolicy] = useState(false);
  const [isFetchingTotalMarks, setIsFetchingTotalMarks] = useState(false);
  const [isFetchingStudentPolicyMap, setIsFetchingStudentPolicyMap] = useState(false);

  const [isAssessmentsFetched, setIsAssessmentsFetched] = useState(false);
  const [isRolesFetched, setIsRolesFetched] = useState(false);
  const [isMarksFetched, setIsMarksFetched] = useState(false);
  const [isPolicyFetched, setIsPolicyFetched] = useState(false);
  const [isTotalMarksFetched, setIsTotalMarksFetched] = useState(false);
  const [isStudentPolicyMapFetched, setIsStudentPolicyMapFetched] = useState(false);

  const [mergedData, setMergedData] = useState<
    Array<{
      student_id: number;
      email: string | null;
      assessment_id?: number;
      marks_obtained: number | null;
    }>
  >([]);

  // Local state for tracking changes
  const [changedMarks, setChangedMarks] = useState<Map<[number, number | undefined], number>>(
    new Map()
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isUpdatingPolicy, setIsUpdatingPolicy] = useState<number | null>(null);

  // Bulk upload state
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [selectedAssessmentForUpload, setSelectedAssessmentForUpload] = useState<any>(null);
  const [unenrolledStudents, setUnenrolledStudents] = useState<
    Array<{ student_id: number; email: string; marks_obtained: number }>
  >([]);
  const [showUnenrolledDialog, setShowUnenrolledDialog] = useState(false);
  const [pendingMarksData, setPendingMarksData] = useState<
    Array<{ student_id: number; email: string; marks_obtained: number }>
  >([]);
  const [isProcessingEnrollment, setIsProcessingEnrollment] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportingSheet, setIsExportingSheet] = useState(false);

  const { role, course, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['instructor'],
    courseId,
    assessmentId,
  });

  const {
    loading: managementLoading,
    getallassessmentmarks,
    getmarksofassessment,
    fetchCourseRoles,
    fetchAllAssessments,
    saveMarks,
    BulkEnrollStudent,
    fetchAllPolicy,
    fetchTotalMarks,
    fetchStudentPolicyMap,
    RecalculateTotal,
    updateStudentPolicy,
  } = useCourseManagement(role || 'instructor');
  const { PublishMarks, UnpublishMarks } = useTACourse();
  const instructorData = useCourseDetailStore((s) => s.instructorData);

  // fetch all the assessments
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

  // Warn user before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // For Next.js route changes
    const handleRouteChange = (url: string) => {
      if (hasUnsavedChanges) {
        if (
          !window.confirm(
            'You have unsaved marks. Save them before leaving or your changes will be lost. Are you sure you want to leave?'
          )
        ) {
          throw 'Route change aborted by user due to unsaved marks.';
        }
      }
    };
    // @ts-ignore
    if (router.events) router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // @ts-ignore
      if (router.events) router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [hasUnsavedChanges]);

  // // fetch courses roles
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

  // // fetch all assessment marks
  useEffect(() => {
    const fetchMarks = async () => {
      if (!isLoading && hasAccess && !isFetchingMarks && isAssessmentsFetched && isRolesFetched) {
        setIsFetchingMarks(true);
        try {
          await getallassessmentmarks(courseId);
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

  // fetch all grading policies
  useEffect(() => {
    const fetchPolicy = async () => {
      if (
        !isLoading &&
        hasAccess &&
        !isFetchingPolicy &&
        isAssessmentsFetched &&
        isRolesFetched &&
        isMarksFetched
      ) {
        setIsFetchingPolicy(true);
        try {
          await fetchAllPolicy(courseId);
          setIsPolicyFetched(true);
        } catch (error) {
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.error('Error fetching policies:', error);
          }
        } finally {
          setIsFetchingPolicy(false);
        }
      }
    };
    fetchPolicy();
  }, [
    isLoading,
    hasAccess,
    isFetchingPolicy,
    courseId,
    isAssessmentsFetched,
    isRolesFetched,
    isMarksFetched,
  ]);

  // // fetch total marks
  useEffect(() => {
    const TotalMarks = async () => {
      if (
        !isLoading &&
        hasAccess &&
        !isFetchingTotalMarks &&
        !isTotalMarksFetched &&
        isAssessmentsFetched &&
        isRolesFetched &&
        isMarksFetched &&
        isPolicyFetched
      ) {
        setIsFetchingTotalMarks(true);
        try {
          await fetchTotalMarks(courseId);
          setIsTotalMarksFetched(true);
        } catch (error) {
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.error('Error fetching total marks:', error);
          }
        } finally {
          setIsFetchingTotalMarks(false);
        }
      }
    };
    TotalMarks();
  }, [
    isLoading,
    hasAccess,
    courseId,
    isAssessmentsFetched,
    isRolesFetched,
    isMarksFetched,
    isPolicyFetched,
    isTotalMarksFetched,
  ]);

  // // fetch student policy map
  useEffect(() => {
    const StudentPolicyMap = async () => {
      if (
        !isLoading &&
        hasAccess &&
        !isFetchingStudentPolicyMap &&
        !isStudentPolicyMapFetched &&
        isAssessmentsFetched &&
        isRolesFetched &&
        isMarksFetched &&
        isPolicyFetched &&
        isTotalMarksFetched
      ) {
        setIsFetchingStudentPolicyMap(true);
        try {
          await fetchStudentPolicyMap(courseId);
          setIsStudentPolicyMapFetched(true);
        } catch (error) {
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.error('Error fetching student policy map:', error);
          }
        } finally {
          setIsFetchingStudentPolicyMap(false);
        }
      }
    };
    StudentPolicyMap();
  }, [
    isLoading,
    hasAccess,
    courseId,
    isAssessmentsFetched,
    isRolesFetched,
    isMarksFetched,
    isPolicyFetched,
    isTotalMarksFetched,
    isStudentPolicyMapFetched,
  ]);

  useEffect(() => {
    if (instructorData?.assessmentMarks && instructorData.assessments) {
      const merged =
        instructorData.CourseRoles?.students.map((student) => {
          const studentData: any = {
            student_id: student.user_id,
            email: student.email || null,
          };

          // Add marks for each assessment
          instructorData.assessments.forEach((assessment) => {
            const marksData = instructorData.assessmentMarks[assessment.id] || [];
            const markEntry = marksData.find((m) => m.student_id === student.user_id);
            studentData[String(assessment.id)] = markEntry ? markEntry.marks_obtained : null;
          });

          if (instructorData.totalMarks && Array.isArray(instructorData.totalMarks)) {
            const totalMarkEntry = instructorData.totalMarks.find(
              (tm) => tm.student_id === student.user_id
            );
            studentData.total_marks = totalMarkEntry
              ? Number(totalMarkEntry.total_marks.toFixed(2))
              : null;
          } else {
            studentData.total_marks = null;
          }

          // Add policy information
          const assignedPolicyId = instructorData.studentPolicyMap?.[student.user_id];
          const defaultPolicy = instructorData.policies?.find((p) => p.is_default);
          const assignedPolicy = assignedPolicyId
            ? instructorData.policies?.find((p) => p.id === assignedPolicyId)
            : defaultPolicy;
          studentData.policy_id = assignedPolicy?.id || null;
          studentData.policy_name = assignedPolicy?.policy_name || 'Default Policy';

          return studentData;
        }) || [];
      setMergedData(merged);
    }
  }, [instructorData]);

  const isLoadingData =
    managementLoading || isFetchingMarks || isFetchingRoles || isFetchingAssessments;

  // Handle local mark changes
  const handleMarkChange = useCallback((assessmentId: number, maxMarks: number) => {
    return (newValue: any, oldValue: any, row: any) => {
      const newMark = Number(newValue);
      if (newMark === oldValue) return;
      if (isNaN(newMark) || newMark > maxMarks) return;

      setChangedMarks((prev) => {
        const next = new Map(prev);
        next.set([row.student_id, assessmentId], newMark);
        return next;
      });
      setHasUnsavedChanges(true);
    };
  }, []);

  // Handle policy change
  const handlePolicyChange = useCallback(
    async (studentId: number, newPolicyId: number) => {
      setIsUpdatingPolicy(studentId);
      try {
        await updateStudentPolicy(courseId, studentId, newPolicyId);
        // Refresh student policy map and total marks after assignment
        await fetchStudentPolicyMap(courseId, true);
      } catch (error) {
        console.error('Failed to update policy:', error);
        alert('Failed to update policy. Please try again.');
      } finally {
        setIsUpdatingPolicy(null);
      }
    },
    [courseId, updateStudentPolicy, fetchStudentPolicyMap, fetchTotalMarks]
  );

  // Merge server data with local changes
  const displayData = useMemo(() => {
    return mergedData.map((row) => {
      const updatedRow: any = { ...row };

      // Check if there are any changed marks for this student
      changedMarks.forEach((marks, key) => {
        const [studentId, assessmentId] = key;
        if (studentId === row.student_id) {
          updatedRow[String(assessmentId)] = marks;
        }
      });

      return updatedRow;
    });
  }, [mergedData, changedMarks]);

  const changedCellsSet = useMemo(() => {
    const set = new Set<string>();
    changedMarks.forEach((_, key) => {
      const [studentId, assessmentId] = key;
      set.add(`${studentId}-${assessmentId}`);
    });
    return set;
  }, [changedMarks]);

  if (isLoading || !role) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (role !== 'instructor') {
    return null;
  }

  // Show loading while fetching assessments or if current assessment is not available yet
  if (isFetchingAssessments) {
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
        ([[student_id, assessment_id], marks_obtained]) => ({
          student_id,
          assessment_id,
          marks_obtained,
        })
      );

      const GroupedPayload = marksPayload.reduce(
        (acc, curr) => {
          {
            if (!acc[curr.assessment_id!]) {
              acc[curr.assessment_id!] = [];
            }
            acc[curr.assessment_id!].push({
              student_id: curr.student_id,
              marks_obtained: curr.marks_obtained,
            });
            return acc;
          }
        },
        {} as { [key: number]: Array<{ student_id: number; marks_obtained: number }> }
      );

      await Promise.all(
        Object.entries(GroupedPayload).map(([assessment_id, marks]) =>
          saveMarks(courseId, Number(assessment_id), { marks })
        )
      );

      // Small delay to allow backend commit/cache update
      await new Promise((res) => setTimeout(res, 300));

      setChangedMarks(new Map());
      setHasUnsavedChanges(false);

      await getallassessmentmarks(courseId, true);
    } catch (error) {
      alert('Failed to save marks. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async (assessment: any, e: React.MouseEvent<HTMLButtonElement>) => {
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
        // alert(`Marks for "${assessment.name}" unpublished successfully!`);
      } else {
        await PublishMarks(assessment.course_id, assessment.id);
        // alert(`Marks for "${assessment.name}" published successfully!`);
      }
      // Refresh assessment data
      await fetchAllAssessments(courseId, true);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error toggling publish status:', error);
      }
      alert(`Failed to ${action} marks. Please try again.`);
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

  const handleRecalculateTotal = async () => {
    if (
      window.confirm(
        'Are you sure you want to recalculate total marks for all students? This will update the total marks based on the current grading policy.'
      )
    ) {
      setIsRecalculating(true);
      try {
        await RecalculateTotal(courseId);
        alert(
          'Total marks recalculated successfully!. Try refreshing the page after some time to see the updated totals.'
        );
      } catch (error) {
        console.error('Failed to recalculate total marks:', error);
        alert('Failed to recalculate total marks. Please try again.');
      } finally {
        setIsRecalculating(false);
      }
    }
  };

  const handleBulkUpload = async (
    parsedData: Array<{ student_id: number; email: string; marks_obtained: number }>,
    assessmentId: number
  ) => {
    try {
      if (parsedData.length === 0) {
        alert('No valid data found in file. Please check the format.');
        return;
      }

      const assessment = instructorData?.assessments.find((a) => a.id === assessmentId);
      if (assessment?.max_marks) {
        const invalidMarks = parsedData.filter((d) => d.marks_obtained > assessment.max_marks);
        if (invalidMarks.length > 0) {
          alert(
            `${invalidMarks.length} entries have marks exceeding maximum (${assessment.max_marks}). Please correct the file.`
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
        await importMarks(assessmentId, enrolled);
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      alert('Failed to process file. Please check the format and try again.');
    }
  };

  const importMarks = async (
    assessmentId: number,
    marksData: Array<{ student_id: number; email: string; marks_obtained: number }>
  ) => {
    try {
      const newChanges = new Map(changedMarks);
      marksData.forEach((mark) => {
        newChanges.set([mark.student_id, assessmentId], mark.marks_obtained);
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

  const handleEnrollAndImport = async (
    assessmentId: number,
    selected: { student_id: number; email: string }[]
  ) => {
    setIsProcessingEnrollment(true);
    try {
      const enrollData = selected.map((s) => ({ student_id: s.student_id, email: s.email }));
      await BulkEnrollStudent(courseId, enrollData);
      await fetchCourseRoles(courseId, true);

      const toImport = pendingMarksData;

      setShowUnenrolledDialog(false);
      await importMarks(assessmentId, toImport);

      await fetchCourseRoles(courseId);
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Failed to enroll students. Please try again.');
    } finally {
      setIsProcessingEnrollment(false);
    }
  };

  const handleExportGradeBook = async (
    instructorData: InstructorCourseData | null,
    courseCode: string
  ) => {
    if (!instructorData) {
      alert('Instructor data not available. Cannot export grade book.');
      return;
    }
    setIsExportingSheet(true);
    await exportGradeBookToExcel(instructorData, courseCode);
    setIsExportingSheet(false);
  };

  const handleSkipUnenrolled = async (assessmentId: number) => {
    const enrolledIds = new Set(mergedData.map((s) => s.student_id));
    const toImport = pendingMarksData.filter((d) => enrolledIds.has(d.student_id));

    setShowUnenrolledDialog(false);
    await importMarks(assessmentId, toImport);
  };

  const handleGoBack = () => {
    if (changedCellsSet.size > 0 && !confirm('Any unsaved changes will be lost. Are you sure you want to go back?')) {
      return;
    }
    router.back();
  };

  const handleGoPolicy = () => {
    if (changedCellsSet.size > 0 && !confirm('Any unsaved changes will be lost. Are you sure you want to go to grading policy page?')) {
      return;
    }
    router.push(`/c/${courseId}/gp`);
  }

  const assessmentColumns =
    instructorData?.assessments.map((a) => ({
      header: (
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-gray-900 truncate" title={a.name}>
              {a.name}
            </span>
            <div className="relative group">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === a.id ? null : a.id);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
              >
                <BiDotsVerticalRounded />
              </button>
              {openMenuId === a.id && (
                <div className="absolute right-0 top-6 w-40 bg-white border border-gray-200 shadow-xl rounded-lg z-50 overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePublishToggle(a, e);
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    {a.is_marks_published ? <BiHide /> : <BiShow />}
                    {a.is_marks_published ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-gray-500">Max: {a.max_marks}</span>
          </div>
        </div>
      ),
      key: String(a.id),
      width: '150px',
      editable: true,
      onEditComplete: handleMarkChange(a.id, a.max_marks),
      max_marks: a.max_marks,
    })) || [];

  const columns = [
    {
      header: 'Student',
      key: 'student_info',
      width: '250px',
      render: (_: any, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{row.student_id}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Policy',
      key: 'policy_name',
      width: '200px',
      render: (value: any, row: any) => {
        const policies = instructorData?.policies || [];
        const currentPolicyId = row.policy_id;
        const isLoading = isUpdatingPolicy === row.student_id;

        return (
          <div className="relative">
            <select
              value={currentPolicyId || ''}
              onChange={(e) => {
                const newPolicyId = Number(e.target.value);
                if (newPolicyId && newPolicyId !== currentPolicyId) {
                  handlePolicyChange(row.student_id, newPolicyId);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              disabled={isLoading}
              className="w-full bg-transparent border-b border-transparent group-hover:border-gray-300 focus:border-blue-500 text-sm py-1 outline-none cursor-pointer"
            >
              {policies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.policy_name}
                  {policy.is_default ? ' (Default)' : ''}
                </option>
              ))}
            </select>
            {isLoading && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <svg
                  className="animate-spin h-4 w-4 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}
          </div>
        );
      },
    },
    ...assessmentColumns,
    {
      header: 'Total',
      key: 'total_marks',
      width: '100px',
      render: (val: any) => <span className="font-bold text-gray-900">{val}</span>,
    },
  ];

  return (
    <div
      className="flex flex-col bg-gray-50 h-[calc(100vh-48px)] max-h-[calc(100vh-48px)]"
      onClick={() => setOpenMenuId(null)}
    >
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleGoBack()}
            className="text-gray-500 cursor-pointer hover:text-gray-900 transition-colors"
          >
            <BiArrowBack className="text-xl" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Grade Book</h1>
            <p className="text-xs text-gray-500">Course ID: {courseId}</p>
          </div>
        </div>
        <div className="flex flex-row gap-2">
          <button
            onClick={() => handleExportGradeBook(instructorData, course?.course_code || 'Course')}
            title="You will get a sheet with all the function of Calculation written in excel"
            className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Export Grade Book
          </button>
          <button
            onClick={() => handleGoPolicy()}
            className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <BiSliderAlt /> Grading Policy
          </button>
        </div>
      </div>

      {/* 2. Main Workspace */}
      <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col">
        {/* The New Toolbar */}
        <IGradeSheetButtons
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          isRecalculating={isRecalculating}
          onSave={handleSave}
          onDiscard={handleDiscard}
          onRecalculate={handleRecalculateTotal}
          onImportClick={() => setIsImportModalOpen(true)} // Opens the selector modal
        />

        {/* The Table Container */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <IGradeSheet
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            columns={columns}
            data={displayData}
            changedCells={changedCellsSet}
          />
        </div>
      </div>

      {/* 3. Global Import Selection Modal (New Feature) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Import Marks</h3>
            <p className="text-gray-500 text-sm mb-4">
              Select the assessment you want to upload marks for:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
              {instructorData?.assessments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelectedAssessmentForUpload(a);
                    setShowBulkUploadDialog(true);
                    setIsImportModalOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <span className="font-medium text-gray-700 group-hover:text-blue-700">
                    {a.name}
                  </span>
                  <span className="text-xs text-gray-400">Max: {a.max_marks}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsImportModalOpen(false)}
              className="w-full py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showBulkUploadDialog && selectedAssessmentForUpload && (
        <BulkUploadDialog
          assessmentName={selectedAssessmentForUpload.name}
          onClose={() => setShowBulkUploadDialog(false)}
          onFileSelect={(parsedData) =>
            handleBulkUpload(parsedData, selectedAssessmentForUpload.id)
          }
        />
      )}

      {showUnenrolledDialog && (
        <UnenrolledStudentsDialog
          students={unenrolledStudents}
          onEnrollAll={() =>
            handleEnrollAndImport(
              assessmentId,
              unenrolledStudents.map((s) => ({ student_id: s.student_id, email: s.email }))
            )
          }
          onSkipAll={() => handleSkipUnenrolled(assessmentId)}
          onSelectiveEnroll={(selected) => handleEnrollAndImport(assessmentId, selected)}
          onClose={() => setShowUnenrolledDialog(false)}
          isProcessing={isProcessingEnrollment}
        />
      )}
    </div>
  );
}

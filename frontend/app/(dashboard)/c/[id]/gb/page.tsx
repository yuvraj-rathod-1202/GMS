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
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import {
  BiArrowBack,
  BiDotsVerticalRounded,
  BiDownload,
  BiHide,
  BiShow,
  BiSliderAlt,
  BiSortAlt2,
  BiSortUp,
  BiSortDown,
  BiSearch,
  BiCloudUpload,
  BiCalculator,
  BiChart,
} from 'react-icons/bi';
import { exportGradeBookToExcel } from '@/components/Grade/ExportGradeBook';
import calculateTotalMarks, { calculateTotalMarksOptimized } from '@/services/totalCalculation';

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
  const [calculatedTotals, setCalculatedTotals] = useState<Map<number, number>>(new Map());
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

  // Sorting and Filtering state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    minGrade?: number;
    maxGrade?: number;
    selectedAssessmentForFilter?: string;
    selectedPolicies?: number[];
  }>({});

  const { role, course, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['instructor', 'ta'],
    courseId,
    assessmentId,
  });

  const {
    loading: managementLoading,
    getallassessmentmarks,
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
  const storeInstructorData = useCourseDetailStore((s) => s.instructorData);
  const storeTaData = useCourseDetailStore((s) => s.taData);
  const instructorData = (role === 'ta' ? storeTaData : storeInstructorData) as any as InstructorCourseData | null;

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
          await fetchCourseRoles(courseId, false, true);
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

  // Optimized: Calculate totals for all affected students in batch using useMemo
  useEffect(() => {
    if (
      !instructorData?.assessments ||
      !instructorData?.assessmentMarks ||
      !instructorData?.policies ||
      !instructorData?.studentPolicyMap
    ) {
      return;
    }

    // Only recalculate if there are changed marks
    if (changedMarks.size === 0) {
      setCalculatedTotals(new Map());
      return;
    }

    // Get unique student IDs that have changes
    const affectedStudentIds = new Set<number>();
    changedMarks.forEach((_, key) => {
      const [studentId] = key;
      affectedStudentIds.add(studentId);
    });

    const newCalculatedTotals = new Map<number, number>();

    // Calculate totals only for affected students
    affectedStudentIds.forEach((studentId) => {
      // Get student's policy
      const assignedPolicyId = instructorData.studentPolicyMap[studentId];
      const defaultPolicy = instructorData.policies.find((p) => p.is_default);
      const studentPolicy = assignedPolicyId
        ? instructorData.policies.find((p) => p.id === assignedPolicyId)
        : defaultPolicy;

      if (!studentPolicy) return;

      // Build student marks map efficiently
      const studentMarksMap = new Map<number, number | null>();

      // First, add all existing marks from server
      instructorData.assessments.forEach((assessment) => {
        const marksArray = instructorData.assessmentMarks[assessment.id] || [];
        const markEntry = marksArray.find((m) => m.student_id === studentId);
        studentMarksMap.set(assessment.id, markEntry ? markEntry.marks_obtained : null);
      });

      // Then, override with local changes
      changedMarks.forEach((marks, key) => {
        const [sid, assessmentId] = key;
        if (sid === studentId && assessmentId !== undefined) {
          studentMarksMap.set(assessmentId, marks);
        }
      });

      // Calculate total using optimized function
      const total = calculateTotalMarksOptimized(
        studentId,
        studentPolicy,
        instructorData.assessments,
        studentMarksMap
      );

      newCalculatedTotals.set(studentId, Number(total.toFixed(2)));
    });

    setCalculatedTotals(newCalculatedTotals);
  }, [instructorData, changedMarks]);

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

        // Total will be recalculated automatically via useEffect
      } catch (error) {
        if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
          console.error('Failed to update policy:', error);
        }
        alert('Failed to update policy. Please try again.');
      } finally {
        setIsUpdatingPolicy(null);
      }
    },
    [courseId, updateStudentPolicy, fetchStudentPolicyMap]
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

      // Use calculated total if available, otherwise use server total
      if (calculatedTotals.has(row.student_id)) {
        updatedRow.total_marks = calculatedTotals.get(row.student_id);
      }

      return updatedRow;
    });
  }, [mergedData, changedMarks, calculatedTotals]);

  // Apply filtering and sorting
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...displayData];

    // Apply grade filter
    if (filters.selectedAssessmentForFilter) {
      const assessmentKey = filters.selectedAssessmentForFilter;
      filtered = filtered.filter((row) => {
        const grade = row[assessmentKey];
        if (grade === null || grade === undefined) return true;

        const meetsMin = filters.minGrade === undefined || grade >= filters.minGrade;
        const meetsMax = filters.maxGrade === undefined || grade <= filters.maxGrade;
        return meetsMin && meetsMax;
      });
    }

    // Apply policy filter
    if (filters.selectedPolicies && filters.selectedPolicies.length > 0) {
      filtered = filtered.filter((row) => filters.selectedPolicies!.includes(row.policy_id));
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle null/undefined values
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        // For student_id, sort numerically
        if (sortConfig.key === 'student_id') {
          aValue = Number(aValue);
          bValue = Number(bValue);
        }

        // For email and policy_name, sort as strings
        if (sortConfig.key === 'email' || sortConfig.key === 'policy_name') {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        // For numbers (marks, total)
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // For strings
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [displayData, filters, sortConfig]);

  // Handle sort toggle
  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null; // Remove sorting
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({});
    setSortConfig(null);
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.minGrade !== undefined ||
    filters.maxGrade !== undefined ||
    filters.selectedAssessmentForFilter !== undefined ||
    (filters.selectedPolicies && filters.selectedPolicies.length > 0);

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

  if (role !== 'instructor' && role !== 'ta') {
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

      // Update instructor data with the saved marks and calculated totals
      if (instructorData) {
        const updatedAssessmentMarks = { ...instructorData.assessmentMarks };
        const updatedTotalMarks = instructorData.totalMarks ? [...instructorData.totalMarks] : [];

        // Update assessment marks
        changedMarks.forEach((marks_obtained, key) => {
          const [student_id, assessment_id] = key;
          if (assessment_id !== undefined) {
            if (!updatedAssessmentMarks[assessment_id]) {
              updatedAssessmentMarks[assessment_id] = [];
            }
            const existingIndex = updatedAssessmentMarks[assessment_id].findIndex(
              (m) => m.student_id === student_id
            );
            if (existingIndex >= 0) {
              updatedAssessmentMarks[assessment_id][existingIndex] = {
                ...updatedAssessmentMarks[assessment_id][existingIndex],
                marks_obtained,
              };
            } else {
              updatedAssessmentMarks[assessment_id].push({
                student_id,
                marks_obtained,
              } as any);
            }
          }
        });

        // Update total marks with calculated values
        calculatedTotals.forEach((total_marks, student_id) => {
          const existingIndex = updatedTotalMarks.findIndex((tm) => tm.student_id === student_id);
          if (existingIndex >= 0) {
            updatedTotalMarks[existingIndex] = {
              ...updatedTotalMarks[existingIndex],
              total_marks,
            };
          } else {
            updatedTotalMarks.push({
              student_id,
              total_marks,
            } as any);
          }
        });

        // Update the store
        if (role === 'ta') {
          useCourseDetailStore.getState().setTAData({
            ...instructorData,
            assessmentMarks: updatedAssessmentMarks,
            totalMarks: updatedTotalMarks,
          });
        } else {
          useCourseDetailStore.getState().setInstructorData({
            ...instructorData,
            assessmentMarks: updatedAssessmentMarks,
            totalMarks: updatedTotalMarks,
          });
        }
      }

      setChangedMarks(new Map());
      setCalculatedTotals(new Map());
      setHasUnsavedChanges(false);
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
      setCalculatedTotals(new Map());
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
        if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
          console.error('Failed to recalculate total marks:', error);
        }
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
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Bulk upload error:', error);
      }
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
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Import marks error:', error);
      }
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
      await fetchCourseRoles(courseId, true, true);

      const toImport = pendingMarksData;

      setShowUnenrolledDialog(false);
      await importMarks(assessmentId, toImport);

      await fetchCourseRoles(courseId, true, true);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Enrollment error:', error);
      }
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
    if (
      changedCellsSet.size > 0 &&
      !confirm('Any unsaved changes will be lost. Are you sure you want to go back?')
    ) {
      return;
    }
    router.back();
  };

  const handleGoPolicy = () => {
    if (
      changedCellsSet.size > 0 &&
      !confirm(
        'Any unsaved changes will be lost. Are you sure you want to go to grading policy page?'
      )
    ) {
      return;
    }
    router.push(`/c/${courseId}/gp`);
  };

  const handleGoAnalytics = () => {
    if (
      changedCellsSet.size > 0 &&
      !confirm('Any unsaved changes will be lost. Are you sure you want to go to analytics page?')
    ) {
      return;
    }
    router.push(`/c/${courseId}/a`);
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <BiSortAlt2 className="text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? (
      <BiSortUp className="text-blue-600" />
    ) : (
      <BiSortDown className="text-blue-600" />
    );
  };

  const totalStudents = displayData.length;

  const assessmentColumns =
    instructorData?.assessments.map((a) => {
      const marksForAssessment = instructorData.assessmentMarks?.[a.id] || [];
      const filledCount = marksForAssessment.filter((m: any) => m.marks_obtained !== null && m.marks_obtained !== undefined).length;
      const pct = totalStudents > 0 ? Math.round((filledCount / totalStudents) * 100) : 0;

      return {
        header: (
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSort(String(a.id));
                }}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <span className="font-bold text-gray-900 truncate" title={a.name}>
                  {a.name}
                </span>
                {getSortIcon(String(a.id))}
              </button>
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
              <span className="text-gray-400 tabular-nums">{filledCount}/{totalStudents}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div
                className={`h-1 rounded-full transition-all ${
                  pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ),
        key: String(a.id),
        width: '150px',
        editable: true,
        onEditComplete: handleMarkChange(a.id, a.max_marks),
        max_marks: a.max_marks,
      };
    }) || [];

  const columns = [
    {
      header: (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSort('student_id');
          }}
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <span>Student</span>
          {getSortIcon('student_id')}
        </button>
      ),
      key: 'student_info',
      width: '250px',
      render: (_: any, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{row.student_id}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
    },
    ...(role === 'instructor'
      ? [
          {
            header: (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSort('policy_name');
                }}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <span>Policy</span>
                {getSortIcon('policy_name')}
              </button>
            ),
            key: 'policy_name',
            width: '200px',
            render: (value: any, row: any) => {
              const policies = instructorData?.policies || [];
              const currentPolicyId = row.policy_id;
              const isPolicyLoading = isUpdatingPolicy === row.student_id;

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
                    disabled={isPolicyLoading}
                    className="w-full bg-transparent border-b border-transparent group-hover:border-gray-300 focus:border-blue-500 text-sm py-1 outline-none cursor-pointer"
                  >
                    {policies.map((policy) => (
                      <option key={policy.id} value={policy.id}>
                        {policy.policy_name}
                        {policy.is_default ? ' (Default)' : ''}
                      </option>
                    ))}
                  </select>
                  {isPolicyLoading && (
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
        ]
      : []),
    ...assessmentColumns,
    {
      header: (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSort('total_marks');
          }}
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <span>Total</span>
          {getSortIcon('total_marks')}
        </button>
      ),
      key: 'total_marks',
      width: '100px',
      render: (val: any) => <span className="font-bold text-gray-900">{val}</span>,
      sticky: 'right' as const,
    },
  ];

  return (
    <div
      className="flex flex-col bg-gray-50 h-[calc(100vh-48px)] max-h-[calc(100vh-48px)]"
      onClick={() => setOpenMenuId(null)}
    >
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-col md:flex-row justify-between items-center shrink-0 gap-4 min-h-[64px]">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={() => handleGoBack()}
            className="text-gray-500 cursor-pointer hover:text-gray-900 transition-colors"
          >
            <BiArrowBack className="text-xl" />
          </button>
          
          <div className="relative w-full md:w-64">
            <BiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search..."
              className="pl-8 h-8 text-xs"
              wrapperClassName="!space-y-0"
            />
          </div>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 h-8 text-xs px-2.5"
          >
            <BiCloudUpload className="text-base" />
            <span>Import Excel</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRecalculateTotal}
            disabled={isRecalculating}
            title="Recalculate total marks based on the current grading policy and assessment marks"
            className="flex items-center gap-1.5 h-8 text-xs px-2.5"
          >
            <BiCalculator className="text-base" />
            <span>{isRecalculating ? 'Calculating...' : 'Recalculate'}</span>
          </Button>

          <div className="hidden h-5 w-px bg-gray-300 md:block" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExportGradeBook(instructorData, course?.course_code || 'Course')}
            title="Export a full gradebook with calculation formulas in Excel"
            className="flex items-center gap-1.5 h-8 text-xs px-2.5"
          >
            <BiDownload className="text-base" /> Export
          </Button>
          {role === 'instructor' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleGoPolicy()}
              className="flex items-center gap-1.5 h-8 text-xs px-2.5"
            >
              <BiSliderAlt className="text-base" /> Policy
            </Button>
          )}
          {role === 'instructor' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleGoAnalytics()}
              className="flex items-center gap-1.5 h-8 text-xs px-2.5"
            >
              <BiChart className="text-base" /> Analytics
            </Button>
          )}
        </div>
      </div>

      {/* 2. Main Workspace */}
      <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col">

        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && (
          <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-medium text-amber-800">
                {changedCellsSet.size} cell{changedCellsSet.size !== 1 ? 's' : ''} edited - save before leaving
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                className="text-amber-700 hover:bg-amber-100"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}

        {/* The Table Container */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {filteredAndSortedData.length !== displayData.length && (
            <div className="px-6 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-700">
              Showing {filteredAndSortedData.length} of {displayData.length} students
            </div>
          )}
          <IGradeSheet
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            columns={columns}
            data={filteredAndSortedData}
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
          onSkipAll={() => handleSkipUnenrolled(assessmentId)}
          onSelectiveEnroll={(selected) => handleEnrollAndImport(assessmentId, selected)}
          onClose={() => setShowUnenrolledDialog(false)}
          isProcessing={isProcessingEnrollment}
        />
      )}
    </div>
  );
}

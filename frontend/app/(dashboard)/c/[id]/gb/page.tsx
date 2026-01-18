"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useCourseManagement } from "@/hooks/useCourseManagement";
import { useTACourse } from "@/hooks/useTACourse";
import UnenrolledStudentsDialog from "@/components/ui/UnenrolledStudentsDialog";
import BulkUploadDialog from "@/components/ui/BulkUploadDialog";
import IGradeSheet from "@/components/ui/IGradeSheet";
import IGradeSheetButtons from "@/components/Grade/IGradeSheetButtons";

const getAssessmentTypeLabel = (typeId: number): string => {
  const types: { [key: number]: string } = {
    1: "Quiz",
    2: "Assignment",
    3: "Midsem",
    4: "EndSem",
    5: "Project",
    6: "Attendance",
    7: "Lab",
  };
  return types[typeId] || `Type ${typeId}`;
};

export default function GradeSheetView() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const [assessmentId, setAssessmentId] = useState<number>(Number(params.assessmentId));
  const [currentAssessment, setCurrentAssessment] = useState<any>(null);
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

  const [mergedData, setMergedData] = useState<Array<{
    student_id: number;
    email: string | null;
    assessment_id?: number;
    marks_obtained: number | null;
  }>>([]);

  // Local state for tracking changes
  const [changedMarks, setChangedMarks] = useState<Map<[number, number | undefined], number>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [fileInputRef, setFileInputRef] = useState<{ [key: number]: HTMLInputElement | null }>({});
  
  // Bulk upload state
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [selectedAssessmentForUpload, setSelectedAssessmentForUpload] = useState<any>(null);
  const [unenrolledStudents, setUnenrolledStudents] = useState<Array<{student_id: number; email: string; marks_obtained: number}>>([]);
  const [showUnenrolledDialog, setShowUnenrolledDialog] = useState(false);
  const [pendingMarksData, setPendingMarksData] = useState<Array<{student_id: number; email: string; marks_obtained: number}>>([]);
  const [isProcessingEnrollment, setIsProcessingEnrollment] = useState(false);
  
  const { role, course, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['instructor'],
    courseId,
    assessmentId,
  });

  const {loading: managementLoading, getallassessmentmarks, getmarksofassessment, fetchCourseRoles, fetchAllAssessments, saveMarks, BulkEnrollStudent, fetchAllPolicy, fetchTotalMarks, fetchStudentPolicyMap} = useCourseManagement(role || 'instructor');
  const {PublishMarks, UnpublishMarks} = useTACourse();
  const instructorData = useCourseDetailStore((s) => s.instructorData);

  // fetch all the assessments
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

  // // fetch courses roles
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

  // // fetch all assessment marks
  useEffect(() => {
    const fetchMarks = async () => {
      if (!isLoading && hasAccess && !isFetchingMarks && isAssessmentsFetched && isRolesFetched) {
        setIsFetchingMarks(true);
        try {
          await getallassessmentmarks(courseId);
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

  // fetch all grading policies
  useEffect(() => {
    const fetchPolicy = async () => {
        if (!isLoading && hasAccess && !isFetchingPolicy && isAssessmentsFetched && isRolesFetched && isMarksFetched) {
            setIsFetchingPolicy(true);
            try {
                await fetchAllPolicy(courseId);
                setIsPolicyFetched(true);
            } catch (error) {
                if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
                    console.error("Error fetching policies:", error);
                }
            } finally {
                setIsFetchingPolicy(false);
            }
        }
    }
    fetchPolicy();
  }, [isLoading, hasAccess, isFetchingPolicy, courseId]);

  // // fetch total marks
  useEffect(() => {
    const TotalMarks = async () => {
        if (!isLoading && hasAccess && !isFetchingTotalMarks && isAssessmentsFetched && isRolesFetched && isMarksFetched && isPolicyFetched) {
            setIsFetchingTotalMarks(true);
            try {
                await fetchTotalMarks(courseId);
                setIsTotalMarksFetched(true);
            } catch (error) {
                if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
                    console.error("Error fetching total marks:", error);
                }                
            } finally {
                setIsFetchingTotalMarks(false);
            }
        }
    }
    TotalMarks();
  }, [isLoading, hasAccess, isFetchingTotalMarks, courseId]);

  // // fetch student policy map
  useEffect(() => {
    const StudentPolicyMap = async () => {
        if (!isLoading && hasAccess && !isFetchingStudentPolicyMap && isAssessmentsFetched && isRolesFetched && isMarksFetched && isPolicyFetched && isTotalMarksFetched) {
            setIsFetchingStudentPolicyMap(true);
            try {
                await fetchStudentPolicyMap(courseId);
                setIsStudentPolicyMapFetched(true);
            } catch (error) {
                if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
                    console.error("Error fetching student policy map:", error);
                }
            } finally {
                setIsFetchingStudentPolicyMap(false);
            }
        }
    }
    StudentPolicyMap();
  }, [isLoading, hasAccess, isFetchingStudentPolicyMap, courseId]);

  useEffect(() => {
    if (instructorData?.assessmentMarks && instructorData.assessments) {
      const merged = instructorData.CourseRoles?.students.map((student) => {
        const studentData: any = {
          student_id: student.user_id,
          email: student.email || null,
        };
        
        // Add marks for each assessment
        instructorData.assessments.forEach((assessment) => {
          const marksData = instructorData.assessmentMarks[assessment.id] || [];
          const markEntry = marksData.find(m => m.student_id === student.user_id);
          studentData[String(assessment.id)] = markEntry ? markEntry.marks_obtained : null;
        });
        
        return studentData;
      }) || [];
      setMergedData(merged);
    }
  }, [instructorData]);

  const isLoadingData = managementLoading || isFetchingMarks || isFetchingRoles || isFetchingAssessments;

  // Handle local mark changes
  const handleMarkChange = useCallback((assessmentId: number, maxMarks: number) => {
    return (newValue: any, oldValue: any, row: any) => {
      const newMark = Number(newValue);
      if (isNaN(newMark) || newMark > maxMarks) return;
      
      setChangedMarks(prev => {
        const next = new Map(prev);
        next.set([row.student_id, assessmentId], newMark);
        return next;
      });
      setHasUnsavedChanges(true);
    };
  }, []);

  // Merge server data with local changes
  const displayData = useMemo(() => {
    return mergedData.map(row => {
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
      const marksPayload = Array.from(changedMarks.entries()).map(([[student_id, assessment_id], marks_obtained]) => ({
        student_id,
        assessment_id,
        marks_obtained
      }));

      const GroupedPayload = marksPayload.reduce((acc, curr) => { {
        if (!acc[curr.assessment_id!]) {
          acc[curr.assessment_id!] = [];
        }
        acc[curr.assessment_id!].push({
          student_id: curr.student_id,
          marks_obtained: curr.marks_obtained
        });
        return acc;
      }
      }, {} as { [key: number]: Array<{ student_id: number; marks_obtained: number }> });
      
      Array.from(Object.entries(GroupedPayload)).map(async ([assessment_id, marks]) => {
        await saveMarks(courseId, Number(assessment_id), {marks: marks});
        await getmarksofassessment(courseId, Number(assessment_id), true);
      });
      // Clear local state after successful save
      setChangedMarks(new Map());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save marks:", error);
      // alert("Failed to save marks. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async (assessment: any,e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    const action = assessment.is_marks_published ? "unpublish" : "publish";
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
        alert(`Marks for "${assessment.name}" unpublished successfully!`);
      } else {
        await PublishMarks(assessment.course_id, assessment.id);
        alert(`Marks for "${assessment.name}" published successfully!`);
      }
      // Refresh assessment data
      await fetchAllAssessments(courseId, true);
    } catch (error) {
      if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
        console.error("Error toggling publish status:", error);
      }
      alert(`Failed to ${action} marks. Please try again.`);
    } finally {
      setIsPublishing(false);
    }
  }

  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard your changes?")) {
      setChangedMarks(new Map());
      setHasUnsavedChanges(false);
    }
  };

  const parseCSV = (text: string): Array<{student_id: number; email: string; marks_obtained: number}> => {
    const lines = text.trim().split('\n');
    const data: Array<{student_id: number; email: string; marks_obtained: number}> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      if (values.length >= 3) {
        const studentId = parseInt(values[0]);
        const email = values[1];
        const marks = parseFloat(values[2]);
        
        if (!isNaN(studentId) && !isNaN(marks)) {
          data.push({
            student_id: studentId,
            email: email,
            marks_obtained: marks
          });
        }
      }
    }
    
    return data;
  };

  const handleBulkUpload = async (assessmentId: number, file: File) => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit");
        return;
      }

      const text = await file.text();
      let parsedData: Array<{student_id: number; email: string; marks_obtained: number}> = [];

      if (file.name.endsWith('.csv')) {
        parsedData = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        alert("Excel file support is not implemented yet. Please upload a CSV file.");
        return;
      } else {
        alert("Only CSV and Excel files are supported.");
        return;
      }

      if (parsedData.length === 0) {
        alert("No valid data found in file. Please check the format.");
        return;
      }

      const assessment = instructorData?.assessments.find(a => a.id === assessmentId);
      if (assessment?.max_marks) {
        const invalidMarks = parsedData.filter(d => d.marks_obtained > assessment.max_marks);
        if (invalidMarks.length > 0) {
          alert(`${invalidMarks.length} entries have marks exceeding maximum (${assessment.max_marks}). Please correct the file.`);
          return;
        }
      }

      const enrolledIds = new Set(mergedData.map(s => s.student_id));
      const enrolled = parsedData.filter(d => enrolledIds.has(d.student_id));
      const unenrolled = parsedData.filter(d => !enrolledIds.has(d.student_id));

      setPendingMarksData(parsedData);

      if (unenrolled.length > 0) {
        setUnenrolledStudents(unenrolled);
        setShowUnenrolledDialog(true);
      } else {
        await importMarks(assessmentId, enrolled);
      }
    } catch (error) {
      console.error("Bulk upload error:", error);
      alert("Failed to process file. Please check the format and try again.");
    }
  };

  const importMarks = async (assessmentId: number, marksData: Array<{student_id: number; email: string; marks_obtained: number}>) => {
    try {
      const newChanges = new Map(changedMarks);
      marksData.forEach(mark => {
        newChanges.set([mark.student_id, assessmentId], mark.marks_obtained);
      });
      
      setChangedMarks(newChanges);
      setHasUnsavedChanges(true);
      
      alert(`Successfully imported marks for ${marksData.length} student${marksData.length > 1 ? 's' : ''}. Click "Save Marks" to apply changes.`);
    } catch (error) {
      console.error("Import marks error:", error);
      alert("Failed to import marks. Please try again.");
    }
  };

  const handleEnrollAndImport = async (assessmentId: number, selected: {student_id: number; email: string}[]) => {
    setIsProcessingEnrollment(true);
    try {
      
      const enrollData = selected.map(s => ({ student_id: s.student_id, email: s.email }));
      await BulkEnrollStudent(courseId, enrollData);
      await fetchCourseRoles(courseId, true);
      
      const enrolledIds = new Set(mergedData.map(s => s.student_id));
      const toImport = pendingMarksData.filter(d => 
        enrolledIds.has(d.student_id) || selected.some(s => s.student_id === d.student_id)
      );
      
      setShowUnenrolledDialog(false);
      await importMarks(assessmentId, toImport);
      
      await fetchCourseRoles(courseId);
    } catch (error) {
      console.error("Enrollment error:", error);
      alert("Failed to enroll students. Please try again.");
    } finally {
      setIsProcessingEnrollment(false);
    }
  };

  const handleSkipUnenrolled = async (assessmentId: number) => {
    const enrolledIds = new Set(mergedData.map(s => s.student_id));
    const toImport = pendingMarksData.filter(d => enrolledIds.has(d.student_id));
    
    setShowUnenrolledDialog(false);
    await importMarks(assessmentId, toImport);
  };

  const assessmentColumns = instructorData?.assessments.map(a => ({
    header: `${a.name}`,
    key: String(a.id),
    width: "150px",
    editable: true,
    onEditComplete: handleMarkChange(a.id, a.max_marks),
    max_marks: a.max_marks,
    headerActions: (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenuId(openMenuId === a.id ? null : a.id);
          }}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <circle cx="8" cy="2" r="1.5"/>
            <circle cx="8" cy="8" r="1.5"/>
            <circle cx="8" cy="14" r="1.5"/>
          </svg>
        </button>
        {openMenuId === a.id && (
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAssessmentForUpload(a);
                setShowBulkUploadDialog(true);
                setOpenMenuId(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
            >
              Bulk Upload
            </button>
            <button
              onClick={(e) => {
                handlePublishToggle(a, e);
                setOpenMenuId(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors border-t border-gray-200"
            >
              {a.is_marks_published ? 'Unpublish Marks' : 'Publish Marks'}
            </button>
          </div>
        )}
      </div>
    ),
  })) || [];

  const columns = [
    { header: "Student ID", key: "student_id", width: "120px"},
    { header: "Email", key: "email", width: "250px"},
    // { header: "Assigned Policy", key: "policy", render: () => "Default Policy", selectable: true, options: ["Default Policy"], onEditComplete: () => {} },
    // { header: "Marks Obtained", key: "marks_obtained", editable: true, onEditComplete: handleMarkChange },
    ...assessmentColumns,
  ];

  const formattedDate = currentAssessment 
    ? new Date(currentAssessment.assessment_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="p-6 h-[calc(100vh-48px)] overflow-y-auto w-screen md:w-[calc((5/6)*100vw)]" onClick={() => setOpenMenuId(null)}>
      <IGradeSheetButtons
        handleSave={handleSave}
        handleDiscard={handleDiscard}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
      />
      <IGradeSheet columns={columns} data={displayData} />
      
      {/* Bulk Upload Dialog */}
      {showBulkUploadDialog && selectedAssessmentForUpload && (
        <BulkUploadDialog
          assessmentName={selectedAssessmentForUpload.name}
          onClose={() => setShowBulkUploadDialog(false)}
          onFileSelect={(file) => handleBulkUpload(selectedAssessmentForUpload.id, file)}
        />
      )}
      
      {/* Unenrolled Students Dialog */}
      {showUnenrolledDialog && (
        <UnenrolledStudentsDialog
          students={unenrolledStudents}
          onEnrollAll={() => handleEnrollAndImport(assessmentId, unenrolledStudents.map(s => ({ student_id: s.student_id, email: s.email })))}
          onSkipAll={() => handleSkipUnenrolled(assessmentId)}
          onSelectiveEnroll={(selected) => handleEnrollAndImport(assessmentId, selected)}
          onClose={() => setShowUnenrolledDialog(false)}
          isProcessing={isProcessingEnrollment}
        />
      )}
    </div>
  );
}
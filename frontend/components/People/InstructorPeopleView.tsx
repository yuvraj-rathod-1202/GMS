import React, { useMemo, useState } from "react";
import PageHeader from "../Course/PageHeader";
import EnrollStudentDialog from "./EnrollStudentDialog";
import StudentList from "./StudentList";
import InstructorNavbar from "../Course/InstructorNavbar";
import AddTADialog from "./AddTADialog";
import BulkEnrollDialog from "./BulkEnrollDialog";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import TAList from "./TAList";

interface Student {
  user_id: number;
  email: string | null;
}

export function InstructorPeopleView({
    setShowEnrollDialog, 
    showEnrollDialog, 
    setShowAddDialog, 
    showAddDialog, 
    showBulkEnrollDialog,
    setShowBulkEnrollDialog,
    handleEnrollStudent, 
    handleRemoveStudent, 
    handleAddTA, 
    handleRemoveTA, 
    handleBulkEnroll,
    managementLoading
} : {
    setShowEnrollDialog: React.Dispatch<React.SetStateAction<boolean>>;
    showEnrollDialog: boolean;
    setShowAddDialog: React.Dispatch<React.SetStateAction<boolean>>;
    showAddDialog: boolean;
    showBulkEnrollDialog: boolean;
    setShowBulkEnrollDialog: React.Dispatch<React.SetStateAction<boolean>>;
    handleEnrollStudent: (studentId: string, email: string) => Promise<void>;
    handleRemoveStudent: (studentId: number) => Promise<void>;
    handleAddTA: (taId: string, email: string) => Promise<void>;
    handleRemoveTA: (taId: number) => Promise<void>;
    handleBulkEnroll: (file: File) => Promise<void>;
    managementLoading: boolean;
}) {

    const instructorData = useCourseDetailStore((s) => s.instructorData);

    const students = useMemo(() => {
        return (instructorData?.CourseRoles?.students || [])
            .filter((student: Student) => student?.user_id !== undefined)
            .map((student: Student, index: number) => ({
            index,
            id: student.user_id.toString(),
            email: student.email || "N/A",
            }));
        }, [instructorData]);

    const tas = useMemo(() => {
        return (instructorData?.CourseRoles?.tas || [])
            .filter((ta: Student) => ta?.user_id !== undefined)
            .map((ta: Student, index: number) => ({
            index,
            id: ta.user_id.toString(),
            email: ta.email || "N/A",
            }));
        }, [instructorData]);

    return (
        <div>
            <InstructorNavbar />
            <div className="h-[calc(100vh-96px)] overflow-y-auto w-full md:max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="space-y-6 md:space-y-8">
                <PageHeader
                title="TAs"
                description="Manage tas enrolled in this course."
                buttonText="Add TA"
                onButtonClick={() => setShowAddDialog(true)}
                />
                <AddTADialog
                isOpen={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                onSubmit={handleAddTA}
                isLoading={managementLoading}
                />
                <TAList
                students={tas}
                onRemoveStudent={handleRemoveTA}
                isLoading={managementLoading}
                />

                <PageHeader
                title="Students"
                description="Manage students enrolled in this course."
                buttonText="Enroll Student"
                onButtonClick={() => setShowEnrollDialog(true)}
                />

                {/* Bulk Enroll Button */}
                <div className="flex justify-end -mt-4 mb-4">
                    <button 
                        onClick={() => setShowBulkEnrollDialog(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md active:scale-95 border border-gray-300"
                        title="Bulk enroll students from CSV/Excel file"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Bulk Enroll
                    </button>
                </div>

                <EnrollStudentDialog
                isOpen={showEnrollDialog}
                onClose={() => setShowEnrollDialog(false)}
                onSubmit={handleEnrollStudent}
                isLoading={managementLoading}
                />

                <BulkEnrollDialog
                isOpen={showBulkEnrollDialog}
                onClose={() => setShowBulkEnrollDialog(false)}
                onUpload={handleBulkEnroll}
                />

                <StudentList
                students={students}
                onRemoveStudent={handleRemoveStudent}
                isLoading={managementLoading}
                />
            </div>
            </div>
        </div>
    )
}
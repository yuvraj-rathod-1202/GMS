import React, { useMemo, useState } from "react";
import PageHeader from "../Course/PageHeader";
import EnrollStudentDialog from "./EnrollStudentDialog";
import StudentList from "./StudentList";
import InstructorNavbar from "../Course/InstructorNavbar";
import AddTADialog from "./AddTADialog";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import TAList from "./TAList";

interface Student {
  user_id: number;
  email: string | null;
}

export function InstructorPeopleView({setShowEnrollDialog, showEnrollDialog, setShowAddDialog, showAddDialog, handleEnrollStudent, handleRemoveStudent, handleAddTA, handleRemoveTA, managementLoading} : {
    setShowEnrollDialog: React.Dispatch<React.SetStateAction<boolean>>;
    showEnrollDialog: boolean;
    setShowAddDialog: React.Dispatch<React.SetStateAction<boolean>>;
    showAddDialog: boolean;
    handleEnrollStudent: (studentId: string, email: string) => Promise<void>;
    handleRemoveStudent: (studentId: number) => Promise<void>;
    handleAddTA: (taId: string, email: string) => Promise<void>;
    handleRemoveTA: (taId: number) => Promise<void>;
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

                <EnrollStudentDialog
                isOpen={showEnrollDialog}
                onClose={() => setShowEnrollDialog(false)}
                onSubmit={handleEnrollStudent}
                isLoading={managementLoading}
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
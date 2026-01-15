import React from "react";
import TANavbar from "../Course/TANavbar";
import PageHeader from "../Course/PageHeader";
import EnrollStudentDialog from "./EnrollStudentDialog";
import StudentList from "../Course/StudentList";

export function TAPeopleView({setShowEnrollDialog, showEnrollDialog, handleEnrollStudent, handleRemoveStudent, students, managementLoading} : {
    setShowEnrollDialog: React.Dispatch<React.SetStateAction<boolean>>;
    showEnrollDialog: boolean;
    handleEnrollStudent: (studentId: string, email: string) => Promise<void>;
    handleRemoveStudent: (studentId: number) => Promise<void>;
    students: {
        index: number;
        id: string;
        email: string;
    }[];
    managementLoading: boolean;
}) {
    return (
        <div>
            <TANavbar />
            <div className="h-[calc(100vh-96px)] overflow-y-auto w-full md:max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="space-y-6 md:space-y-8">
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
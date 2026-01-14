"use client";
import { useState } from "react";
import { BiPencil } from "react-icons/bi";

interface StudentData {
  index: number;
  id: string;
  email: string;
}

interface StudentListProps {
  students: StudentData[];
  onRemoveStudent: (studentId: number) => Promise<void>;
  isLoading?: boolean;
}

export default function StudentList({
  students,
  onRemoveStudent,
  isLoading = false,
}: StudentListProps) {
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  const handleRemove = async (studentId: string) => {
    await onRemoveStudent(Number(studentId));
    setSelectedStudent(null);
  };

  return (
    <div className="border border-gray-300 rounded-2xl bg-white">

      <div 
        className="grid gap-4 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base bg-gray-50 border-b border-gray-300" 
        style={{ gridTemplateColumns: '2fr 3fr auto' }}
      >
        <div className="font-semibold text-gray-900">Roll No</div>
        <div className="font-semibold text-gray-900">Email</div>
        <div className="font-semibold text-gray-900">Actions</div>
      </div>

      {students.length === 0 ? (
        <div className="px-4 sm:px-6 py-6 sm:py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
          No students enrolled yet
        </div>
      ) : (
        students.map((student, index) => (
          <div
            key={student.index}
            className={`grid gap-4 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base items-center ${
              index !== students.length - 1 ? "border-b border-gray-200" : ""
            }`}
            style={{ gridTemplateColumns: '2fr 3fr auto' }}
          >
            <div className="text-gray-900 font-medium">{student.id}</div>
            <div className="text-gray-700 truncate">{student.email}</div>
            <div className="relative">
              <button
                onClick={() => setSelectedStudent(selectedStudent === student.index ? null : student.index)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Manage student"
                disabled={isLoading}
              >
                <BiPencil className="text-lg text-gray-600" />
              </button>
              {selectedStudent === student.index && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-30">
                  <button
                    onClick={() => handleRemove(student.id)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    Remove from course
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

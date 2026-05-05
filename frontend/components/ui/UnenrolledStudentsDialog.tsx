'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Modal from '@/components/ui/Modal';

interface UnenrolledStudent {
  student_id: number;
  email: string;
  marks_obtained: number;
}

interface UnenrolledStudentsDialogProps {
  students: UnenrolledStudent[];
  onSkipAll: () => void;
  onSelectiveEnroll: (selected: { student_id: number; email: string }[]) => void;
  onClose: () => void;
  isProcessing: boolean;
}

export default function UnenrolledStudentsDialog({
  students,
  onSkipAll,
  onSelectiveEnroll,
  onClose,
  isProcessing,
}: UnenrolledStudentsDialogProps) {
  const [selectedStudents, setSelectedStudents] = React.useState<Set<number>>(
    new Set(students.map((s) => s.student_id))
  );

  const toggleStudent = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const toggleAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map((s) => s.student_id)));
    }
  };

  const handleEnrollSelected = () => {
    onSelectiveEnroll(
      Array.from(selectedStudents)
        .map((id) => {
          const student = students.find((s) => s.student_id === id);
          return student ? { student_id: student.student_id, email: student.email } : null;
        })
        .filter(Boolean) as { student_id: number; email: string }[]
    );
  };

  return (
    <Modal
      open
      title="Unenrolled Students Found"
      description={`${students.length} student${students.length > 1 ? 's' : ''} in your file ${
        students.length > 1 ? 'are' : 'is'
      } not enrolled in this course`}
      onClose={onClose}
      className="max-w-3xl"
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 shrink-0 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="mb-1 font-medium text-yellow-900">Action Required</h3>
              <p className="text-sm text-yellow-800">
                You can choose to enroll these students in the course and import their marks, or
                skip them and only import marks for currently enrolled students.
              </p>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="overflow-hidden rounded-lg border border-gray-200">
          {/* Table Header */}
          <div className="flex items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3">
            <Checkbox
              checked={selectedStudents.size === students.length}
              onChange={toggleAll}
              disabled={isProcessing}
            />
            <div className="flex-1 grid grid-cols-3 gap-4 font-medium text-sm text-gray-700">
              <div>Student ID</div>
              <div>Email</div>
              <div>Marks</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {students.map((student) => (
              <div
                key={student.student_id}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <Checkbox
                  checked={selectedStudents.has(student.student_id)}
                  onChange={() => toggleStudent(student.student_id)}
                  disabled={isProcessing}
                />
                <div className="flex-1 grid grid-cols-3 gap-4 text-sm text-gray-700">
                  <div className="font-medium">{student.student_id}</div>
                  <div className="truncate">{student.email}</div>
                  <div>{student.marks_obtained}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          {selectedStudents.size} of {students.length} student
          {selectedStudents.size !== 1 ? 's' : ''} selected for enrollment
        </p>

        <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
          <Button onClick={onSkipAll} disabled={isProcessing} variant="secondary">
            Skip All & Continue
          </Button>
          <Button
            onClick={handleEnrollSelected}
            disabled={isProcessing || selectedStudents.size === 0}
          >
            {isProcessing ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              `Enroll ${selectedStudents.size} & Import Marks`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

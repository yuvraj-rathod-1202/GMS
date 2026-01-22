import React from 'react';

interface UnenrolledStudent {
  student_id: number;
  email: string;
  marks_obtained: number;
}

interface UnenrolledStudentsDialogProps {
  students: UnenrolledStudent[];
  onEnrollAll: () => void;
  onSkipAll: () => void;
  onSelectiveEnroll: (selected: { student_id: number; email: string }[]) => void;
  onClose: () => void;
  isProcessing: boolean;
}

export default function UnenrolledStudentsDialog({
  students,
  onEnrollAll,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Dialog Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Unenrolled Students Found</h2>
            <p className="text-sm text-gray-600 mt-1">
              {students.length} student{students.length > 1 ? 's' : ''} in your file{' '}
              {students.length > 1 ? 'are' : 'is'} not enrolled in this course
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Dialog Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5"
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
                <h3 className="font-medium text-yellow-900 mb-1">Action Required</h3>
                <p className="text-sm text-yellow-800">
                  You can choose to enroll these students in the course and import their marks, or
                  skip them and only import marks for currently enrolled students.
                </p>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedStudents.size === students.length}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-2 focus:ring-gray-500 cursor-pointer"
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
                  className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(student.student_id)}
                    onChange={() => toggleStudent(student.student_id)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-2 focus:ring-gray-500 cursor-pointer"
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

          <p className="text-xs text-gray-500 mt-3">
            {selectedStudents.size} of {students.length} student
            {selectedStudents.size !== 1 ? 's' : ''} selected for enrollment
          </p>
        </div>

        {/* Dialog Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onSkipAll}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip All & Continue
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleEnrollSelected}
              disabled={isProcessing || selectedStudents.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-700 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Processing...
                </>
              ) : (
                `Enroll ${selectedStudents.size} & Import Marks`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

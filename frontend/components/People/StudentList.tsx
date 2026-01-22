'use client';
import { useState, useMemo } from 'react';
import { BiPencil, BiSearch } from 'react-icons/bi';

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
  const [searchQuery, setSearchQuery] = useState('');

  const handleRemove = async (studentId: string) => {
    await onRemoveStudent(Number(studentId));
    setSelectedStudent(null);
  };

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) {
      return students;
    }

    const query = searchQuery.toLowerCase().trim();
    return students.filter((student) => {
      const rollNo = student.id.toLowerCase();
      const email = student.email.toLowerCase();
      return rollNo.includes(query) || email.includes(query);
    });
  }, [students, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <BiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
        <input
          type="text"
          placeholder="Search by Roll No or Email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Student List Table */}
      <div className="border border-gray-300 rounded-2xl bg-white">
        <div
          className="grid gap-4 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base bg-gray-50 border-b border-gray-300"
          style={{ gridTemplateColumns: '2fr 3fr auto' }}
        >
          <div className="font-semibold text-gray-900">Roll No</div>
          <div className="font-semibold text-gray-900">Email</div>
          <div className="font-semibold text-gray-900">Actions</div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="px-4 sm:px-6 py-6 sm:py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
            {searchQuery ? 'No students found matching your search' : 'No students enrolled yet'}
          </div>
        ) : (
          filteredStudents.map((student, index) => (
            <div
              key={student.index}
              className={`grid gap-4 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base items-center ${
                index !== filteredStudents.length - 1 ? 'border-b border-gray-200' : ''
              }`}
              style={{ gridTemplateColumns: '2fr 3fr auto' }}
            >
              <div className="text-gray-900 font-medium">{student.id}</div>
              <div className="text-gray-700 truncate">{student.email}</div>
              <div className="relative">
                <button
                  onClick={() =>
                    setSelectedStudent(selectedStudent === student.index ? null : student.index)
                  }
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

      {searchQuery && filteredStudents.length > 0 && (
        <div className="text-sm text-gray-600 px-2">
          Found {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} matching
          "{searchQuery}"
        </div>
      )}
    </div>
  );
}

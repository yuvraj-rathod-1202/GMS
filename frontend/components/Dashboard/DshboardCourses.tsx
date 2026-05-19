import React, { useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import CoursesStatusSelection from '../ui/CoursesStatusSelection';
import { useCoursesStore } from '@/lib/store/courses';
import { useAuthStore } from '@/lib/store/auth';
import { useCourses } from '@/hooks/useCourses';
import CourseCard from './CourseCard';

export default function DashboardCourses() {
  const [statusFilter, setStatusFilter] = useState<'ongoing' | 'completed' | 'all'>('ongoing');
  const [searchTerm, setSearchTerm] = useState('');
  const { loading, error } = useCourses();
  const courses = useCoursesStore((s) => s.courses);
  const user = useAuthStore((s) => s.user);

  const filteredCourses = useMemo(() => {
    const coursesList = Array.isArray(courses) ? courses : [];
    return coursesList.filter((course) => {
      const matchesStatus = statusFilter === 'all' || course.status.toLowerCase() === statusFilter;
      const matchesSearch =
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [courses, statusFilter, searchTerm]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view your active courses</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gms-indigo/20 focus:border-gms-indigo transition-all"
            />
          </div>
          <CoursesStatusSelection statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gms-indigo mb-4"></div>
          <div className="text-gray-500 font-medium">Loading your courses...</div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-20">
          <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        </div>
      )}

      {!loading && !error && filteredCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="text-gray-400 mb-2">
            <FiSearch size={40} />
          </div>
          <div className="text-gray-500 font-medium text-lg">No courses found</div>
        </div>
      )}

      {!loading && !error && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

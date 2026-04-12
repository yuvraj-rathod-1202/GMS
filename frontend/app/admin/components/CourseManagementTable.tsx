'use client';
import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiUserPlus } from 'react-icons/fi';
import { AdminApi } from '@/lib/api/admin';
import { CourseDBObject } from '@/lib/types/courses';

interface CourseManagementTableProps {
  userId: number;
  onAssignInstructor: (courseId: number) => void;
  onEditCourse: (course: CourseDBObject) => void;
  onCreateCourse: () => void;
  refreshTrigger?: number;
}

export default function CourseManagementTable({
  userId,
  onAssignInstructor,
  onEditCourse,
  onCreateCourse,
  refreshTrigger,
}: CourseManagementTableProps) {
  const [courses, setCourses] = useState<CourseDBObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Record<number, boolean>>({});

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await AdminApi.FetchAllCourses();
        const coursesList = (response as any).courses || [];
        setCourses(coursesList);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch courses');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [refreshTrigger]);

  const handleStatusToggle = async (courseId: number, currentStatus: string) => {
    try {
      setUpdatingStatus((prev) => ({ ...prev, [courseId]: true }));
      const newStatus = currentStatus === 'ongoing' ? 'completed' : 'ongoing';

      await AdminApi.UpdateCourseStatus(courseId, {
        status: newStatus,
      });

      // Update local state
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, status: newStatus as any } : c
        )
      );
    } catch (err: any) {
      console.error('Error updating course status:', err);
      setError(err?.message || 'Failed to update course status');
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      await AdminApi.DeleteCourse(courseId, userId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err: any) {
      console.error('Error deleting course:', err);
      setError(err?.message || 'Failed to delete course');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Course Management</h2>
        <button
          onClick={onCreateCourse}
          className="px-4 py-2 bg-mms-blue text-white rounded-md hover:bg-mms-indigo transition-colors text-sm font-medium"
        >
          + Add Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No courses found. Create your first course!
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="col-span-2 text-sm font-semibold text-gray-900">Course Code</div>
            <div className="col-span-3 text-sm font-semibold text-gray-900">Course Name</div>
            <div className="col-span-2 text-sm font-semibold text-gray-900">Students</div>
            <div className="col-span-2 text-sm font-semibold text-gray-900">Status</div>
            <div className="col-span-3 text-sm font-semibold text-gray-900">Actions</div>
          </div>

          {/* Table Body */}
          {courses.map((course, idx) => (
            <div
              key={course.id}
              className={`grid grid-cols-12 gap-4 px-6 py-4 items-center text-sm ${
                idx !== courses.length - 1 ? 'border-b border-gray-200' : ''
              }`}
            >
              <div className="col-span-2 font-medium text-gray-900">{course.course_code}</div>
              <div className="col-span-3 text-gray-700">{course.name}</div>
              <div className="col-span-2 text-gray-700">{course.total_students}</div>
              <div className="col-span-2">
                <button
                  onClick={() => handleStatusToggle(course.id, course.status)}
                  disabled={updatingStatus[course.id]}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    course.status === 'ongoing'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  } disabled:opacity-50`}
                >
                  {updatingStatus[course.id] ? 'Updating...' : course.status}
                </button>
              </div>
              <div className="col-span-3 flex gap-2">
                <button
                  onClick={() => onAssignInstructor(course.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Assign Instructor"
                >
                  <FiUserPlus size={16} />
                </button>
                <button
                  onClick={() => onEditCourse(course)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                  title="Edit Course"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteCourse(course.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete Course"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

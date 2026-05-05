'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiTrash2, FiUserPlus } from 'react-icons/fi';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import { AdminApi } from '@/lib/api/admin';
import { CourseDBObject } from '@/lib/types/courses';

interface CourseManagementTableProps {
  userId: number;
  onAssignInstructor: (courseId: number, courseName: string) => void;
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

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = (await AdminApi.FetchAllCourses()) as { courses?: CourseDBObject[] };
        setCourses(response.courses || []);
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Failed to fetch courses');
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [refreshTrigger]);

  const handleStatusToggle = useCallback(async (courseId: number, currentStatus: string) => {
    try {
      setUpdatingStatus((prev) => ({ ...prev, [courseId]: true }));
      const newStatus: CourseDBObject['status'] =
        currentStatus === 'ongoing' ? 'completed' : 'ongoing';

      await AdminApi.UpdateCourseStatus(courseId, { status: newStatus });

      setCourses((prev) =>
        prev.map((course) => (course.id === courseId ? { ...course, status: newStatus } : course))
      );
    } catch (error: unknown) {
      console.error('Error updating course status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update course status');
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [courseId]: false }));
    }
  }, []);

  const handleDeleteCourse = useCallback(
    async (courseId: number) => {
      if (!window.confirm('Are you sure you want to delete this course?')) {
        return;
      }

      try {
        await AdminApi.DeleteCourse(courseId, userId);
        setCourses((prev) => prev.filter((course) => course.id !== courseId));
      } catch (error: unknown) {
        console.error('Error deleting course:', error);
        setError(error instanceof Error ? error.message : 'Failed to delete course');
      }
    },
    [userId]
  );

  const columns = useMemo<DataTableColumn<CourseDBObject>[]>(
    () => [
      {
        key: 'course_code',
        header: 'Course Code',
        render: (value) => <span className="font-medium text-gray-900">{value as string}</span>,
      },
      {
        key: 'name',
        header: 'Course Name',
      },
      {
        key: 'total_students',
        header: 'Students',
        align: 'center',
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (_, course) => (
          <button
            type="button"
            onClick={() => handleStatusToggle(course.id, course.status)}
            disabled={updatingStatus[course.id]}
            className={`inline-flex min-w-24 items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
              course.status === 'ongoing'
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            {updatingStatus[course.id] ? 'Updating...' : course.status}
          </button>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (_, course) => (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onAssignInstructor(course.id, course.name)}
              title="Assign Instructor"
              className="px-2 text-blue-700 hover:bg-blue-50"
            >
              <FiUserPlus size={16} />
              <span className="hidden sm:inline">Assign</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditCourse(course)}
              title="Edit Course"
              className="px-2 text-gray-600 hover:bg-gray-100"
            >
              <FiEdit2 size={16} />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteCourse(course.id)}
              title="Delete Course"
              className="px-2 text-red-700 hover:bg-red-50"
            >
              <FiTrash2 size={16} />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        ),
      },
    ],
    [onAssignInstructor, onEditCourse, updatingStatus, handleDeleteCourse, handleStatusToggle]
  );

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Course Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Review course status, assign instructors, and keep the catalog current.
          </p>
        </div>
        <Button onClick={onCreateCourse}>+ Add Course</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <DataTable
        columns={columns}
        data={courses}
        loading={loading}
        loadingMessage="Loading courses..."
        emptyMessage="No courses found. Create your first course!"
        getRowKey={(course) => course.id}
      />
    </div>
  );
}

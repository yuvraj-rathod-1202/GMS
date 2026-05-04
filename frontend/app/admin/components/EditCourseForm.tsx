'use client';
import React, { useEffect, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { AdminApi } from '@/lib/api/admin';
import { CourseDBObject } from '@/lib/types/courses';

type InstructorAssignment = {
  user_id: number;
  email: string | null;
};

interface EditCourseFormProps {
  userId: number;
  course: CourseDBObject;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCourseForm({ userId, course, onClose, onSuccess }: EditCourseFormProps) {
  const [formData, setFormData] = useState({
    course_code: course.course_code,
    name: course.name,
    semester: course.semester,
    credits: course.credits,
    status: course.status,
  });
  const [loading, setLoading] = useState(false);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const [removingInstructorId, setRemovingInstructorId] = useState<number | null>(null);
  const [instructors, setInstructors] = useState<InstructorAssignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [instructorError, setInstructorError] = useState<string | null>(null);
  const [localErrors, setLocalErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    let isActive = true;

    const fetchInstructors = async () => {
      try {
        setInstructorsLoading(true);
        setInstructorError(null);
        const response = (await AdminApi.GetCourseInstructors(course.id)) as { roles?: InstructorAssignment[] };
        if (!isActive) {
          return;
        }

        setInstructors(response.roles || []);
      } catch (error: unknown) {
        if (!isActive) {
          return;
        }

        console.error('Error fetching course instructors:', error);
        setInstructorError(error instanceof Error ? error.message : 'Failed to load assigned instructors');
      } finally {
        if (isActive) {
          setInstructorsLoading(false);
        }
      }
    };

    fetchInstructors();

    return () => {
      isActive = false;
    };
  }, [course.id]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.course_code.trim()) {
      errors.course_code = 'Course code is required';
    } else if (formData.course_code.trim().length > 10) {
      errors.course_code = 'Course code must be 10 characters or less';
    }

    if (!formData.name.trim()) {
      errors.name = 'Course name is required';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Course name must be 100 characters or less';
    }

    if (!formData.credits || formData.credits < 0 || formData.credits > 12) {
      errors.credits = 'Credits must be between 0 and 12';
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await AdminApi.UpdateCourseStatus(course.id, {
        course_code: formData.course_code,
        name: formData.name,
        credits: formData.credits,
        status: formData.status,
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Error updating course:', error);
      setError(error instanceof Error ? error.message : 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (localErrors[field]) {
      setLocalErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleRemoveInstructor = async (instructorId: number) => {
    if (!window.confirm('Remove this instructor from the course?')) {
      return;
    }

    try {
      setRemovingInstructorId(instructorId);
      setInstructorError(null);
      await AdminApi.RemoveInstructor(course.id, instructorId, userId);
      setInstructors((prev) => prev.filter((instructor) => instructor.user_id !== instructorId));
      onSuccess();
    } catch (error: unknown) {
      console.error('Error removing instructor:', error);
      setInstructorError(error instanceof Error ? error.message : 'Failed to remove instructor');
    } finally {
      setRemovingInstructorId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Course</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
            <input
              type="text"
              value={formData.course_code}
              onChange={(e) => handleChange('course_code', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-mms-blue"
            />
            {localErrors.course_code && (
              <p className="mt-1 text-sm text-red-600">{localErrors.course_code}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-mms-blue"
            />
            {localErrors.name && <p className="mt-1 text-sm text-red-600">{localErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credits *</label>
            <input
              type="number"
              min="0"
              max="12"
              value={formData.credits}
              onChange={(e) => handleChange('credits', parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-mms-blue"
            />
            {localErrors.credits && (
              <p className="mt-1 text-sm text-red-600">{localErrors.credits}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-mms-blue"
            >
              <option value="ongoing">ongoing</option>
              <option value="completed">completed</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Assigned Instructors</h3>
              <p className="text-xs text-gray-500 mt-1">
                Manage who can teach this course from the admin panel.
              </p>
            </div>

            {instructorError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {instructorError}
              </div>
            )}

            {instructorsLoading ? (
              <p className="text-sm text-gray-600">Loading instructors...</p>
            ) : instructors.length === 0 ? (
              <p className="text-sm text-gray-500">No instructors are assigned to this course.</p>
            ) : (
              <div className="space-y-2">
                {instructors.map((instructor) => (
                  <div
                    key={instructor.user_id}
                    className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Instructor #{instructor.user_id}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {instructor.email || 'No email on file'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInstructor(instructor.user_id)}
                      disabled={removingInstructorId === instructor.user_id}
                      className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      title="Remove instructor"
                    >
                      <FiTrash2 size={14} />
                      {removingInstructorId === instructor.user_id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-mms-blue text-white rounded-md hover:bg-mms-indigo transition-colors disabled:opacity-50 font-medium text-sm"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

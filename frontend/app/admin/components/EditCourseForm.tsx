'use client';
import React, { useEffect, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { AdminApi } from '@/lib/api/admin';
import { CourseDBObject } from '@/lib/types/courses';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import { UpdateCourseStatusRequest } from '@/lib/api/admin';

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
        const message = error instanceof Error ? error.message : 'Failed to load instructors';
        setInstructorError(message);
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

  const handleChange = (field: string, value: unknown) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    if (localErrors[field]) {
      setLocalErrors({
        ...localErrors,
        [field]: '',
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.course_code.trim()) {
      errors.course_code = 'Course code is required';
    }
    if (!formData.name.trim()) {
      errors.name = 'Course name is required';
    }
    if (formData.credits < 0 || formData.credits > 12) {
      errors.credits = 'Credits must be between 0 and 12';
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const updateData: UpdateCourseStatusRequest = {
        ...formData,
        user_id: userId,
      };
      await AdminApi.UpdateCourseStatus(course.id, updateData);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update course';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveInstructor = async (instructorId: number) => {
    try {
      setRemovingInstructorId(instructorId);
      setInstructorError(null);

      await AdminApi.RemoveInstructor(course.id, instructorId, userId);

      setInstructors(instructors.filter((i) => i.user_id !== instructorId));
      setRemovingInstructorId(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove instructor';
      setInstructorError(message);
      setRemovingInstructorId(null);
    }
  };

  return (
    <Modal
      open
      title="Edit Course"
      onClose={onClose}
      className="max-w-md"
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Course Code *"
            value={formData.course_code}
            onChange={(e) => handleChange('course_code', e.target.value)}
            error={localErrors.course_code}
          />

          <Input
            label="Course Name *"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={localErrors.name}
          />

          <Input
            label="Credits *"
            type="number"
            min="0"
            max="12"
            value={String(formData.credits)}
            onChange={(e) => handleChange('credits', parseInt(e.target.value, 10))}
            error={localErrors.credits}
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={[
              { label: 'Ongoing', value: 'ongoing' },
              { label: 'Completed', value: 'completed' },
            ]}
          />

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Assigned Instructors</h3>
              <p className="mt-1 text-xs text-gray-500">
                Manage who can teach this course from the admin panel.
              </p>
            </div>

            {instructorError && (
              <Alert variant="error" className="text-sm">{instructorError}</Alert>
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
                      <p className="truncate text-sm font-medium text-gray-900">
                        Instructor #{instructor.user_id}
                      </p>
                      <p className="truncate text-xs text-gray-500">
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

          <div className="flex gap-3 border-t border-gray-200 pt-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

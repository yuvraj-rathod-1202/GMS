'use client';

import React, { useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import FormFields from '@/components/ui/FormFields';
import Modal from '@/components/ui/Modal';
import { AdminApi } from '@/lib/api/admin';
import { AddCourseRequest } from '@/lib/types/courses';
import { CourseFormValues, createCourseFields, validateCourseForm } from './courseFormConfig';

type CourseCreateFormState = Omit<CourseFormValues, 'credits'> & {
  credits: number | '';
};

interface CreateCourseFormProps {
  userId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCourseForm({ userId, onClose, onSuccess }: CreateCourseFormProps) {
  const [formData, setFormData] = useState<CourseCreateFormState>({
    course_code: '',
    name: '',
    semester: '',
    credits: 3,
    status: 'ongoing',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CourseFormValues, string>>>(
    {}
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const validationErrors = validateCourseForm(formData, { requireSemester: true });
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);

      const payload: AddCourseRequest & { user_id: number } = {
        user_id: userId,
        course_code: formData.course_code.trim(),
        name: formData.name.trim(),
        semester: formData.semester.trim(),
        credits: Number(formData.credits),
      };

      await AdminApi.CreateCourse(payload);
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Error creating course:', error);
      setError(error instanceof Error ? error.message : 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      title="Create New Course"
      description="Add a new course to the admin catalog."
      onClose={onClose}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}

        <FormFields
          fields={createCourseFields}
          values={formData}
          errors={fieldErrors}
          onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
          disabled={loading}
        />

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Creating...' : 'Create Course'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

'use client';
import React, { useState } from 'react';
import { AdminApi } from '@/lib/api/admin';
import { CourseDBObject } from '@/lib/types/courses';

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
    credits: course.credits,
    status: course.status,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localErrors, setLocalErrors] = useState<{ [key: string]: string }>({});

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
    } catch (err: any) {
      console.error('Error updating course:', err);
      setError(err?.message || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (localErrors[field]) {
      setLocalErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
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

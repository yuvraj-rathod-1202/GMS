import React, { useState, useEffect } from 'react';
import { AssessmentDBObject } from '@/lib/types/assessments';

interface AssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AssessmentFormData) => Promise<void>;
  assessment?: AssessmentDBObject | null;
  isLoading: boolean;
}

export interface AssessmentFormData {
  name: string;
  assessment_type_id: number;
  max_marks: number;
  is_marks_published: boolean;
  assessment_date: string;
}

const ASSESSMENT_TYPES = [
  { id: 1, name: 'Quiz' },
  { id: 2, name: 'Assignment' },
  { id: 3, name: 'Midsem' },
  { id: 4, name: 'EndSem' },
  { id: 5, name: 'Project' },
  { id: 6, name: 'Attendance' },
  { id: 7, name: 'Lab' },
  { id: 8, name: 'Other' },
];

export default function AssessmentDialog({
  isOpen,
  onClose,
  onSubmit,
  assessment,
  isLoading,
}: AssessmentDialogProps) {
  const [formData, setFormData] = useState<AssessmentFormData>({
    name: '',
    assessment_type_id: 1,
    max_marks: 100,
    is_marks_published: false,
    assessment_date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (assessment) {
      setFormData({
        name: assessment.name,
        assessment_type_id: assessment.assessment_type_id,
        max_marks: assessment.max_marks,
        is_marks_published: assessment.is_marks_published,
        assessment_date: new Date(assessment.assessment_date).toISOString().split('T')[0],
      });
    } else {
      setFormData({
        name: '',
        assessment_type_id: 1,
        max_marks: 100,
        is_marks_published: false,
        assessment_date: new Date().toISOString().split('T')[0],
      });
    }
    setErrors({});
  }, [assessment, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Assessment name is required';
    }

    if (!Number.isFinite(formData.max_marks) || formData.max_marks < 0) {
      newErrors.max_marks = 'Max marks must be a positive number';
    }

    if (!formData.assessment_date) {
      newErrors.assessment_date = 'Assessment date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting assessment:', error);
    }
  };

  const handleChange = (field: keyof AssessmentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Dialog Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {assessment ? 'Edit Assessment' : 'Create Assessment'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Assessment Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Midsem, Assignment 1, Quiz 3"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300 focus:border-gray-500'
              }`}
              disabled={isLoading}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Assessment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.assessment_type_id}
              onChange={(e) => handleChange('assessment_type_id', Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-gray-500 transition-colors"
              disabled={isLoading}
            >
              {ASSESSMENT_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Max Marks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Marks <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.max_marks}
              onChange={(e) => handleChange('max_marks', parseFloat(e.target.value))}
              min="0"
              step="0.01"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors ${
                errors.max_marks ? 'border-red-500' : 'border-gray-300 focus:border-gray-500'
              }`}
              disabled={isLoading}
            />
            {errors.max_marks && <p className="text-red-500 text-xs mt-1">{errors.max_marks}</p>}
          </div>

          {/* Assessment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.assessment_date}
              onChange={(e) => handleChange('assessment_date', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors ${
                errors.assessment_date ? 'border-red-500' : 'border-gray-300 focus:border-gray-500'
              }`}
              disabled={isLoading}
            />
            {errors.assessment_date && (
              <p className="text-red-500 text-xs mt-1">{errors.assessment_date}</p>
            )}
          </div>

          {/* Publish Status */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="is_marks_published"
              checked={formData.is_marks_published}
              onChange={(e) => handleChange('is_marks_published', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-2 focus:ring-gray-500 cursor-pointer"
              disabled={isLoading}
            />
            <label
              htmlFor="is_marks_published"
              className="text-sm text-gray-700 cursor-pointer flex-1"
            >
              <span className="font-medium">Publish marks immediately</span>
              <p className="text-xs text-gray-500 mt-0.5">
                Students will be able to view their marks for this assessment
              </p>
            </label>
          </div>

          {/* Dialog Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-700 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
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
                  {assessment ? 'Updating...' : 'Creating...'}
                </>
              ) : assessment ? (
                'Update Assessment'
              ) : (
                'Create Assessment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function getAssessmentTypeName(typeId: number): string {
  const type = ASSESSMENT_TYPES.find((t) => t.id === typeId);
  return type ? type.name : `Type ${typeId}`;
}

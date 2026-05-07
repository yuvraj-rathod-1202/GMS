'use client';

import React, { useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
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
  if (!isOpen) return null;

  return (
    <Modal
      open
      title={assessment ? 'Edit Assessment' : 'Create Assessment'}
      description="Create or update an assessment definition for this course."
      onClose={onClose}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <AssessmentDialogForm
        key={assessment?.id ?? 'new'}
        assessment={assessment}
        isLoading={isLoading}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}

interface AssessmentDialogFormProps {
  assessment?: AssessmentDBObject | null;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: AssessmentFormData) => Promise<void>;
}

function createInitialFormData(assessment?: AssessmentDBObject | null): AssessmentFormData {
  if (assessment) {
    return {
      name: assessment.name,
      assessment_type_id: assessment.assessment_type_id,
      max_marks: assessment.max_marks,
      is_marks_published: assessment.is_marks_published,
      assessment_date: new Date(assessment.assessment_date).toISOString().split('T')[0],
    };
  }

  return {
    name: '',
    assessment_type_id: 1,
    max_marks: 100,
    is_marks_published: false,
    assessment_date: new Date().toISOString().split('T')[0],
  };
}

function AssessmentDialogForm({
  assessment,
  isLoading,
  onClose,
  onSubmit,
}: AssessmentDialogFormProps) {
  const [formData, setFormData] = useState<AssessmentFormData>(() =>
    createInitialFormData(assessment)
  );
  const [errors, setErrors] = useState<Partial<Record<keyof AssessmentFormData, string>>>({});

  const validateForm = () => {
    const newErrors: Partial<Record<keyof AssessmentFormData, string>> = {};

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error submitting assessment:', error);
      }
    }
  };

  const handleChange = (field: keyof AssessmentFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {hasErrors && <Alert variant="error">Please fix the highlighted fields before saving.</Alert>}

      <Input
        label="Assessment Name"
        required
        value={formData.name}
        onChange={(event) => handleChange('name', event.target.value)}
        placeholder="e.g., Midsem, Assignment 1, Quiz 3"
        error={errors.name}
        disabled={isLoading}
      />

      <Select
        label="Assessment Type"
        required
        value={String(formData.assessment_type_id)}
        onChange={(event) => handleChange('assessment_type_id', Number(event.target.value))}
        options={ASSESSMENT_TYPES.map((type) => ({ label: type.name, value: String(type.id) }))}
        disabled={isLoading}
      />

      <Input
        label="Maximum Marks"
        required
        type="number"
        value={formData.max_marks}
        onChange={(event) => handleChange('max_marks', Number(event.target.value))}
        min={0}
        step={0.01}
        error={errors.max_marks}
        disabled={isLoading}
      />

      <Input
        label="Assessment Date"
        required
        type="date"
        value={formData.assessment_date}
        onChange={(event) => handleChange('assessment_date', event.target.value)}
        error={errors.assessment_date}
        disabled={isLoading}
      />

      <Checkbox
        label="Publish marks immediately"
        helperText="Students will be able to view their marks for this assessment"
        checked={formData.is_marks_published}
        onChange={(event) => handleChange('is_marks_published', event.target.checked)}
        disabled={isLoading}
        id="is_marks_published"
      />

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? assessment
              ? 'Updating...'
              : 'Creating...'
            : assessment
              ? 'Update Assessment'
              : 'Create Assessment'}
        </Button>
      </div>
    </form>
  );
}

export function getAssessmentTypeName(typeId: number): string {
  const type = ASSESSMENT_TYPES.find((t) => t.id === typeId);
  return type ? type.name : `Type ${typeId}`;
}

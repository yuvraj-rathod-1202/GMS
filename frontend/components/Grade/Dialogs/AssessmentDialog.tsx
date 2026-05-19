'use client';

import React, { useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import { AssessmentDBObject } from '@/lib/types/assessments';

export interface AssessmentCategory {
  id: number;
  type: string;
}

interface AssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AssessmentFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  assessment?: AssessmentDBObject | null;
  isLoading: boolean;
  categories: AssessmentCategory[];
  onAddCategory?: (type: string) => Promise<any>;
}

export interface AssessmentFormData {
  name: string;
  assessment_type_id: number;
  max_marks: number;
  is_marks_published: boolean;
  assessment_date: string;
}

export default function AssessmentDialog({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  assessment,
  isLoading,
  categories,
  onAddCategory,
}: AssessmentDialogProps) {
  if (!isOpen) return null;

  return (
    <Modal
      open
      title={assessment ? 'Edit Assessment' : 'Create Assessment'}
      description="Update the detail for this assessment."
      onClose={onClose}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <AssessmentDialogForm
        key={assessment?.id ?? 'new'}
        assessment={assessment}
        isLoading={isLoading}
        onClose={onClose}
        onSubmit={onSubmit}
        onDelete={onDelete}
        categories={categories}
        onAddCategory={onAddCategory}
      />
    </Modal>
  );
}

interface AssessmentDialogFormProps {
  assessment?: AssessmentDBObject | null;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: AssessmentFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  categories: AssessmentCategory[];
  onAddCategory?: (type: string) => Promise<any>;
}

function createInitialFormData(
  assessment?: AssessmentDBObject | null,
  defaultCategory?: number
): AssessmentFormData {
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
    assessment_type_id: defaultCategory || 1,
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
  onDelete,
  categories,
  onAddCategory,
}: AssessmentDialogFormProps) {
  const defaultCatId = categories && categories.length > 0 ? categories[0].id : 1;
  const [formData, setFormData] = useState<AssessmentFormData>(() =>
    createInitialFormData(assessment, defaultCatId)
  );
  const [errors, setErrors] = useState<Partial<Record<keyof AssessmentFormData, string>>>({});
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

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

  const handleChange = async (
    field: keyof AssessmentFormData,
    value: string | number | boolean
  ) => {
    if (field === 'assessment_type_id' && value === -1) {
      if (!onAddCategory) return;
      const name = prompt('Enter the name of the new assessment category:');
      if (name && name.trim()) {
        setIsCreatingCategory(true);
        try {
          const newCategory = await onAddCategory(name.trim());
          if (newCategory && newCategory.id) {
            setFormData((prev) => ({ ...prev, assessment_type_id: newCategory.id }));
          }
        } catch (err) {
          alert('Failed to create assessment category');
        } finally {
          setIsCreatingCategory(false);
        }
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  const selectOptions = [
    ...categories.map((type) => ({ label: type.type, value: String(type.id) })),
    ...(onAddCategory ? [{ label: '+ Add New Category...', value: '-1' }] : []),
  ];

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
        disabled={isLoading || isCreatingCategory}
      />

      <Select
        label="Assessment Type"
        required
        value={String(formData.assessment_type_id)}
        onChange={(event) => handleChange('assessment_type_id', Number(event.target.value))}
        options={selectOptions}
        disabled={isLoading || isCreatingCategory}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          label="Maximum Marks"
          required
          type="number"
          value={formData.max_marks}
          onChange={(event) => handleChange('max_marks', Number(event.target.value))}
          min={0}
          step={0.01}
          error={errors.max_marks}
          disabled={isLoading || isCreatingCategory}
        />

        <Input
          label="Assessment Date"
          required
          type="date"
          value={formData.assessment_date}
          onChange={(event) => handleChange('assessment_date', event.target.value)}
          error={errors.assessment_date}
          disabled={isLoading || isCreatingCategory}
        />
      </div>

      <Switch
        label="Publish marks immediately"
        helperText="Students will be able to view their marks for this assessment"
        checked={formData.is_marks_published}
        onChange={(checked) => handleChange('is_marks_published', checked)}
        disabled={isLoading || isCreatingCategory}
        id="is_marks_published"
      />

      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <div>
          {assessment && onDelete && (
            <Button
              type="button"
              variant="danger"
              onClick={onDelete}
              disabled={isLoading || isCreatingCategory}
            >
              Delete Assessment
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading || isCreatingCategory}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isCreatingCategory}>
            {isLoading || isCreatingCategory
              ? isCreatingCategory
                ? 'Creating Category...'
                : assessment
                  ? 'Updating...'
                  : 'Creating...'
              : assessment
                ? 'Update Assessment'
                : 'Create Assessment'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function getAssessmentTypeName(typeId: number, categories?: AssessmentCategory[]): string {
  if (categories && categories.length > 0) {
    const found = categories.find((c) => c.id === typeId);
    if (found) return found.type;
  }
  const types: { [key: number]: string } = {
    1: 'Quiz',
    2: 'Assignment',
    3: 'Midsem',
    4: 'EndSem',
    5: 'Project',
    6: 'Attendance',
    7: 'Lab',
    8: 'Other',
  };
  return types[typeId] || `Type ${typeId}`;
}

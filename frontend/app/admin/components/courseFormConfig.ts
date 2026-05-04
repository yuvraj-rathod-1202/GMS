import { FormFieldConfig } from '@/components/ui/FormFields';
import { UpdateCourseRequest } from '@/lib/types/courses';

export type CourseFormValues = {
  course_code: string;
  name: string;
  semester: string;
  credits: number | '';
  status: NonNullable<UpdateCourseRequest['status']> | 'active' | 'inactive';
};

export const courseStatusOptions = [
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export const createCourseFields: FormFieldConfig<CourseFormValues>[] = [
  {
    name: 'course_code',
    label: 'Course Code',
    placeholder: 'e.g., CS101',
    required: true,
    helperText: 'Use the canonical code used across the LMS.',
  },
  {
    name: 'name',
    label: 'Course Name',
    placeholder: 'e.g., Introduction to Computer Science',
    required: true,
  },
  {
    name: 'semester',
    label: 'Semester',
    placeholder: 'e.g., Fall 2024',
    required: true,
  },
  {
    name: 'credits',
    label: 'Credits',
    type: 'number',
    required: true,
    min: 0,
    max: 12,
  },
];

export const editCourseFields: FormFieldConfig<CourseFormValues>[] = [
  {
    name: 'course_code',
    label: 'Course Code',
    required: true,
  },
  {
    name: 'name',
    label: 'Course Name',
    required: true,
  },
  {
    name: 'credits',
    label: 'Credits',
    type: 'number',
    required: true,
    min: 0,
    max: 12,
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: courseStatusOptions,
    required: true,
  },
];

type ValidationOptions = {
  requireSemester?: boolean;
};

export function validateCourseForm(values: Partial<CourseFormValues>, options: ValidationOptions = {}) {
  const errors: Partial<Record<keyof CourseFormValues, string>> = {};
  const requireSemester = options.requireSemester ?? false;

  if (!values.course_code?.trim()) {
    errors.course_code = 'Course code is required';
  } else if (values.course_code.trim().length > 10) {
    errors.course_code = 'Course code must be 10 characters or less';
  }

  if (!values.name?.trim()) {
    errors.name = 'Course name is required';
  } else if (values.name.trim().length > 100) {
    errors.name = 'Course name must be 100 characters or less';
  }

  if (requireSemester && !values.semester?.trim()) {
    errors.semester = 'Semester is required';
  }

  if (typeof values.credits !== 'number' || Number.isNaN(values.credits)) {
    errors.credits = 'Credits must be a number';
  } else if (values.credits < 0 || values.credits > 12) {
    errors.credits = 'Credits must be between 0 and 12';
  }

  return errors;
}
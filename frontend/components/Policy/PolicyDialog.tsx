'use client';

import React, { useState } from 'react';
import { BiInfoCircle, BiTrash } from 'react-icons/bi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { AssessmentDBObject } from '@/lib/types/assessments';
import { PolicyDBObject } from '@/lib/types/policy';

export const ASSESSMENT_CATEGORIES = {
  1: 'Quiz',
  2: 'Assignment',
  3: 'Midsem',
  4: 'EndSem',
  5: 'Project',
  6: 'Attendance',
  7: 'Lab',
  8: 'Other',
} as const;

export type CategoryId = keyof typeof ASSESSMENT_CATEGORIES;

export const CATEGORY_IDS = Object.keys(ASSESSMENT_CATEGORIES).map(Number) as CategoryId[];

interface PolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PolicyFormData) => Promise<void>;
  policy?: PolicyDBObject | null;
  assessments: AssessmentDBObject[];
  isLoading: boolean;
}

export interface PolicyRuleFormData {
  id?: number;
  rule_type: 'CUMULATIVE' | 'EQUAL_WEIGHTAGE' | 'BEST_N' | 'CUSTOM';
  rule_params: Record<string, number>;
}

export interface PolicyComponentFormData {
  component_id?: number;
  assessment_category_id: number;
  weightage: number;
  rules: PolicyRuleFormData;
}

export interface PolicyFormData {
  policy_name: string;
  total_weightage: number;
  components: PolicyComponentFormData[];
}

const RULE_TYPES = [
  {
    id: 'CUMULATIVE',
    label: 'Cumulative',
    desc: 'Sum of all marks / Sum of max marks.',
    title:
      'Sum of Marks: Calculates based on total marks obtained divided by total maximum marks across all assessments.',
  },
  {
    id: 'EQUAL_WEIGHTAGE',
    label: 'Equal Weight',
    desc: 'Average of percentages.',
    title:
      'Average of Percentages: Treats every assessment equally, regardless of its max marks (e.g. a 10-mark quiz counts the same as a 50-mark quiz).',
  },
  {
    id: 'BEST_N',
    label: 'Best N',
    desc: 'Top X scores only.',
    title:
      "Top Scores: Mark of Each Assessment will be converted into out of 100. Then only includes the highest scoring 'N' assessments in the calculation (drops the lowest scores).",
  },
  {
    id: 'CUSTOM',
    label: 'Custom',
    desc: 'Manual weights per item.',
    title:
      'Manual Assignment: Allows you to manually set a specific percentage weight for each individual assessment.',
  },
] as const;

const DEFAULT_COMPONENTS: PolicyComponentFormData[] = [1, 2, 3, 4, 5].map(
  (assessment_category_id) => ({
    assessment_category_id,
    weightage: 20,
    rules: { rule_type: 'CUMULATIVE', rule_params: {} },
  })
);

const createInitialFormData = (policy?: PolicyDBObject | null): PolicyFormData => {
  if (policy) {
    return {
      policy_name: policy.policy_name,
      total_weightage: policy.total_weightage,
      components: policy.components.map((component) => ({
        component_id: component.id,
        assessment_category_id: component.assessment_category_id,
        weightage: component.weightage,
        rules: component.rules
          ? {
              id: component.rules.id,
              rule_type: component.rules.rule_type,
              rule_params: component.rules.rule_params as Record<string, number>,
            }
          : { rule_type: 'CUMULATIVE', rule_params: {} },
      })),
    };
  }

  return {
    policy_name: '',
    total_weightage: 100,
    components: DEFAULT_COMPONENTS.map((component) => ({
      assessment_category_id: component.assessment_category_id,
      weightage: component.weightage,
      rules: { rule_type: component.rules.rule_type, rule_params: {} },
    })),
  };
};

const getAssessmentTypeLabel = (typeId: number): string => {
  return ASSESSMENT_CATEGORIES[typeId as CategoryId] || 'Unknown';
};

export default function PolicyDialog({
  isOpen,
  onClose,
  onSubmit,
  policy,
  assessments,
  isLoading,
}: PolicyDialogProps) {
  if (!isOpen) return null;

  return (
    <Modal
      open
      title={policy ? 'Edit Policy' : 'Create Grading Policy'}
      onClose={onClose}
      className="max-h-[90vh] max-w-5xl overflow-y-auto"
    >
      <PolicyDialogForm
        key={policy?.id ?? 'new'}
        policy={policy}
        assessments={assessments}
        isLoading={isLoading}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}

function PolicyDialogForm({
  policy,
  assessments,
  isLoading,
  onClose,
  onSubmit,
}: {
  policy?: PolicyDBObject | null;
  assessments: AssessmentDBObject[];
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: PolicyFormData) => Promise<void>;
}) {
  const [formData, setFormData] = useState<PolicyFormData>(() => createInitialFormData(policy));
  const [addComponentLabel, setAddComponentLabel] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addComponent = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        {
          assessment_category_id: categoryId,
          weightage: 0,
          rules: { rule_type: 'CUMULATIVE', rule_params: {} },
        },
      ],
    }));
    setAddComponentLabel(false);
  };

  const getAvailableCategories = () => {
    const usedCategoryIds = formData.components.map(
      (component) => component.assessment_category_id
    );
    return CATEGORY_IDS.filter((id) => !usedCategoryIds.includes(id));
  };

  const removeComponent = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.filter(
        (component) => component.assessment_category_id !== categoryId
      ),
    }));
  };

  const updateComponent = (
    index: number,
    field: string,
    value: string | number | Record<string, number>
  ) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.map((component) => {
        if (component.assessment_category_id !== index) {
          return component;
        }

        if (field === 'rules_type') {
          const ruleType = value as PolicyRuleFormData['rule_type'];
          return {
            ...component,
            rules: {
              ...component.rules,
              rule_type: ruleType,
              rule_params:
                ruleType === 'BEST_N' || ruleType === 'CUSTOM' ? component.rules.rule_params : {},
            },
          };
        }

        if (field === 'rules_params') {
          return {
            ...component,
            rules: {
              ...component.rules,
              rule_params: value as Record<string, number>,
            },
          };
        }

        if (field.startsWith('rules_n_')) {
          return {
            ...component,
            rules: {
              ...component.rules,
              rule_params: { n: parseInt(String(value), 10) || 0 },
            },
          };
        }

        if (field === 'weightage') {
          return {
            ...component,
            weightage: Number(value),
          };
        }

        return {
          ...component,
          [field]: value,
        } as PolicyComponentFormData;
      }),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.policy_name.trim()) {
      newErrors.policy_name = 'Policy name is required';
    }

    if (formData.total_weightage < 0) {
      newErrors.total_weightage = 'Total weightage must be between 1 and 100';
    }

    const totalComponentWeightage = formData.components.reduce(
      (sum, component) => sum + (component.weightage || 0),
      0
    );

    if (totalComponentWeightage > formData.total_weightage) {
      newErrors.total_weightage = `Components total (${totalComponentWeightage}%) exceeds policy weightage (${formData.total_weightage}%)`;
    }

    formData.components.forEach((component, index) => {
      if (component.weightage < 0) {
        newErrors[`components_weightage_${index}`] = 'Component weightage must be greater than 0';
      }

      if (component.rules.rule_type === 'CUSTOM') {
        const customWeightages = component.rules.rule_params || {};
        const totalCustomWeightage = Object.values(customWeightages).reduce(
          (sum, value) => sum + (Number(value) || 0),
          0
        );

        if (totalCustomWeightage > component.weightage) {
          newErrors[`components_custom_${index}`] =
            `Custom weightages total (${totalCustomWeightage}%) exceeds component limit (${component.weightage}%)`;
        }
      }
    });

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

  const handleChange = (field: keyof PolicyFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const currentTotal = formData.components.reduce(
    (sum, component) => sum + (Number(component.weightage) || 0),
    0
  );
  const isOverweight = currentTotal > formData.total_weightage;
  const isUnderweight = currentTotal < formData.total_weightage;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Input
          label="Grading Policy Name"
          required
          value={formData.policy_name}
          onChange={(event) => handleChange('policy_name', event.target.value)}
          placeholder="e.g., Regular Grading, Audit Grading"
          error={errors.policy_name}
          disabled={isLoading}
        />

        <Input
          label="Total Weightage (%)"
          required
          type="number"
          value={formData.total_weightage}
          onChange={(event) => handleChange('total_weightage', Number(event.target.value))}
          min={0}
          error={errors.total_weightage}
          disabled={isLoading}
        />
      </div>

      <div className="sticky top-0 z-20 -mx-6 bg-white px-6 py-2 mb-4 border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3
            className="text-lg font-bold text-gray-900"
            title="Define the distinct categories (buckets) that make up the final grade, such as Quizzes, Labs, or Exams."
          >
            Grading Components
          </h3>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setAddComponentLabel(true)}
            className="px-3 py-1.5 text-sm font-bold text-blue-600 hover:bg-blue-50"
          >
            + Add Component
          </Button>
        </div>

        <div
          className="rounded-xl border border-gray-200 bg-gray-50 p-3"
          title="Visualizes the distribution of marks. Ensure the bar is full (100%) but not overflowing (Red)."
        >
          <div className="mb-1.5 flex justify-between text-xs font-medium">
            <span>Weightage Allocation</span>
            <span
              className={
                isOverweight ? 'text-red-600' : isUnderweight ? 'text-orange-600' : 'text-green-600'
              }
            >
              {currentTotal}% / {formData.total_weightage}%{' '}
              {!isUnderweight && !isOverweight ? '✓' : ''}
            </span>
          </div>
          <div className="flex h-2.5 w-full gap-1">
            {formData.components.map((component, index) => (
              <div
                key={`${component.assessment_category_id}-${index}`}
                style={{
                  width: `${Math.min((component.weightage / formData.total_weightage) * 100, 100)}%`,
                }}
                className={`rounded-full ${['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500'][index % 4]}`}
              />
            ))}
            {isOverweight && <div className="flex-1 rounded-full animate-pulse bg-red-500" />}
            {isUnderweight && <div className="flex-1 rounded-full bg-gray-200" />}
          </div>

          <div className="mt-1.5 flex gap-4 text-[10px] font-semibold text-gray-500 overflow-x-auto pb-1">
            {isUnderweight && (
              <div className="text-orange-500 whitespace-nowrap">
                Missing: {formData.total_weightage - currentTotal}%
              </div>
            )}
            {isOverweight && (
              <div className="text-red-500 whitespace-nowrap">
                Exceeds: {currentTotal - formData.total_weightage}%
              </div>
            )}
            {!isUnderweight && !isOverweight && (
              <div className="text-green-500 whitespace-nowrap">Allocation Balanced ✓</div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {formData.components.map((component, index) => (
          <div
            key={component.assessment_category_id}
            className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {getAssessmentTypeLabel(component.assessment_category_id)}
              </span>
              {formData.components.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeComponent(component.assessment_category_id)}
                  disabled={isLoading}
                  className="p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove component"
                >
                  <BiTrash className="text-xl" />
                </Button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Weightage (%)"
                type="number"
                value={component.weightage}
                onChange={(event) =>
                  updateComponent(
                    component.assessment_category_id,
                    'weightage',
                    Number(event.target.value)
                  )
                }
                min={0}
                placeholder="0"
                disabled={isLoading}
                error={errors[`components_weightage_${index}`]}
                className="text-xs h-8"
                labelClassName="text-[10px]"
              />
              {component.rules.rule_type === 'BEST_N' && (
                <Input
                  label="Best N to consider"
                  type="number"
                  value={component.rules.rule_params.n || 0}
                  onChange={(event) =>
                    updateComponent(
                      component.assessment_category_id,
                      'rules_n_value',
                      event.target.value
                    )
                  }
                  min={0}
                  placeholder="e.g., 3"
                  disabled={isLoading}
                  className="text-xs h-8"
                  labelClassName="text-[10px]"
                />
              )}
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Calculation Rule
              </label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {RULE_TYPES.map((rule) => (
                  <Button
                    key={rule.id}
                    type="button"
                    variant="ghost"
                    title={rule.title}
                    onClick={() =>
                      updateComponent(component.assessment_category_id, 'rules_type', rule.id)
                    }
                    className={`h-auto flex-col items-start rounded-lg border p-2 text-left transition-all ${
                      component.rules.rule_type === rule.id
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-gray-900">{rule.label}</div>
                    <div className="mt-1 text-[10px] leading-tight text-gray-500">{rule.desc}</div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              {component.rules.rule_type === 'CUMULATIVE' && (
                <p className="flex items-center gap-2 text-gray-600">
                  <BiInfoCircle /> All assessments in this category will be summed up.
                </p>
              )}

              {component.rules.rule_type === 'EQUAL_WEIGHTAGE' && (
                <p className="flex items-center gap-2 text-gray-600">
                  <BiInfoCircle /> All assessments in this category will be assigned equal weightage
                  each.
                </p>
              )}

              {component.rules.rule_type === 'CUSTOM' && (
                <div className="space-y-2">
                  <label className="mb-1.5 block text-xs text-gray-600">
                    Custom Weightage per Assessment
                  </label>
                  {(() => {
                    const categoryAssessments = assessments.filter(
                      (assessment) =>
                        assessment.assessment_type_id === component.assessment_category_id
                    );
                    const customWeightages = component.rules.rule_params || {};
                    const totalCustomWeightage = Object.values(customWeightages).reduce(
                      (sum, value) => sum + (Number(value) || 0),
                      0
                    );
                    const exceedsLimit = totalCustomWeightage > component.weightage;

                    if (categoryAssessments.length === 0) {
                      return (
                        <p className="py-2 text-xs italic text-gray-500">
                          No assessments found for this category. First create assessments to set
                          Custom policy.
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {categoryAssessments.map((assessment) => (
                          <div key={assessment.id} className="flex items-center gap-2">
                            <label className="flex-1 truncate text-xs text-gray-700">
                              {assessment.name}
                            </label>
                            <Input
                              type="number"
                              value={customWeightages[assessment.id] || 0}
                              onChange={(event) => {
                                const nextWeightages = {
                                  ...customWeightages,
                                  [assessment.id]: Number(event.target.value) || 0,
                                };
                                updateComponent(
                                  component.assessment_category_id,
                                  'rules_params',
                                  nextWeightages
                                );
                              }}
                              min={0}
                              max={component.weightage}
                              placeholder="0"
                              disabled={isLoading}
                              wrapperClassName="w-20"
                            />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2">
                          <div className="flex-1 text-xs text-blue-700">
                            Sum of weightage of individual assessments should not exceed the
                            component weightage.
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">Total:</span>
                            <span
                              className={`text-xs font-medium ${
                                exceedsLimit
                                  ? 'text-red-600'
                                  : totalCustomWeightage === component.weightage
                                    ? 'text-green-600'
                                    : 'text-gray-700'
                              }`}
                            >
                              {totalCustomWeightage}% / {component.weightage}%
                            </span>
                          </div>
                        </div>
                        {exceedsLimit && (
                          <p className="mt-1 text-xs text-red-600">
                            Total weightage exceeds component limit
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {errors[`components_custom_${index}`] && (
              <p className="mt-1 text-xs text-red-500">{errors[`components_custom_${index}`]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 z-20 -mx-6 flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-2xl">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isOverweight || isLoading}>
          {isLoading ? 'Saving...' : 'Save Policy'}
        </Button>
      </div>

      {addComponentLabel && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Select Category to Add</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose an assessment category for the new component
              </p>
            </div>

            <div className="p-6">
              {getAvailableCategories().length > 0 ? (
                <div className="space-y-2">
                  {getAvailableCategories().map((categoryId) => (
                    <Button
                      key={categoryId}
                      type="button"
                      variant="secondary"
                      onClick={() => addComponent(categoryId)}
                      className="h-auto w-full justify-between rounded-lg px-4 py-3 text-left"
                    >
                      <span className="font-medium text-gray-900">
                        {ASSESSMENT_CATEGORIES[categoryId as CategoryId]}
                      </span>
                      <span className="text-sm text-gray-500">Add →</span>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <BiInfoCircle className="mx-auto mb-3 text-4xl text-gray-400" />
                  <p className="text-gray-600">All categories have been added</p>
                </div>
              )}
            </div>

            <div className="flex justify-end rounded-b-xl border-t border-gray-200 bg-gray-50 p-6">
              <Button type="button" variant="secondary" onClick={() => setAddComponentLabel(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export function getAssessmentTypeName(typeId: number): string {
  const type = ASSESSMENT_CATEGORIES[typeId as CategoryId];
  return type || `Type ${typeId}`;
}

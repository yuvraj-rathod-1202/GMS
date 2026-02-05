import React, { useState, useEffect, Component } from 'react';
import { PolicyDBObject } from '@/lib/types/policy';
import { AssessmentDBObject } from '@/lib/types/assessments';
import { BiInfoCircle, BiTrash } from 'react-icons/bi';
export const ASSESSMENT_CATEGORIES = {
  1: 'Quiz',
  2: 'Assignment',
  3: 'Midsem',
  4: 'EndSem',
  5: 'Project',
  6: 'Attendance',
  7: 'Lab',
} as const;

export type CategoryId = keyof typeof ASSESSMENT_CATEGORIES;

export const CATEGORY_IDS = Object.keys(ASSESSMENT_CATEGORIES).map(Number) as CategoryId[];

interface PolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PolicyFormData) => Promise<void>;
  policy?: PolicyDBObject | null;
  assessments: AssessmentDBObject[] | [];
  isLoading: boolean;
}

export interface PolicyRuleFormData {
  id?: number;
  rule_type: 'CUMULATIVE' | 'EQUAL_WEIGHTAGE' | 'BEST_N' | 'CUSTOM';
  rule_params: Record<any, any>;
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

const getAssessmentTypeLabel = (typeId: number): string => {
  const types: { [key: number]: string } = {
    1: 'Quiz',
    2: 'Assignment',
    3: 'Midsem',
    4: 'EndSem',
    5: 'Project',
    6: 'Attendance',
    7: 'Lab',
  };
  return types[typeId] || 'Unknown';
};
const RULE_TYPES = [
  {
    id: 'CUMULATIVE',
    label: 'Cumulative',
    desc: 'Sum of all marks / Sum of max marks.',
    example: 'Good for standard exams.',
    title:
      'Sum of Marks: Calculates based on total marks obtained divided by total maximum marks across all assessments.',
  },
  {
    id: 'EQUAL_WEIGHTAGE',
    label: 'Equal Weight',
    desc: 'Average of percentages.',
    example: 'Good if Quiz 1 is 10 marks and Quiz 2 is 50, but both are worth equal.',
    title:
      'Average of Percentages: Treats every assessment equally, regardless of its max marks (e.g. a 10-mark quiz counts the same as a 50-mark quiz).',
  },
  {
    id: 'BEST_N',
    label: 'Best N',
    desc: 'Top X scores only.',
    example: 'Drops the lowest scores.',
    title:
      "Top Scores: Mark of Each Assessment will be converted into out of 100. Then only includes the highest scoring 'N' assessments in the calculation (drops the lowest scores).",
  },
  {
    id: 'CUSTOM',
    label: 'Custom',
    desc: 'Manual weights per item.',
    example: 'Assign specific % to specific quizzes.',
    title:
      'Manual Assignment: Allows you to manually set a specific percentage weight for each individual assessment.',
  },
];

export default function PolicyDialog({
  isOpen,
  onClose,
  onSubmit,
  policy,
  assessments,
  isLoading,
}: PolicyDialogProps) {
  const [formData, setFormData] = useState<PolicyFormData>({
    policy_name: '',
    total_weightage: 100,
    components: [
      {
        assessment_category_id: 1,
        weightage: 20,
        rules: {
          rule_type: 'CUMULATIVE',
          rule_params: {},
        },
      },
      {
        assessment_category_id: 2,
        weightage: 20,
        rules: {
          rule_type: 'CUMULATIVE',
          rule_params: {},
        },
      },
      {
        assessment_category_id: 3,
        weightage: 20,
        rules: {
          rule_type: 'CUMULATIVE',
          rule_params: {},
        },
      },
      {
        assessment_category_id: 4,
        weightage: 20,
        rules: {
          rule_type: 'CUMULATIVE',
          rule_params: {},
        },
      },
      {
        assessment_category_id: 5,
        weightage: 20,
        rules: {
          rule_type: 'CUMULATIVE',
          rule_params: {},
        },
      },
    ],
  });
  const [addComponentLabel, setAddComponentLabel] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const addComponent = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        {
          assessment_category_id: categoryId,
          weightage: 0,
          rules: {
            rule_type: 'CUMULATIVE',
            rule_params: {},
          },
        },
      ],
    }));
    setAddComponentLabel(false);
  };

  const getAvailableCategories = () => {
    const usedCategoryIds = formData.components.map((comp) => comp.assessment_category_id);
    return CATEGORY_IDS.filter((id) => !usedCategoryIds.includes(id));
  };

  const removeComponent = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.filter((comp, i) => comp.assessment_category_id !== index),
    }));
  };

  const updateComponent = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.map((comp, i) => {
        if (comp.assessment_category_id === index) {
          if (field === 'rules_type') {
            return {
              ...comp,
              rules: {
                ...comp.rules,
                rule_type: value,
                rule_params: value === 'BEST_N' || value === 'CUSTOM' ? comp.rules.rule_params : {},
              },
            };
          } else if (field === 'rules_params') {
            return {
              ...comp,
              rules: {
                ...comp.rules,
                rule_params: value,
              },
            };
          } else if (field.startsWith('rules_n_')) {
            return {
              ...comp,
              rules: {
                ...comp.rules,
                rule_params: { n: parseInt(value) || 0 },
              },
            };
          } else {
            return {
              ...comp,
              [field]: value,
            };
          }
        }
        return comp;
      }),
    }));
  };

  useEffect(() => {
    if (policy) {
      setFormData({
        policy_name: policy.policy_name,
        total_weightage: policy.total_weightage,
        components: [...policy.components].map((c) => ({
          component_id: c.id,
          assessment_category_id: c.assessment_category_id,
          weightage: c.weightage,
          rules: c.rules
            ? {
                id: c.rules.id,
                rule_type: c.rules.rule_type,
                rule_params: c.rules.rule_params,
              }
            : {
                rule_type: 'CUMULATIVE',
                rule_params: {},
              },
        })),
      });
    } else {
      setFormData({
        policy_name: '',
        total_weightage: 100,
        components: [
          {
            assessment_category_id: 1,
            weightage: 20,
            rules: {
              rule_type: 'CUMULATIVE',
              rule_params: {},
            },
          },
          {
            assessment_category_id: 2,
            weightage: 20,
            rules: {
              rule_type: 'CUMULATIVE',
              rule_params: {},
            },
          },
          {
            assessment_category_id: 3,
            weightage: 20,
            rules: {
              rule_type: 'CUMULATIVE',
              rule_params: {},
            },
          },
          {
            assessment_category_id: 4,
            weightage: 20,
            rules: {
              rule_type: 'CUMULATIVE',
              rule_params: {},
            },
          },
          {
            assessment_category_id: 5,
            weightage: 20,
            rules: {
              rule_type: 'CUMULATIVE',
              rule_params: {},
            },
          },
        ],
      });
    }
    setErrors({});
  }, [policy, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.policy_name.trim()) {
      newErrors.policy_name = 'Policy name is required';
    }
    if (formData.total_weightage < 0) {
      newErrors.total_weightage = 'Total weightage must be between 1 and 100';
    }

    // Calculate total of all component weightages
    const totalComponentWeightage = formData.components.reduce(
      (sum, component) => sum + (component.weightage || 0),
      0
    );

    // Check if total component weightages exceed policy total weightage
    if (totalComponentWeightage > formData.total_weightage) {
      newErrors.total_weightage = `Components total (${totalComponentWeightage}%) exceeds policy weightage (${formData.total_weightage}%)`;
    }

    formData.components.forEach((component, index) => {
      if (component.weightage < 0) {
        newErrors[`components_weightage_${index}`] = 'Component weightage must be greater than 0';
      }

      // Validate CUSTOM rule type weightages
      if (component.rules.rule_type === 'CUSTOM') {
        const customWeightages = component.rules.rule_params || {};
        const totalCustomWeightage = Object.values(customWeightages).reduce(
          (sum: number, val: any) => sum + (Number(val) || 0),
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

  const handleChange = (field: keyof PolicyFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  const currentTotal = formData.components.reduce(
    (acc: number, curr: any) => acc + (Number(curr.weightage) || 0),
    0
  );
  const isOverweight = currentTotal > formData.total_weightage;
  const isUnderweight = currentTotal < formData.total_weightage;

  return (
    <>
      {/* Main Policy Dialog */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          {/* Dialog Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {policy ? 'Edit Policy' : 'Create Grading Policy'}
              </h2>
              <p className="text-xs text-blue-500">Hover over any field for more information.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              &times;
            </button>
          </div>

          <div className="overflow-y-auto p-6 space-y-8 flex-1">
            <div className="grid md:grid-cols-2 gap-6">
              <div title="Give this policy a unique name to distinguish it from others (e.g., 'Regular Grading' vs 'Audit Grading').">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grading Policy Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.policy_name}
                  onChange={(e) => handleChange('policy_name', e.target.value)}
                  placeholder="e.g., Regular Grading, Audit Grading"
                  className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors ${
                    errors.policy_name ? 'border-red-500' : 'border-gray-300 focus:border-gray-500'
                  }`}
                  disabled={isLoading}
                />
                {errors.policy_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.policy_name}</p>
                )}
              </div>

              <div title="The target sum for all components combined. Standard courses typically use 100%.">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Weightage (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.total_weightage}
                  onChange={(e) => handleChange('total_weightage', Number(e.target.value))}
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors ${
                    errors.total_weightage
                      ? 'border-red-500'
                      : 'border-gray-300 focus:border-gray-500'
                  }`}
                  disabled={isLoading}
                />
                {errors.total_weightage && (
                  <p className="text-red-500 text-xs mt-1">{errors.total_weightage}</p>
                )}
              </div>
            </div>

            <div
              className="bg-gray-50 p-4 rounded-xl border border-gray-200"
              title="Visualizes the distribution of marks. Ensure the bar is full (100%) but not overflowing (Red)."
            >
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Weightage Allocation</span>
                <span
                  className={
                    isOverweight
                      ? 'text-red-600'
                      : isUnderweight
                        ? 'text-orange-600'
                        : 'text-green-600'
                  }
                >
                  {currentTotal}% / {formData.total_weightage}%
                </span>
              </div>
              {/* Progress Bar */}
              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden flex">
                {formData.components.map((comp: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      width: `${Math.min((comp.weightage / formData.total_weightage) * 100, 100)}%`,
                    }}
                    className={`${['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500'][i % 4]}`}
                  />
                ))}
                {/* Warning strip if overweight */}
                {isOverweight && <div className="bg-red-500 flex-1 animate-pulse" />}
              </div>
              <p className="text-xs font-semibold text-gray-500 mt-2">
                <div className="space-y-2">
                  <div className="text-blue-500">
                    {isUnderweight && 'You still have percentage points to assign.'}
                  </div>
                  <div className="text-red-500">
                    {isOverweight && 'Total exceeds 100%. Please reduce component weightages.'}
                  </div>
                  <div className="text-green-500">
                    {!isUnderweight && !isOverweight && 'Total weightage allocated correctly.'}
                  </div>
                  {
                    <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {formData.components.map((c, i) => (
                        <div>
                          <p key={i} className="flex justify-start gap-2">
                            <span>{getAssessmentTypeLabel(c.assessment_category_id)}</span>
                            <span>{c.weightage}%</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  }
                </div>
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3
                  className="text-lg font-bold text-gray-900"
                  title="Define the distinct categories (buckets) that make up the final grade, such as Quizzes, Labs, or Exams."
                >
                  Grading Components
                </h3>
                <button
                  // onClick={addComponent}
                  onClick={() => setAddComponentLabel(true)}
                  title="Add a new grading component to this policy."
                  className="text-sm text-blue-600 font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add Component
                </button>
              </div>

              <div className="space-y-4">
                {formData.components.map((component, idx) => (
                  <div
                    key={component.assessment_category_id}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {getAssessmentTypeLabel(component.assessment_category_id)}
                      </span>
                      {formData.components.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeComponent(component.assessment_category_id)}
                          disabled={isLoading}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        >
                          <BiTrash className="text-xl" />
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Category */}
                      {/* <div title="Select the assessment category (e.g., Quizzes, Assignments) to group under this component.">
                        <label className="block text-xs text-gray-600 mb-1.5">Category</label>
                        <select
                          value={component.assessment_category_id}
                          onChange={(e) =>
                            updateComponent(
                              component.assessment_category_id,
                              'assessment_category_id',
                              Number(e.target.value)
                            )
                          }
                          disabled={isLoading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white disabled:opacity-50"
                        >
                          {CATEGORY_IDS.filter((id: number) => {
                            if (id === component.assessment_category_id) return true;
                            return !formData.components.some(
                              (comp, compIdx) =>
                                compIdx !== component.assessment_category_id &&
                                comp.assessment_category_id === id
                            );
                          }).map((id: number) => (
                            <option key={id} value={id}>
                              {ASSESSMENT_CATEGORIES[id as keyof typeof ASSESSMENT_CATEGORIES]}
                            </option>
                          ))}
                        </select>
                      </div> */}

                      {/* Weightage */}
                      <div title="The percentage of the final grade allocated to this specific component.">
                        <label className="block text-xs text-gray-600 mb-1.5">Weightage (%)</label>
                        <input
                          type="number"
                          value={component.weightage}
                          onChange={(e) =>
                            updateComponent(
                              component.assessment_category_id,
                              'weightage',
                              Number(e.target.value)
                            )
                          }
                          min="0"
                          placeholder="0"
                          disabled={isLoading}
                          className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${
                            errors[`components_weightage_${component.assessment_category_id}`]
                              ? 'border-red-500'
                              : 'border-gray-300 focus:border-blue-500'
                          } disabled:opacity-50`}
                        />
                        {errors[`components_weightage_${component.assessment_category_id}`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`components_weightage_${component.assessment_category_id}`]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Calculation Rule
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {RULE_TYPES.map((rule) => (
                          <div
                            key={rule.id}
                            title={rule.title}
                            onClick={() =>
                              updateComponent(
                                component.assessment_category_id,
                                'rules_type',
                                rule.id
                              )
                            }
                            className={`cursor-pointer rounded-lg p-2 border text-left transition-all ${
                              component.rules.rule_type === rule.id
                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-bold text-xs text-gray-900">{rule.label}</div>
                            <div className="text-[10px] text-gray-500 leading-tight mt-1">
                              {rule.desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      {component.rules.rule_type === 'CUMULATIVE' && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <BiInfoCircle /> All assessments in this category will be summed up.
                        </p>
                      )}
                      {component.rules.rule_type === 'EQUAL_WEIGHTAGE' && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <BiInfoCircle /> All assessments in this category will be assigned equal
                          weightage each.
                        </p>
                      )}
                      {component.rules.rule_type === 'BEST_N' && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1.5">
                            N (Best N to consider)
                          </label>
                          <input
                            type="number"
                            value={component.rules.rule_params.n || 0}
                            onChange={(e) =>
                              updateComponent(
                                component.assessment_category_id,
                                'rules_n_value',
                                e.target.value
                              )
                            }
                            min="0"
                            placeholder="e.g., 3"
                            disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors disabled:opacity-50"
                          />
                        </div>
                      )}

                      {component.rules.rule_type === 'CUSTOM' && (
                        <div className="space-y-2">
                          <label className="block text-xs text-gray-600 mb-1.5">
                            Custom Weightage per Assessment
                          </label>
                          {(() => {
                            const categoryAssessments = assessments.filter(
                              (a) => a.assessment_type_id === component.assessment_category_id
                            );
                            const customWeightages = component.rules.rule_params || {};
                            const totalCustomWeightage = Object.values(customWeightages).reduce(
                              (sum: number, val: any) => sum + (Number(val) || 0),
                              0
                            );
                            const exceedsLimit = totalCustomWeightage > component.weightage;

                            if (categoryAssessments.length === 0) {
                              return (
                                <p className="text-xs text-gray-500 italic py-2">
                                  No assessments found for this category. First Create assessments
                                  to set Custom policy.
                                </p>
                              );
                            }

                            return (
                              <div className="space-y-2">
                                {categoryAssessments.map((assessment) => (
                                  <div key={assessment.id} className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 flex-1 truncate">
                                      {assessment.name}
                                    </label>
                                    <input
                                      type="number"
                                      value={customWeightages[assessment.id] || 0}
                                      onChange={(e) => {
                                        const newWeightages = {
                                          ...customWeightages,
                                          [assessment.id]: Number(e.target.value) || 0,
                                        };
                                        updateComponent(
                                          component.assessment_category_id,
                                          'rules_params',
                                          newWeightages
                                        );
                                      }}
                                      min="0"
                                      max={component.weightage}
                                      placeholder="0"
                                      disabled={isLoading}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50"
                                    />
                                    <span className="text-xs text-gray-500">%</span>
                                  </div>
                                ))}
                                <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-200">
                                  <div className="text-xs wrap-break-word text-blue-700 flex-1">
                                    Sum of weightage of individual assessments should not exceed the
                                    component weightage.
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-700">
                                      Total:
                                    </span>
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
                                  <p className="text-xs text-red-600 mt-1">
                                    Total weightage exceeds component limit
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {errors[`components_custom_${component.assessment_category_id}`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`components_custom_${component.assessment_category_id}`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isOverweight || isLoading}
              className="px-5 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        </div>
      </div>

      {addComponentLabel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select Category to Add</h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose an assessment category for the new component
              </p>
            </div>

            <div className="p-6">
              {getAvailableCategories().length > 0 ? (
                <div className="space-y-2">
                  {getAvailableCategories().map((categoryId) => (
                    <button
                      key={categoryId}
                      onClick={() => addComponent(categoryId)}
                      className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 group-hover:text-blue-600">
                          {ASSESSMENT_CATEGORIES[categoryId as CategoryId]}
                        </span>
                        <span className="text-sm text-gray-500 group-hover:text-blue-600">
                          Add →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BiInfoCircle className="mx-auto text-4xl text-gray-400 mb-3" />
                  <p className="text-gray-600">All categories have been added</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setAddComponentLabel(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

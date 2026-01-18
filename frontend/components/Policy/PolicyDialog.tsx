import React, { useState, useEffect } from "react";
import { PolicyDBObject } from "@/lib/types/policy";

export const ASSESSMENT_CATEGORIES = {
    1: "Quiz",
    2: "Assignment",
    3: "Midsem",
    4: "EndSem",
    5: "Project",
    6: "Attendance",
    7: "Lab",
} as const;

export type CategoryId = keyof typeof ASSESSMENT_CATEGORIES;

export const CATEGORY_IDS = Object.keys(ASSESSMENT_CATEGORIES).map(Number) as CategoryId[];

interface PolicyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PolicyFormData) => Promise<void>;
    policy?: PolicyDBObject | null;
    isLoading: boolean;
}

export interface PolicyRuleFormData {
    id?: number;
    rule_type: 'ALL' | 'BEST_N' | 'CUSTOM';
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

const ASSESSMENT_TYPES = [
    {id: 1, name: "Quiz"},
    {id: 2, name: "Assignment"},
    {id: 3, name: "Midsem"},
    {id: 4, name: "EndSem"},
    {id: 5, name: "Project"},
    {id: 6, name: "Attendance"},
    {id: 7, name: "Lab"},
];

export default function PolicyDialog({
    isOpen,
    onClose,
    onSubmit,
    policy,
    isLoading
}: PolicyDialogProps) {
    const [formData, setFormData] = useState<PolicyFormData>({
        policy_name: "",
        total_weightage: 100,
        components: [{
            assessment_category_id: 1,
            weightage: 100,
            rules: {
                rule_type: 'ALL',
                rule_params: {}
            }
        }]
    });

    const [errors, setErrors] = useState<{[key: string]: string}>({});

    const addComponent = () => {
        setFormData(prev => ({
            ...prev,
            components: [
                ...prev.components,
                {
                    assessment_category_id: 1,
                    weightage: 0,
                    rules: {
                        rule_type: 'ALL',
                        rule_params: {}
                    }
                }
            ]
        }));
    };

    const removeComponent = (index: number) => {
        setFormData(prev => ({
            ...prev,
            components: prev.components.filter((_, i) => i !== index)
        }));
    };

    const updateComponent = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            components: prev.components.map((comp, i) => {
                if (i === index) {
                    if (field === 'rules_type') {
                        return {
                            ...comp,
                            rules: {
                                ...comp.rules,
                                rule_type: value,
                                rule_params: value === 'BEST_N' ? comp.rules.rule_params : {}
                            }
                        };
                    } else if (field === 'rules_params') {
                        return {
                            ...comp,
                            rules: {
                                ...comp.rules,
                                rule_params: value
                            }
                        };
                    } else if (field.startsWith('rules_n_')) {
                        return {
                            ...comp,
                            rules: {
                                ...comp.rules,
                                rule_params: { n: parseInt(value) || 0 }
                            }
                        };
                    } else {
                        return {
                            ...comp,
                            [field]: value
                        };
                    }
                }
                return comp;
            })
        }));
    };

    useEffect(() => {
        if (policy) {
            setFormData({
                policy_name: policy.policy_name,
                total_weightage: policy.total_weightage,
                components: [...policy.components].map(c => ({
                    component_id: c.id,
                    assessment_category_id: c.assessment_category_id,
                    weightage: c.weightage,
                    rules: c.rules ? {
                        id: c.rules.id,
                        rule_type: c.rules.rule_type,
                        rule_params: c.rules.rule_params
                    } : {
                        rule_type: 'ALL',
                        rule_params: {}
                }
                }))
            });
        } else {
            setFormData({
                policy_name: "",
                total_weightage: 100,
                components: [{
                    assessment_category_id: 1,
                    weightage: 100,
                    rules: {
                        rule_type: 'ALL',
                        rule_params: {}
                    }
                }]
            });
        }
        setErrors({});
    }, [policy, isOpen]);

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};

        if (!formData.policy_name.trim()) {
            newErrors.policy_name = "Policy name is required";
        }
        if (formData.total_weightage <= 0) {
            newErrors.total_weightage = "Total weightage must be between 1 and 100";
        }
        formData.components.forEach((component, index) => {
            if (component.weightage <= 0) {
                newErrors[`components_weightage_${index}`] = "Component weightage must be greater than 0";
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
            console.error("Error submitting assessment:", error);
        }
    };

    const handleChange = (field: keyof PolicyFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Dialog Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {policy ? "Edit Policy" : "Create Policy"}
                    </h2>
                    <button 
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Dialog Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Assessment Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Policy Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.policy_name}
                            onChange={(e) => handleChange("policy_name", e.target.value)}
                            placeholder="e.g., Mid-Term Exam, Assignment 1"
                            className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors ${
                                errors.policy_name ? "border-red-500" : "border-gray-300 focus:border-gray-500"
                            }`}
                            disabled={isLoading}
                        />
                        {errors.policy_name && <p className="text-red-500 text-xs mt-1">{errors.policy_name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Weightage (%) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.total_weightage}
                            onChange={(e) => handleChange("total_weightage", Number(e.target.value))}
                            min="1"
                            className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors ${
                                errors.total_weightage ? "border-red-500" : "border-gray-300 focus:border-gray-500"
                            }`}
                            disabled={isLoading}
                        />
                        {errors.total_weightage && <p className="text-red-500 text-xs mt-1">{errors.total_weightage}</p>}
                    </div>

                    {/* Components Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Components
                            </label>
                            <button
                                type="button"
                                onClick={addComponent}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Component
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.components.map((component, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Component {idx + 1}</span>
                                        {formData.components.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeComponent(idx)}
                                                disabled={isLoading}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {/* Category */}
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1.5">Category</label>
                                            <select
                                                value={component.assessment_category_id}
                                                onChange={(e) => updateComponent(idx, "assessment_category_id", Number(e.target.value))}
                                                disabled={isLoading}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white disabled:opacity-50"
                                            >
                                                {CATEGORY_IDS.map((id: number) => (
                                                    <option key={id} value={id}>
                                                        {ASSESSMENT_CATEGORIES[id as keyof typeof ASSESSMENT_CATEGORIES]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Weightage */}
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1.5">Weightage (%)</label>
                                            <input
                                                type="number"
                                                value={component.weightage}
                                                onChange={(e) => updateComponent(idx, "weightage", Number(e.target.value))}
                                                min="0"
                                                placeholder="0"
                                                disabled={isLoading}
                                                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${
                                                    errors[`components_weightage_${idx}`] ? "border-red-500" : "border-gray-300 focus:border-blue-500"
                                                } disabled:opacity-50`}
                                            />
                                            {errors[`components_weightage_${idx}`] && (
                                                <p className="text-red-500 text-xs mt-1">{errors[`components_weightage_${idx}`]}</p>
                                            )}
                                        </div>

                                        {/* Rule Type */}
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1.5">Rule Type</label>
                                            <select
                                                value={component.rules.rule_type}
                                                onChange={(e) => updateComponent(idx, "rules_type", e.target.value)}
                                                disabled={isLoading}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white disabled:opacity-50"
                                            >
                                                <option value="ALL">ALL</option>
                                                <option value="BEST_N">BEST_N</option>
                                                <option value="CUSTOM">CUSTOM</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Rule Params - Only show for BEST_N */}
                                    {component.rules.rule_type === 'BEST_N' && (
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1.5">N (Best N to consider)</label>
                                            <input
                                                type="number"
                                                value={component.rules.rule_params.n || 0}
                                                onChange={(e) => updateComponent(idx, "rules_n_value", e.target.value)}
                                                min="1"
                                                placeholder="e.g., 3"
                                                disabled={isLoading}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors disabled:opacity-50"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
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
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {policy ? "Updating..." : "Creating..."}
                                </>
                            ) : (
                                policy ? "Update Policy" : "Create Policy"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function getAssessmentTypeName(typeId: number): string {
    const type = ASSESSMENT_TYPES.find(t => t.id === typeId);
    return type ? type.name : `Type ${typeId}`;
}

import { PolicyDBObject } from "@/lib/types/policy";
import React from "react";

export default function GradingPolicyCard({policy}: {policy: PolicyDBObject}) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{policy.policy_name}</h3>
                        {policy.is_default && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                                Default
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-gray-500">
                        Total Weightage: <span className="font-medium text-gray-900">{policy.total_weightage}%</span>
                    </div>
                </div>
            </div>

            {/* Components */}
            <div className="px-4 sm:px-6 py-4">
                {policy.components.length > 0 ? (
                    <div className="space-y-3">
                        {policy.components.map((component, index) => (
                            <div 
                                key={component.id} 
                                className="p-3 rounded-md bg-gray-50 border border-gray-100"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-300 text-xs font-medium text-gray-700">
                                            {index + 1}
                                        </span>
                                        <span className="text-sm font-medium text-gray-700">
                                            Category {component.assessment_category_id}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 ml-8 sm:ml-0">
                                        {component.weightage}%
                                    </span>
                                </div>
                                
                                {component.rules && (
                                    <div className="ml-8 mt-2 pt-2 border-t border-gray-200">
                                        <div className="flex flex-col sm:flex-row gap-2 text-xs">
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">Rule:</span>
                                                <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-700 font-medium">
                                                    {component.rules.rule_type}
                                                </span>
                                            </div>
                                            {Object.keys(component.rules.rule_params).length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-500">Params:</span>
                                                    <span className="text-gray-700">
                                                        {Object.entries(component.rules.rule_params).map(([key, value]) => (
                                                            <span key={key} className="mr-2">
                                                                <span className="font-medium">{key}:</span> {String(value)}
                                                            </span>
                                                        ))}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No components defined</p>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
                    <span>Updated {new Date(policy.updated_at).toLocaleDateString()}</span>
                    <span>Set by ID: {policy.set_by_id}</span>
                </div>
            </div>
        </div>
    )
}
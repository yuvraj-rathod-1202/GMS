import { PolicyDBObject } from '@/lib/types/policy';
import React from 'react';
import { FaEdit } from 'react-icons/fa';
import { FaPencil } from 'react-icons/fa6';
import { MdDelete } from 'react-icons/md';

const getAssessmentTypeLabel = (typeId: number): string => {
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
};

export default function GradingPolicyCard({
  policy,
  onEdit,
  onDelete,
  SetDefault,
}: {
  policy: PolicyDBObject;
  onEdit: () => void;
  onDelete: () => void;
  SetDefault: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
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
          <div className="flex flex-row gap-4 text-sm text-gray-500 items-center">
            <p>
              Total Weightage:{' '}
              <span className="font-medium text-gray-900">{policy.total_weightage}%</span>
            </p>
            <button
              onClick={onEdit}
              title="Edit Policy"
              className="cursor-pointer text-gray-600 hover:text-mms-indigo hover:underline"
            >
              <FaPencil className="size-4" />
            </button>
            <button
              onClick={onDelete}
              title="Delete Policy"
              className="cursor-pointer text-red-600 hover:text-red-800 hover:underline"
            >
              <MdDelete className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Components */}
      <div className="px-4 sm:px-6 py-4">
        {policy.components.length > 0 ? (
          <div className="space-y-3">
            {policy.components.map((component, index) => (
              <div key={component.id} className="p-3 rounded-md bg-gray-50 border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-300 text-xs font-medium text-gray-700">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {getAssessmentTypeLabel(component.assessment_category_id)}
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
          {!policy.is_default && (
            <button
              onClick={SetDefault}
              className="text-xs text-mms-blue cursor-pointer hover:underline"
            >
              set as default
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

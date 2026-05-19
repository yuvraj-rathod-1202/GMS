import React from 'react';
import { FaPencil } from 'react-icons/fa6';
import { MdDelete } from 'react-icons/md';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PolicyDBObject } from '@/lib/types/policy';

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
  canManage = false,
}: {
  policy: PolicyDBObject;
  onEdit: () => void;
  onDelete: () => void;
  SetDefault: () => void;
  canManage?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{policy.policy_name}</h3>
            {policy.is_default && <Badge variant="info">Default</Badge>}
          </div>
          <div className="flex flex-row items-center gap-4 text-sm text-gray-500">
            <p>
              Total Weightage:{' '}
              <span className="font-medium text-gray-900">{policy.total_weightage}%</span>
            </p>
            {canManage && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  title="Edit Policy"
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gms-indigo"
                >
                  <FaPencil className="size-3.5" />
                  <span>Edit</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  title="Delete Policy"
                  className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-800"
                >
                  <MdDelete className="size-3.5" />
                  <span>Delete</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Components */}
      <div className="px-4 sm:px-6 py-4">
        {policy.components.length > 0 ? (
          <div className="space-y-4">
            {/* Visual Weightage Bar */}
            <div className="flex h-2 w-full gap-1">
              {policy.components.map((component, index) => (
                <div
                  key={`bar-${component.id}`}
                  style={{
                    width: `${Math.min((component.weightage / policy.total_weightage) * 100, 100)}%`,
                  }}
                  className={`rounded-full ${['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500'][index % 4]}`}
                  title={`${getAssessmentTypeLabel(component.assessment_category_id)}: ${component.weightage}%`}
                />
              ))}
              {(() => {
                const totalComponents = policy.components.reduce((sum, c) => sum + c.weightage, 0);
                if (totalComponents < policy.total_weightage) {
                  return <div className="flex-1 rounded-full bg-gray-200" />;
                }
                return null;
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {policy.components.map((component, index) => (
                <div key={component.id} className={`p-3 rounded-md bg-gray-50 border border-gray-100 border-l-4 ${['border-l-blue-500', 'border-l-purple-500', 'border-l-green-500', 'border-l-orange-500'][index % 4]}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-xs font-medium text-gray-700">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {getAssessmentTypeLabel(component.assessment_category_id)}
                    </span>
                  </div>
                  <Badge variant="default" className="ml-8 sm:ml-0">
                    {component.weightage}%
                  </Badge>
                </div>

                {component.rules && (
                  <div className="ml-8 mt-2 pt-2 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Rule:</span>
                        <Badge variant="default" className="rounded-md px-2 py-0.5">
                          {component.rules.rule_type}
                        </Badge>
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
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">No components defined</p>
      )}
    </div>

      {/* Footer */}
      <div className="rounded-b-lg border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Updated {new Date(policy.updated_at).toLocaleDateString()}</span>
          {canManage && !policy.is_default && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={SetDefault}
              className="px-0 text-xs text-gms-blue hover:bg-transparent hover:underline"
            >
              set as default
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

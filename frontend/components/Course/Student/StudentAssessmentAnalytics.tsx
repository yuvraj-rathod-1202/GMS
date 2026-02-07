import { AssessmentAnalyticsDBObject } from '@/lib/types/analytics';
import React from 'react';

export default function StudentAssessmentAnalytics({
  selectedAnalytics,
  setSelectedAnalytics,
}: {
  selectedAnalytics: AssessmentAnalyticsDBObject;
  setSelectedAnalytics: React.Dispatch<React.SetStateAction<AssessmentAnalyticsDBObject | null>>;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={() => setSelectedAnalytics(null)}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Assessment Analytics</h3>
          <button
            onClick={() => setSelectedAnalytics(null)}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Minimum</span>
            <span className="font-medium text-gray-900">{selectedAnalytics.min.toFixed(1)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Maximum</span>
            <span className="font-medium text-gray-900">{selectedAnalytics.max.toFixed(1)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Mean</span>
            <span className="font-medium text-gray-900">{selectedAnalytics.mean.toFixed(1)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Median</span>
            <span className="font-medium text-gray-900">{selectedAnalytics.median.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

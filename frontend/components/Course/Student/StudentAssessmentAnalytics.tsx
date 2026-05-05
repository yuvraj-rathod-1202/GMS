'use client';

import { AssessmentAnalyticsDBObject } from '@/lib/types/analytics';
import React from 'react';
import Modal from '@/components/ui/Modal';

export default function StudentAssessmentAnalytics({
  selectedAnalytics,
  setSelectedAnalytics,
}: {
  selectedAnalytics: AssessmentAnalyticsDBObject;
  setSelectedAnalytics: React.Dispatch<React.SetStateAction<AssessmentAnalyticsDBObject | null>>;
}) {
  return (
    <Modal
      open
      title="Assessment Analytics"
      onClose={() => setSelectedAnalytics(null)}
      className="max-w-md"
    >
      <div className="space-y-3">
        <div className="flex justify-between border-b border-gray-200 py-2">
          <span className="text-gray-600">Minimum</span>
          <span className="font-medium text-gray-900">{selectedAnalytics.min.toFixed(1)}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 py-2">
          <span className="text-gray-600">Maximum</span>
          <span className="font-medium text-gray-900">{selectedAnalytics.max.toFixed(1)}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 py-2">
          <span className="text-gray-600">Mean</span>
          <span className="font-medium text-gray-900">{selectedAnalytics.mean.toFixed(1)}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 py-2">
          <span className="text-gray-600">Median</span>
          <span className="font-medium text-gray-900">{selectedAnalytics.median.toFixed(1)}</span>
        </div>
      </div>
    </Modal>
  );
}

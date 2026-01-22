import React from 'react';

export default function IGradeSheetButtons({
  handleSave,
  handleDiscard,
  hasUnsavedChanges,
  isSaving,
  handleRecalculateTotal,
  isRecalculating,
}: {
  handleSave: () => void;
  handleDiscard: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  handleRecalculateTotal?: () => void;
  isRecalculating?: boolean;
}) {
  return (
    <>
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm border ${
            hasUnsavedChanges && !isSaving
              ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:shadow-md active:scale-95'
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          }`}
          title={hasUnsavedChanges ? 'Save all changes' : 'No changes to save'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {isSaving ? 'Saving...' : 'Save Marks'}
        </button>

        {/* Discard Changes Button */}
        <button
          onClick={handleDiscard}
          disabled={!hasUnsavedChanges}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm border ${
            hasUnsavedChanges
              ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:shadow-md active:scale-95'
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          }`}
          title={hasUnsavedChanges ? 'Discard all unsaved changes' : 'No changes to discard'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Discard Changes
        </button>

        {/* Recalculate Total Button */}
        {handleRecalculateTotal && (
          <button
            onClick={handleRecalculateTotal}
            disabled={isRecalculating}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm border ${
              !isRecalculating
                ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:shadow-md active:scale-95'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
            title="Recalculate total marks for all students"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isRecalculating ? 'Recalculating...' : 'Recalculate Total'}
          </button>
        )}
      </div>
    </>
  );
}

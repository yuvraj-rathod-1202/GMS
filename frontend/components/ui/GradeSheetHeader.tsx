import React from "react";

export function GradeSheetHeader({
    handleBackClick,
    currentAssessment,
    isLoadingData,
    getAssessmentTypeLabel,
    formattedDate,
} : {
    handleBackClick: () => void;
    currentAssessment: any;
    isLoadingData: boolean;
    getAssessmentTypeLabel: (typeId: number) => string;
    formattedDate: string;
}) {

    return (
        <div>
                
        <button
            onClick={handleBackClick}
            className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
            <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
            />
            </svg>
            <span className="font-medium">Back to Grades</span>
        </button>

        {/* Assessment Header */}
        {isLoadingData ? (
            <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
                </div>
            </div>
            </div>
        ) : currentAssessment ? (
            <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{currentAssessment.name}</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Type */}
                <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Type</span>
                <span className="text-sm md:text-base font-medium text-gray-900">
                    {getAssessmentTypeLabel(currentAssessment.assessment_type_id)}
                </span>
                </div>

                {/* Max Marks */}
                <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Max Marks</span>
                <span className="text-sm md:text-base font-medium text-gray-900">
                    {currentAssessment.max_marks}
                </span>
                </div>

                {/* Date */}
                <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Date</span>
                <span className="text-sm md:text-base font-medium text-gray-900">
                    {formattedDate}
                </span>
                </div>

                {/* Marks Published Status */}
                <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</span>
                <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                    currentAssessment.is_marks_published
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                >
                    {currentAssessment.is_marks_published ? "Published" : "Unpublished"}
                </span>
                </div>
            </div>
            </div>
        ) : (
            <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6">
            <p className="text-gray-500">Assessment not found</p>
            </div>
        )}
        </div>
    )
}
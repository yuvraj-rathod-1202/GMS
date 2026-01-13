import React from "react";
import { AssessmentDBObject } from "@/lib/types/assessments";

interface AssessmentCardProps {
  assessment: AssessmentDBObject;
  onClick?: () => void;
}

const getAssessmentTypeLabel = (typeId: number): string => {
  const types: { [key: number]: string } = {
    1: "Assignment",
    2: "Quiz",
    3: "Midsem",
    4: "EndSem",
    5: "Project",
    6: "Lab",
    7: "Attendance",
  };
  return types[typeId] || `Type ${typeId}`;
};

const getAssessmentTypeColor = (typeId: number): string => {
  const colors: { [key: number]: string } = {
    1: "bg-blue-50 text-blue-700 border-blue-200",
    2: "bg-purple-50 text-purple-700 border-purple-200",
    3: "bg-orange-50 text-orange-700 border-orange-200",
    4: "bg-red-50 text-red-700 border-red-200",
    5: "bg-green-50 text-green-700 border-green-200",
    6: "bg-cyan-50 text-cyan-700 border-cyan-200",
  };
  return colors[typeId] || "bg-gray-50 text-gray-700 border-gray-200";
};

export default function AssessmentCard({ assessment, onClick }: AssessmentCardProps) {
  const formattedDate = new Date(assessment.assessment_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedTime = new Date(assessment.assessment_date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      onClick={onClick}
      className={`border border-gray-300 rounded-2xl bg-white p-4 sm:p-6 transition-all duration-200 ${
        onClick ? "hover:shadow-lg hover:border-gray-400 cursor-pointer" : ""
      }`}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {assessment.name}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getAssessmentTypeColor(
                assessment.assessment_type_id
              )}`}
            >
              {getAssessmentTypeLabel(assessment.assessment_type_id)}
            </span>
            {assessment.is_marks_published && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Published
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date</p>
          <p className="text-sm font-medium text-gray-900">{formattedDate}</p>
          <p className="text-xs text-gray-600">{formattedTime}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Max Marks</p>
          <p className="text-2xl font-bold text-gray-900">{assessment.max_marks}</p>
        </div>
      </div>

      {/* Footer Section */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <div>
          <span className="font-medium">Created:</span>{" "}
          {new Date(assessment.created_at).toLocaleDateString()}
        </div>
        <div>
          <span className="font-medium">ID:</span> {assessment.id}
        </div>
      </div>
    </div>
  );
}

"use client";
import React from "react";
import { CourseDBObject } from "@/lib/types/courses";
import { MdGroups } from "react-icons/md";

type Props = {
  course: CourseDBObject;
};

export default function CourseCard({ course }: Props) {
  return (
    <div className="bg-mms-indigoLight rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
            <p className="text-sm text-gray-600 font-mono">{course.course_code}</p>
            <h3 className="font-semibold text-xl text-gray-900 mt-1 truncate" title={course.name}>
                {course.name}
            </h3>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between pt-2">
          <span className="text-gray-600">Credits: {course.credits}</span>
        </div>
      </div>
    </div>
  );
}

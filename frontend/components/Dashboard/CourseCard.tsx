'use client';
import React from 'react';
import { CourseDBObject } from '@/lib/types/courses';
import Link from 'next/link';

type Props = {
  course: CourseDBObject;
};

export default function CourseCard({ course }: Props) {
  return (
    <Link href={`/c/${course.id}`}>
      <div className="bg-gms-indigoLight rounded-xl p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-mono mb-0.5">{course.course_code}</p>
            <h3 className="font-bold text-lg text-gray-900 truncate" title={course.name}>
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
    </Link>
  );
}

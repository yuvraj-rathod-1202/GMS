"use client";
import { useParams } from "next/navigation";

export default function CoursePage() {
  const params = useParams();
  const courseId = params.id;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Course {courseId}</h1>
      <p className="text-gray-600 mt-2">Course detail page coming soon...</p>
    </div>
  );
}

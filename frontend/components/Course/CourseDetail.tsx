"use client";
import { useParams, useRouter } from "next/navigation";
import { useCoursesStore } from "@/lib/store/courses";
import { useEffect, useState } from "react";

export default function CourseDetail() {
  const params = useParams();
  const router = useRouter();
  const courses = useCoursesStore((s) => s.courses);
  const courseId = Number(params.id);
  const [isTimeout, setIsTimeout] = useState(false);

  // Find the course
  const course = courses.find((c) => c.id === courseId);

  useEffect(() => {
    // If courses are loaded but course not found -> Redirect
    if (courses.length > 0 && !course) {
        router.push("/");
        return;
    }

    // Safety timeout for empty courses (e.g. user has no courses or loading failed)
    if (courses.length === 0) {
        const timer = setTimeout(() => {
            setIsTimeout(true);
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [courses, course, router]);

  // Handle timeout redirect
  useEffect(() => {
      if (isTimeout && courses.length === 0) {
          router.push("/");
      }
  }, [isTimeout, courses.length, router]);

  if (!course) {
    return (
        <div className="flex justify-center items-center h-full p-10">
            <div className="text-gray-900 text-lg animate-pulse">Loading course...</div>
        </div>
    );
  }

  return (
    <div className="p-6">
        <p className="text-gray-500 italic">Course content coming soon...</p>
    </div>
  );
}

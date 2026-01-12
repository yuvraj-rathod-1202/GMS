"use client";
import { useState } from "react";
import { CoursesApi } from "@/lib/api/courses";
import { useCoursesStore } from "@/lib/store/courses";
import { CourseDBObject } from "@/lib/types/courses";

export function useCourses() {
    const setCourses = useCoursesStore((s) => s.setCourses);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function fetchCourses() {
        setLoading(true);
        setError(null);
        try {
            const data = await CoursesApi.FetchMyCourses();
            const coursesList = Array.isArray(data) ? data : (data as any)?.courses || [];
            setCourses(coursesList);
            return coursesList;
        } catch (err: any) {
            setError(err?.message || "Failed to fetch courses");
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return {
        fetchCourses,
        loading,
        error,
    };
}
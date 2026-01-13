"use client";
import { useState, useCallback } from "react";
import { CoursesApi } from "@/lib/api/courses";
import { useCoursesStore } from "@/lib/store/courses";

export function useCourses() {
    const setCourses = useCoursesStore((s) => s.setCourses);
    const clearCourses = useCoursesStore((s) => s.clearCourses);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        clearCourses();
        try {
            const data = await CoursesApi.FetchMyCourses();
            const coursesList = Array.isArray(data) ? data : (data as any)?.courses || [];
            setCourses(coursesList);
            return coursesList;
        } catch (err: any) {
            setError(err?.message || "Failed to fetch courses");
            clearCourses();
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setCourses, clearCourses]);

    return {
        fetchCourses,
        loading,
        error,
    };
}
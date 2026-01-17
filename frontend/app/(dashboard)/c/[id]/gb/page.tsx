"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import InstructorNavbar from "@/components/Course/InstructorNavbar";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { IoArrowBack } from "react-icons/io5";

export default function GradeSheetView() {

    const params = useParams();
    const router = useRouter();
    const courseId = Number(params.id);
    const [isTimeout, setIsTimeout] = useState(false);

    const { role, course, isLoading, hasAccess } = useRoleAccess({
        allowedRoles: ['instructor'],
        courseId,
    });

    const currentCourse = useCourseDetailStore((s) => s.currentCourse);

    useEffect(() => {
        if (!isLoading && !course) {
            router.push("/");
            return;
        }
        if (isLoading) {
            const timer = setTimeout(() => {
                setIsTimeout(true);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isLoading, course, router]);

    useEffect(() => {
        if (isTimeout && !course) {
            router.push("/");
        }
    }, [isTimeout, course, router]);

    if (isLoading || !currentCourse || !role) {
        return (
        <div className="flex justify-center items-center h-full p-10">
            <div className="text-gray-900 text-lg animate-pulse">Loading course...</div>
        </div>
        );
    }

    if (role !== 'instructor') {
        return null;
    }

  return (
    <div className="p-4">
        <div className="flex flex-row justify-between items-center mb-4">
            <div className="text-2xl font-semibold">Grade Sheet</div>
            <button onClick={() => router.back()} className="flex flex-row items-center p-2 rounded-lg bg-gray-300 gap-2"><IoArrowBack />Back</button>
        </div>
    </div>
  );
}
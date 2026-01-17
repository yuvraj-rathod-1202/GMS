"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import InstructorNavbar from "@/components/Course/InstructorNavbar";
import { useRoleAccess } from "@/hooks/useRoleAccess";

export default function GPView() {

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
    <>
        <InstructorNavbar />
        <div>
            analytics page
        </div>
    </>
  );
}
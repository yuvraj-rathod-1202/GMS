"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserRoleInCourse } from "./useUserRoleInCourse";

type UserRole = 'instructor' | 'ta' | 'student';

interface UseRoleAccessOptions {
  allowedRoles: UserRole[];
  redirectTo?: string;
  courseId: number;
  assessmentId?: number;
}

export function useRoleAccess({ allowedRoles, redirectTo, courseId, assessmentId }: UseRoleAccessOptions) {
  const router = useRouter();
  const { role, course, assessment, isLoading } = useUserRoleInCourse(courseId);
  const [isTimeout, setIsTimeout] = useState(false);

  useEffect(() => {
    if (!isLoading && !course) {
      router.push("/");
      return;
    }

    // if (!isLoading && assessmentId && !assessment) {
    //   router.push(`/c/${courseId}`);
    //   return;
    // }

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

  useEffect(() => {
    if (!isLoading && role && !allowedRoles.includes(role)) {
      router.push(redirectTo || `/c/${courseId}`);
    }
  }, [role, isLoading, router, courseId, allowedRoles, redirectTo]);

  return {
    role,
    course,
    assessment,
    isLoading,
    hasAccess: role ? allowedRoles.includes(role) : false,
  };
}

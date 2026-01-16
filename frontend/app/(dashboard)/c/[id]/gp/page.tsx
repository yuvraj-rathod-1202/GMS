"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import InstructorNavbar from "@/components/Course/InstructorNavbar";
import { useCourseManagement } from "@/hooks/useCourseManagement";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import GradingPolicyCard from "@/components/Policy/GradingPolicyCard";

export default function GPView() {

    const params = useParams();
    const router = useRouter();
    const courseId = Number(params.id);
    const [isTimeout, setIsTimeout] = useState(false);
    const [isFetchingPolicy, setIsFetchingPolicy] = useState(false);
    const [settingDefaultPolicyId, setSettingDefaultPolicyId] = useState<boolean>(false);

    const { role, course, isLoading, hasAccess } = useRoleAccess({
        allowedRoles: ['instructor'],
        courseId,
    });

    const currentCourse = useCourseDetailStore((s) => s.currentCourse);
    const instructorData = useCourseDetailStore((s) => s.instructorData);
    const {loading: managementLoading, fetchAllPolicy, setDefaultPolicy} = useCourseManagement(role || 'instructor');

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

    useEffect(() => {
        if (!isLoading && hasAccess && !isFetchingPolicy) {
            const fetchPolicy = async () => {
                setIsFetchingPolicy(true);
                try {
                    await fetchAllPolicy(courseId);
                } catch (error) {
                    if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
                        console.error("Error fetching Policy data:", error);
                    }
                } finally {
                    setIsFetchingPolicy(false);
                }
            }
            fetchPolicy();
        }
    }, [role, isLoading, courseId]);

    if (isLoading || !currentCourse || !role) {
        return (
        <div className="flex justify-center items-center h-full p-10">
            <div className="text-gray-900 text-lg animate-pulse">Loading course...</div>
        </div>
        );
    }

    const isLoadingPolicy = managementLoading || isFetchingPolicy;

    const handleSetDefaultPolicy = async (policyId: number) => {
        setSettingDefaultPolicyId(true);
        try {
            await setDefaultPolicy(courseId, policyId);
            fetchAllPolicy(courseId, true);
        }
        catch (error) {
            if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
                console.error("Error setting default policy:", error);
            }
        }
        finally {
            setSettingDefaultPolicyId(false);
        }
    }

    

    if (role !== 'instructor') {
        return null;
    }

  return (
    <>
        <InstructorNavbar />
        <div className="p-6">
            {isLoadingPolicy ? (
                <div className="flex justify-center items-center h-full p-10">
                    <div className="text-gray-900 text-lg animate-pulse">Loading grading policy...</div>
                </div>
            ) : (
                !instructorData?.policies && (
                    <div className="text-gray-900 text-lg">No grading policy found for this course.</div>
                )
            )}
            {instructorData?.policies && (
                instructorData.policies.map((policy) => (
                    <div key={policy.id} className="mb-6 p-4 border border-gray-300 rounded-lg shadow-sm">
                        <GradingPolicyCard policy={policy} />
                    </div>
                ))
            )}
        </div>
    </>
  );
}
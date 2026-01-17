"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import InstructorNavbar from "@/components/Course/InstructorNavbar";
import { useCourseManagement } from "@/hooks/useCourseManagement";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import GradingPolicyCard from "@/components/Policy/GradingPolicyCard";
import { CreatePolicyRequest, PolicyDBObject, UpdatePolicyRequest } from "@/lib/types/policy";
import { FaPlus } from "react-icons/fa";
import Link from "next/link";
import PolicyDialog, { PolicyFormData } from "@/components/Policy/PolicyDialog";

export default function GPView() {

    const params = useParams();
    const router = useRouter();
    const courseId = Number(params.id);
    const [isTimeout, setIsTimeout] = useState(false);
    const [isFetchingPolicy, setIsFetchingPolicy] = useState(false);
    const [showPolicyDialog, setShowPolicyDialog] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<PolicyDBObject | null | undefined>(null);
    const [settingDefaultPolicyId, setSettingDefaultPolicyId] = useState<boolean>(false);
    const [creatingPolicy, setCreatingPolicy] = useState<boolean>(false);
    const [updatingPolicyId, setUpdatingPolicyId] = useState<boolean>(false);
    const [updatingPolicyComponentId, setUpdatingPolicyComponentId] = useState<boolean>(false);

    const { role, course, isLoading, hasAccess } = useRoleAccess({
        allowedRoles: ['instructor'],
        courseId,
    });

    const currentCourse = useCourseDetailStore((s) => s.currentCourse);
    const instructorData = useCourseDetailStore((s) => s.instructorData);
    const {loading: managementLoading, fetchAllPolicy, setDefaultPolicy, createPolicy, updatePolicy, updatePolicyComponent, AddPolicyComponent, DeletePolicy} = useCourseManagement(role || 'instructor');

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

    const handleCreatePolicy = () => {
        setEditingPolicy(null);
        setShowPolicyDialog(true);
    }

    const handleEditPolicy = (policy: PolicyDBObject) => {
        setEditingPolicy(policy);
        setShowPolicyDialog(true);
    }

    const handleAddPolicy = async (policyData: CreatePolicyRequest) => {
        setCreatingPolicy(true);
        try {
            await createPolicy(courseId, policyData);
            fetchAllPolicy(courseId, true);
        }
        catch (error) {
            if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
                console.error("Error creating policy:", error);
            }
        } finally {
            setCreatingPolicy(false);
        }
    }

    const handleUpdatePolicy = async (PolicyData: UpdatePolicyRequest) => {
        setUpdatingPolicyId(true);
        try {
            await updatePolicy(courseId, PolicyData);
            fetchAllPolicy(courseId, true);
        }
        catch (error) {
            if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
                console.error("Error updating policy:", error);
            }
        }
        finally {
            setUpdatingPolicyId(false);
        }
    }

    const handleUpdatePolicyComponent = async (policyId: number, componentId: number, componentData: any) => {
        setUpdatingPolicyComponentId(true);
        try {
            await updatePolicyComponent(courseId, policyId, componentId, componentData);
            fetchAllPolicy(courseId, true);
        }
        catch (error) {
            if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
                console.error("Error updating policy component:", error);
            }
        }
        finally {
            setUpdatingPolicyComponentId(false);
        }
    }

    const handleAddPolicyComponent = async (policyId: number, componentData: any) => {
        setUpdatingPolicyComponentId(true);
        try {
            await AddPolicyComponent(courseId, policyId, componentData);
            fetchAllPolicy(courseId, true);
        }
        catch (error) {
            if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
                console.error("Error adding policy component:", error);
            }
        }
        finally {
            setUpdatingPolicyComponentId(false);
        }
    }

    const handleDeletePolicy = async (policyId: number) => {
        setUpdatingPolicyId(true);
        try {
            await DeletePolicy(courseId, policyId);
            fetchAllPolicy(courseId, true);
        }
        catch (error) {
            if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
                console.error("Error deleting policy:", error);
            }
        }
        finally {
            setUpdatingPolicyId(false);
        }
    }

    const handleSubmitPolicy = async (policyData: PolicyFormData) => {
        if (editingPolicy) {
            await handleUpdatePolicy({
                id: editingPolicy.id,
                policy_name: policyData.policy_name,
                total_weightage: policyData.total_weightage,
            });
            policyData.components.forEach(async (component) => {
                if (component.component_id) {
                    await handleUpdatePolicyComponent(editingPolicy.id, component.component_id, {
                        assessment_category_id: component.assessment_category_id,
                        weightage: component.weightage,
                        rules: component.rules,
                    });
                } else {
                    await handleAddPolicyComponent(editingPolicy.id, {
                        assessment_category_id: component.assessment_category_id,
                        weightage: component.weightage,
                        rules: component.rules,
                    });
                }
            });      
        } else {
            await handleAddPolicy({
                policy_name: policyData.policy_name,
                total_weightage: policyData.total_weightage,
                components: policyData.components.map((component) => ({
                    assessment_category_id: component.assessment_category_id,
                    weightage: component.weightage,
                    rules: component.rules,
                })),
            });
        }
    }


    if (role !== 'instructor') {
        return null;
    }

  return (
    <>
        <InstructorNavbar />
        <div className="p-6 max-h-[calc(100vh-96px)] overflow-y-auto">
            {isLoadingPolicy ? (
                <div className="flex justify-center items-center h-full p-10">
                    <div className="text-gray-900 text-lg animate-pulse">Loading grading policy...</div>
                </div>
            ) : (
                !instructorData?.policies && (
                    <div className="text-gray-900 text-lg">No grading policy found for this course.</div>
                )
            )}
            <div className="w-full">
                <div className="flex gap-4 justify-end mb-4">
                    <Link href={`/c/${courseId}/gb`}><button className="flex flex-row items-center gap-2 rounded-lg bg-gray-300 p-2 hover:bg-gray-400">Open Grade Sheet</button></Link>
                    <button onClick={handleCreatePolicy} className="flex flex-row items-center gap-2 rounded-lg bg-gray-300 p-2 hover:bg-gray-400"><FaPlus />Create Policy</button>
                </div>
            </div>
            {instructorData?.policies && (
                instructorData.policies.map((policy) => (
                    <div key={policy.id} className="mb-6 p-4 rounded-lg">
                        <GradingPolicyCard policy={policy} onEdit={() => handleEditPolicy(policy)} onDelete={() => handleDeletePolicy(policy.id)} />
                    </div>
                ))
            )}
        </div>
        <PolicyDialog
            isOpen={showPolicyDialog}
            onClose={() => setShowPolicyDialog(false)}
            onSubmit={handleSubmitPolicy}
            policy={editingPolicy}
            isLoading={creatingPolicy || updatingPolicyId || updatingPolicyComponentId}
        />
    </>
  );
}
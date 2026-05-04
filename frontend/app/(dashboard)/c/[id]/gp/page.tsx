'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import InstructorNavbar from '@/components/Course/InstructorNavbar';
import { useCourseManagement } from '@/hooks/useCourseManagement';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import GradingPolicyCard from '@/components/Policy/GradingPolicyCard';
import {
  AddPolicyComponentsRequest,
  CreatePolicyRequest,
  PolicyDBObject,
  UpdatePolicyComponentsRequest,
  UpdatePolicyRequest,
} from '@/lib/types/policy';
import { FaPlus } from 'react-icons/fa';
import Link from 'next/link';
import PolicyDialog, { PolicyFormData } from '@/components/Policy/PolicyDialog';
import Button from '@/components/ui/Button';
import { BiSpreadsheet } from 'react-icons/bi';

export default function GPView() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isFetchingPolicy, setIsFetchingPolicy] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [isPolicyFetched, setIsPolicyFetched] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyDBObject | null | undefined>(null);
  const [creatingPolicy, setCreatingPolicy] = useState<boolean>(false);
  const [updatingPolicyId, setUpdatingPolicyId] = useState<boolean>(false);
  const [updatingPolicyComponentId, setUpdatingPolicyComponentId] = useState<boolean>(false);

  const { role, course, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['instructor'],
    courseId,
  });

  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const instructorData = useCourseDetailStore((s) => s.instructorData);
  const {
    loading: managementLoading,
    fetchAllPolicy,
    setDefaultPolicy,
    createPolicy,
    updatePolicy,
    updatePolicyComponent,
    AddPolicyComponent,
    DeletePolicyComponent,
    fetchAllAssessments,
    DeletePolicy,
  } = useCourseManagement(role || 'instructor');

  useEffect(() => {
    if (!isLoading && !course) {
      router.push('/');
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
      router.push('/');
    }
  }, [isTimeout, course, router]);

  useEffect(() => {
    if (!isLoading && hasAccess && !isFetchingPolicy) {
      const fetchPolicy = async () => {
        setIsFetchingPolicy(true);
        try {
          await fetchAllPolicy(courseId);
          setIsPolicyFetched(true);
        } catch (error) {
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.error('Error fetching Policy data:', error);
          }
        } finally {
          setIsFetchingPolicy(false);
        }
      };
      fetchPolicy();
    }
  }, [role, isLoading, courseId]);

  useEffect(() => {
    if (!isLoading && hasAccess && isPolicyFetched) {
      const fetchAssessments = async () => {
        try {
          await fetchAllAssessments(courseId);
        } catch (error) {
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.error('Error fetching Assessments data:', error);
          }
        }
      };
      fetchAssessments();
    }
  }, [role, isLoading, hasAccess, isPolicyFetched, courseId]);

  if (isLoading || !currentCourse || !role) {
    return (
      <div className="flex justify-center items-center h-full p-10">
        <div className="text-gray-900 text-lg animate-pulse">Loading course...</div>
      </div>
    );
  }

  const isLoadingPolicy = managementLoading || isFetchingPolicy;

  const handleSetDefaultPolicy = async (policyId: number) => {
    try {
      await setDefaultPolicy(courseId, policyId);
      fetchAllPolicy(courseId, true);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error setting default policy:', error);
      }
    }
  };

  const handleCreatePolicy = () => {
    setEditingPolicy(null);
    setShowPolicyDialog(true);
  };

  const handleEditPolicy = (policy: PolicyDBObject) => {
    setEditingPolicy(policy);
    setShowPolicyDialog(true);
  };

  const handleAddPolicy = async (policyData: CreatePolicyRequest) => {
    setCreatingPolicy(true);
    try {
      await createPolicy(courseId, policyData);
      fetchAllPolicy(courseId, true);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error creating policy:', error);
      }
    } finally {
      setCreatingPolicy(false);
    }
  };

  const handleUpdatePolicy = async (PolicyData: UpdatePolicyRequest) => {
    setUpdatingPolicyId(true);
    try {
      await updatePolicy(courseId, PolicyData);
      fetchAllPolicy(courseId, true);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error updating policy:', error);
      }
    } finally {
      setUpdatingPolicyId(false);
    }
  };

  const handleUpdatePolicyComponent = async (
    policyId: number,
    componentId: number,
    componentData: UpdatePolicyComponentsRequest
  ) => {
    setUpdatingPolicyComponentId(true);
    try {
      await updatePolicyComponent(courseId, policyId, componentId, componentData);
      fetchAllPolicy(courseId, true);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error updating policy component:', error);
      }
    } finally {
      setUpdatingPolicyComponentId(false);
    }
  };

  const handleAddPolicyComponent = async (
    policyId: number,
    componentData: AddPolicyComponentsRequest
  ) => {
    setUpdatingPolicyComponentId(true);
    try {
      await AddPolicyComponent(courseId, policyId, componentData);
      fetchAllPolicy(courseId, true);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error adding policy component:', error);
      }
    } finally {
      setUpdatingPolicyComponentId(false);
    }
  };

  const handleDeletePolicyComponent = async (policyId: number, componentId: number) => {
    setUpdatingPolicyComponentId(true);
    try {
      await DeletePolicyComponent(courseId, policyId, componentId);
      fetchAllPolicy(courseId, true);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error deleting policy component:', error);
      }
    } finally {
      setUpdatingPolicyComponentId(false);
    }
  }

  const handleDeletePolicy = async (policyId: number) => {
    if (!confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
      return;
    }

    setUpdatingPolicyId(true);
    try {
      await DeletePolicy(courseId, policyId);
      fetchAllPolicy(courseId, true);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error deleting policy:', error);
      }
    } finally {
      setUpdatingPolicyId(false);
    }
  };

  const handleSubmitPolicy = async (policyData: PolicyFormData) => {
    try {
      if (editingPolicy) {
        await handleUpdatePolicy({
          id: editingPolicy.id,
          policy_name: policyData.policy_name,
          total_weightage: policyData.total_weightage,
        });
        const removed_component_ids = editingPolicy.components
          .filter(
            (existingComp) =>
              !policyData.components.some(
                (comp) => comp.component_id === existingComp.id
              )
          )
          .map((comp) => comp.id) as number[];
        policyData.components.forEach(async (component) => {
          if (component.component_id) {
            await handleUpdatePolicyComponent(editingPolicy.id, component.component_id, {
              assessment_category_id: component.assessment_category_id,
              weightage: component.weightage,
              rules: {
                id: component.rules?.id || undefined,
                rule_type: component.rules?.rule_type || 'CUMULATIVE',
                rule_params: component.rules?.rule_params || {},
              },
            });
          } else {
            await handleAddPolicyComponent(editingPolicy.id, {
              assessment_category_id: component.assessment_category_id,
              weightage: component.weightage,
              rules: {
                rule_type: component.rules?.rule_type || 'CUMULATIVE',
                rule_params: component.rules?.rule_params || {},
              },
            });
          }
        });
        // Handle removed components
        for (const compId of removed_component_ids) {
          await handleDeletePolicyComponent(editingPolicy.id, compId);
        }
        
      } else {
        await handleAddPolicy({
          policy_name: policyData.policy_name,
          total_weightage: policyData.total_weightage,
          components: policyData.components.map((component) => ({
            assessment_category_id: component.assessment_category_id,
            weightage: component.weightage,
            rules: {
              rule_type: component.rules?.rule_type || 'CUMULATIVE',
              rule_params: component.rules?.rule_params || {},
            },
          })),
        });
      }
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error submitting policy:', error);
      }
      alert('An error occurred while submitting the policy. Please try again.');
    }
  };

  if (role !== 'instructor') {
    return null;
  }

  return (
    <>
      <InstructorNavbar />
      <div className="p-2 md:p-6 max-h-[calc(100vh-96px)] overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grading Policies</h1>
            <p className="text-gray-500 mt-1">
              Define how student grades are calculated (e.g., Exams 40%, Quizzes 20%).
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/c/${courseId}/gb`}>
              <Button type="button" variant="secondary" className="flex items-center gap-2">
                <BiSpreadsheet className="text-lg" /> Master Gradebook
              </Button>
            </Link>
            <Button type="button" onClick={handleCreatePolicy} className="flex items-center gap-2">
              <FaPlus className="text-sm" /> Create Policy
            </Button>
          </div>
        </div>
        {isLoadingPolicy ? (
          <div className="flex justify-center items-center h-40">
            <div className="text-gray-900 text-lg animate-pulse">Loading policies...</div>
          </div>
        ) : !instructorData?.policies.length ? (
          <EmptyPolicyState onCreate={handleCreatePolicy} />
        ) : (
          <div className="grid gap-6">
            {instructorData.policies.map((policy) => (
              <GradingPolicyCard
                key={policy.id}
                policy={policy}
                onEdit={() => handleEditPolicy(policy)}
                onDelete={() => handleDeletePolicy(policy.id)}
                SetDefault={() => handleSetDefaultPolicy(policy.id)}
              />
            ))}
          </div>
        )}
      </div>
      <PolicyDialog
        isOpen={showPolicyDialog}
        onClose={() => setShowPolicyDialog(false)}
        onSubmit={handleSubmitPolicy}
        policy={editingPolicy}
        assessments={instructorData?.assessments || []}
        isLoading={creatingPolicy || updatingPolicyId || updatingPolicyComponentId}
      />
    </>
  );
}

function EmptyPolicyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Set up your grading logic</h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Create a policy to tell the system how to calculate final grades. You can set weightages for
        different components (e.g., Quizzes, Midsem, Assignments) and choose how scores are
        aggregated.
      </p>
      <button
        onClick={onCreate}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
      >
        Create Grading Policy
      </button>
    </div>
  );
}


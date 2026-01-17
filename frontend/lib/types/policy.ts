import { JSONValue } from "next/dist/server/config-shared";

export interface GradingRule {
    rule_type: 'ALL' | 'BEST_N' | 'CUSTOM';
    rule_params: Record<any, any>;
}

export interface GradingComponent {
    assessment_category_id: number;
    weightage: number;
    rules: GradingRule | null;
}

export interface CreatePolicyRequest {
    policy_name: string;
    total_weightage: number;
    components: GradingComponent[];
}

export interface GradingRuleDBObject {
    id: number;
    rule_type: 'ALL' | 'BEST_N' | 'CUSTOM';
    rule_params: Record<any, any>;
}

export interface GradingComponentDBObject {
    id: number;
    assessment_category_id: number;
    weightage: number;
    created_at: Date;
    updated_at: Date;
    rules: GradingRuleDBObject | null;
}

export interface PolicyDBObject {
    id: number;
    course_id: number;
    total_weightage: number;
    policy_name: string;
    set_by_id: number;
    updated_by_id: number;
    set_at: Date;
    updated_at: Date;
    is_default: boolean;
    components: GradingComponentDBObject[];
}

export interface UpdatePolicyRequest {
    id: number;
    policy_name?: string;
    total_weightage?: number;
}

export interface UpdateGradingRuleRequest {
    id?: number;
    rule_type: 'ALL' | 'BEST_N' | 'CUSTOM';
    rule_params: Record<any, any>;
}

export interface UpdatePolicyComponentsRequest {
    assessment_category_id: number;
    weightage: number;
    rules: UpdateGradingRuleRequest | null;
};

export interface AddGradingRuleRequest {
    rule_type: 'ALL' | 'BEST_N' | 'CUSTOM';
    rule_params: Record<any, any>;
}

export interface AddPolicyComponentsRequest {
    assessment_category_id: number;
    weightage: number;
    rules: AddGradingRuleRequest | null;
}

export interface StudentPolicyMapping {
    student_id: number;
    course_policy_id: number;
};

export interface AssignPolicyRequest {
    mapping: StudentPolicyMapping[];
};

export interface TotalScoreDBObject {
    id: number;
    student_id: number;
    total_marks: number;
    final_grade: string | null;
    computed_at: Date;
    updated_at: Date;
}
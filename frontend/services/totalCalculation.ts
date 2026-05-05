import { AssessmentDBObject } from '@/lib/types/assessments';
import { MarksDBObject } from '@/lib/types/marks';
import { PolicyDBObject } from '@/lib/types/policy';

export default function calculateTotalMarks(
  student_id: number,
  policy: PolicyDBObject,
  assessments: AssessmentDBObject[],
  assessmentMarks: Record<number, MarksDBObject[]>
) {
  let total_score = 0.0;

  for (let component of policy.components) {
    let component_score = 0.0;
    const component_total_weightage = component.weightage;
    const component_rule_type = component.rules?.rule_type || null;
    const component_rule_params = component.rules?.rule_params || null;

    const marks_in_category = assessments
      .filter((a) => a.assessment_type_id === component.assessment_category_id)
      .map((a) => {
        const marks = assessmentMarks[a.id]?.find((m) => m.student_id === student_id);
        return [a, marks];
      })
      .filter((m) => m !== null) as [AssessmentDBObject, MarksDBObject][];

    if (component_rule_type === 'CUMULATIVE') {
      let component_marks_obtained = 0.0;
      let component_max_marks = 0.0;
      for (let marks of marks_in_category) {
        component_marks_obtained += marks[1].marks_obtained;
        component_max_marks += marks[0].max_marks;
      }
      total_score +=
        component_max_marks > 0
          ? (component_marks_obtained * component_total_weightage) / component_max_marks
          : 0;
    } else if (component_rule_type === 'EQUAL_WEIGHTAGE') {
      for (let marks of marks_in_category) {
        component_score += (marks[1].marks_obtained * 100) / marks[0].max_marks;
      }
      total_score +=
        component_score > 0
          ? (component_score * component_total_weightage) / (100 * marks_in_category.length)
          : 0;
    } else if (component_rule_type === 'BEST_N') {
      const n = component_rule_params?.n || 0;
      const sorted_marks = marks_in_category.sort(
        (a, b) =>
          (b[1].marks_obtained * 100) / b[0].max_marks -
          (a[1].marks_obtained * 100) / a[0].max_marks
      );
      const best_n_marks = sorted_marks.slice(0, n);
      for (let marks of best_n_marks) {
        component_score += (marks[1].marks_obtained * 100) / marks[0].max_marks;
      }
      total_score +=
        component_score > 0
          ? (component_score * component_total_weightage) / (100 * best_n_marks.length)
          : 0;
    } else if (component_rule_type === 'CUSTOM') {
      const logic = component_rule_params;
      for (let marks of marks_in_category) {
        component_score +=
          (((marks[1].marks_obtained * 100) / marks[0].max_marks) * (logic?.[marks[0].id] || 0)) /
          100;
      }
      total_score += component_score;
    }
  }
  return total_score;
}

// Optimized version that accepts a student marks map for better performance
export function calculateTotalMarksOptimized(
  student_id: number,
  policy: PolicyDBObject,
  assessments: AssessmentDBObject[],
  studentMarksMap: Map<number, number | null> // Map of assessment_id -> marks_obtained
) {
  let total_score = 0.0;

  for (let component of policy.components) {
    let component_score = 0.0;
    const component_total_weightage = component.weightage;
    const component_rule_type = component.rules?.rule_type || null;
    const component_rule_params = component.rules?.rule_params || null;

    // Filter assessments in this category and get their marks
    const assessments_in_category = assessments.filter(
      (a) => a.assessment_type_id === component.assessment_category_id
    );

    const marks_in_category: [AssessmentDBObject, number][] = [];
    for (let assessment of assessments_in_category) {
      const marks = studentMarksMap.get(assessment.id);
      if (marks !== null && marks !== undefined) {
        marks_in_category.push([assessment, marks]);
      }
    }

    if (marks_in_category.length === 0) continue;

    if (component_rule_type === 'CUMULATIVE') {
      let component_marks_obtained = 0.0;
      let component_max_marks = 0.0;
      for (let [assessment, marks] of marks_in_category) {
        component_marks_obtained += marks;
        component_max_marks += assessment.max_marks;
      }
      total_score +=
        component_max_marks > 0
          ? (component_marks_obtained * component_total_weightage) / component_max_marks
          : 0;
    } else if (component_rule_type === 'EQUAL_WEIGHTAGE') {
      for (let [assessment, marks] of marks_in_category) {
        component_score += (marks * 100) / assessment.max_marks;
      }
      total_score +=
        component_score > 0
          ? (component_score * component_total_weightage) / (100 * marks_in_category.length)
          : 0;
    } else if (component_rule_type === 'BEST_N') {
      const n = component_rule_params?.n || 0;
      const sorted_marks = marks_in_category
        .map(([assessment, marks]) => ({
          assessment,
          marks,
          percentage: (marks * 100) / assessment.max_marks,
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, n);

      for (let item of sorted_marks) {
        component_score += item.percentage;
      }
      total_score +=
        component_score > 0
          ? (component_score * component_total_weightage) / (100 * sorted_marks.length)
          : 0;
    } else if (component_rule_type === 'CUSTOM') {
      const logic = component_rule_params;
      for (let [assessment, marks] of marks_in_category) {
        component_score +=
          (((marks * 100) / assessment.max_marks) * (logic?.[assessment.id] || 0)) / 100;
      }
      total_score += component_score;
    }
  }
  return total_score;
}

import calculateTotalMarks, { calculateTotalMarksOptimized } from '../../services/totalCalculation';
import { AssessmentDBObject } from '@/lib/types/assessments';
import { MarksDBObject } from '@/lib/types/marks';
import { PolicyDBObject } from '@/lib/types/policy';

describe('totalCalculation service', () => {
  const studentId = 1;

  const assessments: AssessmentDBObject[] = [
    { id: 1, assessment_type_id: 1, max_marks: 100, name: 'A1' } as any,
    { id: 2, assessment_type_id: 1, max_marks: 100, name: 'A2' } as any,
    { id: 3, assessment_type_id: 2, max_marks: 50, name: 'Q1' } as any,
  ];

  const assessmentMarks: Record<number, MarksDBObject[]> = {
    1: [{ student_id: studentId, marks_obtained: 80 }] as any,
    2: [{ student_id: studentId, marks_obtained: 90 }] as any,
    3: [{ student_id: studentId, marks_obtained: 40 }] as any,
  };

  const studentMarksMap = new Map<number, number | null>([
    [1, 80],
    [2, 90],
    [3, 40],
  ]);

  describe('calculateTotalMarks', () => {
    it('should calculate CUMULATIVE marks correctly', () => {
      const policy: PolicyDBObject = {
        components: [
          {
            assessment_category_id: 1,
            weightage: 50,
            rules: { rule_type: 'CUMULATIVE' },
          },
        ],
      } as any;

      // (80+90) / (100+100) * 50 = 170 / 200 * 50 = 0.85 * 50 = 42.5
      expect(calculateTotalMarks(studentId, policy, assessments, assessmentMarks)).toBe(42.5);
    });

    it('should calculate EQUAL_WEIGHTAGE marks correctly', () => {
      const policy: PolicyDBObject = {
        components: [
          {
            assessment_category_id: 1,
            weightage: 50,
            rules: { rule_type: 'EQUAL_WEIGHTAGE' },
          },
        ],
      } as any;

      // (80/100 + 90/100) / 2 * 50 = 1.7 / 2 * 50 = 0.85 * 50 = 42.5
      expect(calculateTotalMarks(studentId, policy, assessments, assessmentMarks)).toBe(42.5);
    });

    it('should calculate BEST_N marks correctly', () => {
      const policy: PolicyDBObject = {
        components: [
          {
            assessment_category_id: 1,
            weightage: 50,
            rules: { rule_type: 'BEST_N', rule_params: { n: 1 } },
          },
        ],
      } as any;

      // Best of (80/100, 90/100) is 90/100. 90/100 * 50 = 45
      expect(calculateTotalMarks(studentId, policy, assessments, assessmentMarks)).toBe(45);
    });

    it('should calculate CUSTOM marks correctly', () => {
      const policy: PolicyDBObject = {
        components: [
          {
            assessment_category_id: 1,
            weightage: 50, // This is ignored in the code's CUSTOM logic if it uses direct weights
            rules: {
              rule_type: 'CUSTOM',
              rule_params: { 1: 20, 2: 30 },
            },
          },
        ],
      } as any;

      // (80/100 * 20) + (90/100 * 30) = 16 + 27 = 43
      expect(calculateTotalMarks(studentId, policy, assessments, assessmentMarks)).toBe(43);
    });
  });

  describe('calculateTotalMarksOptimized', () => {
    it('should yield same results as standard version (CUMULATIVE)', () => {
      const policy: PolicyDBObject = {
        components: [
          {
            assessment_category_id: 1,
            weightage: 50,
            rules: { rule_type: 'CUMULATIVE' },
          },
        ],
      } as any;
      expect(calculateTotalMarksOptimized(studentId, policy, assessments, studentMarksMap)).toBe(
        42.5
      );
    });

    it('should handle missing marks in optimized version', () => {
      const policy: PolicyDBObject = {
        components: [
          {
            assessment_category_id: 1,
            weightage: 50,
            rules: { rule_type: 'EQUAL_WEIGHTAGE' },
          },
        ],
      } as any;
      const incompleteMap = new Map<number, number | null>([[1, 80]]); // Assessment 2 missing
      // 80/100 / 1 * 50 = 40
      expect(calculateTotalMarksOptimized(studentId, policy, assessments, incompleteMap)).toBe(40);
    });
  });
});

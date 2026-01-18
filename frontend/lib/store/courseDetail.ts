import { create } from "zustand";
import { CourseDBObject } from "@/lib/types/courses";
import {AllMarksDBObject, MarksChanges, CourseRoles, InstructorCourseRoles} from '@/lib/types/courses';
import {AssessmentDBObject} from '@/lib/types/assessments';
import { PolicyDBObject, TotalScoreDBObject } from "../types/policy";
import { MarksDBObject } from "../types/marks";

// Role-specific data types
export interface StudentCourseData {
  marks: AllMarksDBObject[];
}

export interface TACourseData {
  assessments: AssessmentDBObject[];
  assessmentMarks: Record<number, MarksDBObject[]>;
  totalMarks: TotalScoreDBObject[];
  marksChanges: Record<number, MarksChanges[]>;
  CourseRoles: CourseRoles | null;
}

export interface InstructorCourseData {
  assessments: AssessmentDBObject[];
  assessmentMarks: Record<number, MarksDBObject[]>;
  totalMarks: TotalScoreDBObject[];
  marksChanges: Record<number, MarksChanges[]>;
  CourseRoles: InstructorCourseRoles | null;
  policies: PolicyDBObject[];
  studentPolicyMap: Record<number, number>;
}

// Shared course detail state
export interface CourseDetailState {
  // Current course metadata
  currentCourse: CourseDBObject | null;
  currentAssessment: AssessmentDBObject | null;
  
  // Role-specific data
  studentData: StudentCourseData | null;
  taData: TACourseData | null;
  instructorData: InstructorCourseData | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Session-based fetch tracking (in-memory only, resets on reload)
  hasFetchedStudentDataInSession: boolean;
  hasFetchedTADataInSession: Record<string, boolean>;
  hasFetchedInstructorDataInSession: boolean;
  
  // Actions
  setCurrentCourse: (course: CourseDBObject | null) => void;
  setCurrentAssessment: (assessment: AssessmentDBObject | null) => void;
  setStudentData: (data: StudentCourseData) => void;
  setTAData: (data: TACourseData) => void;
  setInstructorData: (data: InstructorCourseData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasFetchedStudentDataInSession: (value: boolean) => void;
  setHasFetchedTADataInSession: (key: string, value: boolean) => void;
  setHasFetchedInstructorDataInSession: (value: boolean) => void;
  clearCourseDetail: () => void;
}

export const useCourseDetailStore = create<CourseDetailState>((set) => ({
  currentCourse: null,
  currentAssessment: null,
  studentData: null,
  taData: null,
  instructorData: null,
  isLoading: false,
  error: null,
  hasFetchedStudentDataInSession: false,
  hasFetchedTADataInSession: {},
  hasFetchedInstructorDataInSession: false,
  
  setCurrentCourse: (course) => set({ currentCourse: course }),
  setCurrentAssessment: (assessment) => set({ currentAssessment: assessment }),
  setStudentData: (data) => set({ studentData: data }),
  setTAData: (data) => set({ taData: data }),
  setInstructorData: (data) => set({ instructorData: data }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setHasFetchedStudentDataInSession: (value) => set({ hasFetchedStudentDataInSession: value }),
  setHasFetchedTADataInSession: (key, value) => set((state) => ({ hasFetchedTADataInSession: { ...state.hasFetchedTADataInSession, [key]: value}})),
  setHasFetchedInstructorDataInSession: (value) => set({ hasFetchedInstructorDataInSession: value }),
  clearCourseDetail: () => set({
    currentCourse: null,
    currentAssessment: null,
    studentData: null,
    taData: null,
    instructorData: null,
    isLoading: false,
    error: null,
  }),
}));

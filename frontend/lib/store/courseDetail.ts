import { create } from "zustand";
import { CourseDBObject } from "@/lib/types/courses";
import {AllMarksDBObject} from '@/lib/types/courses';
import {AssessmentDBObject} from '@/lib/types/assessments';
import { TotalScoreDBObject } from "../types/policy";

// Role-specific data types
export interface StudentCourseData {
  marks: AllMarksDBObject[];
}

export interface TACourseData {
  assessments: AssessmentDBObject[];
  assesmentMarks: Record<number, AllMarksDBObject[]>;
  totalMarks: TotalScoreDBObject[];
}

export interface InstructorCourseData {
  analytics?: any;
  roster?: any[];
  settings?: any;
  assessments?: any[];
}

// Shared course detail state
export interface CourseDetailState {
  // Current course metadata
  currentCourse: CourseDBObject | null;
  
  // Role-specific data
  studentData: StudentCourseData | null;
  taData: TACourseData | null;
  instructorData: InstructorCourseData | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Session-based fetch tracking (in-memory only, resets on reload)
  hasFetchedStudentDataInSession: boolean;
  hasFetchedTADataInSession: boolean;
  hasFetchedInstructorDataInSession: boolean;
  
  // Actions
  setCurrentCourse: (course: CourseDBObject | null) => void;
  setStudentData: (data: StudentCourseData) => void;
  setTAData: (data: TACourseData) => void;
  setInstructorData: (data: InstructorCourseData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasFetchedStudentDataInSession: (value: boolean) => void;
  setHasFetchedTADataInSession: (value: boolean) => void;
  setHasFetchedInstructorDataInSession: (value: boolean) => void;
  clearCourseDetail: () => void;
}

export const useCourseDetailStore = create<CourseDetailState>((set) => ({
  currentCourse: null,
  studentData: null,
  taData: null,
  instructorData: null,
  isLoading: false,
  error: null,
  hasFetchedStudentDataInSession: false,
  hasFetchedTADataInSession: false,
  hasFetchedInstructorDataInSession: false,
  
  setCurrentCourse: (course) => set({ currentCourse: course }),
  setStudentData: (data) => set({ studentData: data }),
  setTAData: (data) => set({ taData: data }),
  setInstructorData: (data) => set({ instructorData: data }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setHasFetchedStudentDataInSession: (value) => set({ hasFetchedStudentDataInSession: value }),
  setHasFetchedTADataInSession: (value) => set({ hasFetchedTADataInSession: value }),
  setHasFetchedInstructorDataInSession: (value) => set({ hasFetchedInstructorDataInSession: value }),
  clearCourseDetail: () => set({
    currentCourse: null,
    studentData: null,
    taData: null,
    instructorData: null,
    isLoading: false,
    error: null,
  }),
}));

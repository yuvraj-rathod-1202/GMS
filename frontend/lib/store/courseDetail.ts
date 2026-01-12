import { create } from "zustand";
import { CourseDBObject } from "@/lib/types/courses";
import {AllMarksDBObject} from '@/lib/types/courses';

// Role-specific data types
export interface StudentCourseData {
  marks: AllMarksDBObject[];
}

export interface TACourseData {
  studentList?: any[];
  gradingQueue?: any[];
  sections?: any[];
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
  
  // Actions
  setCurrentCourse: (course: CourseDBObject | null) => void;
  setStudentData: (data: StudentCourseData) => void;
  setTAData: (data: TACourseData) => void;
  setInstructorData: (data: InstructorCourseData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCourseDetail: () => void;
}

export const useCourseDetailStore = create<CourseDetailState>((set) => ({
  currentCourse: null,
  studentData: null,
  taData: null,
  instructorData: null,
  isLoading: false,
  error: null,
  
  setCurrentCourse: (course) => set({ currentCourse: course }),
  setStudentData: (data) => set({ studentData: data }),
  setTAData: (data) => set({ taData: data }),
  setInstructorData: (data) => set({ instructorData: data }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearCourseDetail: () => set({
    currentCourse: null,
    studentData: null,
    taData: null,
    instructorData: null,
    isLoading: false,
    error: null,
  }),
}));

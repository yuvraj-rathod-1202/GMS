export interface CourseDBObject {
    id: number;
    course_code: string;
    name: string;
    semester: string;
    credits: number;
    status: 'ongoing' | 'completed';
    created_at: Date;
    role: 'instructor' | 'ta' | 'student';
};

export interface AddCourseRequest {
    course_code: string;
    name: string;
    semester: string;
    credits: number;
};

export interface UpdateCourseRequest {
    status?: 'ongoing' | 'completed';
    course_code?: string;
    name?: string;
    credits?: number;
};

export interface EnrollStudentRequest {
    student_id: number;
};

export interface EnrollTaRequest {
    ta_id: number;
};

export interface EnrollInstructorRequest {
    instructor_id: number;
}

export interface AllMarksDBObject {
    assessment_id: number;
    marks_obtained: number;
    recorded_by_id: number;
    updated_at: Date;
    assessment_name: string;
    assessment_type_id: number;
    max_marks: number;
    assessment_date: Date;
}

export interface CourseState {
    courses: CourseDBObject[];
    setCourses: (courses: CourseDBObject[]) => void;
    clearCourses: () => void;
}
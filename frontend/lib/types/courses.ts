export interface CourseDBObject {
    id: number;
    course_code: string;
    name: string;
    semester: string;
    credits: number;
    status: 'ongoing' | 'completed';
    total_students: number;
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
    email?: string;
};

export interface EnrollTaRequest {
    ta_id: number;
    email?: string;
};

export interface EnrollInstructorRequest {
    instructor_id: number;
    email?: string;
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

export interface MarksChanges {
    student_id: number;
    old_marks: number;
    new_marks: number;
}

export interface UserRole {
    user_id: number;
    email: string | null;
}

export interface CourseRoles {
    students: UserRole[];
};

export interface InstructorCourseRoles {
    students: UserRole[];
    tas: UserRole[];
}
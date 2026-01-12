import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {CourseState} from '@/lib/types/courses';

export const useCoursesStore = create<CourseState>()(
    persist(
        (set) => ({
            courses: [],
            setCourses: (courses: any[]) => set({ courses }),
        }),
        {
            name: 'courses-storage',
        }
    )
)
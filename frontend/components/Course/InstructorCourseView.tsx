'use client';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import InstructorCourseOverview from './InstructorCourseOverview';
import InstructorNavbar from './InstructorNavbar';

export default function InstructorCourseView() {
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);

  if (!currentCourse) return null;

  return (
    <div>
      <InstructorNavbar />
      <InstructorCourseOverview course={currentCourse} />
    </div>
  );
}

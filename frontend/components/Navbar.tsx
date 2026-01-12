import { useCoursesStore } from "@/lib/store/courses";
import { usePathname } from "next/dist/client/components/navigation";
import React, { useEffect, useMemo } from "react";

export default function Navbar() {
    const pathname = usePathname();
    const courseMatch = useMemo(() => pathname.match(/^\/c\/(\d+)/), [pathname]);
    const courses = useCoursesStore((s) => s.courses);
    const [courseCode, setCourseCode] = React.useState<string | null>(null);
    useEffect(() => {
        if (courseMatch) {
            const courseId = parseInt(courseMatch[1], 0);
            const course = courses.find((c) => c.id === courseId);
            setCourseCode(course ? course.course_code : null);
            if (course) {
                document.title = `${course.name} - MMS`;
            } else {
                document.title = `Course ${courseId} - MMS`;
            }
        }
    }, [pathname, courses, courseMatch]);
    return (
        <div className="w-full">
            <nav className="bg-white opacity-60 h-12 gap-4 border-b-2 border-mms-grayLight flex text-sm items-center px-6">
                <p>Dashboard</p>
                <p>/</p>
                {courseMatch  && <p>{courseCode}</p>}
            </nav>
        </div>
    )
}
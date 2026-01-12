import { useCoursesStore } from "@/lib/store/courses";
import { usePathname } from "next/dist/client/components/navigation";
import React, { useEffect } from "react";

export default function Navbar() {
    const pathname = usePathname();
    const courseMatch = pathname.match(/^\/c\/(\d+)/);
    const courses = useCoursesStore((s) => s.courses);
    const [couresName, setCourseName] = React.useState<string | null>(null);
    useEffect(() => {
        if (courseMatch) {
            const courseId = parseInt(courseMatch[1], 0);
            const course = courses.find((c) => c.id === courseId);
            setCourseName(course ? course.name : null);
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
                {courseMatch  && <p>{couresName}</p>}
            </nav>
        </div>
    )
}
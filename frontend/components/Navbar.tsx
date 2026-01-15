import { useCoursesStore } from "@/lib/store/courses";
import { usePathname } from "next/dist/client/components/navigation";
import Link from "next/link";
import React, { useEffect, useMemo } from "react";

export default function Navbar() {
    const pathname = usePathname();
    const courseMatch = useMemo(() => pathname.match(/^\/c\/(\d+)/), [pathname]);
    const courses = useCoursesStore((s) => s.courses);
    const [courseCode, setCourseCode] = React.useState<string | null>(null);
    const PeopleMatch =  useMemo(() => pathname.match(/^\/c\/(\d+)\/p/), [pathname]); 
    const GradeMatch = useMemo(() => pathname.match(/^\/c\/(\d+)\/g/), [pathname]);
    const [courseId, setCourseId] = React.useState<number | null>(null);
    useEffect(() => {
        if (courseMatch) {
            const courseId = parseInt(courseMatch[1], 0);
            setCourseId(courseId);
            const course = courses.find((c) => c.id === courseId);
            setCourseCode(course ? course.course_code : null);
        }
    }, [pathname, courses, courseMatch]);
    return (
        <div className="w-full">
            <nav className="bg-white opacity-60 h-12 gap-4 border-b-2 border-mms-grayLight flex text-sm items-center px-6">
                <Link href="/"><p>Dashboard</p></Link>
                <p>/</p>
                {courseMatch  && <Link href={`/c/${courseId}`}><p>{courseCode}</p></Link>}
                {courseMatch && <p>/</p>}
                {PeopleMatch && <Link href={`/c/${courseId}/p`}><p>People</p></Link>}
                {GradeMatch && <Link href={`/c/${courseId}/g`}><p>Grades</p></Link>}
            </nav>
        </div>
    )
}
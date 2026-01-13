"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useCourses } from "@/hooks/useCourses";
import { useCoursesStore } from "@/lib/store/courses";
import { useAuthStore } from "@/lib/store/auth";
import { SectionHeader } from "../ui/SectionHeader";
import { CourseItem } from "../ui/CourseItem";
import { AiOutlineHome } from "react-icons/ai";
import { FaUserCheck } from "react-icons/fa";
import { MdGroups } from "react-icons/md";
import UserMenu from "./UserMenu";
import Link from "next/link";


export default function DashboardSidebar() {
	const { fetchCourses, loading, error } = useCourses();
	const courses = useCoursesStore((s) => s.courses);
	const [teachOpen, setTeachOpen] = useState(true);
	const [enrolledOpen, setEnrolledOpen] = useState(true);
	const pathname = usePathname();

	useEffect(() => {
        fetchCourses().catch(() => {});
	}, [fetchCourses]);

	const { teaching, enrolled } = useMemo(() => {
		const coursesList = Array.isArray(courses) ? courses : [];
		const teachingList = coursesList.filter(
			(c) => c.role === "instructor" || c.role === "ta"
		);
		const enrolledList = coursesList.filter((c) => c.role === "student");
		return { teaching: teachingList, enrolled: enrolledList };
	}, [courses]);

	return (
		<aside className="hidden md:flex w-1/6 h-screen max-h-screen border-r border-zinc-200 bg-white flex-col justify-between py-4">
			<div className="space-y-4">
				<UserMenu />
                <div className="px-4 space-y-2">
                    <Link href="/" className={`w-full flex items-center gap-3 px-3 py-2.5 text-gray-900 hover:bg-mms-indigoLight rounded-xl text-sm font-medium transition-colors ${
                        pathname === '/' ? 'bg-mms-grayLight' : ''
                    }`}>
                        <AiOutlineHome className="size-5" />
                        <span>Home</span>
                    </Link>

                    <div className="bg-white py-2">
                        <SectionHeader
                            title="Teaching"
                            expanded={teachOpen}
                            onToggle={() => setTeachOpen((v) => !v)}
                            icon={<MdGroups className="size-5 text-mms-black" />}
                        />
                        {teachOpen && (
                            <div className="mt-2 space-y-1">
                                {loading && <div className="px-4 text-sm text-gray-500">Loading...</div>}
                                {error && <div className="px-4 text-sm text-red-600">{error}</div>}
                                {!loading && !error && teaching.length === 0 && (
                                    <div className="px-4 text-sm text-gray-500">No teaching courses</div>
                                )}
                                {teaching.map((course) => (
                                    <CourseItem key={course.id} name={course.name} id={course.id} Highlight={pathname === `/c/${course.id}`} />
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="bg-white py-2">
                        <SectionHeader
                            title="Enrolled"
                            expanded={enrolledOpen}
                            onToggle={() => setEnrolledOpen((v) => !v)}
                            icon={<FaUserCheck className="size-5 text-mms-black" />}
                        />
                        {enrolledOpen && (
                            <div className="mt-2 space-y-1">
                                {loading && <div className="px-4 text-sm text-gray-500">Loading...</div>}
                                {error && <div className="px-4 text-sm text-red-600">{error}</div>}
                                {!loading && !error && enrolled.length === 0 && (
                                    <div className="px-4 text-sm text-gray-500">No enrolled courses</div>
                                )}
                                {enrolled.map((course) => (
                                    <CourseItem key={course.id} name={course.name} id={course.id} Highlight={pathname === `/c/${course.id}`} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
			</div>

			<div className="border-t border-zinc-200 pt-4 px-4 flex justify-center items-center">
				<span className="text-sm font-medium text-gray-700">IIT Gandhinagar</span>
			</div>
		</aside>
	);
}

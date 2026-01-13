"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCourseDetailStore } from "@/lib/store/courseDetail";

export default function TANavbar() {
  const params = useParams();
  const pathname = usePathname();
  const courseId = params.id;
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);

  const navItems = [
    { label: "Overview", href: `/c/${courseId}` },
    { label: "People", href: `/c/${courseId}/p` },
    { label: "Grades", href: `/c/${courseId}/g` },
  ];

  const isActive = (href: string) => {
    if (href === `/c/${courseId}`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="bg-white h-12 border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {currentCourse?.name || "Course"}
            </h2>
          </div>
          <nav className="flex gap-1 sm:gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useCoursesStore } from '@/lib/store/courses';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { FaUserCheck, FaUserCircle } from 'react-icons/fa';
import { MdLogout } from 'react-icons/md';
import { RiLockPasswordLine } from 'react-icons/ri';
import { FaUserCog, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { CoursesApi } from '@/lib/api/courses';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const courseMatch = useMemo(() => pathname.match(/^\/c\/(\d+)/), [pathname]);
  const adminMatch = useMemo(() => pathname.match(/^\/admin/), [pathname]);
  const courses = useCoursesStore((s) => s.courses);
  const [courseCode, setCourseCode] = React.useState<string | null>(null);
  const PeopleMatch = useMemo(() => pathname.match(/^\/c\/(\d+)\/p/), [pathname]);
  const GradeMatch = useMemo(() => pathname.match(/^\/c\/(\d+)\/g/), [pathname]);
  const [courseId, setCourseId] = React.useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (courseMatch) {
      const courseId = parseInt(courseMatch[1], 0);
      setCourseId(courseId);
      const course = courses.find((c) => c.id === courseId);
      setCourseCode(course ? course.course_code : null);
    }
  }, [pathname, courses, courseMatch]);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await CoursesApi.VerifyAdmin();
        setIsAdmin((response as any).isAdmin || false);
        if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
          console.log('Admin status:', (response as any).isAdmin);
        }
      } catch (err) {
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    };

    if (!adminLoading) {
      return; // Already checked
    }

    checkAdminStatus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push('/login');
  };

  const handleChangePassword = () => {
    router.push('/change-password');
    setMenuOpen(false);
  };

  const handleFeedback = () => {
    router.push('/feedback');
    setMenuOpen(false);
  };

  const handleInstructorResetPassword = () => {
    router.push('/instructor/reset-password');
    setMenuOpen(false);
  };

  const isInstructorOrTa = useMemo(() => {
    return courses.some((course) => course.role === 'instructor' || course.role === 'ta');
  }, [courses]);

  return (
    <div className="w-full relative z-9999">
      <nav className="bg-white h-12 gap-4 border-b-2 border-mms-grayLight flex text-sm items-center px-6 justify-between relative z-9999">
        <div className="flex gap-4 items-center">
          <Link href="/">
            <p>Dashboard</p>
          </Link>
          {!courseMatch && !adminMatch && <p>/</p>}
          {adminMatch && (
            <>
              <p>/</p>
              <Link href="/admin">
                <p className="text-mms-blue font-medium">Admin</p>
              </Link>
            </>
          )}
          {courseMatch && (
            <Link href={`/c/${courseId}`}>
              <p>{courseCode}</p>
            </Link>
          )}
          {courseMatch && <p>/</p>}
          {PeopleMatch && (
            <Link href={`/c/${courseId}/p`}>
              <p>People</p>
            </Link>
          )}
          {GradeMatch && (
            <Link href={`/c/${courseId}/g`}>
              <p>Grades</p>
            </Link>
          )}
        </div>

        {/* Desktop Admin Link */}
        <div className="hidden md:flex gap-4 items-center">
          {isAdmin && (
            <Link href="/admin">
              <button className="px-3 py-1.5 text-sm text-mms-blue font-medium hover:bg-blue-50 rounded-md transition-colors flex items-center gap-2">
                <FaShieldAlt className="size-4" />
                Admin
              </button>
            </Link>
          )}
        </div>

        <div className="md:hidden bg-white relative z-9999" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-full transition-colors relative z-9999"
            aria-label="User menu"
          >
            <FaUserCircle className="size-6 text-gray-700" />
          </button>

          {menuOpen && (
            <div className="fixed right-2 top-14 bg-white rounded-lg shadow-xl z-9999 min-w-180px border border-gray-200">
              {isAdmin && (
                <button
                  onClick={() => {
                    router.push('/admin');
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-mms-blue flex gap-2 items-center first:rounded-t-lg transition font-medium border-b border-gray-100"
                >
                  <FaShieldAlt className="size-4" />
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={handleChangePassword}
                className={`w-full text-left px-4 py-2.5 text-sm text-gray-900 flex gap-2 items-center transition ${
                  !isAdmin ? 'first:rounded-t-lg' : ''
                }`}
              >
                <RiLockPasswordLine className="size-4" />
                Change Password
              </button>
              {isInstructorOrTa && (
                <button
                  onClick={handleInstructorResetPassword}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-900 flex gap-2 items-center transition"
                >
                  <FaUserCog className="size-4" />
                  Reset User Password
                </button>
              )}
              <button
                onClick={handleFeedback}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-900 flex gap-2 items-center transition"
              >
                <FaUserCheck className="size-4" />
                Bug Report
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 last:rounded-b-lg flex items-center gap-2"
              >
                <MdLogout className="size-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}

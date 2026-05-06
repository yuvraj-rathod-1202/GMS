'use client';
import React, { useState, useCallback } from 'react';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useAuthStore } from '@/lib/store/auth';
import CourseManagementTable from './components/CourseManagementTable';
import CreateCourseForm from './components/CreateCourseForm';
import AssignInstructorModal from './components/AssignInstructorModal';
import AnalyticsPanel from './components/AnalyticsPanel';
import EditCourseForm from './components/EditCourseForm';
import { CourseDBObject } from '@/lib/types/courses';
import Link from 'next/link';
import { BiShieldQuarter, BiSpreadsheet } from 'react-icons/bi';

type Tab = 'overview' | 'courses';

export default function AdminPage() {
  const { isAdmin, isLoading } = useAdminAccess('/dashboard');
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? 0;

  // Modal states
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [showAssignInstructor, setShowAssignInstructor] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<CourseDBObject | null>(null);

  // Refresh trigger for course table
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Tab state for mobile
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Handle create course modal
  const handleOpenCreateCourse = useCallback(() => {
    setShowCreateCourse(true);
  }, []);

  const handleCloseCreateCourse = useCallback(() => {
    setShowCreateCourse(false);
  }, []);

  const handleCreateCourseSuccess = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleOpenEditCourse = useCallback((course: CourseDBObject) => {
    setSelectedCourse(course);
    setShowEditCourse(true);
  }, []);

  const handleCloseEditCourse = useCallback(() => {
    setShowEditCourse(false);
    setSelectedCourse(null);
  }, []);

  const handleEditCourseSuccess = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Handle assign instructor modal
  const handleOpenAssignInstructor = useCallback((courseId: number, courseName?: string) => {
    setSelectedCourseId(courseId);
    if (courseName) setSelectedCourseName(courseName);
    setShowAssignInstructor(true);
  }, []);

  const handleCloseAssignInstructor = useCallback(() => {
    setShowAssignInstructor(false);
    setSelectedCourseId(null);
    setSelectedCourseName('');
  }, []);

  const handleAssignInstructorSuccess = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-gray-600 text-lg">Verifying admin access...</p>
      </div>
    );
  }

  // If not admin, access denied (useAdminAccess already redirects, but as fallback)
  if (!isAdmin) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <p className="font-medium">Access Denied</p>
        <p className="text-sm mt-1">You do not have admin privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Manage courses, assign instructors, and view system-wide analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/entities">
            <button className="flex items-center gap-2 px-4 py-2 bg-mms-blue text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">
              <BiSpreadsheet className="text-xl" />
              Manage All Entities
            </button>
          </Link>
        </div>
      </div>

      {/* Tab Navigation (Mobile Only) */}
      <div className="lg:hidden mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-medium text-sm transition-colors ${
            activeTab === 'overview'
              ? 'text-mms-blue border-b-2 border-mms-blue'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-3 font-medium text-sm transition-colors ${
            activeTab === 'courses'
              ? 'text-mms-blue border-b-2 border-mms-blue'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Courses
        </button>
      </div>

      {/* Desktop Layout: Two Column */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {/* Left Column: Analytics Panel (1 column) */}
        <div className="lg:col-span-1">
          <AnalyticsPanel />
        </div>

        {/* Right Column: Course Management (2 columns) */}
        <div className="lg:col-span-2">
          <CourseManagementTable
            userId={userId}
            onAssignInstructor={handleOpenAssignInstructor}
            onEditCourse={handleOpenEditCourse}
            onCreateCourse={handleOpenCreateCourse}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>

      {/* Mobile Layout: Tabbed */}
      <div className="lg:hidden">
        {activeTab === 'overview' && <AnalyticsPanel />}
        {activeTab === 'courses' && (
          <CourseManagementTable
            userId={userId}
            onAssignInstructor={handleOpenAssignInstructor}
            onEditCourse={handleOpenEditCourse}
            onCreateCourse={handleOpenCreateCourse}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateCourse && (
        <CreateCourseForm
          userId={userId}
          onClose={handleCloseCreateCourse}
          onSuccess={handleCreateCourseSuccess}
        />
      )}

      {showEditCourse && selectedCourse && (
        <EditCourseForm
          userId={userId}
          course={selectedCourse}
          onClose={handleCloseEditCourse}
          onSuccess={handleEditCourseSuccess}
        />
      )}

      {showAssignInstructor && selectedCourseId && (
        <AssignInstructorModal
          courseId={selectedCourseId}
          userId={userId}
          courseName={selectedCourseName || `Course ${selectedCourseId}`}
          onClose={handleCloseAssignInstructor}
          onSuccess={handleAssignInstructorSuccess}
        />
      )}
    </div>
  );
}

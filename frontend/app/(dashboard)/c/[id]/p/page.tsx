'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import { useCourseManagement } from '@/hooks/useCourseManagement';
import { TAPeopleView } from '@/components/People/TAPeopleView';
import { InstructorPeopleView } from '@/components/People/InstructorPeopleView';
import * as XLSX from 'xlsx';

export default function PeoplePage() {
  const params = useParams();
  const courseId = Number(params.id);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkEnrollDialog, setShowBulkEnrollDialog] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const { role, course, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['ta', 'instructor'],
    courseId,
  });

  const currentCourse = useCourseDetailStore((s) => s.currentCourse);

  const {
    loading: managementLoading,
    fetchCourseRoles,
    enrollStudent,
    unenrollStudent,
    AddTA,
    RemoveTA,
    BulkEnrollStudent,
  } = useCourseManagement(role || 'ta');

  useEffect(() => {
    if (!isLoading && hasAccess && !isFetchingData) {
      const fetchStudents = async () => {
        setIsFetchingData(true);
        try {
          await fetchCourseRoles(courseId, false, role === 'instructor');
        } catch (error) {
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.error('Error fetching students:', error);
          }
        } finally {
          setIsFetchingData(false);
        }
      };
      fetchStudents();
    }
  }, [courseId, hasAccess, isLoading, fetchCourseRoles]);

  if (isLoading || !currentCourse || !hasAccess || isFetchingData) {
    return (
      <div className="flex justify-center items-center h-full p-10">
        <div className="text-gray-900 text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  const handleEnrollStudent = async (studentId: string, email: string) => {
    if (!studentId.trim()) {
      alert('Please enter a student ID');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to enroll student with ID: ${studentId}?`
    );
    if (!confirmed) return;

    try {
      await enrollStudent(courseId, { student_id: Number(studentId), email: email.trim() });
      // alert('Student enrolled successfully!');
      setShowEnrollDialog(false);
      await fetchCourseRoles(courseId, true, role === 'instructor');
    } catch (error: any) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error enrolling student:', error);
      }
      alert('Failed to enroll student');
    }
  };

  const handleRemoveStudent = async (studentIdToRemove: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove student with ID: ${studentIdToRemove} from the course?`
    );
    if (!confirmed) return;
    try {
      await unenrollStudent(courseId, studentIdToRemove);
      await fetchCourseRoles(courseId, true, role === 'instructor');
      alert('Student removed successfully!');
    } catch (error: any) {
      alert('Failed to remove student');
    }
  };

  const handleAddTA = async (taId: string, email: string) => {
    if (!taId.trim()) {
      alert('Please enter a TA ID');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to add TA with ID: ${taId}?`);
    if (!confirmed) return;

    try {
      await AddTA(courseId, { ta_id: Number(taId), email: email.trim() });
      await fetchCourseRoles(courseId, true, true);
      alert('TA added successfully!');
      setShowAddDialog(false);
    } catch (error: any) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error adding TA:', error);
      }
      alert('Failed to add TA');
    }
  };

  const handleRemoveTA = async (taId: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove TA with ID: ${taId} from the course?`
    );
    if (!confirmed) return;
    try {
      await RemoveTA(courseId, taId);
      await fetchCourseRoles(courseId, true, true);
      alert('TA removed successfully!');
    } catch (error: any) {
      alert('Failed to remove TA');
    }
  };

  const parseCSV = (text: string): Array<{ student_id: number; email: string }> => {
    const lines = text.trim().split('\n');
    const data: Array<{ student_id: number; email: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map((v) => v.trim());
      if (values.length >= 2) {
        const studentId = parseInt(values[0]);
        const email = values[1];

        if (!isNaN(studentId) && email) {
          data.push({
            student_id: studentId,
            email: email,
          });
        }
      }
    }

    return data;
  };

  const parseExcel = async (file: File): Promise<Array<{ student_id: number; email: string }>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

          const parsedData: Array<{ student_id: number; email: string }> = [];

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length < 2) continue;

            const studentId = parseInt(String(row[0]));
            const email = String(row[1]);

            if (!isNaN(studentId) && email) {
              parsedData.push({
                student_id: studentId,
                email: email,
              });
            }
          }

          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const handleBulkEnroll = async (file: File) => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }

      let parsedData: Array<{ student_id: number; email: string }> = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        parsedData = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsedData = await parseExcel(file);
      } else {
        alert('Only CSV and Excel files are supported.');
        return;
      }

      if (parsedData.length === 0) {
        alert('No valid data found in file. Please check the format.');
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to enroll ${parsedData.length} student${parsedData.length > 1 ? 's' : ''}?`
      );
      if (!confirmed) return;

      await BulkEnrollStudent(courseId, parsedData);
      await fetchCourseRoles(courseId, true, role === 'instructor');

      alert(
        `Successfully enrolled ${parsedData.length} student${parsedData.length > 1 ? 's' : ''}!`
      );
      setShowBulkEnrollDialog(false);
    } catch (error: any) {
      console.error('Bulk enrollment error:', error);
      alert('Failed to enroll students. Please check the file format and try again.');
    }
  };

  switch (role) {
    case 'ta':
      return (
        <TAPeopleView
          setShowEnrollDialog={setShowEnrollDialog}
          showEnrollDialog={showEnrollDialog}
          handleEnrollStudent={handleEnrollStudent}
          handleRemoveStudent={handleRemoveStudent}
          managementLoading={managementLoading}
        />
      );
    case 'instructor':
      return (
        <InstructorPeopleView
          setShowEnrollDialog={setShowEnrollDialog}
          showEnrollDialog={showEnrollDialog}
          showAddDialog={showAddDialog}
          setShowAddDialog={setShowAddDialog}
          showBulkEnrollDialog={showBulkEnrollDialog}
          setShowBulkEnrollDialog={setShowBulkEnrollDialog}
          handleEnrollStudent={handleEnrollStudent}
          handleRemoveStudent={handleRemoveStudent}
          handleAddTA={handleAddTA}
          handleRemoveTA={handleRemoveTA}
          handleBulkEnroll={handleBulkEnroll}
          managementLoading={managementLoading}
        />
      );
  }
}

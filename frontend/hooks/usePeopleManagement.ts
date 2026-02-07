import { parseCSV, parseExcel } from '@/lib/utils/excelParser';
import { useCourseManagement } from './useCourseManagement';

type UserRole = 'instructor' | 'ta' | 'student';

export function usePeopleManagement(
  courseId: number,
  role: UserRole,
  setShowEnrollDialog: (show: boolean) => void,
  setShowAddDialog: (show: boolean) => void,
  setShowBulkEnrollDialog: (show: boolean) => void
) {
  const {
    loading: managementLoading,
    fetchCourseRoles,
    enrollStudent,
    unenrollStudent,
    UnEnrollAllStudents,
    AddTA,
    RemoveTA,
    BulkEnrollStudent,
  } = useCourseManagement(role || 'ta');

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
        // alert('TA added successfully!');
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
        // alert('TA removed successfully!');
      } catch (error: any) {
        alert('Failed to remove TA');
      }
    };

    const handleUnenrollAllStudents = async () => {
      const confirmed = window.confirm(
        'Are you sure you want to unenroll ALL students from this course? This action cannot be undone.'
      );
      if (!confirmed) return;

      try {
        await UnEnrollAllStudents(courseId);
        await fetchCourseRoles(courseId, true, role === 'instructor');
        alert('All students have been unenrolled successfully!');
      } catch (error: any) {
        if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
          console.error('Error unenrolling all students:', error);
        }
        alert('Failed to unenroll all students');
      }
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

    return {
      managementLoading,
      fetchCourseRoles,
      handleEnrollStudent,
      handleRemoveStudent,
      handleAddTA,
      handleRemoveTA,
      handleUnenrollAllStudents,
      handleBulkEnroll,
    };
}

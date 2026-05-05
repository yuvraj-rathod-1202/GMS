'use client';

import UserEnrollDialog from '@/components/People/Dialogs/UserEnrollDialog';

interface EnrollStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentId: string, email: string) => Promise<void>;
  isLoading: boolean;
}

export default function EnrollStudentDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: EnrollStudentDialogProps) {
  return (
    <UserEnrollDialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      isLoading={isLoading}
      title="Enroll Student"
      idLabel="Student ID (Roll No)"
      idPlaceholder="Enter student ID"
      submitLabel="Enroll"
      loadingLabel="Enrolling..."
    />
  );
}

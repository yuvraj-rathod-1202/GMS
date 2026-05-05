'use client';

import UserEnrollDialog from '@/components/People/Dialogs/UserEnrollDialog';

interface AddTADialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taId: string, email: string) => Promise<void>;
  isLoading: boolean;
}

export default function AddTADialog({ isOpen, onClose, onSubmit, isLoading }: AddTADialogProps) {
  return (
    <UserEnrollDialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      isLoading={isLoading}
      title="Add TA"
      idLabel="TA ID (Roll No)"
      idPlaceholder="Enter TA ID"
      submitLabel="Enroll"
      loadingLabel="Enrolling..."
    />
  );
}

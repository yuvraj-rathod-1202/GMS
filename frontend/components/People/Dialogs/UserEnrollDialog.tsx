'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface UserEnrollDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, email: string) => Promise<void>;
  isLoading: boolean;
  title: string;
  idLabel: string;
  idPlaceholder: string;
  submitLabel: string;
  loadingLabel: string;
}

export default function UserEnrollDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  title,
  idLabel,
  idPlaceholder,
  submitLabel,
  loadingLabel,
}: UserEnrollDialogProps) {
  const [userId, setUserId] = React.useState('');
  const [email, setEmail] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setUserId('');
      setEmail('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setUserId('');
    setEmail('');
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(userId, email);
    setUserId('');
    setEmail('');
  };

  return (
    <Modal open={isOpen} title={title} onClose={handleClose} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={idLabel}
          type="number"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder={idPlaceholder}
          disabled={isLoading}
          required
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter email"
          disabled={isLoading}
          required
        />

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? loadingLabel : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

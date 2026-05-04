'use client';

import React, { useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { AdminApi } from '@/lib/api/admin';

interface AssignInstructorModalProps {
  courseId: number;
  userId: number;
  courseName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignInstructorModal({
  courseId,
  userId,
  courseName,
  onClose,
  onSuccess,
}: AssignInstructorModalProps) {
  const [instructorId, setInstructorId] = useState<string>('');
  const [instructorEmail, setInstructorEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateInputs = (): boolean => {
    if (!instructorId.trim()) {
      setError('Please enter instructor ID');
      return false;
    }

    if (!instructorEmail.trim()) {
      setError('Please enter instructor email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(instructorEmail)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);
      await AdminApi.AssignInstructor(courseId, {
        user_id: userId,
        instructor_id: Number(instructorId),
        email: instructorEmail.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (error: unknown) {
      console.error('Error assigning instructor:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign instructor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      title="Assign Instructor"
      description={`Assign an instructor to ${courseName}`}
      onClose={onClose}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">Instructor assigned successfully!</Alert>}

        <Input
          label="Instructor ID"
          type="number"
          value={instructorId}
          onChange={(event) => setInstructorId(event.target.value)}
          placeholder="e.g., 123456"
          disabled={loading}
          required
        />

        <Input
          label="Email Address"
          type="email"
          value={instructorEmail}
          onChange={(event) => setInstructorEmail(event.target.value)}
          placeholder="e.g., instructor@iitgn.ac.in"
          disabled={loading}
          required
        />

        <Alert variant="info">
          <p className="font-medium">Tip:</p>
          <p className="mt-1">
            Enter the instructor&apos;s ID and email address. Make sure the email matches their registered account.
          </p>
        </Alert>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
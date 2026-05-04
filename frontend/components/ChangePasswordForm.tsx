'use client';

import React, { useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Props = {
  onSubmit: (oldPassword: string, newPassword: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
};

export default function ChangePasswordForm({ onSubmit, loading, error, success }: Props) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    if (!oldPassword) {
      setLocalError('Please enter your current password');
      return;
    }

    if (!newPassword) {
      setLocalError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setLocalError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('New passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      setLocalError('New password must be different from current password');
      return;
    }

    try {
      await onSubmit(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      // Parent component owns the API error state.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-left">
      <Input
        label="Current Password"
        value={oldPassword}
        onChange={(event) => setOldPassword(event.target.value)}
        type="password"
        placeholder="Current password"
        disabled={loading}
        required
      />

      <Input
        label="New Password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        type="password"
        placeholder="New password"
        disabled={loading}
        required
      />

      <Input
        label="Confirm New Password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        type="password"
        placeholder="Confirm new password"
        disabled={loading}
        required
      />

      {localError && <Alert variant="error">{localError}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">Password changed successfully!</Alert>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Changing Password...' : 'Change Password'}
      </Button>
    </form>
  );
}

'use client';
import React, { useState } from 'react';

type Props = {
  onSubmit: (oldPassword: string, newPassword: string) => Promise<any>;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
};

export default function ChangePasswordForm({ onSubmit, loading, error, success }: Props) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    } catch (err) {}
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto text-left">
      <Inputbox label="Current Password" value={oldPassword} OnChange={setOldPassword} />
      <Inputbox label="New Password" value={newPassword} OnChange={setNewPassword} />
      <Inputbox
        label="Confirm New Password"
        value={confirmPassword}
        OnChange={setConfirmPassword}
      />

      {localError && <div className="text-red-600 mb-2 text-sm">{localError}</div>}
      {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
      {success && <div className="text-green-600 mb-2 text-sm">Password changed successfully!</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-md bg-gray-800 text-white disabled:opacity-60 hover:bg-gray-700 transition-colors"
      >
        {loading ? 'Changing Password...' : 'Change Password'}
      </button>
    </form>
  );
}

function Inputbox({
  label,
  value,
  OnChange,
}: {
  label: string;
  value: string;
  OnChange: (val: string) => void;
}) {
  return (
    <div className="mb-4">
      <label className="block mb-1.5 text-gray-700">{label}</label>
      <input
        value={value}
        onChange={(e) => OnChange(e.target.value)}
        type="password"
        placeholder={label}
        className="w-full px-3 py-2 rounded-md border border-gray-300 outline-none focus:ring-2 focus:ring-gray-400"
      />
    </div>
  );
}

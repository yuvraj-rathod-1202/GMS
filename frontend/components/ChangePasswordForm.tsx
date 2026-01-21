"use client";
import React, { useState } from "react";

type Props = {
  onSubmit: (oldPassword: string, newPassword: string) => Promise<any>;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
};

export default function ChangePasswordForm({ onSubmit, loading, error, success }: Props) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!oldPassword) {
      setLocalError("Please enter your current password");
      return;
    }
    if (!newPassword) {
      setLocalError("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      setLocalError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("New passwords do not match");
      return;
    }
    if (oldPassword === newPassword) {
      setLocalError("New password must be different from current password");
      return;
    }

    try {
      await onSubmit(oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto text-left">
      <div className="mb-4">
        <label className="block mb-1.5 text-gray-700">Current Password</label>
        <input
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          type="password"
          placeholder="Enter current password"
          className="w-full px-3 py-2 rounded-md border border-gray-300 outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1.5 text-gray-700">New Password</label>
        <input
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          placeholder="Enter new password"
          className="w-full px-3 py-2 rounded-md border border-gray-300 outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1.5 text-gray-700">Confirm New Password</label>
        <input
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          placeholder="Confirm new password"
          className="w-full px-3 py-2 rounded-md border border-gray-300 outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

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

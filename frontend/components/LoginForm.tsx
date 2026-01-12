"use client";
import React, { useState } from "react";

type Props = {
  onSubmit: (id: number, password: string) => Promise<any>;
  loading?: boolean;
  error?: string | null;
};

export default function LoginForm({ onSubmit, loading, error }: Props) {
  const [id, setId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const parsed = Number(id);
    if (!id || Number.isNaN(parsed)) {
      setLocalError("Please enter a valid numeric ID");
      return;
    }
    if (!password) {
      setLocalError("Please enter your password");
      return;
    }

    try {
      await onSubmit(parsed, password);
    } catch (err) {
      // error is handled by parent; nothing to do here
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto text-left">
      <div className="mb-4">
        <label className="block mb-1.5">User ID</label>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Enter user id"
          inputMode="numeric"
          className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-mms-grayLight outline-none focus:ring-2 focus:ring-mms-blue"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1.5">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Enter password"
          className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-mms-grayLight outline-none focus:ring-2 focus:ring-mms-blue"
        />
      </div>

      {localError && <div className="text-red-600 mb-2 text-sm">{localError}</div>}
      {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 hover:cursor-pointer rounded-md bg-mms-blue text-white disabled:opacity-60 hover:bg-mms-indigo transition-colors"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

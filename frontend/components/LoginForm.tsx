'use client';

import React, { useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Props = {
  onSubmit: (id: number, password: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
};

export default function LoginForm({ onSubmit, loading, error }: Props) {
  const [id, setId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    const parsed = Number(id);
    if (!id || Number.isNaN(parsed)) {
      setLocalError('Please enter a valid numeric ID');
      return;
    }

    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    try {
      await onSubmit(parsed, password);
    } catch {
      // Error is handled by the parent component.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <Input
        label="User ID"
        value={id}
        onChange={(event) => setId(event.target.value)}
        placeholder="Enter user ID"
        inputMode="numeric"
        disabled={loading}
        required
      />

      <Input
        label="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        type="password"
        placeholder="Enter password"
        disabled={loading}
        required
      />

      {localError && <Alert variant="error">{localError}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}

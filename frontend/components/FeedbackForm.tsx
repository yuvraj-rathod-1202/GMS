'use client';
import React, { useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';

type Props = {
  onSubmit: (feedbackText: string) => Promise<unknown>;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
};

export default function FeedbackForm({ onSubmit, loading, error, success }: Props) {
  const [feedbackText, setFeedbackText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!feedbackText.trim()) {
      setLocalError('Please enter your feedback');
      return;
    }

    try {
      await onSubmit(feedbackText);
      setFeedbackText(''); // Clear form on success
    } catch {
      // error is handled by parent
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Textarea
        label="Your Feedback"
        value={feedbackText}
        onChange={(event) => setFeedbackText(event.target.value)}
        placeholder="Share your thoughts, suggestions, or report issues..."
        rows={6}
        wrapperClassName="mb-4"
      />

      {localError && (
        <Alert variant="error" className="mb-3">
          {localError}
        </Alert>
      )}
      {error && (
        <Alert variant="error" className="mb-3">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-3">
          Thank you! Your Bug Report has been submitted successfully.
        </Alert>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Submitting...' : 'Submit Report'}
      </Button>
    </form>
  );
}

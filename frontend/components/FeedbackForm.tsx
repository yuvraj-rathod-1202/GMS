'use client';
import React, { useState } from 'react';

type Props = {
  onSubmit: (feedbackText: string) => Promise<any>;
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
    } catch (err) {
      // error is handled by parent
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-4">
        <label className="block mb-2 text-gray-700 font-medium">Your Feedback</label>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Share your thoughts, suggestions, or report issues..."
          rows={6}
          className="w-full px-3 py-2 rounded-md border text-black border-gray-300 bg-gray-50 outline-none focus:ring-2 focus:ring-mms-blue resize-none"
        />
      </div>

      {localError && <div className="text-red-600 mb-3 text-sm">{localError}</div>}
      {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}
      {success && (
        <div className="text-green-600 mb-3 text-sm font-medium">
          Thank you! Your Bug Report has been submitted successfully.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-md bg-mms-blue text-white disabled:opacity-60 hover:bg-mms-indigo transition-colors"
      >
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
}

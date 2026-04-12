'use client';
import React, { useState, useEffect } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);
      await AdminApi.AssignInstructor(courseId, {
        user_id: userId,
        instructor_id: parseInt(instructorId),
        email: instructorEmail,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error assigning instructor:', err);
      setError(err?.message || 'Failed to assign instructor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Assign Instructor</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Assign an instructor to <span className="font-medium">{courseName}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
            Instructor assigned successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructor ID *
            </label>
            <input
              type="number"
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              placeholder="e.g., 123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mms-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={instructorEmail}
              onChange={(e) => setInstructorEmail(e.target.value)}
              placeholder="e.g., instructor@iitgn.ac.in"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mms-blue"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">Tip:</p>
            <p>Enter the instructor's ID and email address. Make sure the email matches their registered account.</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-mms-blue text-white rounded-md hover:bg-mms-indigo transition-colors disabled:opacity-50 font-medium text-sm"
            >
              {loading ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

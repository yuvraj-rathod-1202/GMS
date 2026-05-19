'use client';

import React, { useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { AdminApi } from '@/lib/api/admin';
import { BiSearch, BiLoaderAlt, BiUserCheck } from 'react-icons/bi';
import { useEffect } from 'react';

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

  // User selection states
  const [users, setUsers] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userOffset, setUserOffset] = useState(0);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const USER_LIMIT = 10;

  useEffect(() => {
    fetchUsers(0, true);
  }, []);

  const fetchUsers = async (offset: number, isInitial = false, search = '') => {
    setUserLoading(true);
    try {
      const res: any = await AdminApi.FetchAllUsers(USER_LIMIT, offset, search);
      const newUsers = res.users || [];
      
      if (isInitial) {
        setUsers(newUsers);
        setUserOffset(0);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
        setUserOffset(offset);
      }
      
      setHasMoreUsers(newUsers.length === USER_LIMIT);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users for selection');
    } finally {
      setUserLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(0, true, userSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleLoadMoreUsers = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fetchUsers(userOffset + USER_LIMIT, false, userSearch);
  };

  const handleSelectUser = (user: any) => {
    setInstructorId(user.id.toString());
    setInstructorEmail(user.email);
  };

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
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error assigning instructor:', error);
      }
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

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Search Instructor</label>
            <div className="relative">
              <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search by ID or Email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gms-blue/20 outline-none"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 scrollbar-hide">
            {users.length === 0 && !userLoading && (
              <div className="p-8 text-center text-gray-400 text-sm">No users found</div>
            )}
            
            {users.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  className={`w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-gray-50 ${
                    instructorId === user.id.toString() ? 'bg-blue-50/50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${instructorId === user.id.toString() ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                      <BiUserCheck className="text-lg" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{user.email}</div>
                      <div className="text-[10px] text-gray-500">ID: {user.id}</div>
                    </div>
                  </div>
                  {instructorId === user.id.toString() && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </button>
              ))}

            {hasMoreUsers && (
              <button
                type="button"
                onClick={handleLoadMoreUsers}
                disabled={userLoading}
                className="w-full p-3 text-xs font-bold text-gms-blue hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {userLoading ? (
                  <>
                    <BiLoaderAlt className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Users'
                )}
              </button>
            )}
          </div>
        </div>

        {instructorId && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase">Selected Instructor</span>
              <button 
                type="button"
                onClick={() => { setInstructorId(''); setInstructorEmail(''); }}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Change
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-sm font-bold text-blue-900">{instructorEmail}</div>
              <div className="text-xs text-blue-600">User ID: {instructorId}</div>
            </div>
          </div>
        )}

        <Alert variant="info">
          <p className="font-medium text-xs">Important:</p>
          <p className="mt-1 text-[11px]">
            Assigning an instructor grants them full access to manage course content and marks for {courseName}.
          </p>
        </Alert>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
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

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { MdLogout } from 'react-icons/md';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/lib/store/auth';
import { RiLockPasswordLine } from 'react-icons/ri';

export default function UserMenu() {
  const router = useRouter();
  const { logout } = useAuth();
  const user = useAuthStore((s) => s.user);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push('/login');
  };

  const handleChangePassword = () => {
    router.push('/change-password');
    setUserMenuOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-mms-indigoLight rounded-lg">
        <FaUserCircle className="size-6 text-mms-black" />
        <span
          className="truncate font-semibold text-base text-gray-900"
          title={user?.email || 'User'}
        >
          {user?.email.split('@')[0] || 'User'}
        </span>
      </button>

      {userMenuOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg z-50">
          <button
            onClick={handleChangePassword}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-mms-indigoLight flex gap-2 items-center first:rounded-t-lg transition"
          >
            <RiLockPasswordLine className="size-4" /> Change Password
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg  flex items-center gap-2"
          >
            <MdLogout className="size-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { Authapi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth';

// export default function ChangePasswordPage() {
//   const router = useRouter();
//   const user = useAuthStore((s) => s.user);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState(false);
//   const logout = useAuthStore((s) => s.logout);

//   async function handleSubmit(oldPassword: string, newPassword: string) {
//     if (!user?.id) {
//       setError('User not authenticated');
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     setSuccess(false);

//     try {
//       await Authapi.changePassword({
//         id: user.id,
//         old_password: oldPassword,
//         new_password: newPassword,
//       });
//       setSuccess(true);
//       logout();
//       setTimeout(() => {
//         router.push('/login');
//       }, 2000);
//     } catch (err: any) {
//       setError(err?.message || 'Failed to change password');
//     } finally {
//       setLoading(false);
//     }
//   }

//   // Redirect if not logged in
//   if (!user) {
//     router.push('/login');
//     return null;
//   }

//   return (
//     <main className="min-h-screen flex items-center justify-center bg-gray-50">
//       <div className="w-full max-w-md p-8 border border-gray-200 rounded-lg bg-white">
//         <div className="mb-6">
//           <button
//             onClick={() => router.back()}
//             className="text-gray-600 cursor-pointer flex flex-row gap-2 hover:text-gray-800 text-sm mb-4"
//           >
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M10 19l-7-7m0 0l7-7m-7 7h18"
//               />
//             </svg>{' '}
//             Back
//           </button>
//           <h1 className="text-2xl font-semibold text-gray-900">Change Password</h1>
//           <p className="text-sm text-gray-600 mt-2">Update your account password</p>
//         </div>
//         <ChangePasswordForm
//           onSubmit={handleSubmit}
//           loading={loading}
//           error={error}
//           success={success}
//         />
//       </div>
//     </main>
//   );
// }

export default function ChangePasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <h1>Change Password</h1>
    </main>
  );
}
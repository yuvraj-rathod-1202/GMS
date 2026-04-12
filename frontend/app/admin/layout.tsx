'use client';
import ProtectedLayout from '@/components/ProtectedLayout';
import NavBar from '@/components/NavBar';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedLayout>
      <main className="flex flex-col w-full min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex-1 p-6 md:p-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-gray-900 transition-colors">
                Dashboard
              </a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">Admin</span>
            </nav>
          </div>

          {children}
        </div>
      </main>
    </ProtectedLayout>
  );
}

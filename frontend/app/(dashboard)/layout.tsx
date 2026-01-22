'use client';
import ProtectedLayout from '@/components/ProtectedLayout';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';
import NavBar from '@/components/NavBar';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedLayout>
      <main className="flex flex-row">
        <DashboardSidebar />
        <div className="flex flex-col w-full">
          <NavBar />
          {children}
        </div>
      </main>
    </ProtectedLayout>
  );
}

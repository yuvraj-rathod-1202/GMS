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
      <main className="flex flex-row h-screen overflow-hidden">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50/30">
          <NavBar />
          <div className="flex-1">{children}</div>
        </div>
      </main>
    </ProtectedLayout>
  );
}

"use client";
import ProtectedLayout from "@/components/ProtectedLayout";
import DashboardSidebar from "@/components/Dashboard/DashboardSidebar";
import Navbar from "@/components/NavBar";

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
          <Navbar />
          {children}
        </div>
      </main>
    </ProtectedLayout>
  );
}

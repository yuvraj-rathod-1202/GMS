"use client";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuthStore } from "@/lib/store/auth";
import { useAuth } from "@/hooks/useAuth";
import DashboardSidebar from "@/components/DashboardSidebar";
import Navbar from "@/components/NavBar";
import DashboardCourses from "@/components/DshboardCourses";

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  const handleLogout = async () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <ProtectedLayout>
      <main className="flex flex-row">
        <DashboardSidebar />
        <div className="flex flex-col w-full">
          <Navbar />
          <DashboardCourses />
        </div>
      </main>
    </ProtectedLayout>
  );
}

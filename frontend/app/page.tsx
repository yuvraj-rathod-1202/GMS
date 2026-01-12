"use client";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuthStore } from "@/lib/store/auth";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  const handleLogout = async () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <ProtectedLayout>
      <main style={{ padding: 24 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1>Welcome to MMS</h1>
          {user && (
            <div>
              <p>Logged in as: {user.email}</p>
              <button
                onClick={handleLogout}
                style={{
                  padding: "8px 16px",
                  background: "#ff6b6b",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </main>
    </ProtectedLayout>
  );
}

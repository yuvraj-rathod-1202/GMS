"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedLayout({ children }: Props) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Wait for client hydration to avoid false redirects
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Client-side failsafe: token required and not expired
    const msInDay = 24 * 60 * 60 * 1000;
    const lastLogin = typeof window !== 'undefined' ? localStorage.getItem('lastLogin') : null;
    const expired = lastLogin ? (Date.now() - Date.parse(lastLogin)) > msInDay : false;
    if (hydrated && (!token || expired)) {
      // Clear server cookie if expired
      if (expired) {
        fetch('/api/session', { method: 'DELETE' }).catch(() => {});
      }
      router.push("/login");
    }
  }, [token, router, hydrated]);

  if (!hydrated) {
    return null;
  }

  if (!token) {
    return <div>Redirecting to login...</div>;
  }

  return <>{children}</>;
}

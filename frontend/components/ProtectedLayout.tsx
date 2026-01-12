"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedLayout({ children }: Props) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  if (!token) {
    return <div>Redirecting to login...</div>;
  }

  return <>{children}</>;
}

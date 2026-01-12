"use client";
import { useState } from "react";
import { Authapi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth";

export function useAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(id: number, password: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await Authapi.login(id, password);
      // Expecting { user, token } 
      const user = (data as any).user ?? null;
      const token = (data as any).token ?? null;
      if (!token) throw new Error("Invalid login response");
      setAuth(user, token);
      return { user, token };
    } catch (err: any) {
      setError(err?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    login,
    logout,
    loading,
    error,
    clearError: () => setError(null),
  };
}

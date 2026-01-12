"use client";
import React from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAuth();

  async function handleSubmit(id: number, password: string) {
    try {
      await login(id, password);
      router.push('/');
    } catch (err) {
      // hook exposes error state; LoginForm will show it
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-90 p-6 border border-zinc-200 rounded-xl shadow-lg bg-white items-center text-center">
        <h1 className="m-0 mb-3 text-xl font-bold">Login</h1>
        <LoginForm onSubmit={handleSubmit} loading={loading} error={error} />
      </div>
    </main>
  );
}

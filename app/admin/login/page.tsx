"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Lock } from "lucide-react";
import { useAdminBasePath } from "@/components/admin/AdminProvider";

function LoginForm() {
  const basePath = useAdminBasePath();
  const router = useRouter();
  const search = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Login failed. Please try again.");
        setSubmitting(false);
        return;
      }
      const next = search.get("next");
      // Only trust same-path admin redirects.
      const dest = next && next.startsWith(basePath) ? next : basePath;
      router.replace(dest);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 shadow-xs">
            <Lock className="h-5 w-5 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Groutix Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider">Username</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

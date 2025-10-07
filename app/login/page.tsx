"use client";
export const dynamic = "force-dynamic";

import React, { useState, Suspense } from "react";

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Loading…</div>}>
      <LoginPage />
    </Suspense>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pass }),
      });
      if (res.ok) {
        const next =
          new URLSearchParams(window.location.search).get("next") || "/contacts";
        window.location.href = next;
      } else {
        const j = await res.json().catch(() => ({}));
        setErr(j?.error || "Login failed");
      }
    } catch (e) {
      setErr("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-indigo-400 mb-4">Sign in</h1>

        {err && (
          <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}

        <label className="block text-sm text-gray-400 mb-1">Email</label>
        <input
          className="input mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@example.com"
          required
        />

        <label className="block text-sm text-gray-400 mb-1">Password</label>
        <input
          className="input mb-4"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          type="password"
          placeholder="••••••••"
          required
        />

        <button className="btn w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

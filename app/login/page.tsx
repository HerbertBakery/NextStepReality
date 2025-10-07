"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pass }),
    });
    if (res.ok) {
      const next = new URLSearchParams(window.location.search).get("next") || "/contacts";
      window.location.href = next;
    } else {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error || "Login failed");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-28 card">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" value={pass} onChange={e=>setPass(e.target.value)} type="password" required />
        </div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="btn w-full" type="submit">Sign in</button>
      </form>
    </div>
  );
}

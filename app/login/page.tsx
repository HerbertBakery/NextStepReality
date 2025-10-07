"use client";
export const dynamic = "force-dynamic";


import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const next = useSearchParams().get("next") || "/contacts";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pass }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      router.replace(next);
    } catch (e: any) {
      setErr(e.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="texture" />
      <main className="card">
        <header className="head">
          <div className="logoDot" />
          <h1>Sign in</h1>
          <p className="sub">Welcome back. Please enter your credentials.</p>
        </header>

        <form onSubmit={onSubmit} className="form">
          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
            />
          </label>

          {err && <p className="error">{err}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <footer className="foot">
          <span className="hint">Protected area · Admin only</span>
        </footer>
      </main>

      <style jsx>{`
        .wrap {
          min-height: 100svh;
          display: grid;
          place-items: center;
          position: relative;
          background: radial-gradient(1200px 600px at 10% -10%, #0b1220, transparent),
                      radial-gradient(1000px 600px at 110% 10%, #111827, transparent),
                      linear-gradient(180deg, #0b1220 0%, #0e1324 60%, #0b0e1a 100%);
          color: #e5e7eb;
          overflow: hidden;
        }
        .texture {
          position: absolute;
          inset: -25%;
          background: radial-gradient(40% 60% at 50% 20%, rgba(255,255,255,0.06), transparent),
                      radial-gradient(30% 50% at 80% 10%, rgba(59,130,246,0.18), transparent);
          filter: blur(60px);
          opacity: 0.6;
          pointer-events: none;
        }
        .card {
          width: min(92vw, 440px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(17, 24, 39, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.45);
          padding: 24px 22px;
        }
        .head {
          display: grid;
          gap: 6px;
          text-align: left;
          margin-bottom: 10px;
        }
        .logoDot {
          width: 16px; height: 16px; border-radius: 50%;
          background: conic-gradient(from 0deg, #60a5fa, #22d3ee, #a78bfa, #60a5fa);
          margin-bottom: 8px;
          filter: drop-shadow(0 2px 6px rgba(59,130,246,0.5));
        }
        h1 { margin: 0 0 4px; font-weight: 650; letter-spacing: 0.2px; }
        .sub { margin: 0; color: #9ca3af; font-size: 0.95rem; }

        .form {
          display: grid;
          gap: 14px;
          margin-top: 14px;
        }
        label { display: grid; gap: 8px; }
        label span { font-size: 0.9rem; color: #cbd5e1; }
        input {
          height: 44px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(2,6,23,0.6);
          color: #e5e7eb;
          padding: 0 14px;
          outline: none;
          transition: border-color .2s, box-shadow .2s, background .2s;
        }
        input::placeholder { color: #677086; }
        input:focus {
          border-color: rgba(99,102,241,0.8);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.25);
          background: rgba(2,6,23,0.8);
        }
        .error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fecaca;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 0.9rem;
        }
        button {
          height: 46px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.18);
          background: linear-gradient(180deg, #4f46e5, #4338ca);
          color: white;
          font-weight: 600;
          letter-spacing: 0.2px;
          transition: transform .06s ease, filter .2s ease, opacity .2s;
        }
        button:hover { filter: brightness(1.05); transform: translateY(-1px); }
        button:disabled { opacity: 0.7; transform: none; }
        .foot { margin-top: 14px; display: flex; justify-content: center; }
        .hint { color: #7c859f; font-size: 0.85rem; }
      `}</style>
    </div>
  );
}

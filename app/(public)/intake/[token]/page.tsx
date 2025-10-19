// app/(public)/intake/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";

type RentalStatus = "none" | "applied" | "approved" | "declined" | "moved_in" | "moved_out";

type Client = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  lookingFor: string | null;
  lastRentalStatus: RentalStatus;
  lastRentalNotes: string | null;
  tags: string | null;       // comma string for clients
  agentOnJob: string | null;
};

export default function IntakePage({ params }: { params: { token: string } }) {
  const token = params.token;

  const [data, setData] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`/api/public/intake/${token}`, { cache: "no-store" });
        if (!r.ok) throw new Error("Could not load form. The link may be invalid or expired.");
        const j = await r.json();
        if (active) setData(j);
      } catch (e: any) {
        setErr(e?.message || "Failed to load.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  function vDate(d: string | null) {
    if (!d) return "";
    const nd = new Date(d);
    const yyyy = nd.getFullYear();
    const mm = String(nd.getMonth() + 1).padStart(2, "0");
    const dd = String(nd.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data) return;
    setSaving(true); setOk(null); setErr(null);

    const res = await fetch(`/api/public/intake/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        // Normalize for API
        email: (data.email ?? "") || null,
        phone: (data.phone ?? "") || null,
        tags: (data.tags ?? "") || "",
        budgetMin:
          data.budgetMin === null || data.budgetMin === ("" as any)
            ? null
            : Number.isFinite(Number(data.budgetMin)) ? Number(data.budgetMin) : null,
        budgetMax:
          data.budgetMax === null || data.budgetMax === ("" as any)
            ? null
            : Number.isFinite(Number(data.budgetMax)) ? Number(data.budgetMax) : null,
        birthday: data.birthday ? new Date(data.birthday).toISOString() : null,
      }),
    });

    if (res.ok) {
      setOk("Thanks! Your information was saved.");
    } else {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error || "Could not save, please try again.");
    }
    setSaving(false);
  }

  if (loading) return <Shell><p className="text-gray-400">Loading…</p></Shell>;
  if (err) return <Shell><p className="text-red-300">{err}</p></Shell>;
  if (!data) return <Shell><p className="text-red-300">Form unavailable.</p></Shell>;

  return (
    <Shell>
      <h1 className="text-xl font-bold mb-4">Client Intake Form</h1>

      <form className="grid grid-cols-1 gap-3" onSubmit={onSubmit}>
        {/* Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="First name"
            value={data.firstName ?? ""}
            onChange={(e) => setData({ ...data, firstName: e.currentTarget.value })}
            required
          />
          <input
            className="input"
            placeholder="Last name"
            value={data.lastName ?? ""}
            onChange={(e) => setData({ ...data, lastName: e.currentTarget.value })}
            required
          />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={data.email ?? ""}
            onChange={(e) => setData({ ...data, email: e.currentTarget.value })}
          />
          <input
            className="input"
            type="tel"
            placeholder="Phone"
            value={data.phone ?? ""}
            onChange={(e) => setData({ ...data, phone: e.currentTarget.value })}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="label">Birthday</label>
            <input
              className="input"
              type="date"
              value={vDate(data.birthday)}
              onChange={(e) => setData({ ...data, birthday: e.currentTarget.value || null })}
            />
          </div>
          <div className="space-y-1">
            <label className="label">Agent on job</label>
            <input
              className="input"
              placeholder="Agent name"
              value={data.agentOnJob ?? ""}
              onChange={(e) => setData({ ...data, agentOnJob: e.currentTarget.value })}
            />
          </div>
        </div>

        {/* Budgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="label">Budget min</label>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              value={data.budgetMin ?? ""}
              onChange={(e) => {
                const v = e.currentTarget.value.trim();
                setData({ ...data, budgetMin: v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : (data.budgetMin ?? null) });
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="label">Budget max</label>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              value={data.budgetMax ?? ""}
              onChange={(e) => {
                const v = e.currentTarget.value.trim();
                setData({ ...data, budgetMax: v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : (data.budgetMax ?? null) });
              }}
            />
          </div>
        </div>

        {/* Preferences */}
        <textarea
          className="input"
          rows={3}
          placeholder="What are you looking for?"
          value={data.lookingFor ?? ""}
          onChange={(e) => setData({ ...data, lookingFor: e.currentTarget.value })}
        />

        {/* Status / Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="label">Rental status</label>
            <select
              className="input"
              value={data.lastRentalStatus || "none"}
              onChange={(e) => setData({ ...data, lastRentalStatus: e.currentTarget.value as RentalStatus })}
            >
              <option value="none">None</option>
              <option value="applied">Applied</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="moved_in">Moved In</option>
              <option value="moved_out">Moved Out</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="label">Tags (comma-separated)</label>
            <input
              className="input"
              placeholder="vip, newsletter"
              value={data.tags ?? ""}
              onChange={(e) => setData({ ...data, tags: e.currentTarget.value })}
            />
          </div>
        </div>

        <textarea
          className="input"
          rows={3}
          placeholder="Notes"
          value={data.lastRentalNotes ?? ""}
          onChange={(e) => setData({ ...data, lastRentalNotes: e.currentTarget.value })}
        />

        {ok && <p className="text-green-300">{ok}</p>}
        {err && <p className="text-red-300">{err}</p>}

        <button disabled={saving} className="btn">{saving ? "Saving…" : "Submit"}</button>
      </form>

      <style jsx global>{`
        .input { background: rgba(2,6,23,.6); border: 1px solid rgba(255,255,255,.14); border-radius: 12px; padding: 10px 12px; color: #e5e7eb; }
        .label { color: #cbd5e1; font-size: .9rem; display: inline-block; margin-bottom: 4px; }
        .btn { height: 44px; padding: 0 16px; border-radius: 12px; background: linear-gradient(180deg, #4f46e5, #4338ca); color: white; font-weight: 700; border: 1px solid rgba(255,255,255,.2); margin-top: 6px; }
      `}</style>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto bg-slate-900/60 rounded-2xl p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}

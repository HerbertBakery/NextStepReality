// app/(public)/intake/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type RentalStatus = "none" | "applied" | "approved" | "declined" | "moved_in" | "moved_out";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string; // yyyy-mm-dd
  budgetMin: string; // keep as string to avoid NaN flicker
  budgetMax: string;
  lookingFor: string;
  lastRentalStatus: RentalStatus;
  lastRentalNotes: string;
  tags: string;        // comma-separated
  agentOnJob: string;  // can be prefilled via ?agent=
};

export default function PublicIntakePage() {
  const sp = useSearchParams();
  const agentFromQS = useMemo(() => sp.get("agent") ?? "", [sp]);

  const [data, setData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    budgetMin: "",
    budgetMax: "",
    lookingFor: "",
    lastRentalStatus: "none",
    lastRentalNotes: "",
    tags: "",
    agentOnJob: "",
  });

  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Prefill agentOnJob from ?agent=
  useEffect(() => {
    if (agentFromQS && !data.agentOnJob) {
      setData((d) => ({ ...d, agentOnJob: agentFromQS }));
    }
  }, [agentFromQS]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setOk(null); setErr(null);

    // Build payload; backend also accepts ?agent= but we’ll send agentOnJob explicitly
    const payload = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim() || null,
      phone: data.phone.trim() || null,
      birthday: data.birthday || null,
      budgetMin: data.budgetMin.trim() === "" ? null : Number(data.budgetMin),
      budgetMax: data.budgetMax.trim() === "" ? null : Number(data.budgetMax),
      lookingFor: data.lookingFor.trim() || null,
      lastRentalStatus: data.lastRentalStatus,
      lastRentalNotes: data.lastRentalNotes.trim() || null,
      tags: data.tags.trim(),          // stored as comma string in Client
      agentOnJob: data.agentOnJob.trim() || agentFromQS || null,
    };

    const res = await fetch(`/api/public/intake${agentFromQS ? `?agent=${encodeURIComponent(agentFromQS)}` : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      setOk(j?.created ? "Thanks! Your info was submitted." : "Thanks! Your info was updated.");
      // Optionally clear form after success:
      // setData({...data, email:"", phone:"", ...})
    } else {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error || "Could not submit the form. Please try again.");
    }
    setSaving(false);
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold mb-4">Client Intake Form</h1>
      <p className="text-gray-300 mb-4">
        Please fill out your details below and click Submit.
      </p>

      <form className="grid grid-cols-1 gap-3" onSubmit={onSubmit}>
        {/* Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="First name *"
            value={data.firstName}
            onChange={(e) => setData({ ...data, firstName: e.currentTarget.value })}
            required
          />
          <input
            className="input"
            placeholder="Last name *"
            value={data.lastName}
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
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.currentTarget.value })}
          />
          <input
            className="input"
            type="tel"
            placeholder="Phone"
            value={data.phone}
            onChange={(e) => setData({ ...data, phone: e.currentTarget.value })}
          />
        </div>

        {/* Dates / Agent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="label">Birthday</label>
            <input
              className="input"
              type="date"
              value={data.birthday}
              onChange={(e) => setData({ ...data, birthday: e.currentTarget.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="label">Agent on job</label>
            <input
              className="input"
              placeholder="Agent name"
              value={data.agentOnJob}
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
              value={data.budgetMin}
              onChange={(e) => {
                const v = e.currentTarget.value;
                if (v === "" || Number.isFinite(Number(v))) setData({ ...data, budgetMin: v });
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="label">Budget max</label>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              value={data.budgetMax}
              onChange={(e) => {
                const v = e.currentTarget.value;
                if (v === "" || Number.isFinite(Number(v))) setData({ ...data, budgetMax: v });
              }}
            />
          </div>
        </div>

        {/* Preferences */}
        <textarea
          className="input"
          rows={3}
          placeholder="What are you looking for?"
          value={data.lookingFor}
          onChange={(e) => setData({ ...data, lookingFor: e.currentTarget.value })}
        />

        {/* Status / Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="label">Rental status</label>
            <select
              className="input"
              value={data.lastRentalStatus}
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
              value={data.tags}
              onChange={(e) => setData({ ...data, tags: e.currentTarget.value })}
            />
          </div>
        </div>

        <textarea
          className="input"
          rows={3}
          placeholder="Notes"
          value={data.lastRentalNotes}
          onChange={(e) => setData({ ...data, lastRentalNotes: e.currentTarget.value })}
        />

        {ok && <p className="text-green-300">{ok}</p>}
        {err && <p className="text-red-300">{err}</p>}

        <button disabled={saving} className="btn">{saving ? "Submitting…" : "Submit"}</button>
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

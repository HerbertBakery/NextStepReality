// app/(public)/intake/IntakeIndexClient.tsx
"use client";

import { useState } from "react";

type RentalStatus = "none" | "applied" | "approved" | "declined" | "moved_in" | "moved_out";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string; // yyyy-mm-dd
  budgetMax: string;
  lookingFor: string;
  lastRentalNotes: string;
};

export default function IntakeIndexClient({ initialAgent }: { initialAgent: string }) {
  const [data, setData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    budgetMax: "",
    lookingFor: "",
    lastRentalNotes: "",
  });

  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setOk(null);
    setErr(null);

    const payload = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim() || null,
      phone: data.phone.trim() || null,
      birthday: data.birthday || null,
      // budgetMin removed from UI, always null
      budgetMin: null as number | null,
      budgetMax: data.budgetMax.trim() === "" ? null : Number(data.budgetMax),
      lookingFor: data.lookingFor.trim() || null,
      // rental status + tags removed from UI, but we send safe defaults
      lastRentalStatus: "none" as RentalStatus,
      lastRentalNotes: data.lastRentalNotes.trim() || null,
      tags: "",
      // agent on job removed from UI, but still tie to initialAgent if present
      agentOnJob: initialAgent || null,
    };

    const qs = initialAgent ? `?agent=${encodeURIComponent(initialAgent)}` : "";
    const res = await fetch(`/api/public/intake${qs}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      setOk(j?.created ? "Thanks! Your info was submitted." : "Thanks! Your info was updated.");
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
            onChange={(e) =>
              setData({ ...data, firstName: e.currentTarget.value })
            }
            required
          />
          <input
            className="input"
            placeholder="Last name *"
            value={data.lastName}
            onChange={(e) =>
              setData({ ...data, lastName: e.currentTarget.value })
            }
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
            onChange={(e) =>
              setData({ ...data, email: e.currentTarget.value })
            }
          />
          <input
            className="input"
            type="tel"
            placeholder="Phone"
            value={data.phone}
            onChange={(e) =>
              setData({ ...data, phone: e.currentTarget.value })
            }
          />
        </div>

        {/* Birthday */}
        <div className="space-y-1">
          <label className="label">Birthday</label>
          <input
            className="input"
            type="date"
            value={data.birthday}
            onChange={(e) =>
              setData({ ...data, birthday: e.currentTarget.value })
            }
          />
        </div>

        {/* Budget (max only) */}
        <div className="space-y-1">
          <label className="label">Budget max</label>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            value={data.budgetMax}
            onChange={(e) => {
              const v = e.currentTarget.value;
              if (v === "" || Number.isFinite(Number(v)))
                setData({ ...data, budgetMax: v });
            }}
          />
        </div>

        {/* Preferences */}
        <textarea
          className="input"
          rows={3}
          placeholder="What are you looking for?"
          value={data.lookingFor}
          onChange={(e) =>
            setData({ ...data, lookingFor: e.currentTarget.value })
          }
        />

        {/* Notes */}
        <textarea
          className="input"
          rows={3}
          placeholder="Notes"
          value={data.lastRentalNotes}
          onChange={(e) =>
            setData({ ...data, lastRentalNotes: e.currentTarget.value })
          }
        />

        {ok && <p className="text-green-300">{ok}</p>}
        {err && <p className="text-red-300">{err}</p>}

        <button disabled={saving} className="btn">
          {saving ? "Submitting…" : "Submit"}
        </button>
      </form>

      <style jsx global>{`
        .input {
          background: rgba(2, 6, 23, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          padding: 10px 12px;
          color: #e5e7eb;
        }
        .label {
          color: #cbd5e1;
          font-size: 0.9rem;
          display: inline-block;
          margin-bottom: 4px;
        }
        .btn {
          height: 44px;
          padding: 0 16px;
          border-radius: 12px;
          background: linear-gradient(180deg, #4f46e5, #4338ca);
          color: white;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.2);
          margin-top: 6px;
        }
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

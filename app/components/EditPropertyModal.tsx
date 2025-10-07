"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

type Property = {
  id: string; title: string; price?: number; address?: string;
};

export default function EditPropertyModal({
  id, onClose, onSaved,
}: { id: string; onClose: () => void; onSaved?: () => void }) {
  const [data, setData] = useState<Property | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/properties/${id}`);
        if (!res.ok) throw new Error("Failed to load property");
        const json = await res.json();
        if (active) setData(json);
      } catch (e: any) {
        setErr(e.message || "Load error");
      }
    })();
    return () => { active = false; };
  }, [id]);

  async function save() {
    if (!data) return;
    setSaving(true); setErr(null);
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Save failed");
      onSaved?.();
      onClose();
    } catch (e: any) {
      setErr(e.message || "Save error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Listing" onClose={onClose} width={760}>
      {!data ? (
        <p style={{ color: "#9aa3b2" }}>{err || "Loading…"}</p>
      ) : (
        <div className="grid">
          <label><span>Title</span>
            <input value={data.title} onChange={e => setData({ ...data, title: e.target.value })}/>
          </label>
          <label><span>Price</span>
            <input type="number" value={data.price ?? ""} onChange={e => setData({ ...data, price: Number(e.target.value) })}/>
          </label>
          <label><span>Address</span>
            <input value={data.address ?? ""} onChange={e => setData({ ...data, address: e.target.value })}/>
          </label>
          {err && <p className="err">{err}</p>}
          <div className="row">
            <button onClick={onClose} className="muted">Cancel</button>
            <button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}
      <style jsx>{`
        .grid { display: grid; gap: 12px; }
        label { display: grid; gap: 6px; }
        span { color: #cbd5e1; font-size: .9rem; }
        input {
          height: 40px; border-radius: 10px; border: 1px solid rgba(255,255,255,.14);
          background: rgba(2,6,23,.6); color: #e5e7eb; padding: 0 12px;
        }
        .row { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
        .muted { background: transparent; border: 1px solid rgba(255,255,255,.18); color: #cbd5e1; }
        button {
          height: 40px; padding: 0 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,.2);
          background: linear-gradient(180deg, #4f46e5, #4338ca); color: white; font-weight: 600;
        }
        .err { color: #fecaca; }
      `}</style>
    </Modal>
  );
}

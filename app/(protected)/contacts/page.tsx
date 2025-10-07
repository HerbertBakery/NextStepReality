"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Modal from "@/app/components/Modal";

/** ================= Types ================= */
type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthday?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  lookingFor?: string | null;
  lastRentalStatus: string;
  lastRentalNotes?: string | null;
  tags?: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

/** ================= Wrapper with Suspense ================= */
export default function ContactsPageWrapper() {
  return (
    <Suspense fallback={<div className="text-gray-400 p-6">Loading…</div>}>
      <ContactsPage />
    </Suspense>
  );
}

/** ================= Actual Page (was default before) ================= */
function ContactsPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Client> | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isNew = searchParams.get("new") === "1";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clients?q=${encodeURIComponent(q)}`);
    const j = await res.json();
    setItems(j.items || []);
    setLoading(false);
  }, [q]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    const params = new URLSearchParams(searchParams);
    params.set("new", "1");
    params.delete("edit");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const openEdit = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("edit", id);
    params.delete("new");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const closeModal = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("edit");
    params.delete("new");
    router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
    setForm(null);
  };

  useEffect(() => {
    let active = true;
    async function hydrate() {
      if (isNew) { setForm({ firstName: "", lastName: "", lastRentalStatus: "none" } as any); return; }
      if (editId) {
        const fromList = items.find(i => i.id === editId);
        if (fromList) { active && setForm(fromList); return; }
        const r = await fetch(`/api/clients/${editId}`);
        if (r.ok) { const one = await r.json(); active && setForm(one); }
        else active && setForm(null);
      } else setForm(null);
    }
    hydrate();
    return () => { active = false; };
  }, [editId, isNew, items]);

  async function save() {
    if (!form) return;
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/clients/${form.id}` : `/api/clients`;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { closeModal(); await load(); } else alert("Save failed");
  }

  async function archive(id: string) {
    if (!confirm("Archive this client?")) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(c =>
      `${c.firstName} ${c.lastName} ${c.email ?? ""} ${c.phone ?? ""} ${c.tags ?? ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [items, q]);

  return (
    <div className="space-y-6 w-full">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="pill">CRM</div>
          <h1 className="text-2xl font-bold text-white mt-1">Contacts</h1>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            className="input flex-1 md:w-96"
            placeholder="Search name, email, tags…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button className="btn" onClick={openCreate}>Add</button>
        </div>
      </div>

      {/* Cards (kept as-is; can convert to table later if you want) */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No contacts found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(c => (
            <div
              key={c.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col gap-3 shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">{c.firstName} {c.lastName}</h3>
                  <p className="text-sm text-gray-400">{c.email ?? "—"}</p>
                  <p className="text-sm text-gray-400">{c.phone ?? "—"}</p>
                </div>
                <button
                  onClick={() => openEdit(c.id)}
                  className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                >
                  Edit
                </button>
              </div>

              {c.tags && (
                <div className="flex flex-wrap gap-2">
                  {c.tags.split(",").map(t => <span key={t} className="pill">{t.trim()}</span>)}
                </div>
              )}

              <button onClick={() => archive(c.id)} className="btn secondary w-full mt-1">Archive</button>
            </div>
          ))}
        </div>
      )}

      {(form || editId || isNew) && (
        <Modal
          title={form?.id ? "Edit Client" : "New Client"}
          onClose={closeModal}
          size="lg"
          footer={
            <>
              <button className="btn secondary" onClick={closeModal}>Cancel</button>
              <button className="btn" onClick={save}>Save</button>
            </>
          }
        >
          <div className="formGrid two">
            <div className="field">
              <label className="label">First Name</label>
              <input className="input" value={form?.firstName || ""} onChange={e => setForm({ ...form!, firstName: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Last Name</label>
              <input className="input" value={form?.lastName || ""} onChange={e => setForm({ ...form!, lastName: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Email</label>
              <input className="input" value={form?.email || ""} onChange={e => setForm({ ...form!, email: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Phone</label>
              <input className="input" value={form?.phone || ""} onChange={e => setForm({ ...form!, phone: e.target.value })} />
            </div>
            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Tags (comma separated)</label>
              <input className="input" value={form?.tags || ""} onChange={e => setForm({ ...form!, tags: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

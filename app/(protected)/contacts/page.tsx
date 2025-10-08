"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Modal from "@/app/components/Modal";

type RentalStatus = "none" | "applied" | "approved" | "declined" | "moved_in" | "moved_out";

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  birthday?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  lookingFor?: string | null;
  lastRentalStatus: RentalStatus;
  lastRentalNotes?: string | null;
  tags?: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ContactsPageWrapper() {
  return (
    <Suspense fallback={<div className="text-gray-400 p-6">Loading…</div>}>
      <ContactsPage />
    </Suspense>
  );
}

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
    const url = params.size ? `${pathname}?${params.toString()}` : pathname;
    router.replace(url, { scroll: false });
    setForm(null);
  };

  useEffect(() => {
    let active = true;
    async function hydrate() {
      if (isNew) {
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          birthday: "",
          budgetMin: null,
          budgetMax: null,
          lastRentalStatus: "none",
          tags: "",
          lookingFor: "",
          lastRentalNotes: "",
        } as Partial<Client>);
        return;
      }
      if (editId) {
        const fromList = items.find(i => i.id === editId);
        if (fromList) { active && setForm(fromList); return; }
        const r = await fetch(`/api/clients/${editId}`);
        if (r.ok) { const one = await r.json(); active && setForm(one); }
        else active && setForm(null);
      } else {
        setForm(null);
      }
    }
    hydrate();
    return () => { active = false; };
  }, [editId, isNew, items]);

  async function save() {
    if (!form) return;
    const method = (form as any).id ? "PUT" : "POST";
    const url = (form as any).id ? `/api/clients/${(form as any).id}` : `/api/clients`;
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

  // ------- Search across ANY field (string or numeric) -------
  const filteredSorted = useMemo(() => {
    const raw = q.trim().toLowerCase();
    if (!raw) {
      return [...items].sort(sortByName);
    }
    const tokens = raw.split(/\s+/).filter(Boolean);

    function matches(c: Client) {
      const pack: string[] = [
        c.firstName, c.lastName, c.email ?? "", c.phone ?? "",
        c.tags ?? "", c.lookingFor ?? "", c.lastRentalNotes ?? "",
        c.lastRentalStatus ?? "none",
      ].map(s => (s ?? "").toString().toLowerCase());

      // include birthday (ISO date) for textual search
      if (c.birthday) pack.push(new Date(c.birthday).toISOString().slice(0, 10));

      // include numeric fields as strings
      if (typeof c.budgetMin === "number") pack.push(String(c.budgetMin));
      if (typeof c.budgetMax === "number") pack.push(String(c.budgetMax));

      const hay = pack.join(" ");

      // each token must appear somewhere (AND semantics for stronger relevance)
      return tokens.every(t => hay.includes(t));
    }

    return items.filter(matches).sort(sortByName);
  }, [items, q]);

  function sortByName(a: Client, b: Client) {
    const la = (a.lastName || "").toLowerCase();
    const lb = (b.lastName || "").toLowerCase();
    if (la === lb) return (a.firstName || "").toLowerCase().localeCompare((b.firstName || "").toLowerCase());
    return la.localeCompare(lb);
  }

  // Helpers for binding date/number fields
  const setField = <K extends keyof Client>(k: K, v: Client[K]) => setForm(prev => ({ ...(prev as any), [k]: v }));

  return (
    <div className="space-y-6 w-full">
      {/* Clean page header (no per-page nav buttons) */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mt-1">Clients</h1>
          <p className="text-sm text-gray-400">Manage client records and rental/budget details.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            className="input flex-1 md:w-96"
            placeholder="Search name, email, phone, tags, status, birthday, budget…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button className="btn" onClick={openCreate}>Add</button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/40 shadow-md">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-800/60">
            <tr>
              <th className="px-4 py-3 text-left text-gray-400 font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-gray-400 font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-gray-400 font-semibold">Phone</th>
              <th className="px-4 py-3 text-left text-gray-400 font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-gray-400 font-semibold">Budget</th>
              <th className="px-4 py-3 text-right text-gray-400 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-6 text-gray-500">Loading…</td></tr>
            ) : filteredSorted.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-gray-500">No clients found.</td></tr>
            ) : (
              filteredSorted.map((c, i) => (
                <tr
                  key={c.id}
                  className={
                    (i % 2 === 0 ? "bg-slate-950/40 " : "bg-slate-900/40 ") +
                    "cursor-pointer hover:bg-indigo-500/10 transition"
                  }
                  onClick={() => openEdit(c.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && openEdit(c.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{c.firstName} {c.lastName}</div>
                    {c.tags && (
                      <div className="mt-1">
                        {c.tags.split(",").map(t => (
                          <span key={t} className="pill mr-2">{t.trim()}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{c.email ?? "—"}</td>
                  <td className="px-4 py-3">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{(c.lastRentalStatus || "none").replace("_"," ")}</td>
                  <td className="px-4 py-3">
                    {(typeof c.budgetMin === "number" || typeof c.budgetMax === "number")
                      ? `${c.budgetMin ?? "—"} – ${c.budgetMax ?? "—"}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); archive(c.id); }}
                      className="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(form || editId || isNew) && (
        <Modal
          title={(form as any)?.id ? "Edit Client" : "New Client"}
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
              <input
                className="input"
                value={form?.firstName || ""}
                onChange={e => setField("firstName", e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Last Name</label>
              <input
                className="input"
                value={form?.lastName || ""}
                onChange={e => setField("lastName", e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Email</label>
              <input
                className="input"
                value={form?.email || ""}
                onChange={e => setField("email", e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Phone</label>
              <input
                className="input"
                value={form?.phone || ""}
                onChange={e => setField("phone", e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Birthday</label>
              <input
                type="date"
                className="input"
                value={form?.birthday ? toDateInputValue(form.birthday) : ""}
                onChange={e => setField("birthday", e.target.value ? e.target.value : "")}
              />
            </div>
            <div className="field">
              <label className="label">Rental Status</label>
              <select
                className="input"
                value={form?.lastRentalStatus || "none"}
                onChange={e => setField("lastRentalStatus", e.target.value as RentalStatus)}
              >
                <option value="none">None</option>
                <option value="applied">Applied</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
                <option value="moved_in">Moved in</option>
                <option value="moved_out">Moved out</option>
              </select>
            </div>

            <div className="field">
              <label className="label">Budget Min</label>
              <input
                type="number"
                className="input"
                value={form?.budgetMin ?? ""}
                onChange={e => setField("budgetMin", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label className="label">Budget Max</label>
              <input
                type="number"
                className="input"
                value={form?.budgetMax ?? ""}
                onChange={e => setField("budgetMax", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>

            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Tags (comma separated)</label>
              <input
                className="input"
                value={form?.tags || ""}
                onChange={e => setField("tags", e.target.value)}
              />
            </div>

            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Looking For</label>
              <input
                className="input"
                value={form?.lookingFor || ""}
                onChange={e => setField("lookingFor", e.target.value)}
              />
            </div>

            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Rental Notes</label>
              <textarea
                className="input"
                rows={3}
                value={form?.lastRentalNotes || ""}
                onChange={e => setField("lastRentalNotes", e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Convert ISO/string to yyyy-MM-dd for <input type="date">
function toDateInputValue(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

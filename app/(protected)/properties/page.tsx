"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Modal from "@/app/components/Modal";

type Property = {
  id: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  province?: string | null;
  postalCode?: string | null;
  forType: "SALE" | "RENT";
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  primaryClientId?: string | null;
  notes?: string | null;
  imageUrl?: string | null; // NEW: one photo per listing (URL)
  archived: boolean;
};

export default function PropertiesPageWrapper() {
  return (
    <Suspense fallback={<div className="text-gray-400 p-6">Loading…</div>}>
      <PropertiesPage />
    </Suspense>
  );
}

function PropertiesPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Property> | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isNew = searchParams.get("new") === "1";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/properties?q=${encodeURIComponent(q)}`);
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
        setForm({ addressLine1: "", city: "", forType: "RENT" } as any);
        return;
      }
      if (editId) {
        const fromList = items.find(i => i.id === editId);
        if (fromList) { active && setForm(fromList); return; }
        const r = await fetch(`/api/properties/${editId}`);
        if (r.ok) { const one = await r.json(); active && setForm(one); }
        else active && setForm(null);
      } else setForm(null);
    }
    hydrate(); return () => { active = false; };
  }, [editId, isNew, items]);

  async function save() {
    if (!form) return;
    const method = (form as any).id ? "PUT" : "POST";
    const url = (form as any).id ? `/api/properties/${(form as any).id}` : `/api/properties`;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { closeModal(); await load(); } else alert("Save failed");
  }

  async function archive(id: string) {
    if (!confirm("Archive this property?")) return;
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const filteredSorted = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = !s
      ? [...items]
      : items.filter(p =>
          `${p.addressLine1} ${p.city} ${p.ownerName ?? ""}`.toLowerCase().includes(s)
        );
    // sort by addressLine1 alphabetically
    return list.sort((a, b) => (a.addressLine1 || "").toLowerCase().localeCompare((b.addressLine1 || "").toLowerCase()));
  }, [items, q]);

  return (
    <div className="space-y-6 w-full">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="pill">Inventory</div>
          <h1 className="text-2xl font-bold text-white mt-1">Listings</h1>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            className="input flex-1 md:w-96"
            placeholder="Search address, city…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button className="btn" onClick={openCreate}>Add</button>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading…</p>
      ) : filteredSorted.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No listings found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSorted.map(p => (
            <div
              key={p.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 shadow-md overflow-hidden hover:shadow-indigo-500/10 transition flex flex-col"
            >
              {/* Image (optional) */}
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt={p.addressLine1}
                  className="w-full h-40 object-cover bg-slate-800"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-40 bg-slate-800 grid place-items-center text-sm text-gray-400">
                  No Photo
                </div>
              )}

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{p.addressLine1}</h3>
                    <p className="text-sm text-gray-400">
                      {p.city}{p.province ? `, ${p.province}` : ""}
                    </p>
                    <p className="text-sm text-gray-400">
                      {p.forType} • {p.price ? `$${p.price.toLocaleString()}` : "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => openEdit(p.id)}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>

                {p.ownerName && (
                  <div className="text-sm text-gray-400">Owner: {p.ownerName}</div>
                )}

                <button
                  onClick={() => archive(p.id)}
                  className="btn secondary w-full mt-auto"
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(form || editId || isNew) && (
        <Modal
          title={(form as any)?.id ? "Edit Listing" : "New Listing"}
          onClose={closeModal}
          size="xl"
          footer={
            <>
              <button className="btn secondary" onClick={closeModal}>Cancel</button>
              <button className="btn" onClick={save}>Save</button>
            </>
          }
        >
          <div className="formGrid two">
            <div className="field">
              <label className="label">Type</label>
              <select
                className="input"
                value={form?.forType || "RENT"}
                onChange={e => setForm({ ...form!, forType: e.target.value as any })}
              >
                <option value="SALE">SALE</option>
                <option value="RENT">RENT</option>
              </select>
            </div>

            <div className="field">
              <label className="label">Price</label>
              <input
                type="number"
                className="input"
                value={form?.price ?? ""}
                onChange={e => setForm({ ...form!, price: e.target.value ? Number(e.target.value) : null })}
              />
            </div>

            <div className="field">
              <label className="label">Beds</label>
              <input
                type="number"
                className="input"
                value={form?.beds ?? ""}
                onChange={e => setForm({ ...form!, beds: e.target.value ? Number(e.target.value) : null })}
              />
            </div>

            <div className="field">
              <label className="label">Baths</label>
              <input
                type="number"
                className="input"
                value={form?.baths ?? ""}
                onChange={e => setForm({ ...form!, baths: e.target.value ? Number(e.target.value) : null })}
              />
            </div>

            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Address Line 1</label>
              <input
                className="input"
                value={form?.addressLine1 || ""}
                onChange={e => setForm({ ...form!, addressLine1: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">City</label>
              <input
                className="input"
                value={form?.city || ""}
                onChange={e => setForm({ ...form!, city: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">Province</label>
              <input
                className="input"
                value={form?.province || ""}
                onChange={e => setForm({ ...form!, province: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">Postal Code</label>
              <input
                className="input"
                value={form?.postalCode || ""}
                onChange={e => setForm({ ...form!, postalCode: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">Owner Name</label>
              <input
                className="input"
                value={form?.ownerName || ""}
                onChange={e => setForm({ ...form!, ownerName: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">Owner Phone</label>
              <input
                className="input"
                value={form?.ownerPhone || ""}
                onChange={e => setForm({ ...form!, ownerPhone: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">Owner Email</label>
              <input
                className="input"
                value={form?.ownerEmail || ""}
                onChange={e => setForm({ ...form!, ownerEmail: e.target.value })}
              />
            </div>

            {/* NEW: Image URL */}
            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Image URL (optional)</label>
              <input
                className="input"
                value={form?.imageUrl || ""}
                onChange={e => setForm({ ...form!, imageUrl: e.target.value })}
                placeholder="https://…/photo.jpg"
              />
            </div>

            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows={3}
                value={form?.notes || ""}
                onChange={e => setForm({ ...form!, notes: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

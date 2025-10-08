"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Modal from "@/app/components/Modal";

type ForType = "SALE" | "RENT";

type Property = {
  id: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  forType: ForType;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  primaryClientId?: string | null;
  notes?: string | null;
  imageUrl?: string | null;
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

  // upload UI state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

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
    setFile(null);
    setPreview(null);
    setUploading(false);
    setUploadErr(null);
  };

  useEffect(() => {
    let active = true;
    async function hydrate() {
      if (isNew) {
        setForm({ addressLine1: "", city: "", forType: "RENT", imageUrl: null } as any);
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

  // ======== Client-side search across any field ========
  const filteredSorted = useMemo(() => {
    const raw = q.trim().toLowerCase();
    if (!raw) {
      return [...items].sort((a, b) =>
        (a.addressLine1 || "").toLowerCase().localeCompare((b.addressLine1 || "").toLowerCase())
      );
    }
    const tokens = raw.split(/\s+/).filter(Boolean);

    function norm(v: any) {
      return (v ?? "").toString().toLowerCase();
    }

    function matches(p: Property) {
      // Build a searchable haystack with rich aliases
      const parts: string[] = [
        p.addressLine1,
        p.addressLine2 ?? "",
        p.city,
        p.ownerName ?? "",
        p.ownerEmail ?? "",
        p.ownerPhone ?? "",
        p.notes ?? "",
        p.forType, // "RENT" | "SALE"
      ].map(norm);

      // Human-friendly keywords for forType
      if (p.forType === "RENT") parts.push("rent", "rental", "for rent");
      if (p.forType === "SALE") parts.push("sale", "for sale", "buy", "purchase");

      // Numeric fields as strings
      if (typeof p.price === "number") parts.push(String(p.price));
      if (typeof p.beds === "number") parts.push(String(p.beds), `${p.beds} bed`, `${p.beds} beds`);
      if (typeof p.baths === "number") parts.push(String(p.baths), `${p.baths} bath`, `${p.baths} baths`);

      const hay = parts.join(" ");
      return tokens.every(t => hay.includes(t));
    }

    return items.filter(matches).sort((a, b) =>
      (a.addressLine1 || "").toLowerCase().localeCompare((b.addressLine1 || "").toLowerCase())
    );
  }, [items, q]);

  // ======== Upload handling ========
  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setUploadErr(null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  async function uploadPhoto() {
    if (!file) return;
    setUploading(true); setUploadErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json();

      if (!res.ok) throw new Error(j?.error || "Upload failed");
      setForm(prev => ({ ...prev!, imageUrl: j.url as string }));
    } catch (e: any) {
      setUploadErr(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Clean page header (no per-page nav buttons; no 'Inventory') */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mt-1">Properties</h1>
          <p className="text-sm text-gray-400">Browse and manage property listings.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            className="input flex-1 md:w-96"
            placeholder="Search rent/sale, price, beds, baths, address, owner…"
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
        <p className="text-center text-gray-400 py-10">No properties found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSorted.map(p => (
            <div
              key={p.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 shadow-md overflow-hidden hover:shadow-indigo-500/10 transition flex flex-col cursor-pointer"
              onClick={() => openEdit(p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openEdit(p.id)}
            >
              {/* Image */}
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
                    {p.addressLine2 ? (
                      <p className="text-sm text-gray-400">{p.addressLine2}</p>
                    ) : null}
                    <p className="text-sm text-gray-400">{p.city}</p>
                    <p className="text-sm text-gray-300 font-medium">
                      <span className="uppercase">{p.forType}</span>{" "}
                      • {typeof p.price === "number" ? `$${p.price.toLocaleString()}` : "—"}{" "}
                      • {typeof p.beds === "number" ? `${p.beds} bd` : "—"}{" "}
                      • {typeof p.baths === "number" ? `${p.baths} ba` : "—"}
                    </p>
                  </div>
                  {/* Removed Edit button — card is clickable */}
                </div>

                {p.ownerName && (
                  <div className="text-sm text-gray-400">Owner: {p.ownerName}</div>
                )}
                {(p.ownerPhone || p.ownerEmail) && (
                  <div className="text-xs text-gray-500">
                    {p.ownerPhone ? `☎ ${p.ownerPhone}` : ""} {p.ownerEmail ? ` • ✉ ${p.ownerEmail}` : ""}
                  </div>
                )}

                <div className="mt-auto flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); archive(p.id); }}
                    className="btn secondary"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(form || editId || isNew) && (
        <Modal
          title={(form as any)?.id ? "Edit Property" : "New Property"}
          onClose={closeModal}
          size="xl"
          footer={
            <>
              <button className="btn secondary" onClick={closeModal}>Cancel</button>
              <button className="btn" onClick={save} disabled={uploading}>
                {uploading ? "Uploading…" : "Save"}
              </button>
            </>
          }
        >
          <div className="formGrid two">
            {/* Upload UI */}
            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Photo</label>

              {(preview || form?.imageUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview || (form?.imageUrl as string)}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-xl border border-slate-800 mb-3"
                />
              ) : null}

              <input
                className="input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPick}
              />

              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => { setFile(null); setPreview(null); }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={uploadPhoto}
                  disabled={!file || uploading}
                >
                  {uploading ? "Uploading…" : "Upload photo"}
                </button>
              </div>

              {uploadErr && <p className="text-red-300 text-sm mt-2">{uploadErr}</p>}
              {form?.imageUrl && !preview && (
                <p className="text-green-300 text-sm mt-2">Photo attached.</p>
              )}
            </div>

            <div className="field">
              <label className="label">Type</label>
              <select
                className="input"
                value={form?.forType || "RENT"}
                onChange={e => setForm({ ...form!, forType: e.target.value as ForType })}
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
              <label className="label">Address Line 2</label>
              <input
                className="input"
                value={form?.addressLine2 || ""}
                onChange={e => setForm({ ...form!, addressLine2: e.target.value })}
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

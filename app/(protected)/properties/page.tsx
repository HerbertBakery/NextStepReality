// app/(protected)/properties/page.tsx
"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
  createdAt?: string;
  updatedAt?: string;
  tags?: string[]; // NEW
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

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  // NEW: buffer the raw tags text like Contacts does
  const [tagsText, setTagsText] = useState<string>("");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isNew = searchParams.get("new") === "1";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/properties?q=${encodeURIComponent(q)}`, { cache: "no-store" });
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
    setTagsText(""); // reset buffer
  };

  useEffect(() => {
    let active = true;
    async function hydrate() {
      if (isNew) {
        const fresh = { addressLine1: "", city: "", forType: "RENT", imageUrl: null, tags: [] } as any;
        setForm(fresh);
        setTagsText(""); // NEW
        return;
      }
      if (editId) {
        const fromList = items.find(i => i.id === editId);
        if (fromList) {
          if (active) {
            setForm(fromList);
            setTagsText(Array.isArray(fromList.tags) ? fromList.tags.join(", ") : ""); // NEW
          }
          return;
        }
        const r = await fetch(`/api/properties/${editId}`, { cache: "no-store" });
        if (r.ok) {
          const one = await r.json();
          if (active) {
            setForm(one);
            setTagsText(Array.isArray(one.tags) ? one.tags.join(", ") : ""); // NEW
          }
        } else active && setForm(null);
      } else {
        setForm(null);
        setTagsText(""); // NEW
      }
    }
    hydrate(); return () => { active = false; };
  }, [editId, isNew, items]);

  async function save() {
    if (!form) return;
    const method = (form as any).id ? "PUT" : "POST";
    const url = (form as any).id ? `/api/properties/${(form as any).id}` : `/api/properties`;

    // Parse tags from the buffered text (allow commas OR spaces), normalize to lowercase
    const parsedTags =
      (tagsText || "")
        .split(/[,\s]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s.toLowerCase());

    const payload: any = {
      ...form,
      tags: parsedTags,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { closeModal(); await load(); } else alert("Save failed");
  }

  async function archive(id: string) {
    if (!confirm("Archive this property?")) return;
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  // Client-side display: quick keyword filtering
  const filteredSorted = useMemo(() => {
    const raw = q.trim().toLowerCase();
    if (!raw) {
      return [...items].sort((a, b) =>
        (a.addressLine1 || "").toLowerCase().localeCompare((b.addressLine1 || "").toLowerCase())
      );
    }
    // NEW: split search tokens on commas OR spaces
    const tokens = raw.split(/[,\s]+/).filter(Boolean);

    function norm(v: any) { return (v ?? "").toString().toLowerCase(); }

    function matches(p: Property) {
      const parts: string[] = [
        p.addressLine1,
        p.addressLine2 ?? "",
        p.city,
        p.ownerName ?? "",
        p.ownerEmail ?? "",
        p.ownerPhone ?? "",
        p.notes ?? "",
        p.forType,
      ].map(norm);

      if (p.forType === "RENT") parts.push("rent", "rental", "for rent");
      if (p.forType === "SALE") parts.push("sale", "for sale", "buy", "purchase");

      if (typeof p.price === "number") parts.push(String(p.price));
      if (typeof p.beds === "number") parts.push(String(p.beds), `${p.beds} bed`, `${p.beds} beds`);
      if (typeof p.baths === "number") parts.push(String(p.baths), `${p.baths} bath`, `${p.baths} baths`);

      // include tags
      if (Array.isArray(p.tags)) {
        p.tags.forEach(t => parts.push(norm(t)));
      }

      const hay = parts.join(" ");
      return tokens.every(t => hay.includes(t));
    }

    return items.filter(matches).sort((a, b) =>
      (a.addressLine1 || "").toLowerCase().localeCompare((b.addressLine1 || "").toLowerCase())
    );
  }, [items, q]);

  // Upload handling — FIX: removed capture="environment"
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mt-1">Properties</h1>
          <p className="text-sm text-gray-400">Browse and manage property listings.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            className="input flex-1 md:w-96"
            type="search"
            enterKeyHint="search"
            placeholder="Search rent/sale, price, beds, baths, address, owner, tags…"
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

              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{p.addressLine1}</h3>
                    {p.addressLine2 ? <p className="text-sm text-gray-400">{p.addressLine2}</p> : null}
                    <p className="text-sm text-gray-400">{p.city}</p>
                    <p className="text-sm text-gray-300 font-medium">
                      <span className="uppercase">{p.forType}</span>{" "}
                      • {typeof p.price === "number" ? `$${p.price.toLocaleString()}` : "—"}{" "}
                      • {typeof p.beds === "number" ? `${p.beds} bd` : "—"}{" "}
                      • {typeof p.baths === "number" ? `${p.baths} ba` : "—"}
                    </p>
                  </div>
                </div>

                {/* Tags display */}
                {Array.isArray(p.tags) && p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {p.tags.map((t, i) => (
                      <span key={`${t}-${i}`} className="pill">{t}</span>
                    ))}
                  </div>
                )}

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

      {(form) && (
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
                onChange={onPick} // <= no capture attribute
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

            {/* Safer numeric inputs */}
            <div className="field">
              <label className="label">Price</label>
              <input
                type="number"
                inputMode="numeric"
                className="input"
                enterKeyHint="done"
                value={form?.price ?? ""}
                onChange={(e) => {
                  const val = e.currentTarget.value.trim();
                  setForm(prev => ({ ...prev!, price: val === "" ? null : Number.isFinite(Number(val)) ? Number(val) : (prev?.price ?? null) }));
                }}
              />
            </div>

            <div className="field">
              <label className="label">Beds</label>
              <input
                type="number"
                inputMode="numeric"
                className="input"
                enterKeyHint="done"
                value={form?.beds ?? ""}
                onChange={(e) => {
                  const val = e.currentTarget.value.trim();
                  setForm(prev => ({ ...prev!, beds: val === "" ? null : Number.isFinite(Number(val)) ? Number(val) : (prev?.beds ?? null) }));
                }}
              />
            </div>

            <div className="field">
              <label className="label">Baths</label>
              <input
                type="number"
                inputMode="numeric"
                className="input"
                enterKeyHint="done"
                value={form?.baths ?? ""}
                onChange={(e) => {
                  const val = e.currentTarget.value.trim();
                  setForm(prev => ({ ...prev!, baths: val === "" ? null : Number.isFinite(Number(val)) ? Number(val) : (prev?.baths ?? null) }));
                }}
              />
            </div>

            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Address Line 1</label>
              <input
                className="input"
                type="text"
                enterKeyHint="next"
                value={form?.addressLine1 || ""}
                onChange={e => setForm({ ...form!, addressLine1: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">Address Line 2</label>
              <input
                className="input"
                type="text"
                enterKeyHint="next"
                value={form?.addressLine2 || ""}
                onChange={e => setForm({ ...form!, addressLine2: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">City</label>
              <input
                className="input"
                type="text"
                enterKeyHint="next"
                value={form?.city || ""}
                onChange={e => setForm({ ...form!, city: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">Owner Name</label>
              <input
                className="input"
                type="text"
                autoCapitalize="words"
                enterKeyHint="next"
                value={form?.ownerName || ""}
                onChange={e => setForm({ ...form!, ownerName: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">Owner Phone</label>
              <input
                className="input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="done"
                value={form?.ownerPhone || ""}
                onChange={e => setForm({ ...form!, ownerPhone: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">Owner Email</label>
              <input
                className="input"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                enterKeyHint="done"
                value={form?.ownerEmail || ""}
                onChange={e => setForm({ ...form!, ownerEmail: e.target.value })}
              />
            </div>

            {/* NEW: Tags input (buffered) */}
            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Tags (comma-separated)</label>
              <input
                className="input"
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.currentTarget.value)}
                placeholder="e.g., sale, ocean view, fixer-upper"
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

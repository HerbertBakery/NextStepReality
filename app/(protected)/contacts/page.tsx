// app/(protected)/contacts/page.tsx
"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
  moveOutDate?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  lookingFor?: string | null;
  lastRentalStatus: RentalStatus;
  lastRentalNotes?: string | null;
  tags?: string | null;
  agentOnJob?: string | null;
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
  const [birthdayFilter, setBirthdayFilter] = useState("");
  const [moveOutFilter, setMoveOutFilter] = useState("");
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Client> | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isNew = searchParams.get("new") === "1";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clients?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    const j = await res.json();
    setItems(j.items || []);
    setLoading(false);
    setSelected({}); // clear selection when list changes
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

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
          moveOutDate: "",
          budgetMax: null,
          lastRentalStatus: "none",
          tags: "",
          lookingFor: "",
          lastRentalNotes: "",
          agentOnJob: "",
        } as Partial<Client>);
        return;
      }
      if (editId) {
        const fromList = items.find((i) => i.id === editId);
        if (fromList) {
          active && setForm(fromList);
          return;
        }
        const r = await fetch(`/api/clients/${editId}`, { cache: "no-store" });
        if (r.ok) {
          const one = await r.json();
          active && setForm(one);
        } else active && setForm(null);
      } else {
        setForm(null);
      }
    }
    hydrate();
    return () => {
      active = false;
    };
  }, [editId, isNew, items]);

  async function save() {
    if (!form) return;
    const method = (form as any).id ? "PUT" : "POST";
    const url = (form as any).id ? `/api/clients/${(form as any).id}` : `/api/clients`;
    const payload = {
      ...form,
      email: (form?.email ?? "").toString().trim() || null,
      phone: (form?.phone ?? "").toString().trim() || null,
      tags: (form?.tags ?? "").toString(),
      agentOnJob: (form?.agentOnJob ?? "").toString() || null,
    };
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      closeModal();
      await load();
    } else {
      const j = await res.json().catch(() => ({}));
      if (res.status === 409) {
        alert(j?.error || "Email already exists.");
        return;
      }
      alert(j?.error || "Save failed");
    }
  }

  async function archive(id: string) {
    if (!confirm("Archive this client?")) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  // Selection helpers
  const toggleSelect = (id: string, checked: boolean) =>
    setSelected((prev) => ({ ...prev, [id]: checked }));

  const anySelected = useMemo(() => Object.values(selected).some(Boolean), [selected]);

  const filteredSorted = useMemo(() => {
    const raw = q.trim().toLowerCase();
    const tokens = raw.split(/[,\s]+/).filter(Boolean);

    function matches(c: Client) {
      // Month-only filters (01–12), ignore year and day
      if (birthdayFilter) {
        const bdMonth = getMonthKey(c.birthday);
        if (bdMonth !== birthdayFilter) return false;
      }
      if (moveOutFilter) {
        const moMonth = getMonthKey(c.moveOutDate);
        if (moMonth !== moveOutFilter) return false;
      }

      if (tokens.length === 0) return true;

      const pack: string[] = [
        c.firstName,
        c.lastName,
        c.email ?? "",
        c.phone ?? "",
        c.tags ?? "",
        c.lookingFor ?? "",
        c.lastRentalNotes ?? "",
        c.agentOnJob ?? "",
      ].map((s) => (s ?? "").toString().toLowerCase());

      if (c.birthday) pack.push(toDateInputValue(c.birthday).toLowerCase());
      if (c.moveOutDate) pack.push(toDateInputValue(c.moveOutDate).toLowerCase());
      if (typeof c.budgetMax === "number") pack.push(String(c.budgetMax));

      const hay = pack.join(" ");
      return tokens.every((t) => hay.includes(t));
    }

    return items.filter(matches).sort(sortByName);
  }, [items, q, birthdayFilter, moveOutFilter]);

  const allSelectedOnPage = filteredSorted.length > 0 && filteredSorted.every((c) => selected[c.id]);
  const someSelectedOnPage = filteredSorted.some((c) => selected[c.id]) && !allSelectedOnPage;

  const selectedEmails = useMemo(() => {
    const set = new Set<string>();
    filteredSorted.forEach((i) => {
      const useIt = anySelected ? !!selected[i.id] : true;
      if (useIt && i.email) set.add(i.email);
    });
    return Array.from(set);
  }, [filteredSorted, selected, anySelected]);

  async function copyEmails() {
    if (selectedEmails.length === 0) {
      alert("No emails to copy.");
      return;
    }
    const text = selectedEmails.join(", ");
    try {
      await navigator.clipboard.writeText(text);
      alert(`Copied ${selectedEmails.length} email(s) to clipboard.`);
    } catch {
      prompt("Copy these emails:", text);
    }
  }
  function emailAll() {
    if (selectedEmails.length === 0) {
      alert("No emails to email.");
      return;
    }
    const bcc = encodeURIComponent(selectedEmails.join(","));
    window.location.href = `mailto:?bcc=${bcc}`;
  }

  function sortByName(a: Client, b: Client) {
    const la = (a.lastName || "").toLowerCase();
    const lb = (b.lastName || "").toLowerCase();
    if (la === lb)
      return (a.firstName || "")
        .toLowerCase()
        .localeCompare((b.firstName || "").toLowerCase());
    return la.localeCompare(lb);
  }

  const setField = <K extends keyof Client>(k: K, v: Client[K]) =>
    setForm((prev) => ({ ...(prev as any), [k]: v }));

  return (
    <div className="space-y-5 w-full">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white mt-1">Clients</h1>
        <p className="text-sm text-gray-400">
          Manage client records, contact details, dates, and budgets.
        </p>
      </div>

      {/* Search FIRST (mobile-friendly full width) */}
      <div className="w-full">
        <label className="sr-only" htmlFor="contact-search">
          Search clients
        </label>
        <input
          id="contact-search"
          className="input w-full"
          type="search"
          enterKeyHint="search"
          placeholder="Search name, email, phone, tags, birthday, move-out, budget…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Month filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="label" htmlFor="birthday-filter">
            Birthday month
          </label>
          <select
            id="birthday-filter"
            className="input"
            value={birthdayFilter}
            onChange={(e) => setBirthdayFilter(e.target.value)}
          >
            <option value="">All months</option>
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="moveout-filter">
            Move-out month
          </label>
          <select
            id="moveout-filter"
            className="input"
            value={moveOutFilter}
            onChange={(e) => setMoveOutFilter(e.target.value)}
          >
            <option value="">All months</option>
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
        {(birthdayFilter || moveOutFilter) && (
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              setBirthdayFilter("");
              setMoveOutFilter("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Actions — wrap on mobile */}
      <div className="flex items-center gap-2 flex-wrap">
        <button className="btn secondary whitespace-nowrap" onClick={copyEmails}>
          {anySelected ? "Copy Selected Emails" : "Copy All Emails"}
        </button>
        <button className="btn whitespace-nowrap" onClick={emailAll}>
          {anySelected ? "Email Selected" : "Email All"}
        </button>
        <div className="ms-auto">
          <button className="btn" onClick={openCreate}>
            Add
          </button>
        </div>
      </div>

      {/* Table: horizontal scroll on small screens */}
      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/40 shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-800/60">
              <tr>
                <th className="px-3 py-3 text-left text-gray-400 font-semibold w-10">
                  <input
                    aria-label="Select all"
                    type="checkbox"
                    checked={allSelectedOnPage}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelectedOnPage;
                    }}
                    onChange={(e) => {
                      const checked = e.currentTarget.checked;
                      const updates: Record<string, boolean> = {};
                      filteredSorted.forEach((c) => {
                        updates[c.id] = checked;
                      });
                      setSelected((prev) => ({ ...prev, ...updates }));
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left text-gray-400 font-semibold">
                  Name / Tags
                </th>
                <th className="px-4 py-3 text-left text-gray-400 font-semibold">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-gray-400 font-semibold">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-gray-400 font-semibold">
                  Dates
                </th>
                {/* Hide less-critical columns on small screens */}
                <th className="px-4 py-3 text-left text-gray-400 font-semibold hidden md:table-cell">
                  Budget (Max)
                </th>
                <th className="px-4 py-3 text-left text-gray-400 font-semibold hidden md:table-cell">
                  Agent on job
                </th>
                <th className="px-4 py-3 text-right text-gray-400 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : filteredSorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-500">
                    No clients found.
                  </td>
                </tr>
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
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") && openEdit(c.id)
                    }
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        aria-label={`Select ${c.firstName} ${c.lastName}`}
                        type="checkbox"
                        checked={!!selected[c.id]}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(c.id, e.currentTarget.checked);
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">
                        {c.firstName} {c.lastName}
                      </div>
                      {c.tags && (
                        <div className="mt-1">
                          {c.tags.split(",").map((t, idx) => (
                            <span key={`${t}-${idx}`} className="pill mr-2">
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{c.email ?? "—"}</td>
                    <td className="px-4 py-3">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-100">
                        <div>
                          Birthday:{" "}
                          {c.birthday ? toDateInputValue(c.birthday) : "—"}
                        </div>
                        <div>
                          Move out:{" "}
                          {c.moveOutDate ? toDateInputValue(c.moveOutDate) : "—"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {typeof c.budgetMax === "number" ? c.budgetMax : "—"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {c.agentOnJob || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          archive(c.id);
                        }}
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
      </div>

      {form && (
        <Modal
          title={(form as any)?.id ? "Edit Client" : "New Client"}
          onClose={closeModal}
          size="lg"
          footer={
            <>
              <button className="btn secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn" onClick={save}>
                Save
              </button>
            </>
          }
        >
          <div className="formGrid two">
            <div className="field">
              <label className="label">First Name</label>
              <input
                className="input"
                type="text"
                autoCapitalize="words"
                enterKeyHint="next"
                value={form?.firstName || ""}
                onChange={(e) => setField("firstName", e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Last Name</label>
              <input
                className="input"
                type="text"
                autoCapitalize="words"
                enterKeyHint="next"
                value={form?.lastName || ""}
                onChange={(e) => setField("lastName", e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                enterKeyHint="next"
                value={form?.email || ""}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Phone</label>
              <input
                className="input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="done"
                value={form?.phone || ""}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Birthday</label>
              <input
                type="date"
                className="input"
                enterKeyHint="done"
                value={form?.birthday ? toDateInputValue(form.birthday) : ""}
                onChange={(e) =>
                  setField("birthday", e.target.value ? e.target.value : "")
                }
              />
            </div>

            <div className="field">
              <label className="label">Move Out Date</label>
              <input
                type="date"
                className="input"
                enterKeyHint="done"
                value={
                  form?.moveOutDate ? toDateInputValue(form.moveOutDate) : ""
                }
                onChange={(e) =>
                  setField("moveOutDate", e.target.value ? e.target.value : "")
                }
              />
            </div>

            {/* Only Budget Max now */}
            <div className="field">
              <label className="label">Budget Max</label>
              <input
                type="number"
                inputMode="numeric"
                className="input"
                enterKeyHint="done"
                value={form?.budgetMax ?? ""}
                onChange={(e) => {
                  const val = e.currentTarget.value.trim();
                  setField(
                    "budgetMax",
                    val === ""
                      ? null
                      : Number.isFinite(Number(val))
                      ? Number(val)
                      : form?.budgetMax ?? null
                  );
                }}
              />
            </div>

            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Agent on job</label>
              <input
                className="input"
                type="text"
                enterKeyHint="next"
                value={form?.agentOnJob || ""}
                onChange={(e) => setField("agentOnJob", e.target.value)}
              />
            </div>

            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Tags (comma separated)</label>
              <input
                className="input"
                type="text"
                enterKeyHint="done"
                value={form?.tags || ""}
                onChange={(e) => setField("tags", e.target.value)}
              />
            </div>

            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Looking For</label>
              <input
                className="input"
                type="text"
                enterKeyHint="done"
                value={form?.lookingFor || ""}
                onChange={(e) => setField("lookingFor", e.target.value)}
              />
            </div>

            <div className="field" style={{ gridColumn: "1/-1" }}>
              <label className="label">Rental Notes</label>
              <textarea
                className="input"
                rows={3}
                value={form?.lastRentalNotes || ""}
                onChange={(e) => setField("lastRentalNotes", e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function toDateInputValue(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Return "01"–"12" for a given date string, or "" if invalid/missing
function getMonthKey(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return mm;
}

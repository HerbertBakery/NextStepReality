"use client";
import { useEffect, useMemo, useState } from "react";

type Client = {
  id: string; firstName: string; lastName: string; email?: string; phone?: string;
  birthday?: string; budgetMin?: number|null; budgetMax?: number|null;
  lookingFor?: string|null; lastRentalStatus: string; lastRentalNotes?: string|null;
  tags?: string|null; archived: boolean; createdAt: string; updatedAt: string;
};

export default function ContactsPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Client>|null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/clients?q=${encodeURIComponent(q)}`);
    const j = await res.json();
    setItems(j.items);
    setLoading(false);
  }
  useEffect(()=>{ load(); }, [q]);

  function startCreate() { setForm({ firstName:"", lastName:"", lastRentalStatus:"none" } as any); }
  function startEdit(c: Client) { setForm(c); }

  async function save() {
    if (!form) return;
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/clients/${form.id}` : `/api/clients`;
    const res = await fetch(url, { method, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm(null); await load(); } else alert("Save failed");
  }

  async function archive(id: string) {
    if (!confirm("Archive this client?")) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const filtered = useMemo(()=> items, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input className="input flex-1" placeholder="Search name, email, tags..." value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn" onClick={startCreate}>Add</button>
      </div>

      <div className="card">
        {loading ? <p>Loading…</p> : (
          <table className="table">
            <thead>
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Phone</th>
                <th className="th">Tags</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className="td">{c.firstName} {c.lastName}</td>
                  <td className="td">{c.email ?? "—"}</td>
                  <td className="td">{c.phone ?? "—"}</td>
                  <td className="td">{c.tags ?? "—"}</td>
                  <td className="td text-right">
                    <button className="btn" onClick={()=>startEdit(c)}>Edit</button>
                    <button className="btn ml-2" onClick={()=>archive(c.id)}>Archive</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">{form.id ? "Edit Client" : "New Client"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="label">First Name</label><input className="input" value={form.firstName||""} onChange={e=>setForm({...form, firstName:e.target.value})} /></div>
            <div><label className="label">Last Name</label><input className="input" value={form.lastName||""} onChange={e=>setForm({...form, lastName:e.target.value})} /></div>
            <div><label className="label">Email</label><input className="input" value={form.email||""} onChange={e=>setForm({...form, email:e.target.value})} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone||""} onChange={e=>setForm({...form, phone:e.target.value})} /></div>
            <div><label className="label">Birthday</label><input className="input" type="date" value={form.birthday?.slice(0,10)||""} onChange={e=>setForm({...form, birthday:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Budget Min</label><input className="input" type="number" value={form.budgetMin as any || ""} onChange={e=>setForm({...form, budgetMin: Number(e.target.value)})} /></div>
              <div><label className="label">Budget Max</label><input className="input" type="number" value={form.budgetMax as any || ""} onChange={e=>setForm({...form, budgetMax: Number(e.target.value)})} /></div>
            </div>
            <div className="md:col-span-2"><label className="label">Looking For</label><textarea className="input" value={form.lookingFor||""} onChange={e=>setForm({...form, lookingFor:e.target.value})} /></div>
            <div>
              <label className="label">Last Rental Status</label>
              <select className="input" value={form.lastRentalStatus||"none"} onChange={e=>setForm({...form, lastRentalStatus:e.target.value})}>
                <option value="none">None</option><option value="applied">Applied</option><option value="approved">Approved</option><option value="declined">Declined</option><option value="moved_in">Moved In</option><option value="moved_out">Moved Out</option>
              </select>
            </div>
            <div className="md:col-span-2"><label className="label">Last Rental Notes</label><textarea className="input" value={form.lastRentalNotes||""} onChange={e=>setForm({...form, lastRentalNotes:e.target.value})} /></div>
            <div className="md:col-span-2"><label className="label">Tags (comma separated)</label><input className="input" value={form.tags||""} onChange={e=>setForm({...form, tags:e.target.value})} /></div>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn" onClick={save}>Save</button>
            <button className="btn" onClick={()=>setForm(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

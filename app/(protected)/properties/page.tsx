"use client";
import { useEffect, useMemo, useState } from "react";

type Property = {
  id: string; addressLine1: string; addressLine2?: string|null; city: string; province?: string|null; postalCode?: string|null;
  forType: "SALE"|"RENT"; price?: number|null; beds?: number|null; baths?: number|null;
  ownerName?: string|null; ownerPhone?: string|null; ownerEmail?: string|null;
  primaryClientId?: string|null; notes?: string|null; archived: boolean;
};
type Client = { id: string; firstName: string; lastName: string };

export default function PropertiesPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Property>|null>(null);

  async function load() {
    setLoading(true);
    const [propsRes, clientsRes] = await Promise.all([
      fetch(`/api/properties?q=${encodeURIComponent(q)}`),
      fetch(`/api/clients?q=`)
    ]);
    const props = await propsRes.json();
    const cl = await clientsRes.json();
    setItems(props.items);
    setClients(cl.items.map((x:any)=>({id:x.id, firstName:x.firstName, lastName:x.lastName})));
    setLoading(false);
  }
  useEffect(()=>{ load(); }, [q]);

  function startCreate() { setForm({ addressLine1:"", city:"", forType:"RENT" } as any); }
  function startEdit(p: Property) { setForm(p); }

  async function save() {
    if (!form) return;
    const method = (form as any).id ? "PUT" : "POST";
    const url = (form as any).id ? `/api/properties/${(form as any).id}` : `/api/properties`;
    const res = await fetch(url, { method, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm(null); await load(); } else alert("Save failed");
  }

  async function archive(id: string) {
    if (!confirm("Archive this property?")) return;
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const filtered = useMemo(()=> items, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input className="input flex-1" placeholder="Search address, city…" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn" onClick={startCreate}>Add</button>
      </div>

      <div className="card">
        {loading ? <p>Loading…</p> : (
          <table className="table">
            <thead>
              <tr>
                <th className="th">Address</th>
                <th className="th">City</th>
                <th className="th">Type</th>
                <th className="th">Price</th>
                <th className="th">Owner</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td className="td">{p.addressLine1}{p.addressLine2?(", "+p.addressLine2):""}</td>
                  <td className="td">{p.city}</td>
                  <td className="td">{p.forType}</td>
                  <td className="td">{p.price ?? "—"}</td>
                  <td className="td">{p.ownerName ?? "—"}</td>
                  <td className="td text-right">
                    <button className="btn" onClick={()=>startEdit(p)}>Edit</button>
                    <button className="btn ml-2" onClick={()=>archive(p.id)}>Archive</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">{(form as any).id ? "Edit Listing" : "New Listing"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="label">Type</label>
              <select className="input" value={form.forType||"RENT"} onChange={e=>setForm({...form, forType: e.target.value as any})}>
                <option value="SALE">SALE</option>
                <option value="RENT">RENT</option>
              </select>
            </div>
            <div><label className="label">Price</label><input className="input" type="number" value={(form.price as any) ?? ""} onChange={e=>setForm({...form, price: Number(e.target.value)})} /></div>
            <div><label className="label">Beds</label><input className="input" type="number" value={(form.beds as any) ?? ""} onChange={e=>setForm({...form, beds: Number(e.target.value)})} /></div>
            <div><label className="label">Baths</label><input className="input" type="number" value={(form.baths as any) ?? ""} onChange={e=>setForm({...form, baths: Number(e.target.value)})} /></div>

            <div className="md:col-span-2"><label className="label">Address Line 1</label><input className="input" value={form.addressLine1||""} onChange={e=>setForm({...form, addressLine1:e.target.value})} /></div>
            <div className="md:col-span-2"><label className="label">Address Line 2</label><input className="input" value={form.addressLine2||""} onChange={e=>setForm({...form, addressLine2:e.target.value})} /></div>

            <div><label className="label">City</label><input className="input" value={form.city||""} onChange={e=>setForm({...form, city:e.target.value})} /></div>
            <div><label className="label">Province</label><input className="input" value={form.province||""} onChange={e=>setForm({...form, province:e.target.value})} /></div>
            <div><label className="label">Postal Code</label><input className="input" value={form.postalCode||""} onChange={e=>setForm({...form, postalCode:e.target.value})} /></div>

            <div><label className="label">Owner Name</label><input className="input" value={form.ownerName||""} onChange={e=>setForm({...form, ownerName:e.target.value})} /></div>
            <div><label className="label">Owner Phone</label><input className="input" value={form.ownerPhone||""} onChange={e=>setForm({...form, ownerPhone:e.target.value})} /></div>
            <div><label className="label">Owner Email</label><input className="input" value={form.ownerEmail||""} onChange={e=>setForm({...form, ownerEmail:e.target.value})} /></div>

            <div className="md:col-span-2">
              <label className="label">Link to Client</label>
              <select className="input" value={form.primaryClientId||""} onChange={e=>setForm({...form, primaryClientId: e.target.value || undefined})}>
                <option value="">— None —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>

            <div className="md:col-span-2"><label className="label">Notes</label><textarea className="input" value={form.notes||""} onChange={e=>setForm({...form, notes:e.target.value})} /></div>
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

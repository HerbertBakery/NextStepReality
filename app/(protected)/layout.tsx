export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Realtor CRM</h1>
        <nav className="flex gap-2">
          <a className="btn" href="/contacts">Contacts</a>
          <a className="btn" href="/properties">Listings</a>
        </nav>
      </header>
      {children}
    </div>
  );
}

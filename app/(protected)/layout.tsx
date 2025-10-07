// app/(protected)/layout.tsx
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col">
      {/* Sticky app header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="w-full flex items-center justify-between px-4 py-3 sm:px-6">
          <h1 className="text-lg sm:text-xl font-semibold text-indigo-400">Realtor CRM</h1>
          <nav className="flex gap-2">
            <a
              href="/contacts"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition text-white text-sm"
            >
              Contacts
            </a>
            <a
              href="/properties"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-gray-200 text-sm"
            >
              Listings
            </a>
          </nav>
        </div>
      </header>

      {/* Full-width content area */}
      <main className="flex-1 w-full px-4 sm:px-6 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}

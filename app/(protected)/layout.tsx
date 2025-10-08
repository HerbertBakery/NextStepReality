"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isContacts = pathname.startsWith("/contacts");
  const isProperties = pathname.startsWith("/properties");

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col">
      {/* Sticky app header (with safe area top) */}
      <header
        className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px))" }}
      >
        <div className="w-full flex items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo + Brand name */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 grid place-items-center text-indigo-300 font-bold">
              NS
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-indigo-400">
              Next Step Reality
            </h1>
          </div>

          {/* Nav Tabs */}
          <nav className="flex gap-2">
            <Link
              href="/contacts"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                isContacts
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Contacts
            </Link>
            <Link
              href="/properties"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                isProperties
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Listings
            </Link>
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

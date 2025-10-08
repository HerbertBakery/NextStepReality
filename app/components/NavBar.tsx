"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();
  const isClients = pathname?.startsWith("/contacts");
  const isProperties = pathname?.startsWith("/properties");

  return (
    <header
      className="
        sticky top-0 z-40 border-b border-slate-800/70
        bg-slate-950/80 backdrop-blur
        px-4 md:px-6
        pt-[max(env(safe-area-inset-top),0px)]
      "
      role="navigation"
      aria-label="Main"
    >
      <div className="h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 grid place-items-center text-indigo-300 font-bold">
            NS
          </div>
          <div className="font-semibold tracking-tight text-white">Next Step Reality</div>
        </div>

        <nav className="flex items-center gap-1">
          <Link
            href="/contacts"
            className={
              "px-3 h-9 rounded-lg text-sm font-medium grid place-items-center " +
              (isClients
                ? "bg-indigo-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-slate-800/60")
            }
          >
            Clients
          </Link>
          <Link
            href="/properties"
            className={
              "px-3 h-9 rounded-lg text-sm font-medium grid place-items-center " +
              (isProperties
                ? "bg-indigo-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-slate-800/60")
            }
          >
            Properties
          </Link>
        </nav>
      </div>
    </header>
  );
}

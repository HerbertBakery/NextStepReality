"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SegmentedTabs({
  tabs,
  className = "",
}: {
  tabs: { href: string; label: string }[];
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav className={`tabs ${className}`}>
      {tabs.map(t => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`tab ${active ? "active" : ""}`}
            prefetch
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

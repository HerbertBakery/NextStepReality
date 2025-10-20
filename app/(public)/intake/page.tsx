// app/(public)/intake/page.tsx
import { Suspense } from "react";
import IntakeIndexClient from "./IntakeIndexClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
          <div className="max-w-2xl mx-auto bg-slate-900/60 rounded-2xl p-6 shadow-xl">
            <p className="text-gray-400">Loading…</p>
          </div>
        </div>
      }
    >
      <IntakeIndexClient />
    </Suspense>
  );
}

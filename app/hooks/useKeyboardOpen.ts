// app/hooks/useKeyboardOpen.ts
"use client";

import { useEffect, useState } from "react";

/** Returns true while the on-screen keyboard is likely open. */
export function useKeyboardOpen() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return;

    const thresh = 120; // px delta that typically indicates keyboard height
    const onResize = () => {
      const kb = Math.max(0, window.innerHeight - (vv.height ?? window.innerHeight));
      setOpen(kb > thresh);
      document.documentElement.classList.toggle("kb-open", kb > thresh);
    };

    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    onResize();
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, []);

  return open;
}

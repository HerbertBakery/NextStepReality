"use client";

import { useEffect } from "react";

/**
 * Adds bottom padding to the target element while the on-screen keyboard is visible.
 * Prevents action buttons / inputs from being hidden behind the keyboard on mobile.
 */
export function useKeyboardPadding(selector = "main") {
  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return;
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return;

    const onResize = () => {
      const keyboardPx = Math.max(0, (vv.height ? window.innerHeight - vv.height : 0));
      el.style.paddingBottom = keyboardPx ? `${keyboardPx + 16}px` : "";
    };

    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    onResize();

    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, [selector]);
}

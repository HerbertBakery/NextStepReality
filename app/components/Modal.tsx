"use client";

import { useEffect, ReactNode } from "react";

export default function Modal({
  title,
  children,
  footer,
  onClose,
  size = "lg",
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div
        className={`modalPanel ${size}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modalHeader">
          <h2 className="modalTitle">{title}</h2>
          <button className="modalClose" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modalBody">{children}</div>
        {footer && <div className="modalFooter">{footer}</div>}
      </div>
    </div>
  );
}

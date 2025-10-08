// app/components/Modal.tsx
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
    document.body.style.overflow = "hidden"; // lock background scroll
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="modalOverlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`modalPanel ${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <h2 className="modalTitle">{title}</h2>
          <button className="modalClose" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Scrollable content area */}
        <div className="modalBody">
          {children}
        </div>

        {footer && <div className="modalFooter">{footer}</div>}

      </div>

      <style jsx>{`
        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.75);
          backdrop-filter: blur(2px);
          display: grid;
          place-items: center;
          z-index: 50;
          /* Respect safe areas */
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: 16px;
          padding-right: 16px;
        }
        .modalPanel {
          background: rgba(2, 6, 23, 0.98);
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,.4);
          color: #e5e7eb;
          width: 100%;
          max-width: 700px;
          /* KEY: allow internal scrolling within the panel */
          display: flex;
          flex-direction: column;
          overflow: hidden; /* keep rounded corners on header/footer */
          /* KEY: cap height relative to viewport (safe-area aware) */
          max-height: calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
        }
        .modalPanel.md { max-width: 560px; }
        .modalPanel.lg { max-width: 700px; }
        .modalPanel.xl { max-width: 900px; }

        /* Keep header/footer visible; body scrolls independently */
        .modalHeader {
          flex: 0 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(148,163,184,.16);
          background: rgba(2, 6, 23, 0.98);
        }
        .modalTitle { font-weight: 700; }
        .modalClose {
          height: 36px; width: 36px; border-radius: 10px;
          background: transparent; border: 1px solid rgba(148,163,184,.24);
          color: #cbd5e1;
        }
        .modalClose:hover { background: rgba(51,65,85,.4); }

        .modalBody {
          /* KEY: scrollable area */
          flex: 1 1 auto;
          overflow: auto;
          -webkit-overflow-scrolling: touch; /* momentum scroll on iOS */
          padding: 16px;
          min-height: 0; /* allows flex child to actually shrink for scroll */
        }

        .modalFooter {
          flex: 0 0 auto;
          padding: 12px 16px;
          border-top: 1px solid rgba(148,163,184,.16);
          display: flex; gap: 8px; justify-content: flex-end;
          background: rgba(2, 6, 23, 0.98);
        }
      `}</style>
    </div>
  );
}

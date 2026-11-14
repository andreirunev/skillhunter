"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Bottom sheet (centred dialog on desktop): fades in and rises 8px. Closes on
// the backdrop, Escape or Cancel. Focus moves to the panel, not to an action.
export function ActionSheet({ open, title, onClose, children }: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center lg:items-center lg:pl-(--rail)">
      <div aria-hidden onClick={onClose} className="absolute inset-0 animate-fade bg-black/60" />
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className="relative w-full outline-none max-w-[720px] animate-rise rounded-t-card border border-b-0 border-border bg-card px-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] pt-4 lg:max-w-md lg:rounded-card lg:border-b lg:pb-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</p>
        <div className="flex flex-col gap-2">
          {children}
          <button type="button" onClick={onClose} className="ui-btn ui-btn-secondary mt-1 min-h-12 text-base">Cancel</button>
        </div>
      </div>
    </div>
  );
}

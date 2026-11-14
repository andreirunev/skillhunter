"use client";

import { useEffect, useState } from "react";

const EVENT = "skillscan:ui-toast";
const SHOW_MS = 2500;
const FADE_MS = 150;

// Short confirmation from any client component, e.g. toast("Saved", 2000).
export function toast(text: string, ms = SHOW_MS) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { text, ms } }));
}

type Shown = { id: number; text: string; bottom: number; leaving: boolean };

// One toast at a time: slides up 8px and fades in, sits just above whatever is
// docked at the bottom (elements marked data-dock), so it never covers buttons.
// The desktop rail is also data-dock but full height, so it is skipped.
export function Toast() {
  const [shown, setShown] = useState<Shown | null>(null);

  useEffect(() => {
    let hide: ReturnType<typeof setTimeout> | undefined;
    let remove: ReturnType<typeof setTimeout> | undefined;
    function show(e: Event) {
      const { text, ms } = (e as CustomEvent<{ text: string; ms: number }>).detail;
      const vh = window.innerHeight;
      const tops = Array.from(document.querySelectorAll("[data-dock]"), (el) => el.getBoundingClientRect())
        .filter((r) => r.height > 0 && r.height < vh / 2)
        .map((r) => r.top);
      const bottom = vh - Math.min(vh, ...tops) + 12;
      clearTimeout(hide);
      clearTimeout(remove);
      setShown({ id: Date.now(), text, bottom, leaving: false });
      hide = setTimeout(() => setShown((s) => s && { ...s, leaving: true }), ms);
      remove = setTimeout(() => setShown(null), ms + FADE_MS);
    }
    window.addEventListener(EVENT, show);
    return () => {
      window.removeEventListener(EVENT, show);
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, []);

  return (
    <div role="status" aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 lg:left-(--rail)"
      style={{ bottom: shown?.bottom ?? 16 }}>
      {shown && (
        <p key={shown.id}
          className={`max-w-sm animate-rise rounded-btn bg-accent px-4 py-2.5 text-center text-sm font-semibold text-bg transition-opacity duration-150 ${shown.leaving ? "opacity-0" : ""}`}>
          {shown.text}
        </p>
      )}
    </div>
  );
}

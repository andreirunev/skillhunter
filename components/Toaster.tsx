"use client";

import { useEffect, useState } from "react";

const EVENT = "skillscan:toast";
const SHOW_MS = 3000;
const FADE_MS = 150;

// Short confirmation from any client component, e.g. toast("Saved: Not now").
export function toast(text: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: text }));
}

type Shown = { id: number; text: string; bottom: number; leaving: boolean };

// One toast at a time, just above whatever bar is docked at the bottom
// (elements marked data-dock), so it never covers the buttons.
export function Toaster() {
  const [shown, setShown] = useState<Shown | null>(null);

  useEffect(() => {
    let hide: ReturnType<typeof setTimeout> | undefined;
    let remove: ReturnType<typeof setTimeout> | undefined;
    function show(e: Event) {
      const dockTops = Array.from(document.querySelectorAll("[data-dock]"), (el) => el.getBoundingClientRect().top);
      const bottom = window.innerHeight - Math.min(window.innerHeight, ...dockTops) + 12;
      clearTimeout(hide);
      clearTimeout(remove);
      setShown({ id: Date.now(), text: (e as CustomEvent<string>).detail, bottom, leaving: false });
      hide = setTimeout(() => setShown((s) => s && { ...s, leaving: true }), SHOW_MS);
      remove = setTimeout(() => setShown(null), SHOW_MS + FADE_MS);
    }
    window.addEventListener(EVENT, show);
    return () => {
      window.removeEventListener(EVENT, show);
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, []);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: shown?.bottom ?? 16 }}>
      {shown && (
        <p key={shown.id}
          className={`max-w-sm animate-rise bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity duration-150 ${shown.leaving ? "opacity-0" : ""}`}>
          {shown.text}
        </p>
      )}
    </div>
  );
}

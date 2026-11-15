"use client";

import { useEffect, useRef, useState } from "react";

const EVENT = "skillhunter:ui-toast";
const SHOW_MS = 2500;
const FADE_MS = 150;

type Action = { label: string; onClick: () => void };

// Short confirmation from any client component, e.g. toast("Saved", 2000).
// `action` adds one button (e.g. Undo); tapping it closes the toast.
export function toast(text: string, ms = SHOW_MS, action?: Action) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { text, ms, action } }));
}

type Shown = { id: number; text: string; action?: Action; bottom: number; leaving: boolean };
type Timers = { current: ReturnType<typeof setTimeout>[] };

function clearTimers(timers: Timers) {
  timers.current.forEach(clearTimeout);
  timers.current = [];
}

// One toast at a time: slides up 8px and fades in, sits just above whatever is
// docked at the bottom (elements marked data-dock), so it never covers buttons.
// The desktop rail is also data-dock but full height, so it is skipped.
export function Toast() {
  const [shown, setShown] = useState<Shown | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    function show(e: Event) {
      const { text, ms, action } = (e as CustomEvent<{ text: string; ms: number; action?: Action }>).detail;
      const vh = window.innerHeight;
      const tops = Array.from(document.querySelectorAll("[data-dock]"), (el) => el.getBoundingClientRect())
        .filter((r) => r.height > 0 && r.height < vh / 2)
        .map((r) => r.top);
      const bottom = vh - Math.min(vh, ...tops) + 12;
      clearTimers(timers);
      setShown({ id: Date.now(), text, action, bottom, leaving: false });
      timers.current = [
        setTimeout(() => setShown((s) => s && { ...s, leaving: true }), ms),
        setTimeout(() => setShown(null), ms + FADE_MS),
      ];
    }
    window.addEventListener(EVENT, show);
    return () => {
      window.removeEventListener(EVENT, show);
      clearTimers(timers);
    };
  }, []);

  function act(action: Action) {
    clearTimers(timers);
    setShown(null);
    action.onClick();
  }

  return (
    <div role="status" aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 lg:left-(--rail)"
      style={{ bottom: shown?.bottom ?? 16 }}>
      {shown && (
        <p key={shown.id}
          className={`flex max-w-sm animate-rise items-center gap-3 rounded-btn bg-accent px-4 py-2.5 text-center text-sm font-semibold text-bg transition-opacity duration-150 ${
            shown.action ? "pointer-events-auto py-1 pr-1" : ""} ${shown.leaving ? "opacity-0" : ""}`}>
          {shown.text}
          {shown.action && (
            <button type="button" onClick={() => act(shown.action!)}
              className="min-h-11 px-3 font-bold underline underline-offset-2">
              {shown.action.label}
            </button>
          )}
        </p>
      )}
    </div>
  );
}

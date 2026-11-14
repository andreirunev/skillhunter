"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "@/lib/theme";

type Theme = "light" | "dark";
const THEMES: Theme[] = ["light", "dark"];

// <html data-theme> is set before paint by THEME_SCRIPT; this reads and changes it.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const current = (): Theme => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

// Small "Light / Dark" segmented control. Saves the choice under one key.
export function ThemeToggle({ labels = { light: "Light", dark: "Dark" }, label = "Theme" }: {
  labels?: Record<Theme, string>;
  label?: string;
}) {
  const theme = useSyncExternalStore(subscribe, current, () => null);

  function choose(next: Theme) {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode: the theme still applies for this page view.
    }
  }

  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 rounded-pill bg-track p-0.5">
      {THEMES.map((t) => (
        <button key={t} type="button" role="radio" aria-checked={theme === t} onClick={() => choose(t)}
          className={`h-8 rounded-pill px-2.5 text-xs font-semibold ${theme === t ? "bg-accent text-bg" : "text-muted"}`}>
          {labels[t]}
        </button>
      ))}
    </div>
  );
}

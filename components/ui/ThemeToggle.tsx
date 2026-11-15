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

// Small "Light / Dark" segmented control, square like the rest of the site
// (2px corners, 1px border, the active side a white chip). Same height as
// LangSelect: 36px, "lg" 44px. Saves the choice under one key.
export function ThemeToggle({ labels = { light: "Light", dark: "Dark" }, label = "Theme", size = "md" }: {
  labels?: Record<Theme, string>;
  label?: string;
  size?: "md" | "lg";
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
    <div role="radiogroup" aria-label={label}
      className={`${size === "lg" ? "h-11" : "h-9"} flex shrink-0 rounded-[2px] border border-border bg-track p-0.5`}>
      {THEMES.map((t) => (
        <button key={t} type="button" role="radio" aria-checked={theme === t} onClick={() => choose(t)}
          className={`${size === "lg" ? "px-3" : "px-2.5"} rounded-[2px] text-xs font-semibold ${theme === t ? "bg-white text-[#0b0b0c]" : "text-muted"}`}>
          {labels[t]}
        </button>
      ))}
    </div>
  );
}

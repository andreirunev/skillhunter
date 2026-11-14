"use client";

import { ChevronDown } from "lucide-react";
import { LANG_COOKIE, LANGS, LANG_NAMES, type Lang } from "@/lib/i18n";

// EN / FI / SV pill select. The choice is kept in a small preference cookie so
// a reload or the next screen keeps it. "lg" is 44px tall (landing header).
export function LangSelect({ value, onChange, label, size = "md" }: {
  value: Lang;
  onChange: (lang: Lang) => void;
  label: string;
  size?: "md" | "lg";
}) {
  function choose(next: Lang) {
    onChange(next);
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${7 * 86_400}; samesite=lax`;
  }

  return (
    <label className="relative shrink-0">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => choose(e.target.value as Lang)}
        className={`${size === "lg" ? "h-11" : "h-9"} appearance-none rounded-pill border border-border bg-card pl-3 pr-7 text-base font-semibold leading-none text-fg outline-none focus:border-fg/40`}>
        {LANGS.map((l) => <option key={l} value={l} aria-label={LANG_NAMES[l]}>{l.toUpperCase()}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden />
    </label>
  );
}

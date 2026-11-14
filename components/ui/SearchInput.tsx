"use client";

import { Search } from "lucide-react";

// Full-width search with a magnifier. 16px text so iOS does not zoom on focus.
export function SearchInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="search"
        className="h-11 w-full rounded-btn border border-border bg-card pl-10 pr-3 text-base text-fg outline-none placeholder:text-muted focus:border-fg/40" />
    </label>
  );
}

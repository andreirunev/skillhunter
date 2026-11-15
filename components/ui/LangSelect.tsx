"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import { LANG_COOKIE, LANGS, LANG_NAMES, type Lang } from "@/lib/i18n";

function saveLang(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${7 * 86_400}; samesite=lax`;
}

// EN / FI / SV dropdown: a button and a small listbox in the site's square
// style (theme tokens, no native select, so no OS highlight colour). Keys:
// arrows / Home / End move, Enter or Space picks, Escape or Tab closes. The
// choice is kept in a small preference cookie so a reload or the next screen
// keeps it. 36px tall like ThemeToggle, "lg" 44px.
export function LangSelect({ value, onChange, label, size = "md" }: {
  value: Lang;
  onChange: (lang: Lang) => void;
  label: string;
  size?: "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();

  // Open: focus goes into the list; a tap anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  function show() {
    setActive(LANGS.indexOf(value));
    setOpen(true);
  }

  function close() {
    setOpen(false);
    button.current?.focus();
  }

  function choose(next: Lang) {
    close();
    if (next === value) return;
    saveLang(next);
    onChange(next);
  }

  function onButtonKey(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      show();
    }
  }

  function onListKey(e: KeyboardEvent) {
    const last = LANGS.length - 1;
    const move: Record<string, () => void> = {
      ArrowDown: () => setActive((i) => Math.min(last, i + 1)),
      ArrowUp: () => setActive((i) => Math.max(0, i - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(LANGS[active]),
      " ": () => choose(LANGS[active]),
      Escape: close,
    };
    if (e.key === "Tab") setOpen(false);
    else if (move[e.key]) {
      e.preventDefault();
      move[e.key]();
    }
  }

  return (
    <div ref={root} className="relative shrink-0">
      <button ref={button} type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined}
        onClick={() => (open ? setOpen(false) : show())} onKeyDown={onButtonKey}
        className={`${size === "lg" ? "h-11 pl-3" : "h-9 pl-2.5"} inline-flex items-center gap-1 rounded-[2px] border border-border bg-card pr-2 text-xs font-semibold text-fg outline-none focus-visible:border-fg/50`}>
        <span className="sr-only">{label}: </span>
        {value.toUpperCase()}
        <ChevronDown className={`size-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <ul ref={list} id={`${id}-list`} role="listbox" tabIndex={-1} aria-label={label}
          aria-activedescendant={`${id}-${LANGS[active]}`} onKeyDown={onListKey}
          className="absolute right-0 top-full z-40 mt-1 w-40 rounded-[2px] border border-border bg-card p-0.5 text-fg outline-none">
          {LANGS.map((l, i) => (
            <li key={l} id={`${id}-${l}`} role="option" aria-selected={l === value}
              onClick={() => choose(l)} onPointerMove={() => setActive(i)}
              className={`flex min-h-10 cursor-pointer items-center gap-2.5 rounded-[2px] px-2.5 text-sm ${i === active ? "bg-track" : ""}`}>
              <span className="w-6 text-xs font-semibold">{l.toUpperCase()}</span>
              <span className="flex-1 text-muted">{LANG_NAMES[l]}</span>
              {l === value && <Check className="size-3.5" aria-hidden />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

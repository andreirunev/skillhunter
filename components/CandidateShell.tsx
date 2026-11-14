"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LANG_COOKIE, LANGS, LANG_NAMES, t, type Lang } from "@/lib/i18n";

const LangCtx = createContext<Lang>("en");

// UI language of the candidate screens, switched from the top bar.
export const useLang = () => useContext(LangCtx);

// Candidate frame: skin (light/dark), slim top bar (company, booth, language,
// theme) and one phone-width column. The language choice is kept in a small
// preference cookie so a reload or the next screen keeps it.
export function CandidateShell({ lang: initial, company, showLang = true, children }: {
  lang: Lang;
  company: { name: string; booth: string } | null;
  showLang?: boolean;
  children: ReactNode;
}) {
  const [lang, setLang] = useState(initial);

  function choose(next: Lang) {
    setLang(next);
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${7 * 86_400}; samesite=lax`;
  }

  return (
    <LangCtx.Provider value={lang}>
      <div data-skin lang={lang} className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-bg">
          <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-2">
            <div className="min-w-0 flex-1 text-[11px] font-semibold uppercase leading-tight tracking-[0.08em] text-muted">
              <p className="truncate">{company?.name ?? "SkillScan"}</p>
              {company && <p className="truncate">{t(lang, "booth", { booth: company.booth })}</p>}
            </div>
            {showLang && (
              <label className="relative shrink-0">
                <span className="sr-only">{t(lang, "language")}</span>
                <select value={lang} onChange={(e) => choose(e.target.value as Lang)}
                  className="h-9 appearance-none rounded-pill border border-border bg-card pl-3 pr-7 text-base font-semibold leading-none text-fg outline-none focus:border-fg/40">
                  {LANGS.map((l) => <option key={l} value={l} aria-label={LANG_NAMES[l]}>{l.toUpperCase()}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden />
              </label>
            )}
            <ThemeToggle label={t(lang, "theme")} labels={{ light: t(lang, "light"), dark: t(lang, "dark") }} />
          </div>
        </header>
        {children}
      </div>
    </LangCtx.Provider>
  );
}

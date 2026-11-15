"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { LangSelect } from "@/components/ui/LangSelect";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { t, type Lang } from "@/lib/i18n";

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

  return (
    <LangCtx.Provider value={lang}>
      <div data-skin lang={lang} className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-bg">
          <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-2">
            <div className="min-w-0 flex-1 text-[11px] font-semibold uppercase leading-tight tracking-[0.08em] text-muted">
              <p className="truncate">{company?.name ?? "SkillHunter"}</p>
              {company && <p className="truncate">{t(lang, "booth", { booth: company.booth })}</p>}
            </div>
            {showLang && <>
              <LangSelect value={lang} onChange={setLang} label={t(lang, "language")} />
              <span aria-hidden className="h-5 w-px bg-border" />
            </>}
            <ThemeToggle label={t(lang, "theme")} labels={{ light: t(lang, "light"), dark: t(lang, "dark") }} />
          </div>
        </header>
        {children}
      </div>
    </LangCtx.Provider>
  );
}

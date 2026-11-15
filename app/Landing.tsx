"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FlagMini } from "@/components/FlagLoader";
import { LangSelect } from "@/components/ui/LangSelect";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { t, type Lang } from "@/lib/i18n";
import { lt } from "@/lib/i18n-landing";
import { usePinAction } from "./r/PinForm";

// Inputs and buttons share one 56px height and 2px corners.
const FIELD = "h-14 min-w-0 flex-1 rounded-[2px] border border-white/55 bg-white/10 px-4 text-white outline-none focus:border-white focus:bg-white/15";
const BTN = "inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-[2px] bg-white px-6 font-display text-lg font-bold tracking-[-0.01em] hover:bg-white/90 disabled:opacity-60";

// One screen, two doors: the candidate half (flag blue) and the recruiter
// half (near-black), side by side on desktop, stacked halves on a phone. The
// top bar spans both. No data, no cookies until a form is sent (the language
// choice is a preference cookie).
export function Landing({ lang: initial, className = "" }: { lang: Lang; className?: string }) {
  const [lang, setLang] = useState(initial);

  return (
    <div data-landing lang={lang}
      className={`${className} relative flex min-h-svh flex-1 flex-col [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-solid [&_:focus-visible]:outline-white`}>
      <header className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 px-4 pt-3 md:px-8 md:pt-5">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold leading-tight tracking-tight">SkillScan</h1>
          <p className="text-xs leading-tight text-white/70">{lt(lang, "tagline")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex h-9 items-center rounded-[2px] border border-white/40 px-2 text-xs font-semibold text-white/85">Demo</span>
          <LangSelect value={lang} onChange={setLang} label={t(lang, "language")} />
          <ThemeToggle label={t(lang, "theme")} labels={{ light: t(lang, "light"), dark: t(lang, "dark") }} />
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 grid-rows-[1fr_1fr] md:grid-cols-2 md:grid-rows-1">
        <Door id="candidate" title={lt(lang, "candidateTitle")} line={lt(lang, "candidateLine")}
          className="bg-flag-blue pt-[4.75rem] pb-6 md:py-24">
          <CandidateStart lang={lang} />
        </Door>
        <Door id="recruiter" title={lt(lang, "recruiterTitle")} line={lt(lang, "recruiterLine")}
          className="bg-(--rec) pt-6 pb-12 md:py-24">
          <RecruiterStart lang={lang} />
          <footer className="absolute inset-x-4 bottom-3 text-center text-[11px] leading-snug text-white/50 md:inset-x-8 md:bottom-5 md:text-right">
            {lt(lang, "footer")}
          </footer>
        </Door>
      </main>
    </div>
  );
}

function Door({ id, title, line, className, children }: {
  id: string;
  title: string;
  line: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className={`relative flex flex-col justify-center px-4 md:px-8 ${className}`}>
      <div className="mx-auto w-full max-w-[440px]">
        <h2 id={`${id}-title`} className="font-display text-[28px] font-bold leading-tight tracking-[-0.02em] md:text-[40px]">{title}</h2>
        {/* Two lines tall on desktop, so both halves' forms line up. */}
        <p className="mt-1 text-[15px] leading-snug text-white/80 md:mt-2 md:min-h-[2lh] md:text-[17px]">{line}</p>
        <div className="mt-4 md:mt-6">{children}</div>
      </div>
    </section>
  );
}

// Candidate door. Same plain POST as /join (works without JS; the server
// burns the code on entry); a wrong code lands on /join with the error and
// the code still in the box.
function CandidateStart({ lang }: { lang: Lang }) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  // Safari restores this page from the back-forward cache: un-stick the button.
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => e.persisted && setPending(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <form method="post" action="/api/join" onSubmit={() => setPending(true)}>
      <label htmlFor="landing-code" className="mb-1.5 block text-sm font-semibold">{t(lang, "codeLabel")}</label>
      <div className="flex gap-2">
        <input
          id="landing-code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          type="text"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          maxLength={12}
          required
          className={`${FIELD} font-mono text-2xl font-bold tracking-[0.14em]`}
        />
        <button type="submit" disabled={pending} aria-busy={pending} className={`${BTN} text-flag-blue`}>
          {pending ? <><FlagMini />{t(lang, "checking")}</> : t(lang, "start")}
        </button>
      </div>
    </form>
  );
}

// Recruiter door: the same PIN check as /r. The error sits under the row
// without moving it, so both halves keep the same height.
function RecruiterStart({ lang }: { lang: Lang }) {
  const { error, formAction, pending } = usePinAction();

  return (
    <form action={formAction}>
      <label htmlFor="landing-pin" className="mb-1.5 block text-sm font-semibold">{lt(lang, "pinLabel")}</label>
      <div className="relative flex gap-2">
        <input
          id="landing-pin"
          name="pin"
          type="password"
          autoComplete="off"
          autoCapitalize="none"
          required
          aria-invalid={Boolean(error)}
          aria-describedby="landing-pin-error"
          className={`${FIELD} text-lg`}
        />
        <button type="submit" disabled={pending} aria-busy={pending} className={`${BTN} text-(--rec)`}>
          {pending ? <><FlagMini />{t(lang, "checking")}</> : lt(lang, "openBooth")}
        </button>
        <p id="landing-pin-error" aria-live="polite" className="absolute left-0 top-full mt-2 text-sm font-medium text-red-300">
          {error && lt(lang, "wrongPin")}
        </p>
      </div>
    </form>
  );
}

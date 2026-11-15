"use client";

import { useEffect, useState } from "react";
import Link from "@/components/TransitionLink";
import { useLang } from "@/components/CandidateShell";
import { useFlagNav } from "@/components/TransitionProvider";
import { FlagMini } from "@/components/FlagLoader";
import { t } from "@/lib/i18n";

// Plain POST form: works without JS, and the server burns the code on entry.
export function JoinForm({ initialCode, error, continueHref }: {
  initialCode: string;
  error: "used" | "missing" | "paused" | null;
  continueHref: string | null;
}) {
  const lang = useLang();
  // Controlled, so the code stays in the box after an error and can be fixed.
  const [code, setCode] = useState(initialCode);
  const [pending, setPending] = useState(false);
  const nav = useFlagNav();

  // Safari restores this page from the back-forward cache: un-stick the button.
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => e.persisted && setPending(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pb-8 pt-6">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{t(lang, "joinTitle")}</h1>
        <p className="mt-1 text-[15px] text-muted">{t(lang, "joinHint")}</p>
      </div>
      <form method="post" action="/api/join" onSubmit={() => {
        setPending(true);
        nav.coverForReload();
      }} className="flex flex-col gap-3">
        <label htmlFor="code" className="text-sm font-semibold">{t(lang, "codeLabel")}</label>
        <input
          id="code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          type="text"
          inputMode="text"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          maxLength={12}
          placeholder="UQE6CRCP"
          required
          aria-invalid={Boolean(error)}
          aria-describedby="code-error"
          className="min-h-16 rounded-card border border-border bg-card px-4 text-center font-mono text-3xl font-bold tracking-[0.2em] text-fg outline-none placeholder:text-muted/50 focus:border-fg/40"
        />
        <p id="code-error" aria-live="polite" className="min-h-5 text-sm font-medium text-bad">
          {error === "missing" ? t(lang, "joinMissing") : error === "used" ? t(lang, "joinUsed") : error === "paused" ? t(lang, "joinPaused") : ""}
        </p>
        <button type="submit" disabled={pending} aria-busy={pending} className="ui-btn ui-btn-primary min-h-14 text-lg">
          {pending ? <><FlagMini />{t(lang, "checking")}</> : t(lang, "start")}
        </button>
      </form>
      {continueHref && (
        <Link href={continueHref} className="ui-btn ui-btn-secondary min-h-12 text-base">{t(lang, "joinMine")}</Link>
      )}
    </main>
  );
}

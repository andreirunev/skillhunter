"use client";

import { useEffect, useState } from "react";
import { FlagMini } from "@/components/FlagLoader";
import { useFlagNav } from "@/components/TransitionProvider";
import { usePinAction } from "./r/PinForm";

const BTN = "fx-btn tap inline-flex min-h-14 shrink-0 items-center justify-center gap-2 px-6 font-display text-lg font-bold tracking-[-0.01em] disabled:opacity-60";

// Candidate door, on the blue half. Same plain POST as /join (works without
// JS; the server burns the code on entry); a wrong code lands on /join with
// the error and the code still in the box.
export function CandidateStart() {
  const nav = useFlagNav();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  // Safari restores this page from the back-forward cache: un-stick the button.
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => e.persisted && setPending(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <form method="post" action="/api/join" className="flex flex-col gap-2 sm:flex-row"
      onSubmit={() => {
        setPending(true);
        nav.coverForReload();
      }}>
      <label htmlFor="landing-code" className="sr-only">Booth code</label>
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
        placeholder="Booth code"
        required
        className="min-h-14 min-w-0 flex-1 border border-white/60 bg-white/10 px-4 font-mono text-2xl font-bold tracking-[0.14em] text-white outline-none placeholder:font-sans placeholder:text-lg placeholder:font-medium placeholder:tracking-normal placeholder:text-white/60 focus:border-white focus:bg-white/15"
      />
      <button type="submit" disabled={pending} aria-busy={pending} className={`${BTN} fx-btn-light border border-white bg-white text-flag-blue`}>
        {pending ? <><FlagMini />Checking…</> : "Start"}
      </button>
    </form>
  );
}

// Recruiter door, on the white half: the same PIN check as /r.
export function RecruiterStart() {
  const { error, formAction, pending, onSubmit } = usePinAction();

  return (
    <form action={formAction} onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="landing-pin" className="text-sm font-semibold">Company PIN</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="landing-pin"
          name="pin"
          type="password"
          autoComplete="off"
          autoCapitalize="none"
          required
          aria-invalid={Boolean(error)}
          aria-describedby="landing-pin-error"
          className="min-h-14 min-w-0 flex-1 border border-ink/40 bg-white px-4 text-lg text-ink outline-none focus:border-flag-blue"
        />
        <button type="submit" disabled={pending} aria-busy={pending} className={`${BTN} border border-flag-blue bg-flag-blue text-white`}>
          {pending ? <><FlagMini />Checking…</> : "Open my booth"}
        </button>
      </div>
      <p id="landing-pin-error" aria-live="polite" className="min-h-5 text-sm font-medium text-red-700">{error}</p>
    </form>
  );
}

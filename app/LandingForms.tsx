"use client";

import { useActionState, useEffect, useState } from "react";
import { FlagMini } from "@/components/FlagLoader";
import { checkPin } from "./r/actions";

// Candidate door. Same plain POST as /join (works without JS; the server
// burns the code on entry); a wrong code lands on /join with the error and
// the code still in the box.
export function CandidateForm() {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  // Safari restores this page from the back-forward cache: un-stick the button.
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => e.persisted && setPending(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <form method="post" action="/api/join" onSubmit={() => setPending(true)} className="lp-form">
      <label htmlFor="lp-code" className="sr-only">Booth code</label>
      <input
        id="lp-code"
        name="code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        type="text"
        autoCapitalize="characters"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        maxLength={12}
        placeholder="BOOTH CODE"
        required
        className="lp-input"
      />
      <button type="submit" disabled={pending} aria-busy={pending} className="lp-btn lp-btn-black">
        {pending ? <><FlagMini />Checking…</> : <>Start <span aria-hidden>→</span></>}
      </button>
    </form>
  );
}

// Recruiter door: the same PIN check as /r (checkPin redirects on a right PIN).
export function RecruiterForm() {
  const [{ error }, formAction, pending] = useActionState(checkPin, { error: "" });

  return (
    <form action={formAction} className="lp-form lp-form-pin">
      <label htmlFor="lp-pin" className="sr-only">Recruiter PIN</label>
      <input
        id="lp-pin"
        name="pin"
        type="password"
        autoComplete="off"
        autoCapitalize="none"
        placeholder="RECRUITER PIN"
        required
        aria-invalid={Boolean(error)}
        aria-describedby="lp-pin-error"
        className="lp-input"
      />
      <button type="submit" disabled={pending} aria-busy={pending} className="lp-btn lp-btn-white">
        {pending ? <><FlagMini />Checking…</> : <>Open <span aria-hidden>→</span></>}
      </button>
      <p id="lp-pin-error" aria-live="polite" className="lp-error">{error}</p>
    </form>
  );
}

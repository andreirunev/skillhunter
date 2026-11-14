"use client";

import { useState } from "react";
import { useFlagNav } from "@/components/TransitionProvider";
import { KeyRound } from "lucide-react";
import { FlagMini } from "@/components/FlagLoader";
import { isInviteCode, normalizeInviteCode } from "@/lib/stage";

// "Find by code": the recruiter types the 4 characters from the candidate's
// phone. The server looks the code up within this company and, on a match,
// the card opens already verified. The code itself is never shown here.
export function FindByCode({ slug, autoFocus = false }: { slug: string; autoFocus?: boolean }) {
  const router = useFlagNav();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function find(raw: string) {
    if (busy || !isInviteCode(normalizeInviteCode(raw))) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/find", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, code: raw }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (res?.ok && typeof data?.attemptId === "string") {
      router.push(`/r/${slug}/a/${data.attemptId}`);
      return; // stays busy until the card opens
    }
    setBusy(false);
    setError(res?.status === 429 ? "Try again in a minute" : res?.status === 404 ? "No candidate with this code" : "Could not check. Try again.");
  }

  function onType(value: string) {
    const next = value.toUpperCase();
    setTyped(next);
    setError(null);
    if (normalizeInviteCode(next) !== normalizeInviteCode(typed)) find(next);
  }

  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); find(typed); }} className="flex flex-col gap-1.5">
      <label className="relative flex items-center">
        <KeyRound className="pointer-events-none absolute left-3 size-4 text-muted" aria-hidden />
        <input value={typed} onChange={(e) => onType(e.target.value)} autoFocus={autoFocus}
          aria-label="Find a candidate by the code on their phone" placeholder="Find by code" maxLength={9}
          autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false} enterKeyHint="search"
          className="min-h-12 w-full rounded-btn border border-border bg-card pl-9 pr-10 text-base font-semibold tracking-[0.12em] text-fg outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-muted focus:border-fg/40" />
        {busy && <span className="absolute right-3 text-muted"><FlagMini /></span>}
      </label>
      {error && <p role="alert" className="text-sm font-semibold text-bad">{error}</p>}
    </form>
  );
}

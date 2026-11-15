"use client";

import { useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { FlagMini } from "@/components/FlagLoader";
import { isInviteCode, normalizeInviteCode } from "@/lib/stage";

// undefined: no full code typed (no filter); null: no candidate with this code.
export type CodeMatch = string | null | undefined;

// "Find by code": the recruiter types the 4 characters from the candidate's
// phone. The server looks the code up within this company and, on a match,
// the list narrows to that candidate, whose card then opens already verified.
// The codes themselves never reach this screen, so a partial code filters nothing.
export function FindByCode({ slug, autoFocus = false, onMatch }: {
  slug: string;
  autoFocus?: boolean;
  onMatch: (match: CodeMatch) => void;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(""); // the code of the newest lookup; older answers are dropped

  async function find(raw: string) {
    const code = normalizeInviteCode(raw);
    if (!isInviteCode(code)) return;
    latest.current = code;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/find", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, code }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (latest.current !== code) return;
    setBusy(false);
    if (res?.ok && typeof data?.attemptId === "string") return onMatch(data.attemptId);
    onMatch(res?.status === 404 ? null : undefined);
    setError(res?.status === 429 ? "Try again in a minute" : res?.status === 404 ? "No candidate with this code" : "Could not check. Try again.");
  }

  function onType(value: string) {
    const next = value.toUpperCase();
    setTyped(next);
    if (normalizeInviteCode(next) === normalizeInviteCode(typed)) return;
    setError(null);
    if (isInviteCode(normalizeInviteCode(next))) return void find(next);
    latest.current = "";
    setBusy(false);
    onMatch(undefined);
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

"use client";

import { useActionState, useEffect, useState } from "react";
import { CircleCheck, CircleDot } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { SectionLabel } from "@/components/ui/ScreenTitle";
import { StatCard } from "@/components/ui/StatCard";
import { toast } from "@/components/ui/Toast";
import type { BoothCode } from "@/lib/recruiter";
import { createCodes } from "../actions";

// Print block + code grid. A free tile copies its one code; a taken tile only
// says "Taken" (never who or when).
export function CodesView({ slug, free, taken, codes, max, days, highlight }: {
  slug: string;
  free: number;
  taken: number;
  codes: BoothCode[];
  max: number;
  days: number;
  highlight: boolean;
}) {
  const [state, formAction, pending] = useActionState(createCodes, { error: "", created: 0 });
  const [count, setCount] = useState("10");

  useEffect(() => {
    if (state.created) toast(`Created ${state.created} code${state.created === 1 ? "" : "s"}`);
  }, [state]);

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast("Copied");
    } catch {
      toast("Copy did not work here. Long-press the code.");
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Free" value={free} icon={CircleDot} tone="ok" />
        <StatCard label="Taken" value={taken} icon={CircleCheck} tone="muted" />
      </div>

      <form action={formAction}
        className={`flex flex-col gap-3 rounded-card border bg-card p-4 ${highlight ? "border-fg/60" : "border-border"}`}>
        <input type="hidden" name="slug" value={slug} />
        <label className="flex items-center justify-between gap-3 text-sm font-semibold">
          How many codes
          <input name="count" type="number" inputMode="numeric" min={1} max={max} required
            value={count} onChange={(e) => setCount(e.target.value)}
            className="h-11 w-24 rounded-btn border border-border bg-bg px-3 text-right text-base font-semibold tabular-nums outline-none focus:border-fg/40" />
        </label>
        <button type="submit" disabled={pending} aria-busy={pending} className="ui-btn ui-btn-primary w-full min-h-12 text-base">
          {pending ? <><Spinner />Saving…</> : "Print"}
        </button>
        <p aria-live="polite" className={`text-[13px] ${state.error ? "font-medium text-bad" : "text-muted"}`}>
          {state.error || `Single use, valid ${days} days. Candidates type the code at /join.`}
        </p>
      </form>

      <section className="flex flex-col gap-3">
        <SectionLabel>Codes · {codes.length}</SectionLabel>
        {codes.length === 0 ? (
          <p className="rounded-card border border-border bg-card p-4 text-center text-sm text-muted">No codes yet. Print some above.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {codes.map((c) => (
              <li key={c.code}>
                {c.taken ? (
                  <div className="flex flex-col items-center gap-2 rounded-tile border border-border bg-card px-1 py-3 opacity-55">
                    <span className="font-mono text-sm font-bold tracking-wider text-muted line-through decoration-1">{c.code}</span>
                    <span className="rounded-pill bg-fg/10 px-2 py-0.5 text-[11px] font-semibold text-muted">Taken</span>
                  </div>
                ) : (
                  <button type="button" onClick={() => copy(c.code)} aria-label={`Copy code ${c.code}`}
                    className="flex w-full flex-col items-center gap-2 rounded-tile border border-border bg-card px-1 py-3 active:bg-track">
                    <span className="font-mono text-sm font-bold tracking-wider">{c.code}</span>
                    <span className="rounded-pill bg-ok/15 px-2 py-0.5 text-[11px] font-semibold text-ok">Free</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

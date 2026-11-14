"use client";

import { useActionState, useEffect, useState } from "react";
import { createCodes } from "@/app/r/[slug]/actions";
import { Spinner } from "@/components/Spinner";
import { toast } from "@/components/Toaster";

// Booth codes tab: create single-use codes, then copy them one at a time.
export function PrintCodes({ slug, codes, max, days }: { slug: string; codes: string[]; max: number; days: number }) {
  const [state, formAction, pending] = useActionState(createCodes, { error: "", created: 0 });
  const [count, setCount] = useState("10");
  const n = Number(count);

  useEffect(() => {
    if (state.created) toast(`Created ${state.created} new codes`);
  }, [state]);

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast(`Copied ${code}`);
    } catch {
      toast("Copy did not work here. Long-press the code to select it.");
    }
  }

  return (
    <>
      <section className="border border-slate-200 bg-white p-4">
        <h2 className="font-bold">Print booth codes</h2>
        <p className="mt-1 text-sm text-slate-600">
          Each code starts the test once and expires after {days} days. Candidates type it at <span className="font-mono font-semibold">/join</span>.
        </p>
        <form action={formAction} className="mt-3 flex items-end gap-2">
          <input type="hidden" name="slug" value={slug} />
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            How many
            <input name="count" type="number" inputMode="numeric" min={1} max={max} required
              value={count} onChange={(e) => setCount(e.target.value)}
              className="min-h-11 w-20 border border-slate-400 bg-white px-3 text-lg outline-none focus:border-slate-900" />
          </label>
          <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary flex-1">
            {pending ? <><Spinner />Saving…</> : Number.isInteger(n) && n > 0 ? `Print ${n} code${n === 1 ? "" : "s"}` : "Print codes"}
          </button>
        </form>
        {state.error && <p aria-live="polite" className="mt-2 text-sm font-medium text-red-700">{state.error}</p>}
      </section>

      <div className="flex items-baseline justify-between">
        <h2 className="font-bold">Unused codes</h2>
        <span className="text-sm text-slate-500">{codes.length}</span>
      </div>

      {codes.length === 0 ? (
        <p className="border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">No unused codes. Print some above.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {codes.map((c) => (
            <li key={c} className="flex flex-col border border-slate-200 bg-white">
              <span className="select-all py-2 text-center font-mono text-sm font-bold tracking-wider">{c}</span>
              <button type="button" onClick={() => copy(c)} aria-label={`Copy ${c}`}
                className="h-9 border-t border-slate-200 text-xs font-semibold text-slate-600 active:bg-slate-100">
                Copy
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

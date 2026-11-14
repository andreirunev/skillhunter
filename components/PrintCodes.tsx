"use client";

import { useActionState, useState } from "react";
import { createCodes } from "@/app/r/[slug]/actions";

// Recruiter "printing step": create single-use booth codes and copy them out.
export function PrintCodes({ slug, codes, max, days }: { slug: string; codes: string[]; max: number; days: number }) {
  const [state, formAction, pending] = useActionState(createCodes, { error: "", created: 0 });
  const [copy, setCopy] = useState<"idle" | "done" | "failed">("idle");

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopy("done");
    } catch {
      setCopy("failed");
    }
  }

  return (
    <details className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <summary className="tap flex min-h-14 cursor-pointer items-center justify-between gap-3 px-4 font-semibold">
        <span>🖨️ Print booth codes</span>
        <span className="text-sm font-normal text-slate-500">{codes.length} unused</span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-slate-100 p-4">
        <p className="text-sm text-slate-600">
          Each code starts the test once and expires after {days} days. Hand them out on cards; candidates type the code at <span className="font-mono font-semibold">/join</span>.
        </p>

        <form action={formAction} className="flex items-end gap-2">
          <input type="hidden" name="slug" value={slug} />
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            How many
            <input name="count" type="number" inputMode="numeric" min={1} max={max} defaultValue={10} required
              className="min-h-12 w-24 rounded-xl bg-white px-3 text-lg ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-brand-600" />
          </label>
          <button type="submit" disabled={pending}
            className="min-h-12 flex-1 rounded-xl bg-brand-700 px-4 font-bold text-white active:scale-[0.99] disabled:opacity-60">
            {pending ? "Creating…" : "Create codes"}
          </button>
        </form>
        <p aria-live="polite" className={`text-sm font-medium ${state.error ? "text-red-700" : "text-leaf-700"}`}>
          {state.error || (state.created ? `Created ${state.created} new codes.` : "")}
        </p>

        {codes.length > 0 && (
          <>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {codes.map((c) => (
                <li key={c} className="rounded-xl bg-slate-50 py-2 text-center font-mono text-lg font-bold tracking-wider ring-1 ring-slate-200">{c}</li>
              ))}
            </ul>
            <button type="button" onClick={copyAll}
              className="min-h-12 rounded-xl bg-slate-100 font-semibold text-slate-800 active:bg-slate-200">
              {copy === "done" ? "Copied ✓" : `📋 Copy all ${codes.length} (one per line)`}
            </button>
            {copy === "failed" && <p className="text-sm text-red-700">Copy did not work here. Long-press a code to select it.</p>}
          </>
        )}
      </div>
    </details>
  );
}

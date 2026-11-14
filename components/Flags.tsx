"use client";

import { useState } from "react";
import { ChevronDown, Flag } from "lucide-react";
import { FLAG_INFO, type FlagCode } from "@/lib/flags";

// Per task: a labelled row of flag pills. Tapping a pill opens its rule, what it
// does NOT mean and what to ask. Flags are three plain rules, never a verdict.
export function FlagRow({ flags, changes }: { flags: FlagCode[]; changes: number }) {
  const [open, setOpen] = useState<FlagCode | null>(null);
  const info = open ? FLAG_INFO[open] : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Flags</span>
        {flags.length ? flags.map((f) => (
          <button
            key={f}
            type="button"
            aria-expanded={open === f}
            onClick={() => setOpen(open === f ? null : f)}
            className={`inline-flex h-8 items-center gap-1 rounded-pill px-3 text-[13px] font-semibold text-warn ${open === f ? "bg-warn/25" : "bg-warn/15"}`}
          >
            <Flag className="size-3" strokeWidth={2.5} aria-hidden />
            {f === "changes" ? `Changed ${changes}×` : FLAG_INFO[f].label}
            <ChevronDown className={`size-3.5 transition-transform ${open === f ? "rotate-180" : ""}`} aria-hidden />
          </button>
        )) : (
          <span className="text-sm text-muted">No flags</span>
        )}
      </div>
      {info && (
        <div className="flex animate-fade flex-col gap-1 rounded-tile bg-warn/10 p-3 text-sm">
          <p className="font-semibold">{info.rule}</p>
          <p className="text-muted">{info.notMeaning}</p>
          <p>{info.ask}</p>
        </div>
      )}
    </div>
  );
}

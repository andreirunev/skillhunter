"use client";

import { useEffect } from "react";
import Link from "next/link";
import { joinSep } from "@/components/ui/Sep";

// Screen-only bar above the sheets (hidden when printing). With ?auto=1 (from
// "Create and print") the print dialog opens by itself once.
export function PrintBar({ backHref, tickets, sheets, skipped, auto }: {
  backHref: string;
  tickets: number;
  sheets: number;
  skipped: number;
  auto: boolean;
}) {
  useEffect(() => {
    if (!auto || tickets === 0) return;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [auto, tickets]);

  return (
    <div className="pv-screen mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-3 px-4 font-sans text-sm text-slate-900">
      <Link href={backHref} className="tap inline-flex min-h-11 items-center rounded-[10px] border border-slate-400 bg-white px-4 font-semibold">
        Back
      </Link>
      <p className="flex-1">
        {joinSep([
          `${tickets} ticket${tickets === 1 ? "" : "s"}`,
          `${sheets} A4 sheet${sheets === 1 ? "" : "s"}`,
          skipped > 0 && `${skipped} taken code${skipped === 1 ? "" : "s"} left out`,
        ])}
        <span className="block text-slate-600">Print at 100% scale (no &quot;fit to page&quot;), then cut along the dashed lines.</span>
      </p>
      <button type="button" onClick={() => window.print()} disabled={tickets === 0}
        className="inline-flex min-h-11 items-center rounded-[10px] bg-slate-900 px-5 font-semibold text-white disabled:opacity-50">
        Print
      </button>
    </div>
  );
}

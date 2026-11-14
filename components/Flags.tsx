import { FLAG_INFO, OWN_PACE_NOTE, type FlagCode } from "@/lib/flags";

// One flag: tap to see the rule, what it does NOT mean, and what to ask.
export function FlagChip({ code }: { code: FlagCode }) {
  const info = FLAG_INFO[code];
  return (
    <details className="group border border-amber-300 bg-amber-50 text-sm open:w-full">
      <summary className="tap flex min-h-11 cursor-pointer list-none items-center gap-1.5 px-3 font-semibold text-amber-900">
        {info.label}
        <span className="ml-1 text-amber-700 transition-transform duration-150 group-open:rotate-180" aria-hidden>▾</span>
      </summary>
      <div className="space-y-1.5 px-3 pb-3 text-slate-700">
        <p><span className="font-semibold">Rule:</span> {info.rule}</p>
        <p className="border border-amber-200 bg-white p-2"><span className="font-semibold">What this does NOT mean:</span> {info.notMeaning.replace(/^It does NOT mean /, "")}</p>
        <p><span className="font-semibold">Ask:</span> {info.ask}</p>
      </div>
    </details>
  );
}

export function FlagList({ flags }: { flags: FlagCode[] }) {
  if (!flags.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((f) => <FlagChip key={f} code={f} />)}
    </div>
  );
}

// Shown once per candidate: how flags work, in plain words.
export function FlagLegend({ ownPace }: { ownPace: boolean }) {
  return (
    <div className="border border-slate-200 bg-white p-4 text-sm text-slate-600">
      <p className="font-semibold text-slate-800">About flags</p>
      <p className="mt-1">
        Flags are three plain rules (very fast, much longer, changed 3+ times), not AI. They never lower anything
        and nobody is sorted by them. Use them only to decide what to ask.
      </p>
      {ownPace && <p className="mt-2 border border-leaf-600/30 bg-leaf-50 p-2 font-medium text-leaf-700">{OWN_PACE_NOTE}</p>}
    </div>
  );
}

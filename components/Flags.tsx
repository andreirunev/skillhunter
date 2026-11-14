import { FLAG_INFO, OWN_PACE_NOTE, type FlagCode } from "@/lib/flags";

// One flag: tap to see the rule, what it does NOT mean, and what to ask.
export function FlagChip({ code }: { code: FlagCode }) {
  const info = FLAG_INFO[code];
  return (
    <details className="group rounded-xl bg-amber-50 text-sm ring-1 ring-amber-200 open:w-full">
      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-1.5 px-3 font-semibold text-amber-900">
        <span aria-hidden>{info.emoji}</span>
        {info.label}
        <span className="ml-1 text-amber-700 group-open:rotate-180" aria-hidden>▾</span>
      </summary>
      <div className="space-y-1.5 px-3 pb-3 text-slate-700">
        <p><span className="font-semibold">Rule:</span> {info.rule}</p>
        <p className="rounded-lg bg-white p-2"><span className="font-semibold">What this does NOT mean:</span> {info.notMeaning.replace(/^It does NOT mean /, "")}</p>
        <p>💬 {info.ask}</p>
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
    <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200">
      <p className="font-semibold text-slate-800">ℹ️ About flags</p>
      <p className="mt-1">
        Flags are three plain rules (very fast, much longer, changed 3+ times), not AI. They never lower anything
        and nobody is sorted by them. Use them only to decide what to ask.
      </p>
      {ownPace && <p className="mt-2 rounded-lg bg-leaf-50 p-2 font-medium text-leaf-700">🐢 {OWN_PACE_NOTE}</p>}
    </div>
  );
}

import { ChevronDown, Flag } from "lucide-react";
import { FLAG_INFO, OWN_PACE_NOTE, type FlagCode } from "@/lib/flags";

// One flag as a small collapsible row: the rule, what it does NOT mean, what to ask.
export function FlagRow({ code }: { code: FlagCode }) {
  const info = FLAG_INFO[code];
  return (
    <details className="group rounded-tile border border-warn/30 bg-warn/10 text-sm">
      <summary className="tap flex min-h-10 cursor-pointer list-none items-center gap-2 px-3 font-semibold text-warn">
        <Flag className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
        {info.label}
        <ChevronDown className="ml-auto size-4 shrink-0 transition-transform duration-150 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="flex flex-col gap-2 px-3 pb-3 text-fg/85">
        <p><span className="text-muted">Rule:</span> {info.rule}</p>
        <p className="rounded-tile bg-bg/70 p-2.5">
          <span className="font-semibold text-fg">What this does NOT mean:</span> {info.notMeaning.replace(/^It does NOT mean /, "")}
        </p>
        <p><span className="text-muted">Ask:</span> {info.ask}</p>
      </div>
    </details>
  );
}

export function FlagList({ flags }: { flags: FlagCode[] }) {
  if (!flags.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {flags.map((f) => <FlagRow key={f} code={f} />)}
    </div>
  );
}

// Shown once per candidate: how flags work, in plain words.
export function FlagLegend({ ownPace }: { ownPace: boolean }) {
  return (
    <div className="rounded-card border border-border bg-card p-3.5 text-[13px] text-muted">
      <p>
        <span className="font-semibold text-fg">Flags</span> are three plain rules (very fast, much longer, changed 3+
        times), not AI. They never lower anything and nobody is sorted by them. Use them only to decide what to ask.
      </p>
      {ownPace && <p className="mt-2 rounded-tile bg-ok/10 p-2.5 font-medium text-ok">{OWN_PACE_NOTE}</p>}
    </div>
  );
}

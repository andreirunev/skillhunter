import { Flag } from "lucide-react";
import { FLAG_INFO, type FlagCode } from "@/lib/flags";

// Per task, always open: plain flag labels in one row, then for each flag what
// it does NOT mean and what to ask. Flags are three plain rules, never a verdict.
export function FlagRow({ flags, changes }: { flags: FlagCode[]; changes: number }) {
  if (!flags.length) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex h-6 items-center rounded-pill bg-fg/10 px-2.5 text-xs font-semibold text-muted">No flags</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {flags.map((f) => (
          <span key={f} className="inline-flex h-6 items-center gap-1 rounded-pill bg-warn/15 px-2.5 text-xs font-semibold text-warn">
            <Flag className="size-3" strokeWidth={2.5} aria-hidden />
            {f === "changes" ? `Changed ${changes}×` : FLAG_INFO[f].label}
          </span>
        ))}
      </div>
      <ul className="flex flex-col gap-1 text-[13px] text-muted">
        {flags.map((f) => (
          <li key={f}>
            <span className="font-semibold text-fg">{FLAG_INFO[f].label}:</span> {FLAG_INFO[f].notMeaning} {FLAG_INFO[f].ask}
          </li>
        ))}
      </ul>
    </div>
  );
}

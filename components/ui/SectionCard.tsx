import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Tone } from "./StatCard";

// Icon tile in the status pill colours (tint + text of the same tone).
const TONE_TILE: Record<Tone, string> = {
  muted: "bg-fg/10 text-fg/70",
  info: "bg-info/15 text-info",
  ok: "bg-ok/15 text-ok",
  warn: "bg-warn/15 text-warn",
  bad: "bg-bad/15 text-bad",
};

// Content card on the skin: 1px border, card fill, the base 2px corners. With
// a title it gets a heading row: tinted icon tile + bold title, grey body.
// `flush` drops the padding for edge-to-edge rows (a divided list).
export function SectionCard({ icon: Icon, tone = "muted", title, flush = false, children }: {
  icon?: LucideIcon;
  tone?: Tone;
  title?: string;
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`border border-border bg-card ${flush ? "" : "p-4"}`}>
      {title && (
        <div className="mb-2.5 flex items-center gap-3">
          {Icon && (
            <span className={`inline-flex size-10 shrink-0 items-center justify-center ${TONE_TILE[tone]}`}>
              <Icon className="size-5" strokeWidth={2} aria-hidden />
            </span>
          )}
          <h3 className="text-base font-bold leading-snug">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

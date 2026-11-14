import type { LucideIcon } from "lucide-react";

export type Tone = "muted" | "info" | "ok" | "warn" | "bad";

const TONE_TEXT: Record<Tone, string> = {
  muted: "text-muted",
  info: "text-info",
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
};

// Small count card: label with a tiny coloured icon, big number below.
// With onClick it is one tap target (a filter); without, a plain card.
export function StatCard({ label, value, icon: Icon, tone = "muted", active = false, onClick }: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: Tone;
  active?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
        <Icon className={`size-3.5 shrink-0 ${TONE_TEXT[tone]}`} strokeWidth={2.25} aria-hidden />
        {label}
      </span>
      <span className="text-[32px] font-bold leading-none tabular-nums">{value}</span>
    </>
  );
  const box = "flex flex-col items-start gap-2.5 rounded-card border bg-card p-3.5 text-left";
  if (!onClick) return <div className={`${box} border-border`}>{body}</div>;
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`${box} ${active ? "border-fg/60" : "border-border"}`}>
      {body}
    </button>
  );
}

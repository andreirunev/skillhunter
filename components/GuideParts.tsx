import { Ear, Info } from "lucide-react";
import { FORMAT_LABELS, type SimTask } from "@/lib/sim";

// Pieces of the interview guide, shared by the candidate card and the
// printable booth sheet. Soft skills are a signal for conversation only.

const LABEL = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";

export function KindChip({ kind }: { kind: SimTask["skill_kind"] }) {
  return (
    <span className={`inline-flex h-6 shrink-0 items-center px-2 text-[11px] font-semibold uppercase tracking-[0.06em] ${
      kind === "soft" ? "bg-info/15 text-info" : "border border-border text-muted"}`}>
      {kind === "soft" ? "Soft" : "Hard"}
    </span>
  );
}

export function FormatChip({ format }: { format: SimTask["format"] }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center bg-fg/10 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg/70">
      {FORMAT_LABELS[format]}
    </span>
  );
}

// Skill tag + Hard/Soft, with the soft-skill caveat.
export function SkillLine({ task }: { task: Pick<SimTask, "skill_tag" | "skill_kind"> }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">{task.skill_tag}</span>
        <KindChip kind={task.skill_kind} />
      </p>
      {task.skill_kind === "soft" && <p className="text-[13px] text-muted">Soft skill: a signal for conversation, never a rating.</p>}
    </div>
  );
}

export function ListenFor({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className={`flex items-center gap-1.5 ${LABEL}`}><Ear className="size-3.5" aria-hidden />Listen for</p>
      <ul className="flex flex-col gap-1 text-sm">
        {items.map((g) => <li key={g} className="flex gap-2"><span aria-hidden className="mt-2 size-1 shrink-0 bg-fg/50" />{g}</li>)}
      </ul>
    </div>
  );
}

// The note is written as "This does NOT mean / measure ..."; the lead is bold.
export function NotMeasure({ text }: { text: string }) {
  if (!text) return null;
  const [, lead, rest] = /^(This does NOT \w+|There is no typical answer here\.)([\s\S]*)$/.exec(text) ?? [null, "", text];
  return (
    <div className="flex gap-2 bg-fg/[0.05] p-2.5 text-[13px] leading-relaxed">
      <Info className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
      <p>{lead && <span className="font-semibold">{lead}</span>}{rest}</p>
    </div>
  );
}

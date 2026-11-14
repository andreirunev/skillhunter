"use client";

import { Check } from "lucide-react";
import { ChoiceInput, OrderInput, TaskInput } from "@/components/TaskInputs";
import { joinSep } from "@/components/ui/Sep";
import type { Answer, Option } from "@/lib/tasks";
import type { Item, Panel, PlayerTask, QuickPayload, SimPayload } from "@/lib/sim";
import { t, type Lang, type MessageKey } from "@/lib/i18n";

// Candidate renderers for the job-simulation formats, one per format. Task
// content is English (with emoji); only the chrome around it is translated.
// Everything is tapped: big targets, native buttons, so the keyboard works.

type OnChange = (next: Answer | undefined, revision: boolean) => void;
type InputProps = { payload: SimPayload; value: Answer | undefined; onChange: OnChange; lang: Lang };

const LABEL = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";
const asOptions = (items: Item[] = []): Option[] => items.map((i) => ({ id: i.id, label: i.text }));

// A small document: chat lines, or labelled fields. With `marked`/`onTap`
// (spot_error) the fields of a non-reference panel become toggle buttons.
export function PanelCard({ panel, marked, onTap }: { panel: Panel; marked?: string[]; onTap?: (id: string) => void }) {
  const tappable = Boolean(onTap) && !panel.ref;
  return (
    <section className="overflow-hidden border border-border bg-card">
      <h3 className={`border-b border-border px-3 py-2 ${LABEL}`}>{panel.title}</h3>
      {panel.lines && (
        <div className="flex flex-col gap-1.5 p-3 text-base leading-relaxed">
          {panel.lines.map((l) => <p key={l}>{l}</p>)}
        </div>
      )}
      {panel.fields && (
        <ul className={panel.mono ? "py-1" : "divide-y divide-border"}>
          {panel.fields.map((fld) => {
            const on = marked?.includes(fld.id) ?? false;
            const body = panel.mono ? (
              <>
                <span className="w-6 shrink-0 text-right font-mono text-[13px] text-muted">{fld.label}</span>
                <code className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed">{fld.value}</code>
              </>
            ) : (
              <>
                <span className="w-24 shrink-0 text-sm text-muted">{fld.label}</span>
                <span className="min-w-0 flex-1 text-base font-semibold">{fld.value}</span>
              </>
            );
            if (!tappable) {
              return <li key={fld.id} className={`flex items-baseline gap-3 px-3 ${panel.mono ? "py-0.5" : "py-2.5"}`}>{body}</li>;
            }
            return (
              <li key={fld.id}>
                <button type="button" aria-pressed={on} onClick={() => onTap!(fld.id)}
                  className={`flex w-full items-center gap-3 border-l-4 px-3 text-left ${panel.mono ? "min-h-11 py-1" : "min-h-12 py-2"} ${
                    on ? "border-l-warn bg-warn/10" : "border-l-transparent"}`}>
                  {body}
                  <span aria-hidden className={`flex size-6 shrink-0 items-center justify-center border-2 ${on ? "border-warn bg-warn text-bg" : "border-border"}`}>
                    {on && <Check className="size-4" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TriageInput({ payload, value, onChange, lang }: InputProps) {
  return <OrderInput options={asOptions(payload.items)} value={value as string[] | undefined} onChange={onChange} lang={lang} />;
}

function SpotErrorInput({ payload, value, onChange }: InputProps) {
  const marked = (value as string[] | undefined) ?? [];
  function toggle(id: string) {
    const on = marked.includes(id);
    const next = on ? marked.filter((x) => x !== id) : [...marked, id];
    onChange(next.length ? next : undefined, on);
  }
  return (
    <div className="flex flex-col gap-3">
      {(payload.panels ?? []).map((pn) => <PanelCard key={pn.title} panel={pn} marked={marked} onTap={toggle} />)}
    </div>
  );
}

function Options({ payload, value, onChange }: InputProps) {
  return <ChoiceInput options={asOptions(payload.options)} value={value as string | undefined} onChange={onChange} />;
}

function NextStepInput(props: InputProps) {
  return (
    <div className="flex flex-col gap-4">
      {(props.payload.panels ?? []).map((pn) => <PanelCard key={pn.title} panel={pn} />)}
      <Options {...props} />
    </div>
  );
}

function ApplyRuleInput(props: InputProps) {
  const { payload, lang } = props;
  return (
    <div className="flex flex-col gap-4">
      <section className="border border-border bg-card p-3">
        <h3 className={LABEL}>{t(lang, "rules")}</h3>
        <ol className="mt-2 flex flex-col gap-2 text-base leading-snug">
          {(payload.rules ?? []).map((r, i) => (
            <li key={r} className="flex gap-2.5">
              <span className="flex size-6 shrink-0 items-center justify-center bg-fg/10 text-xs font-bold tabular-nums">{i + 1}</span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
      </section>
      {payload.case && (
        <section className="border-2 border-fg/20 bg-card p-3">
          <h3 className={LABEL}>{t(lang, "case")}</h3>
          <p className="mt-1.5 text-base font-semibold leading-relaxed">{payload.case}</p>
        </section>
      )}
      <Options {...props} />
    </div>
  );
}

// Bars are plain CSS widths (no chart library), scaled to the largest value.
export function DataView({ payload }: { payload: SimPayload }) {
  const max = Math.max(1, ...(payload.bars ?? []).map((b) => b.value));
  return (
    <>
      {payload.table && (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                {payload.table.columns.map((c) => <th key={c} scope="col" className={`px-3 py-2 ${LABEL}`}>{c}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payload.table.rows.map((row) => (
                <tr key={row.join("|")}>
                  {row.map((cell, i) => i === 0
                    ? <th key={i} scope="row" className="px-3 py-2.5 font-semibold">{cell}</th>
                    : <td key={i} className="px-3 py-2.5 tabular-nums">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {payload.bars && (
        <figure className="border border-border bg-card p-3">
          <ul className="flex flex-col gap-2">
            {payload.bars.map((b) => (
              <li key={b.label} className="flex items-center gap-3 text-sm">
                <span className="w-14 shrink-0 tabular-nums text-muted">{b.label}</span>
                <span className="h-5 min-w-0 flex-1">
                  <span className="block h-full bg-fg/70" style={{ width: `${Math.max(2, (b.value / max) * 100)}%` }} />
                </span>
                <span className="w-10 shrink-0 text-right font-semibold tabular-nums">{b.value}</span>
              </li>
            ))}
          </ul>
          {payload.unit && <figcaption className="mt-2 text-right text-xs text-muted">{payload.unit}</figcaption>}
        </figure>
      )}
    </>
  );
}

function ReadDecideInput(props: InputProps) {
  return (
    <div className="flex flex-col gap-4">
      <DataView payload={props.payload} />
      {props.payload.question && <p className="text-base font-semibold leading-snug">{props.payload.question}</p>}
      <Options {...props} />
    </div>
  );
}

function SimInput({ task, value, onChange, lang }: { task: PlayerTask; value: Answer | undefined; onChange: OnChange; lang: Lang }) {
  if (task.format === "quick_logic") {
    const p = task.payload as QuickPayload;
    return <TaskInput type={p.kind} payload={p} value={value} onChange={onChange} lang={lang} />;
  }
  const props = { payload: task.payload as SimPayload, value, onChange, lang };
  switch (task.format) {
    case "triage":
      return <TriageInput {...props} />;
    case "spot_error":
      return <SpotErrorInput {...props} />;
    case "next_step":
      return <NextStepInput {...props} />;
    case "apply_rule":
      return <ApplyRuleInput {...props} />;
    case "read_decide":
      return <ReadDecideInput {...props} />;
    case "handover":
      return <Options {...props} />;
  }
}

// One task screen: the duty it comes from, the title and prompt, a hint in
// the UI language, then the input. Used by the player and the builder preview.
export function SimTaskView({ task, value, onChange, lang }: { task: PlayerTask; value: Answer | undefined; onChange: OnChange; lang: Lang }) {
  const quick = task.format === "quick_logic" ? (task.payload as QuickPayload) : null;
  const hint = (quick ? `hint_${quick.kind}` : `hint_${task.format}`) as MessageKey;
  return (
    <>
      <section>
        {task.duty && <p className={LABEL}>{joinSep([t(lang, "duty"), task.duty])}</p>}
        <h1 className={`text-xl font-bold leading-snug ${task.duty ? "mt-1.5" : ""}`}>{task.title}</h1>
        {quick?.emoji && <div className="mt-3 text-center text-4xl leading-tight" aria-hidden>{quick.emoji}</div>}
        <p className="mt-3 text-base leading-relaxed">{task.payload.prompt}</p>
        {quick?.code && (
          <pre className="mt-3 overflow-x-auto border border-border bg-card p-4 font-mono text-sm leading-relaxed">{quick.code}</pre>
        )}
        <p className="mt-3 text-[13px] font-medium text-muted">{t(lang, hint)}</p>
      </section>
      <SimInput task={task} value={value} onChange={onChange} lang={lang} />
    </>
  );
}

// Recruiter side: the task exactly as the candidate saw it, with their
// answer filled in. Inert, so nothing can be tapped or changed.
export function SimTaskReplay({ task, value }: { task: PlayerTask; value: Answer | undefined }) {
  return (
    <div inert className="flex flex-col gap-4">
      <SimTaskView task={task} value={value} onChange={() => {}} lang="en" />
    </div>
  );
}

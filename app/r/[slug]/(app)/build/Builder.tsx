"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Check, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import { ChoiceInput, OrderInput } from "@/components/TaskInputs";
import { PanelCard, SimTaskView } from "@/components/SimInputs";
import { Spinner } from "@/components/Spinner";
import { FilterPills } from "@/components/ui/FilterPills";
import { LangSelect } from "@/components/ui/LangSelect";
import { joinSep } from "@/components/ui/Sep";
import { bt, type BuilderKey } from "@/lib/i18n-builder";
import type { Lang } from "@/lib/i18n";
import {
  FORMATS, hasLoadedWording, isValidKey,
  type Format, type LibraryTask, type PlayerTask, type RoleTemplate, type SimKey, type SimPayload,
} from "@/lib/sim";
import type { Answer } from "@/lib/tasks";
import { publishDraft } from "./actions";

export type LiveDraft = {
  version: number;
  title: string;
  roleSlug: string | null;
  timeLimit: number;
  englishRequired: boolean;
  duties: { title: string; libraryId: string; followups: string[]; good: string[]; key: SimKey }[];
};

// One duty in the draft: its title, the library task it maps to, and the
// three things a company may change on that task.
type Row = { uid: string; title: string; taskId: string | null; followups: string[]; good: string[]; key: SimKey };
type SheetState = { kind: "library" | "edit"; index: number } | null;

const LABEL = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";
const INPUT = "min-h-11 w-full border border-border bg-bg px-3 text-base text-fg outline-none placeholder:text-muted focus:border-fg/40";
const ICON_BTN = "tap inline-flex size-11 items-center justify-center border border-border bg-card text-fg disabled:opacity-40";
const LONG_SEC = 12 * 60;
// Error codes from publishTest that have their own message.
const PUBLISH_ERRORS = ["missing_title", "bad_time_limit", "bad_duty_count", "missing_task", "empty_guide", "bad_key"];

let seq = 0;
const uid = () => `row${++seq}`;
const rowFrom = (title: string, task: LibraryTask): Row =>
  ({ uid: uid(), title, taskId: task.id, followups: [...task.followups], good: [...task.good_looks_like], key: task.key });

export function Builder({ slug, initialLang, templates, library, live }: {
  slug: string;
  initialLang: Lang;
  templates: RoleTemplate[];
  library: LibraryTask[];
  live: LiveDraft | null;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const tr = useCallback((key: BuilderKey, vars?: Record<string, string | number>) => bt(lang, key, vars), [lang]);
  const byId = useMemo(() => new Map(library.map((t) => [t.id, t])), [library]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [roleSlug, setRoleSlug] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(20);
  const [englishRequired, setEnglishRequired] = useState(false);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<number | null>(null);
  const [pending, startPublish] = useTransition();

  // The role tag that filters the library: the one shared by the template's tasks.
  const template = templates.find((t) => t.slug === roleSlug) ?? null;
  const roleTag = template ? byId.get(template.duties[0]?.task_id ?? "")?.role_tags[0] ?? null : null;
  const estimateSec = rows.reduce((s, r) => s + (byId.get(r.taskId ?? "")?.expected_seconds ?? 0), 0);

  function go(next: 1 | 2 | 3) {
    setStep(next);
    setError(null);
    window.scrollTo({ top: 0 });
  }

  function startFromTemplate(t: RoleTemplate) {
    setRoleSlug(t.slug);
    setRows(t.duties.flatMap((d) => (byId.get(d.task_id) ? [rowFrom(d.title, byId.get(d.task_id)!)] : [])));
    setTitle(`${t.name}: job simulation`);
    setPublished(null);
    go(2);
  }
  function startFromScratch() {
    setRoleSlug(null);
    setRows([]);
    setTitle("");
    setPublished(null);
    go(2);
  }
  function startFromLive(l: LiveDraft) {
    setRoleSlug(l.roleSlug);
    setRows(l.duties.map((d) => ({ uid: uid(), title: d.title, taskId: byId.has(d.libraryId) ? d.libraryId : null, followups: d.followups, good: d.good, key: d.key })));
    setTitle(l.title);
    setTimeLimit(l.timeLimit);
    setEnglishRequired(l.englishRequired);
    setPublished(null);
    go(2);
  }

  const update = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  function move(i: number, by: -1 | 1) {
    setRows((rs) => {
      const next = [...rs];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });
  }
  function addDuty() {
    setRows((rs) => [...rs, { uid: uid(), title: "", taskId: null, followups: [], good: [], key: null }]);
    setSheet({ kind: "library", index: rows.length });
  }
  function assign(i: number, task: LibraryTask) {
    const fresh = rowFrom("", task);
    update(i, { taskId: task.id, followups: fresh.followups, good: fresh.good, key: fresh.key, title: rows[i]?.title.trim() ? rows[i].title : task.duty_hint });
    setSheet(null);
  }

  function publish() {
    setError(null);
    startPublish(async () => {
      const result = await publishDraft(slug, {
        roleSlug,
        title,
        timeLimit,
        englishRequired,
        duties: rows.map((r) => ({ title: r.title, libraryId: r.taskId ?? "", followups: r.followups, good_looks_like: r.good, key: r.key })),
      }).catch(() => ({ ok: false as const, error: "failed" }));
      if (result.ok) setPublished(result.version);
      else setError(result.error);
    });
  }

  const previewTasks: PlayerTask[] = rows.flatMap((r) => {
    const task = byId.get(r.taskId ?? "");
    return task ? [{ id: r.uid, format: task.format, duty: r.title, title: task.title, payload: task.payload }] : [];
  });
  const kinds = rows.map((r) => byId.get(r.taskId ?? "")?.skill_kind).filter(Boolean);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className={LABEL}>{tr("stepOf", { i: step })}</p>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{tr("builderTitle")}</h1>
        </div>
        <LangSelect value={lang} onChange={setLang} label={tr("language")} />
      </div>

      <ol className="grid grid-cols-3 gap-1.5" aria-label={tr("builderTitle")}>
        {(["stepRole", "stepDuties", "stepSettings"] as const).map((k, i) => (
          <li key={k} aria-current={step === i + 1 ? "step" : undefined}
            className={`border-t-2 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${step >= i + 1 ? "border-fg text-fg" : "border-border text-muted"}`}>
            {tr(k)}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="flex flex-col gap-3">
          <p className="text-sm text-muted">{tr("roleIntro")}</p>
          {live && (
            <button type="button" onClick={() => startFromLive(live)} className="tap flex flex-col gap-1 border-2 border-fg/40 bg-card p-4 text-left">
              <span className="text-base font-bold">{tr("editLive", { v: live.version })}</span>
              <span className="text-sm text-muted">{joinSep([live.title, tr("dutiesCount", { n: live.duties.length })])}</span>
              <span className="text-[13px] text-muted">{tr("editLiveHint")}</span>
            </button>
          )}
          {templates.map((t) => {
            const tasks = t.duties.map((d) => byId.get(d.task_id)).filter((x): x is LibraryTask => Boolean(x));
            const minutes = Math.max(1, Math.round(tasks.reduce((s, x) => s + x.expected_seconds, 0) / 60));
            return (
              <button key={t.slug} type="button" onClick={() => startFromTemplate(t)} className="tap flex flex-col gap-2 border border-border bg-card p-4 text-left">
                <span className="text-base font-bold">{t.name}</span>
                <span className="text-sm text-muted">{t.summary}</span>
                <span className={LABEL}>{joinSep([tr("skillProfile"), tr("dutiesCount", { n: tasks.length }), `≈ ${minutes} min`])}</span>
                <span className="flex flex-wrap gap-1.5">
                  {tasks.map((x) => (
                    <span key={x.id} className="inline-flex min-h-7 items-center gap-1.5 border border-border px-2 text-[13px]">
                      {x.skill_tag}<KindTag kind={x.skill_kind} tr={tr} />
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
          <button type="button" onClick={startFromScratch} className="tap flex flex-col gap-1 border border-dashed border-border bg-card p-4 text-left">
            <span className="text-base font-bold">{tr("fromScratch")}</span>
            <span className="text-sm text-muted">{tr("fromScratchHint")}</span>
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-3">
          <p className="text-sm text-muted">{tr("dutiesIntro")}</p>
          <Estimate seconds={estimateSec} limit={timeLimit} count={rows.length} tr={tr} />
          <ol className="flex flex-col gap-3">
            {rows.map((r, i) => {
              const task = byId.get(r.taskId ?? "");
              return (
                <li key={r.uid} className="flex flex-col gap-2.5 border border-border bg-card p-3">
                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL}>{tr("dutyLabel", { i: i + 1 })}</span>
                    <input value={r.title} maxLength={120} onChange={(e) => update(i, { title: e.target.value })}
                      placeholder={tr("dutyPlaceholder")} className={INPUT} />
                  </label>
                  {hasLoadedWording(r.title) && (
                    <p role="status" className="flex gap-2 bg-warn/10 p-2.5 text-[13px]">
                      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
                      <span><span className="font-semibold">{tr("loaded")}</span> {tr("loadedHint")}</span>
                    </p>
                  )}
                  {task ? <TaskLine task={task} tr={tr} /> : <p className="bg-fg/10 p-2.5 text-sm text-fg/70">{tr("noTask")}</p>}
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setSheet({ kind: "library", index: i })}
                      className={`ui-btn ${task ? "ui-btn-secondary" : "ui-btn-primary"}`}>
                      {task ? tr("swap") : tr("pickTask")}
                    </button>
                    <button type="button" disabled={!task} onClick={() => setSheet({ kind: "edit", index: i })} className="ui-btn ui-btn-secondary">
                      {tr("edit")}
                    </button>
                    <span className="ml-auto flex gap-1.5">
                      <button type="button" aria-label={tr("moveUp")} title={tr("moveUp")} disabled={i === 0} onClick={() => move(i, -1)} className={ICON_BTN}>
                        <ArrowUp className="size-4" aria-hidden />
                      </button>
                      <button type="button" aria-label={tr("moveDown")} title={tr("moveDown")} disabled={i === rows.length - 1} onClick={() => move(i, 1)} className={ICON_BTN}>
                        <ArrowDown className="size-4" aria-hidden />
                      </button>
                      <button type="button" aria-label={tr("remove")} title={tr("remove")} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className={`${ICON_BTN} text-bad`}>
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
          <button type="button" onClick={addDuty} disabled={rows.length >= 8} className="ui-btn ui-btn-secondary min-h-12 border-dashed">
            <Plus className="size-4" aria-hidden />{tr("addDuty")}
          </button>
          <StepNav tr={tr} onBack={() => go(1)} onNext={() => go(3)} nextDisabled={rows.length === 0 || rows.some((r) => !r.taskId)} />
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>{tr("testName")}</span>
            <input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>{tr("timeLimit")}</span>
            <input type="number" inputMode="numeric" min={5} max={60} value={timeLimit}
              onChange={(e) => setTimeLimit(Math.round(Number(e.target.value) || 0))} className={`${INPUT} max-w-32 tabular-nums`} />
          </label>
          <Estimate seconds={estimateSec} limit={timeLimit} count={rows.length} tr={tr} />
          <div className="flex flex-col gap-1.5 border border-border bg-card p-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base font-semibold">
              <input type="checkbox" checked={englishRequired} onChange={(e) => setEnglishRequired(e.target.checked)} className="size-5 shrink-0 accent-accent" />
              {tr("englishRequired")}
            </label>
            <p className="text-[13px] text-muted">{tr("englishHint")}</p>
          </div>

          <section className="flex flex-col gap-2 border border-border bg-card p-3">
            <p className={LABEL}>{joinSep([tr("summary"), tr("skills", { hard: kinds.filter((k) => k === "hard").length, soft: kinds.filter((k) => k === "soft").length })])}</p>
            <ol className="flex flex-col gap-2">
              {rows.map((r, i) => {
                const task = byId.get(r.taskId ?? "");
                return (
                  <li key={r.uid} className="flex gap-2.5 text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center bg-fg/10 text-xs font-bold tabular-nums">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{r.title || "–"}</span>
                      {task && <span className="flex flex-wrap items-center gap-1.5 text-muted">{task.skill_tag}<KindTag kind={task.skill_kind} tr={tr} /></span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <button type="button" onClick={() => setPreview(true)} disabled={previewTasks.length === 0} className="ui-btn ui-btn-secondary min-h-12 text-base">
            {tr("preview")}
          </button>

          {error && <p role="alert" className="text-sm font-semibold text-bad">{tr(PUBLISH_ERRORS.includes(error) ? `err_${error}` as BuilderKey : "err_failed")}</p>}
          {published !== null ? (
            <div role="status" className="flex flex-col gap-3 border border-ok/50 bg-ok/10 p-3">
              <p className="flex gap-2 text-sm font-semibold"><Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />{tr("published", { v: published })}</p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/r/${slug}/guide`} className="ui-btn ui-btn-primary">{tr("openGuide")}</Link>
                <Link href={`/r/${slug}`} className="ui-btn ui-btn-secondary">{tr("toCandidates")}</Link>
              </div>
            </div>
          ) : (
            <StepNav tr={tr} onBack={() => go(2)} onNext={publish} nextLabel={pending ? <><Spinner />{tr("publishing")}</> : tr("publish")}
              nextDisabled={pending || rows.length === 0} busy={pending} />
          )}
        </section>
      )}

      {sheet?.kind === "library" && (
        <Sheet title={tr("library")} closeLabel={tr("close")} onClose={() => setSheet(null)}>
          <LibraryPicker library={library} roleTag={roleTag} current={byId.get(rows[sheet.index]?.taskId ?? "") ?? null}
            onPick={(task) => assign(sheet.index, task)} tr={tr} />
        </Sheet>
      )}
      {sheet?.kind === "edit" && rows[sheet.index] && byId.get(rows[sheet.index].taskId ?? "") && (
        <Sheet title={byId.get(rows[sheet.index].taskId!)!.title} closeLabel={tr("close")} onClose={() => setSheet(null)}>
          <EditTask row={rows[sheet.index]} task={byId.get(rows[sheet.index].taskId!)!} lang={lang} tr={tr}
            onChange={(patch) => update(sheet.index, patch)} onDone={() => setSheet(null)} />
        </Sheet>
      )}
      {preview && <Preview tasks={previewTasks} lang={lang} tr={tr} onClose={() => setPreview(false)} />}
    </div>
  );
}

type Tr = (key: BuilderKey, vars?: Record<string, string | number>) => string;

function KindTag({ kind, tr }: { kind: LibraryTask["skill_kind"]; tr: Tr }) {
  return (
    <span className={`inline-flex h-5 items-center px-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${
      kind === "soft" ? "bg-info/15 text-info" : "bg-fg/10 text-fg/70"}`}>
      {tr(kind)}
    </span>
  );
}

function TaskLine({ task, tr }: { task: LibraryTask; tr: Tr }) {
  return (
    <div className="flex flex-col gap-1.5 bg-bg p-2.5">
      <p className="text-sm font-semibold">{task.title}</p>
      <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
        <span className="inline-flex h-5 items-center bg-fg/10 px-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-fg/70">
          {tr(`fmt_${task.format}` as BuilderKey)}
        </span>
        <KindTag kind={task.skill_kind} tr={tr} />
        {joinSep([task.skill_tag, tr("seconds", { s: task.expected_seconds })])}
      </p>
    </div>
  );
}

function Estimate({ seconds, limit, count, tr }: { seconds: number; limit: number; count: number; tr: Tr }) {
  const long = seconds > LONG_SEC;
  return (
    <div className="flex flex-col gap-1">
      <p className={`text-sm font-semibold tabular-nums ${long || seconds > limit * 60 ? "text-warn" : ""}`}>
        {tr("estimate", { est: Math.max(1, Math.round(seconds / 60)), limit })}
      </p>
      {long && <p className="text-[13px] text-warn">{tr("tooLong")}</p>}
      {(count < 3 || count > 5) && <p className="text-[13px] text-muted">{tr("dutyRange")}</p>}
    </div>
  );
}

function StepNav({ tr, onBack, onNext, nextLabel, nextDisabled, busy }: {
  tr: Tr;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: ReactNode;
  nextDisabled?: boolean;
  busy?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 pt-1">
      <button type="button" onClick={onBack} className="ui-btn ui-btn-secondary min-h-12 text-base">{tr("back")}</button>
      <button type="button" onClick={onNext} disabled={nextDisabled} aria-busy={busy} className="ui-btn ui-btn-primary min-h-12 text-base">
        {nextLabel ?? tr("next")}
      </button>
    </div>
  );
}

// Bottom sheet with its own scroll. Escape or Close dismisses it.
function Sheet({ title, closeLabel, onClose, children }: { title: string; closeLabel: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center lg:items-center lg:pl-(--rail)">
      <div aria-hidden onClick={onClose} className="absolute inset-0 animate-fade bg-black/60" />
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className="relative flex max-h-[88dvh] w-full max-w-[720px] animate-rise flex-col border border-b-0 border-border bg-card outline-none lg:max-w-lg lg:border-b">
        <div className="flex items-center gap-3 border-b border-border px-4 py-2">
          <p className={`min-w-0 flex-1 truncate ${LABEL}`}>{title}</p>
          <button type="button" onClick={onClose} aria-label={closeLabel} title={closeLabel} className="tap inline-flex size-11 items-center justify-center text-muted">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] pt-3">{children}</div>
      </div>
    </div>
  );
}

// Library filtered by the role's tag and a format; Swap starts on the
// current task's format.
function LibraryPicker({ library, roleTag, current, onPick, tr }: {
  library: LibraryTask[];
  roleTag: string | null;
  current: LibraryTask | null;
  onPick: (task: LibraryTask) => void;
  tr: Tr;
}) {
  const [scope, setScope] = useState<"role" | "all">(roleTag ? "role" : "all");
  const [format, setFormat] = useState<Format | "all">(current?.format ?? "all");
  const shown = library.filter((t) =>
    (scope === "all" || !roleTag || t.role_tags.includes(roleTag) || t.role_tags.includes("general")) &&
    (format === "all" || t.format === format));
  return (
    <div className="flex flex-col gap-3">
      {roleTag && (
        <FilterPills label={tr("library")} value={scope} onChange={setScope}
          options={[{ value: "role", label: tr("thisRole") }, { value: "all", label: tr("allRoles") }]} />
      )}
      <FilterPills label={tr("allFormats")} value={format} onChange={setFormat}
        options={[{ value: "all", label: tr("allFormats") }, ...FORMATS.map((f) => ({ value: f, label: tr(`fmt_${f}` as BuilderKey) }))]} />
      {shown.length === 0 && <p className="py-6 text-center text-sm text-muted">{tr("noMatches")}</p>}
      <ul className="flex flex-col gap-2">
        {shown.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => onPick(t)} aria-pressed={current?.id === t.id}
              className={`tap flex w-full flex-col gap-1 border p-3 text-left ${current?.id === t.id ? "border-fg" : "border-border"}`}>
              <span className="text-[13px] text-muted">{t.duty_hint}</span>
              <TaskLine task={t} tr={tr} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LinesEditor({ label, lines, onChange, max, addLabel, removeLabel }: {
  label: string;
  lines: string[];
  onChange: (lines: string[]) => void;
  max: number;
  addLabel: string;
  removeLabel: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={`mb-2 ${LABEL}`}>{label}</legend>
      {lines.map((line, i) => (
        <div key={i} className="flex gap-2">
          <input value={line} maxLength={200} aria-label={`${label} ${i + 1}`}
            onChange={(e) => onChange(lines.map((l, j) => (j === i ? e.target.value : l)))} className={INPUT} />
          <button type="button" aria-label={removeLabel} title={removeLabel} onClick={() => onChange(lines.filter((_, j) => j !== i))} className={ICON_BTN}>
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}
      {lines.length < max && (
        <button type="button" onClick={() => onChange([...lines, ""])} className="ui-btn ui-btn-secondary self-start">
          <Plus className="size-4" aria-hidden />{addLabel}
        </button>
      )}
    </fieldset>
  );
}

// Tap-to-set key: an order for triage, wrong fields for spot_error, one
// option for exact choices, one or more options for typical ones.
function KeyEditor({ task, value, onChange, lang, tr }: { task: LibraryTask; value: SimKey; onChange: (key: SimKey) => void; lang: Lang; tr: Tr }) {
  if (task.format === "quick_logic") return <p className="text-sm text-muted">{tr("keyQuick")}</p>;
  if (task.key_kind === "none") return <p className="text-sm text-muted">{tr("keyNone")}</p>;
  const p = task.payload as SimPayload;
  const ids = Array.isArray(value) ? (value as string[]) : typeof value === "string" ? [value] : [];
  const complete = isValidKey(task.format, task.payload, task.key_kind, value);
  let input: ReactNode;
  let hint: BuilderKey;
  if (task.format === "triage") {
    hint = "keyOrder";
    input = <OrderInput options={(p.items ?? []).map((x) => ({ id: x.id, label: x.text }))} value={ids.length ? ids : undefined}
      onChange={(next) => onChange((next as string[] | undefined) ?? [])} lang={lang} />;
  } else if (task.format === "spot_error") {
    hint = "keyFields";
    const toggle = (id: string) => onChange(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
    input = <div className="flex flex-col gap-3">{(p.panels ?? []).map((pn) => <PanelCard key={pn.title} panel={pn} marked={ids} onTap={toggle} />)}</div>;
  } else if (task.format === "apply_rule" || task.format === "read_decide") {
    hint = "keyOne";
    input = <ChoiceInput options={(p.options ?? []).map((x) => ({ id: x.id, label: x.text }))} value={ids[0]}
      onChange={(next) => onChange((next as string | undefined) ?? null)} />;
  } else {
    hint = "keyOptions";
    input = (
      <div className="flex flex-col gap-2">
        {(p.options ?? []).map((o) => {
          const on = ids.includes(o.id);
          return (
            <button key={o.id} type="button" aria-pressed={on} onClick={() => onChange(on ? ids.filter((x) => x !== o.id) : [...ids, o.id])}
              className={`flex min-h-12 w-full items-center gap-3 border-2 px-3 py-2 text-left text-sm font-semibold ${on ? "border-accent bg-fg/[0.06]" : "border-border bg-card"}`}>
              <span aria-hidden className={`flex size-6 shrink-0 items-center justify-center border-2 ${on ? "border-accent bg-accent text-bg" : "border-border"}`}>
                {on && <Check className="size-4" strokeWidth={3} />}
              </span>
              {o.text}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] text-muted">{tr(hint)}</p>
      {input}
      {!complete && <p className="text-[13px] font-semibold text-warn">{tr("keyIncomplete")}</p>}
    </div>
  );
}

function EditTask({ row, task, lang, tr, onChange, onDone }: {
  row: Row;
  task: LibraryTask;
  lang: Lang;
  tr: Tr;
  onChange: (patch: Partial<Row>) => void;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <TaskLine task={task} tr={tr} />
      <p className="text-sm">{task.payload.prompt}</p>
      <LinesEditor label={tr("followups")} lines={row.followups} onChange={(followups) => onChange({ followups })} max={6}
        addLabel={tr("addQuestion")} removeLabel={tr("removeLine")} />
      <LinesEditor label={tr("listenFor")} lines={row.good} onChange={(good) => onChange({ good })} max={5}
        addLabel={tr("addLine")} removeLabel={tr("removeLine")} />
      <section className="flex flex-col gap-2">
        <p className={LABEL}>{tr(task.key_kind === "typical" ? "keyTypical" : "keyExact")}</p>
        <KeyEditor task={task} value={row.key} onChange={(key) => onChange({ key })} lang={lang} tr={tr} />
      </section>
      <section className="flex flex-col gap-1.5">
        <p className={LABEL}>{tr("notMeasure")}</p>
        <p className="bg-fg/[0.05] p-2.5 text-[13px] text-muted">{task.not_measure_note}</p>
      </section>
      <p className="text-[13px] text-muted">{tr("taskEnglish")}</p>
      <button type="button" onClick={onDone} className="ui-btn ui-btn-primary min-h-12 text-base">{tr("done")}</button>
    </div>
  );
}

// Candidate view of the draft, one task per screen. Local state only: no
// attempt, no request, nothing saved.
function Preview({ tasks, lang, tr, onClose }: { tasks: PlayerTask[]; lang: Lang; tr: Tr; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer | undefined>>({});
  const task = tasks[Math.min(i, tasks.length - 1)];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!task) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={tr("preview")} className="fixed inset-0 z-50 overflow-y-auto bg-bg">
      <div className="sticky top-0 z-10 border-b border-border bg-bg">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-2">
          <p className="min-w-0 flex-1 text-[13px] text-muted">
            <span className="block font-semibold text-fg">{joinSep([tr("preview"), `${i + 1}/${tasks.length}`])}</span>
            {tr("previewNote")}
          </p>
          <button type="button" onClick={onClose} className="ui-btn ui-btn-secondary">{tr("closePreview")}</button>
        </div>
      </div>
      <main key={task.id} className="mx-auto flex w-full max-w-md animate-fade flex-col gap-4 px-4 pb-28 pt-5">
        <SimTaskView task={task} value={answers[task.id]} lang={lang}
          onChange={(next) => setAnswers((a) => ({ ...a, [task.id]: next }))} />
      </main>
      <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-bg px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
          <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="ui-btn ui-btn-secondary min-h-12 text-base">{tr("back")}</button>
          {i < tasks.length - 1
            ? <button type="button" onClick={() => setI(i + 1)} className="ui-btn ui-btn-primary min-h-12 text-base">{tr("next")}</button>
            : <button type="button" onClick={onClose} className="ui-btn ui-btn-primary min-h-12 text-base">{tr("closePreview")}</button>}
        </div>
      </footer>
    </div>
  );
}

"use client";

import {
  useCallback, useEffect, useMemo, useRef, useState, useTransition,
  type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode,
} from "react";
import { Check, GripVertical, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import { ChoiceInput, OrderInput } from "@/components/TaskInputs";
import { PanelCard } from "@/components/SimInputs";
import { FlagMini } from "@/components/FlagLoader";
import { NEW_TASK_FORMATS, TaskTypeCards } from "@/components/TaskTypeCards";
import { joinSep } from "@/components/ui/Sep";
import { toast } from "@/components/ui/Toast";
import { bt, type BuilderKey } from "@/lib/i18n-builder";
import type { Lang } from "@/lib/i18n";
import {
  hasLoadedWording, isValidKey,
  type Format, type LibraryTask, type RoleTemplate, type SimKey, type SimPayload,
} from "@/lib/sim";
import { publishDraft } from "./actions";

export type LiveDraft = {
  version: number;
  title: string;
  roleSlug: string | null;
  timeLimit: number;
  englishRequired: boolean;
  duties: { title: string; libraryId: string; followups: string[]; good: string[]; key: SimKey }[];
};

// A new contest asked for on the Contests or Templates tab: from a role
// template, or from scratch (template null).
export type DraftStart = { template: RoleTemplate | null };

// One duty in the draft: its title, the library task it maps to, and the
// three things a company may change on that task.
type Row = { uid: string; title: string; taskId: string | null; followups: string[]; good: string[]; key: SimKey };
// One sheet for everything: pick a type, then a library task, then edit it.
type SheetState = { kind: "type" } | { kind: "library"; format: Format } | { kind: "edit"; index: number } | null;
// A row being dragged by its handle: row rects measured at pointerdown, the
// pointer's offset, and `to` = the index it would land on.
type Drag = { pointer: number; from: number; to: number; startY: number; dy: number; rects: DOMRect[] };

const LABEL = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";
const INPUT = "min-h-11 w-full border border-border bg-bg px-3 text-base text-fg outline-none placeholder:text-muted focus:border-fg/40";
const ICON_BTN = "tap inline-flex size-11 items-center justify-center border border-border bg-card text-fg disabled:opacity-40";
const OPTION = "ui-btn ui-btn-secondary min-h-12 justify-start py-2 text-left text-base";
const LONG_SEC = 20 * 60;
const MAX_TASKS = 10;
const UNDO_MS = 5000;
// Error codes from publishTest that have their own message.
const PUBLISH_ERRORS = ["missing_title", "bad_time_limit", "bad_duty_count", "missing_task", "empty_guide", "bad_key"];

let seq = 0;
const uid = () => `row${++seq}`;
const rowFrom = (title: string, task: LibraryTask): Row =>
  ({ uid: uid(), title, taskId: task.id, followups: [...task.followups], good: [...task.good_looks_like], key: task.key });

// Contest builder on one screen: name, the task list, Add task, and Save in a
// bar fixed at the bottom. `contestId` = the contest being edited (opens on
// its live version); null = a new contest (`start`), local until the first
// Save creates it. Every Save publishes a new version of that one contest, so
// its earlier versions, other contests and attempts never change.
export function Builder({ slug, companyName, lang, templates, library, contestId, live, start }: {
  slug: string;
  companyName: string;
  lang: Lang;
  templates: RoleTemplate[];
  library: LibraryTask[];
  contestId: string | null;
  live: LiveDraft | null;
  start: DraftStart | null;
}) {
  const tr = useCallback((key: BuilderKey, vars?: Record<string, string | number>) => bt(lang, key, vars), [lang]);
  const byId = useMemo(() => new Map(library.map((t) => [t.id, t])), [library]);

  const templateRows = (t: RoleTemplate) => t.duties.flatMap((d) => (byId.get(d.task_id) ? [rowFrom(d.title, byId.get(d.task_id)!)] : []));
  const newDraft = (t: RoleTemplate | null) => ({ roleSlug: t?.slug ?? null, rows: t ? templateRows(t) : [], title: t ? `${t.name}: job simulation` : "" });

  const [initial] = useState(() => (contestId === null ? newDraft(start?.template ?? null) : {
    roleSlug: live?.roleSlug ?? null,
    rows: (live?.duties ?? []).map((d): Row =>
      ({ uid: uid(), title: d.title, taskId: byId.has(d.libraryId) ? d.libraryId : null, followups: d.followups, good: d.good, key: d.key })),
    title: live?.title ?? "",
  }));
  const [roleSlug, setRoleSlug] = useState<string | null>(initial.roleSlug);
  const [rows, setRows] = useState<Row[]>(initial.rows);
  const [title, setTitle] = useState(initial.title);
  const [contest, setContest] = useState(contestId);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<number | null>(null);
  const [pending, startPublish] = useTransition();
  const [drag, setDrag] = useState<Drag | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const handles = useRef(new Map<string, HTMLButtonElement>());
  const refocus = useRef<string | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);

  // A keyboard move re-orders the DOM; keep focus on the moved row's handle.
  useEffect(() => {
    if (refocus.current) handles.current.get(refocus.current)?.focus();
    refocus.current = null;
  }, [rows]);

  // The role tag that narrows the library: the one shared by the template's tasks.
  const template = templates.find((t) => t.slug === roleSlug) ?? null;
  const roleTag = template ? byId.get(template.duties[0]?.task_id ?? "")?.role_tags[0] ?? null : null;
  // New tasks: only the three plain types. Rows on other formats stay as they are.
  const newFormats = NEW_TASK_FORMATS.filter((f) => library.some((t) => t.format === f));
  const estimateSec = rows.reduce((s, r) => s + (byId.get(r.taskId ?? "")?.expected_seconds ?? 0), 0);
  const minutes = rows.length ? Math.max(1, Math.round(estimateSec / 60)) : 0;
  const timeLimit = live?.timeLimit ?? 20;

  function choices(format: Format) {
    const all = library.filter((t) => t.format === format);
    const forRole = roleTag ? all.filter((t) => t.role_tags.includes(roleTag) || t.role_tags.includes("general")) : all;
    return forRole.length ? forRole : all;
  }

  // Any change hides the result of the last save.
  function edit(next: (rs: Row[]) => Row[]) {
    setRows(next);
    setPublished(null);
    setError(null);
  }
  const update = (i: number, patch: Partial<Row>) => edit((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  function moveTo(from: number, to: number) {
    if (from === to) return;
    edit((rs) => {
      const next = [...rs];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next;
    });
  }
  // One tap, no confirm: the toast offers Undo for 5 s (back at the same place).
  function remove(i: number) {
    const row = rows[i];
    if (!row) return;
    edit((rs) => rs.filter((r) => r.uid !== row.uid));
    setSheet(null);
    toast(tr("taskRemoved"), UNDO_MS, {
      label: tr("undo"),
      onClick: () => edit((rs) => (rs.some((r) => r.uid === row.uid) ? rs : [...rs.slice(0, i), row, ...rs.slice(i)])),
    });
  }

  // Drag to reorder with pointer events (mouse and touch). Only the handle has
  // touch-action: none, so the page still scrolls from anywhere else.
  function grab(e: ReactPointerEvent<HTMLButtonElement>, i: number) {
    if (e.button !== 0 || !listRef.current) return;
    if (e.pointerType === "mouse") e.preventDefault(); // no text selection
    e.currentTarget.setPointerCapture(e.pointerId);
    const rects = Array.from(listRef.current.children, (el) => el.getBoundingClientRect());
    setDrag({ pointer: e.pointerId, from: i, to: i, startY: e.clientY, dy: 0, rects });
  }
  // Where the row lands: the number of other rows whose middle is above the
  // dragged row's middle.
  function landing(d: Drag, clientY: number) {
    const dy = clientY - d.startY;
    const own = d.rects[d.from];
    const center = own.top + own.height / 2 + dy;
    return { dy, to: d.rects.filter((r, j) => j !== d.from && r.top + r.height / 2 < center).length };
  }
  function dragMove(e: ReactPointerEvent) {
    if (!drag || e.pointerId !== drag.pointer) return;
    setDrag({ ...drag, ...landing(drag, e.clientY) });
  }
  // The release point decides (a last pointermove may not have arrived).
  function drop(e: ReactPointerEvent) {
    if (!drag || e.pointerId !== drag.pointer) return;
    setDrag(null);
    moveTo(drag.from, landing(drag, e.clientY).to);
  }
  // Keyboard: ArrowUp / ArrowDown on a focused handle moves its row.
  function handleKey(e: ReactKeyboardEvent, i: number, uid: string) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const to = e.key === "ArrowUp" ? i - 1 : i + 1;
    if (to < 0 || to >= rows.length) return;
    refocus.current = uid;
    moveTo(i, to);
  }
  function add(task: LibraryTask) {
    edit((rs) => [...rs, rowFrom(task.duty_hint, task)]);
    setSheet({ kind: "edit", index: rows.length });
  }
  function startFrom(t: RoleTemplate) {
    setRoleSlug(t.slug);
    edit(() => templateRows(t));
    if (!title.trim()) setTitle(`${t.name}: job simulation`);
  }

  function publish() {
    setError(null);
    startPublish(async () => {
      const result = await publishDraft(slug, contest, {
        roleSlug,
        title,
        timeLimit,
        englishRequired: live?.englishRequired ?? false,
        duties: rows.map((r) => ({ title: r.title, libraryId: r.taskId ?? "", followups: r.followups, good_looks_like: r.good, key: r.key })),
      }).catch(() => ({ ok: false as const, error: "failed" }));
      if (!result.ok) return setError(result.error);
      setPublished(result.version);
      // A new contest exists now: later saves are its next versions.
      if (contest !== result.contestId) {
        setContest(result.contestId);
        window.history.replaceState(null, "", `/r/${slug}/build?contest=${result.contestId}`);
      }
    });
  }

  const editRow = sheet?.kind === "edit" ? rows[sheet.index] : undefined;
  const editTask = byId.get(editRow?.taskId ?? "") ?? null;
  const sheetTitle = sheet?.kind === "type" ? tr("taskType")
    : sheet?.kind === "library" ? tr(`fmt_${sheet.format}` as BuilderKey)
    : sheet?.kind === "edit" ? [tr("taskN", { i: sheet.index + 1 }), editTask && tr(`fmt_${editTask.format}` as BuilderKey)].filter(Boolean).join(" · ")
    : "";
  const long = estimateSec > LONG_SEC || estimateSec > timeLimit * 60;

  return (
    <div className="flex flex-col gap-4 pb-36 pt-2 lg:pb-28">
      <header className="flex flex-col gap-1">
        <p className={LABEL}>{companyName}</p>
        <input value={title} maxLength={80} aria-label={tr("testName")} placeholder={tr("testName")}
          onChange={(e) => { setTitle(e.target.value); setPublished(null); setError(null); }}
          className="w-full border-b border-border bg-transparent pb-1 text-[28px] font-bold leading-tight tracking-tight text-fg outline-none placeholder:text-muted focus:border-fg/40" />
      </header>

      {rows.length > 0 && (
        <ol ref={listRef} className="flex flex-col border-t border-border">
          {rows.map((r, i) => {
            const task = byId.get(r.taskId ?? "");
            const dragging = drag?.from === i;
            // Insertion line: above the row it lands on when moving up, below when moving down.
            const line = drag && drag.to !== drag.from && drag.to === i ? (drag.to < drag.from ? "-top-px" : "-bottom-px") : null;
            return (
              <li key={r.uid} style={dragging ? { transform: `translateY(${drag.dy}px)` } : undefined}
                className={`relative flex items-center gap-1 border-b border-border py-1.5 ${dragging ? "z-10 border-t bg-card shadow-lg" : ""}`}>
                {line && <span aria-hidden className={`pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-accent ${line}`} />}
                <button type="button" aria-label={tr("dragTask", { i: i + 1 })} title={tr("dragTask", { i: i + 1 })}
                  ref={(el) => { if (el) handles.current.set(r.uid, el); else handles.current.delete(r.uid); }}
                  onPointerDown={(e) => grab(e, i)} onPointerMove={dragMove} onPointerUp={drop}
                  onPointerCancel={() => setDrag(null)} onKeyDown={(e) => handleKey(e, i, r.uid)}
                  style={{ touchAction: "none", transform: "none" }}
                  className={`tap inline-flex size-11 shrink-0 items-center justify-center text-muted ${dragging ? "cursor-grabbing text-fg" : "cursor-grab"}`}>
                  <GripVertical className="size-5" aria-hidden />
                </button>
                <button type="button" onClick={() => setSheet({ kind: "edit", index: i })}
                  className="tap flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="w-5 shrink-0 text-sm font-bold tabular-nums text-muted">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-base font-semibold">{r.title || task?.title || "–"}</span>
                    <span className={`block text-[13px] ${task ? "text-muted" : "text-warn"}`}>
                      {task ? tr(`fmt_${task.format}` as BuilderKey) : tr("noTask")}
                    </span>
                  </span>
                </button>
                <button type="button" onClick={() => remove(i)} aria-label={tr("removeTask", { i: i + 1 })} title={tr("removeTask", { i: i + 1 })}
                  className="tap inline-flex size-11 shrink-0 items-center justify-center text-muted hover:text-bad">
                  <Trash2 className="size-5" aria-hidden />
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <button type="button" onClick={() => setSheet({ kind: "type" })} disabled={rows.length >= MAX_TASKS}
        className="ui-btn ui-btn-secondary min-h-12 text-base">
        <Plus className="size-4" aria-hidden />{tr("addTask")}
      </button>

      {rows.length === 0 && templates.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className={LABEL}>{tr("startFrom")}</p>
          {templates.map((t) => (
            <button key={t.slug} type="button" onClick={() => startFrom(t)} className={OPTION}>{t.name}</button>
          ))}
        </section>
      )}

      <div data-dock className="fixed inset-x-0 bottom-(--tabbar) z-20 border-t border-border bg-bg px-4 pb-3 pt-2 lg:left-(--rail)">
        <div className="mx-auto flex max-w-[720px] flex-col gap-2">
          <p aria-live="polite" className={`truncate text-[13px] tabular-nums ${
            error ? "font-semibold text-bad" : published !== null ? "font-semibold text-ok" : long ? "font-semibold text-warn" : "text-muted"}`}>
            {error ? tr(PUBLISH_ERRORS.includes(error) ? `err_${error}` as BuilderKey : "err_failed")
              : published !== null ? tr("savedLine", { v: published })
              : joinSep([rows.length === 1 ? tr("oneTask") : tr("tasksCount", { n: rows.length }), tr("aboutMin", { m: minutes })])}
          </p>
          <button type="button" onClick={publish} disabled={pending || rows.length === 0} aria-busy={pending}
            className="ui-btn ui-btn-primary min-h-12 text-base">
            {pending ? <><FlagMini />{tr("saving")}</> : tr("save")}
          </button>
        </div>
      </div>

      {sheet && (sheet.kind !== "edit" || editRow) && (
        <Sheet title={sheetTitle} closeLabel={tr("close")} onClose={closeSheet} wide={sheet.kind === "type"}>
          {sheet.kind === "type" && (
            <TaskTypeCards onPick={(f) => setSheet({ kind: "library", format: f })}
              items={newFormats.map((f) => ({ format: f, text: {
                title: tr(`fmt_${f}`), line: tr(`fmtLine_${f}`), exampleLabel: tr("example"), example: tr(`fmtEx_${f}`),
              } }))} />
          )}
          {sheet.kind === "library" && (
            <div className="flex flex-col gap-2">
              {choices(sheet.format).map((t) => (
                <button key={t.id} type="button" onClick={() => add(t)} className={OPTION}>{t.title}</button>
              ))}
              <button type="button" onClick={() => setSheet({ kind: "type" })} className="ui-btn ui-btn-secondary mt-1 min-h-12 text-base">
                {tr("back")}
              </button>
            </div>
          )}
          {sheet.kind === "edit" && editRow && (
            <EditTask row={editRow} task={editTask} lang={lang} tr={tr}
              onChange={(patch) => update(sheet.index, patch)} onRemove={() => remove(sheet.index)} onDone={closeSheet} />
          )}
        </Sheet>
      )}
    </div>
  );
}

type Tr = (key: BuilderKey, vars?: Record<string, string | number>) => string;

// Bottom sheet with its own scroll. Escape or Close dismisses it. `wide`: a
// wider dialog on desktop (the task type cards).
function Sheet({ title, closeLabel, onClose, wide = false, children }: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
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
        className={`relative flex max-h-[88dvh] w-full max-w-[720px] animate-rise flex-col border border-b-0 border-border bg-card outline-none lg:border-b ${
          wide ? "lg:max-w-2xl" : "lg:max-w-lg"}`}>
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

function EditTask({ row, task, lang, tr, onChange, onRemove, onDone }: {
  row: Row;
  task: LibraryTask | null;
  lang: Lang;
  tr: Tr;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <input value={row.title} maxLength={120} aria-label={tr("dutyPlaceholder")} placeholder={tr("dutyPlaceholder")}
          onChange={(e) => onChange({ title: e.target.value })} className={INPUT} />
        {hasLoadedWording(row.title) && (
          <p role="status" className="flex items-center gap-2 text-[13px] font-semibold text-warn">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />{tr("loaded")}
          </p>
        )}
      </div>
      {task ? (
        <>
          <p className="text-sm">{task.payload.prompt}</p>
          <LinesEditor label={tr("followups")} lines={row.followups} onChange={(followups) => onChange({ followups })} max={6}
            addLabel={tr("addQuestion")} removeLabel={tr("removeLine")} />
          <LinesEditor label={tr("listenFor")} lines={row.good} onChange={(good) => onChange({ good })} max={5}
            addLabel={tr("addLine")} removeLabel={tr("removeLine")} />
          <section className="flex flex-col gap-2">
            <p className={LABEL}>{tr(task.key_kind === "typical" ? "keyTypical" : "keyExact")}</p>
            <KeyEditor task={task} value={row.key} onChange={(key) => onChange({ key })} lang={lang} tr={tr} />
          </section>
        </>
      ) : (
        <p className="text-sm text-muted">{tr("noTask")}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onRemove} className="ui-btn ui-btn-secondary min-h-12 text-base text-bad">{tr("remove")}</button>
        <button type="button" onClick={onDone} className="ui-btn ui-btn-primary min-h-12 text-base">{tr("done")}</button>
      </div>
    </div>
  );
}

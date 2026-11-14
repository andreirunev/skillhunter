import { notFound } from "next/navigation";
import { Check, ChevronDown, Flag, TriangleAlert } from "lucide-react";
import { ActionBar } from "@/components/ActionBar";
import { AutoRefresh } from "@/components/AutoRefresh";
import { CandidateStatusProvider, DetailTopBar } from "@/components/CandidateStatus";
import { FlagRow } from "@/components/Flags";
import { FormatChip, KindChip, ListenFor, NotMeasure, SkillLine } from "@/components/GuideParts";
import { SimTaskReplay } from "@/components/SimInputs";
import { TaskNotes } from "@/components/TaskNotes";
import { AvatarTile } from "@/components/ui/ListRow";
import { joinSep } from "@/components/ui/Sep";
import { getCandidate, getCompany, type DetailTask } from "@/lib/recruiter";
import { compareLabel, describeSim, toPlayerTask, type SimPayload } from "@/lib/sim";
import { GENERIC_FOLLOW_UPS } from "@/lib/tasks";
import { formatClock, formatDuration, formatMinutes, LANG_SHORT } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CandidatePage(props: PageProps<"/r/[slug]/a/[attemptId]">) {
  const { slug, attemptId } = await props.params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const data = await getCandidate(company.id, attemptId);
  if (!data) notFound();
  const { attempt, tasks } = data;

  const answered = tasks.filter((t) => t.answered).length;
  const flagCount = tasks.reduce((sum, t) => sum + t.flags.length, 0);
  const expectedSec = tasks.reduce((sum, t) => sum + t.expected_seconds, 0);

  return (
    <CandidateStatusProvider key={attempt.id} attemptId={attempt.id} status={attempt.status}
      invited={attempt.invited} verified={attempt.code_verified} stage={attempt.stage}>
      <AutoRefresh seconds={10} />
      <DetailTopBar backHref={`/r/${slug}`} name={attempt.avatar_name} />

      <div className="flex flex-col gap-3 pb-16 pt-4 lg:pb-12">
        {/* Timing summary: facts only, no verdict. */}
        <section className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
          <div className="flex items-center gap-2.5">
            <AvatarTile emoji={attempt.avatar_emoji} color={attempt.avatar_color} size={32} />
            <p className="min-w-0 truncate text-sm font-semibold">{attempt.avatar_name}</p>
            <span className="ml-auto shrink-0 text-[13px] text-muted">
              {joinSep([LANG_SHORT[attempt.lang] ?? attempt.lang, `limit ${attempt.time_limit_minutes} min`])}
            </span>
          </div>
          {attempt.contact && (
            <div className="flex flex-col gap-1 rounded-tile bg-bg p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{joinSep(["Contact", "shared by the candidate"])}</p>
              <p className="text-base font-semibold">{attempt.contact.full_name}</p>
              {attempt.contact.phone && <a href={`tel:${attempt.contact.phone.replace(/[^\d+]/g, "")}`} className="text-base text-info">{attempt.contact.phone}</a>}
              {attempt.contact.email && <a href={`mailto:${attempt.contact.email}`} className="break-all text-base text-info">{attempt.contact.email}</a>}
            </div>
          )}
          <dl className="grid grid-cols-3 gap-2">
            <Fact label={attempt.finished_at ? "Finished" : "In progress"}
              value={attempt.finished_at ? formatClock(attempt.finished_at) : `${answered}/${tasks.length}`} />
            <Fact label="Total time" value={attempt.finished_at ? formatMinutes(attempt.total_ms) : "–"}
              note={attempt.limit_reached ? "Limit reached" : undefined} />
            <Fact label="Expected" value={`≈ ${formatMinutes(expectedSec * 1000)}`} />
          </dl>
          <p className={`flex items-center gap-2 text-sm font-semibold ${flagCount ? "text-warn" : "text-muted"}`}>
            <Flag className="size-4 shrink-0" aria-hidden />
            {flagCount ? joinSep([`${flagCount} flag${flagCount === 1 ? "" : "s"}`, "review below"]) : "No flags fired"}
          </p>
          <p className="text-[13px] text-muted">
            Flags are three plain rules (very fast, took longer, changed 3+ times), not AI. They never lower anything.
          </p>
        </section>

        {tasks.map((t, i) => (
          <TaskCard key={t.id} task={t} index={i} attemptId={attempt.id}
            finished={Boolean(attempt.finished_at)} limitReached={attempt.limit_reached} />
        ))}
      </div>

      <ActionBar />
    </CandidateStatusProvider>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-2xl font-bold tabular-nums leading-tight">{value}</dd>
      {note && <dd className="text-[12px] font-semibold text-muted">{note}</dd>}
    </div>
  );
}

const LABEL = "text-xs font-semibold uppercase tracking-[0.08em] text-muted";

// One task, top to bottom: duty and format, the situation, the answer with a
// neutral comparison (or a grey "not answered" block), time vs expected,
// flags, then the interview guide for the booth. Skipped or not answered
// tasks are never compared.
function TaskCard({ task: t, index, attemptId, finished, limitReached }: {
  task: DetailTask;
  index: number;
  attemptId: string;
  finished: boolean;
  limitReached: boolean;
}) {
  const skipped = t.answered && t.answer === null;
  const hasAnswer = t.answered && !skipped;
  const chip = hasAnswer ? "Answered" : skipped ? "Skipped" : !finished ? "Pending" : limitReached ? "Time up" : "Not answered";
  const empty = skipped ? "Skipped" : !finished ? "Not answered yet" : limitReached ? joinSep(["Not answered", "Time up"]) : "Not answered";
  const quick = t.format === "quick_logic";
  const p = t.payload as SimPayload;
  const situation = quick ? null : [p.case, p.question].filter(Boolean).join(" ");
  // Older tasks have no guide of their own: the generic questions fill in.
  const questions = t.library_id === "legacy" ? [...t.followups, ...GENERIC_FOLLOW_UPS] : t.followups;

  return (
    <article className="flex flex-col gap-3 border border-border bg-card p-3">
      <div className="flex items-start gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center bg-fg/10 text-sm font-bold tabular-nums">{index + 1}</span>
        <div className="min-w-0 flex-1">
          {t.duty && <p className={LABEL}>{t.duty}</p>}
          <p className="text-sm font-semibold">{t.title}</p>
        </div>
        <span className={`inline-flex h-6 shrink-0 items-center rounded-pill px-2.5 text-xs font-semibold ${hasAnswer ? "border border-border text-muted" : "bg-fg/10 text-fg/70"}`}>
          {chip}
        </span>
      </div>
      <p className="flex flex-wrap gap-1.5">
        <FormatChip format={t.format} />
        <KindChip kind={t.skill_kind} />
      </p>

      <div>
        <h2 className="text-base font-semibold leading-snug">{t.payload.prompt}</h2>
        {situation && <p className="mt-1 text-sm text-muted">{situation}</p>}
        <details className="mt-2">
          <summary className="tap inline-flex min-h-10 cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-info">
            <ChevronDown className="size-4" aria-hidden />Show the task as the candidate saw it
          </summary>
          <div className="mt-2 border border-dashed border-border p-3">
            <SimTaskReplay task={toPlayerTask(t)} value={hasAnswer ? t.answer : undefined} />
          </div>
        </details>
      </div>

      {hasAnswer ? (
        <Comparison task={t} />
      ) : (
        <p className="bg-fg/10 px-3 py-3.5 text-base font-bold uppercase tracking-[0.06em] text-fg/70">{empty}</p>
      )}

      <TimeStrip expectedSec={t.expected_seconds} timeMs={t.time_ms} compare={hasAnswer} />

      <FlagRow flags={t.flags} changes={t.changes ?? 0} />

      <p className="text-xs text-muted">No tab, location or screen tracking.</p>

      {/* Interview guide: what to ask, what to listen for, what this is not. */}
      <section className="flex flex-col gap-3 border-t border-border pt-3">
        <p className={LABEL}>Interview guide</p>
        <SkillLine task={t} />
        <TaskNotes
          attemptId={attemptId}
          taskId={t.id}
          questions={questions}
          initialAsked={t.asked}
          initialNote={t.note}
        />
        <ListenFor items={t.good_looks_like} />
        <NotMeasure text={t.not_measure_note} />
      </section>
    </article>
  );
}

// The candidate's answer and a neutral fact about it. "Key" wording only for
// tasks with one right answer; "typical answer" is a guide, not a verdict.
function Comparison({ task: t }: { task: DetailTask }) {
  const parts = describeSim(t.format, t.payload, t.answer);
  const same = Boolean(t.matches_key);
  const label = compareLabel(t.key_kind, same);
  const chipClass = t.key_kind === "exact"
    ? same ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn"
    : t.key_kind === "typical" ? same ? "bg-info/15 text-info" : "border border-border text-muted" : "bg-fg/10 text-fg/70";
  const ordered = t.format === "triage";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        <p className={LABEL}>Answer</p>
        {ordered
          ? <ol className="flex flex-col gap-0.5 text-sm font-semibold">{parts.map((x) => <li key={x}>{x}</li>)}</ol>
          : <p className="text-base font-semibold">{joinSep(parts)}</p>}
      </div>
      <p>
        <span className={`inline-flex min-h-6 items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-semibold ${chipClass}`}>
          {t.key_kind === "exact" && (same
            ? <Check className="size-3.5" strokeWidth={2.75} aria-hidden />
            : <TriangleAlert className="size-3.5" strokeWidth={2.5} aria-hidden />)}
          {label}
        </span>
      </p>
      {!same && t.key_kind !== "none" && t.key !== null && (
        <div className="text-sm text-muted">
          <p>{t.key_kind === "exact" ? "Key" : "Typical answer (a guide only)"}:</p>
          {ordered
            ? <ol className="mt-0.5 flex flex-col text-fg">{describeSim(t.format, t.payload, t.key).map((x) => <li key={x}>{x}</li>)}</ol>
            : <p className="font-semibold text-fg">{joinSep(describeSim(t.format, t.payload, t.key))}</p>}
        </div>
      )}
    </div>
  );
}

// Expected vs spent, plus a bar scaled to 2x expected (the tick marks 1x).
// Colour is a reading aid only: green within expected, amber above 1.5x,
// grey under 3 s or when there is no answer to compare.
function TimeStrip({ expectedSec, timeMs, compare }: { expectedSec: number; timeMs: number | null; compare: boolean }) {
  const expectedMs = expectedSec * 1000;
  const spent = timeMs ?? 0;
  const tone = !compare || timeMs === null || spent < 3000
    ? { text: "text-muted", bar: "bg-muted" }
    : spent <= expectedMs
      ? { text: "text-ok", bar: "bg-ok" }
      : spent > expectedMs * 1.5
        ? { text: "text-warn", bar: "bg-warn" }
        : { text: "text-fg", bar: "bg-fg/60" };
  const fill = timeMs === null ? 0 : (Math.min(spent / expectedMs, 2) / 2) * 100;

  return (
    <div className="flex flex-col gap-2 bg-bg p-3">
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className={LABEL}>Expected</dt>
          <dd className="mt-0.5 text-xl font-bold tabular-nums leading-tight">≈ {formatDuration(expectedMs)}</dd>
        </div>
        <div className="text-right">
          <dt className={LABEL}>Spent</dt>
          <dd className={`mt-0.5 text-xl font-bold tabular-nums leading-tight ${tone.text}`}>{timeMs === null ? "–" : formatDuration(spent)}</dd>
        </div>
      </dl>
      <div aria-hidden className="relative h-1.5 rounded-pill bg-track">
        <div className={`h-full rounded-pill ${tone.bar}`} style={{ width: `${fill}%` }} />
        <div className="absolute -top-1 left-1/2 h-3.5 w-0.5 -translate-x-1/2 rounded-pill bg-fg/40" />
      </div>
    </div>
  );
}

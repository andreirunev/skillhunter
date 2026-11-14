import { notFound } from "next/navigation";
import { Check, Flag, TriangleAlert } from "lucide-react";
import { ActionBar } from "@/components/ActionBar";
import { CandidateStatusProvider, DetailTopBar } from "@/components/CandidateStatus";
import { FlagRow } from "@/components/Flags";
import { TaskNotes } from "@/components/TaskNotes";
import { AvatarTile } from "@/components/ui/ListRow";
import { getCandidate, getCompany, type DetailTask } from "@/lib/recruiter";
import { describeAnswer, GENERIC_FOLLOW_UPS, SKILLS, TYPE_LABELS } from "@/lib/tasks";
import { formatClock, formatDuration, formatMinutes, LANG_SHORT } from "@/lib/format";
import { TIME_LIMIT_MINUTES } from "@/lib/timing";

export const dynamic = "force-dynamic";

export default async function CandidatePage(props: PageProps<"/r/[slug]/a/[attemptId]">) {
  const { slug, attemptId } = await props.params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const data = await getCandidate(company.test_id, attemptId);
  if (!data) notFound();
  const { attempt, tasks } = data;

  const answered = tasks.filter((t) => t.answered).length;
  const flagCount = tasks.reduce((sum, t) => sum + t.flags.length, 0);

  return (
    <CandidateStatusProvider key={attempt.id} attemptId={attempt.id} status={attempt.status} code={attempt.invite_code}>
      <DetailTopBar backHref={`/r/${slug}`} name={attempt.avatar_name} />

      <div className="flex flex-col gap-3 pb-16 pt-4 lg:pb-12">
        {/* Timing summary: facts only, no verdict. */}
        <section className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
          <div className="flex items-center gap-2.5">
            <AvatarTile emoji={attempt.avatar_emoji} color={attempt.avatar_color} size={32} />
            <p className="min-w-0 truncate text-sm font-semibold">{attempt.avatar_name}</p>
            <span className="ml-auto shrink-0 text-[13px] text-muted">
              {LANG_SHORT[attempt.lang] ?? attempt.lang} · limit {TIME_LIMIT_MINUTES} min
            </span>
          </div>
          <dl className="grid grid-cols-3 gap-2">
            <Fact label={attempt.finished_at ? "Finished" : "In progress"}
              value={attempt.finished_at ? formatClock(attempt.finished_at) : `${answered}/${tasks.length}`} />
            <Fact label="Total time" value={attempt.finished_at ? formatMinutes(attempt.total_ms) : "–"}
              note={attempt.limit_reached ? "Limit reached" : undefined} />
            <Fact label="Expected" value={`≈ ${formatMinutes(company.expected_sec * 1000)}`} />
          </dl>
          <p className={`flex items-center gap-2 text-sm font-semibold ${flagCount ? "text-warn" : "text-muted"}`}>
            <Flag className="size-4 shrink-0" aria-hidden />
            {flagCount ? `${flagCount} flag${flagCount === 1 ? "" : "s"} · review below` : "No flags fired"}
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

// One task, top to bottom: header, question, answer (or a grey "not answered"
// block), time vs expected, flags, then the booth follow-up. Skipped or not
// answered tasks are never compared to the key.
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
  const empty = skipped ? "Skipped" : !finished ? "Not answered yet" : limitReached ? "Not answered · Time up" : "Not answered";

  return (
    <article className="flex flex-col gap-3 rounded-card border border-border bg-card p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-[2px] bg-fg/10 text-sm font-bold tabular-nums">{index + 1}</span>
        <p className="min-w-0 flex-1 text-sm font-semibold">{SKILLS[t.skill]} · {TYPE_LABELS[t.type]}</p>
        <span className={`inline-flex h-6 shrink-0 items-center rounded-pill px-2.5 text-xs font-semibold ${hasAnswer ? "border border-border text-muted" : "bg-fg/10 text-fg/70"}`}>
          {chip}
        </span>
      </div>

      <div>
        <h2 className="text-lg font-semibold leading-snug">{t.payload.prompt}</h2>
        {t.payload.emoji && <p className="mt-1.5 text-2xl leading-snug" aria-hidden>{t.payload.emoji}</p>}
        {t.payload.code && (
          <pre className="mt-2 overflow-x-auto rounded-tile border border-border bg-bg p-3 font-mono text-[13px] leading-relaxed">{t.payload.code}</pre>
        )}
      </div>

      {hasAnswer ? (
        <div className="flex flex-col gap-1.5">
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span className="text-base font-semibold">{describeAnswer(t.type, t.payload, t.answer)}</span>
            {t.matches_key ? (
              <span className="inline-flex h-6 items-center gap-1 rounded-pill bg-ok/15 px-2.5 text-xs font-semibold text-ok">
                <Check className="size-3.5" strokeWidth={2.75} aria-hidden />Matches key
              </span>
            ) : (
              <span className="inline-flex h-6 items-center gap-1 rounded-pill bg-warn/15 px-2.5 text-xs font-semibold text-warn">
                <TriangleAlert className="size-3.5" strokeWidth={2.5} aria-hidden />Differs from key
              </span>
            )}
          </p>
          {!t.matches_key && (
            <p className="text-sm text-muted">Key: <span className="font-semibold text-fg">{describeAnswer(t.type, t.payload, t.answer_key.value)}</span></p>
          )}
        </div>
      ) : (
        <p className="rounded-tile bg-fg/10 px-3 py-3.5 text-base font-bold uppercase tracking-[0.06em] text-fg/70">{empty}</p>
      )}

      <TimeStrip expectedSec={t.expected_sec} timeMs={t.time_ms} compare={hasAnswer} />

      <FlagRow flags={t.flags} changes={t.changes ?? 0} />

      <p className="text-xs text-muted">Page switching is not tracked.</p>

      {hasAnswer ? (
        <TaskNotes
          attemptId={attemptId}
          taskId={t.id}
          questions={[...t.follow_ups, ...GENERIC_FOLLOW_UPS]}
          initialAsked={t.asked}
          initialNote={t.note}
        />
      ) : (
        <p className="rounded-tile border border-dashed border-border p-3 text-sm text-muted">No answer to discuss</p>
      )}
    </article>
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
    <div className="flex flex-col gap-2 rounded-tile bg-bg p-3">
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

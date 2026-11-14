import { notFound } from "next/navigation";
import { Check, Flag, TriangleAlert } from "lucide-react";
import { ActionBar } from "@/components/ActionBar";
import { CandidateStatusProvider, DetailTopBar } from "@/components/CandidateStatus";
import { FlagRow } from "@/components/Flags";
import { TaskNotes } from "@/components/TaskNotes";
import { AvatarTile } from "@/components/ui/ListRow";
import { getCandidate, getCompany, type DetailTask } from "@/lib/recruiter";
import { OWN_PACE_NOTE } from "@/lib/flags";
import { describeAnswer, GENERIC_FOLLOW_UPS, SKILLS, TYPE_LABELS } from "@/lib/tasks";
import { formatClock, formatDuration, formatMinutes, LANG_SHORT } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CandidatePage(props: PageProps<"/r/[slug]/a/[attemptId]">) {
  const { slug, attemptId } = await props.params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const data = await getCandidate(company.test_id, attemptId);
  if (!data) notFound();
  const { attempt, tasks } = data;

  const totalMs = tasks.reduce((sum, t) => sum + (t.time_ms ?? 0), 0);
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
              {LANG_SHORT[attempt.lang] ?? attempt.lang}{attempt.own_pace && " · own pace"}
            </span>
          </div>
          <dl className="grid grid-cols-3 gap-2">
            <Fact label={attempt.finished_at ? "Finished" : "In progress"}
              value={attempt.finished_at ? formatClock(attempt.finished_at) : `${answered}/${tasks.length}`} />
            <Fact label="Total time" value={formatMinutes(totalMs)} />
            <Fact label="Expected" value={`≈ ${formatMinutes(company.expected_sec * 1000)}`} />
          </dl>
          <p className={`flex items-center gap-2 text-sm font-semibold ${flagCount ? "text-warn" : "text-muted"}`}>
            <Flag className="size-4 shrink-0" aria-hidden />
            {flagCount ? `${flagCount} flag${flagCount === 1 ? "" : "s"} · review below` : "No flags fired"}
          </p>
          <p className="text-[13px] text-muted">
            Flags are three plain rules (very fast, took longer, changed 3+ times), not AI. They never lower anything.
          </p>
          {attempt.own_pace && <p className="rounded-tile bg-ok/10 p-2.5 text-[13px] font-medium text-ok">{OWN_PACE_NOTE}</p>}
        </section>

        {tasks.map((t, i) => (
          <TaskCard key={t.id} task={t} index={i} attemptId={attempt.id} />
        ))}
      </div>

      <ActionBar />
    </CandidateStatusProvider>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-2xl font-bold tabular-nums leading-tight">{value}</dd>
    </div>
  );
}

// One task: flags first (always open), the question, the answer with a key
// badge, time vs expected, then the booth follow-up.
function TaskCard({ task: t, index, attemptId }: { task: DetailTask; index: number; attemptId: string }) {
  const skipped = t.answered && t.answer === null;
  return (
    <article className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-tile bg-fg/10 text-sm font-bold tabular-nums">{index + 1}</span>
        <p className="text-sm font-semibold">{SKILLS[t.skill]} · {TYPE_LABELS[t.type]}</p>
      </div>

      {t.answered && !skipped && <FlagRow flags={t.flags} changes={t.changes ?? 0} />}

      <div>
        <h2 className="text-lg font-semibold leading-snug">{t.payload.prompt}</h2>
        {t.payload.emoji && <p className="mt-1.5 text-2xl leading-snug" aria-hidden>{t.payload.emoji}</p>}
        {t.payload.code && (
          <pre className="mt-2 overflow-x-auto rounded-tile border border-border bg-bg p-3 font-mono text-[13px] leading-relaxed">{t.payload.code}</pre>
        )}
      </div>

      {!t.answered ? (
        <p className="text-sm text-muted">Not answered yet.</p>
      ) : skipped ? (
        <p className="text-sm text-muted">Skipped · {formatDuration(t.time_ms ?? 0)} on screen</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
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
            <p className="text-sm text-muted">Key: {describeAnswer(t.type, t.payload, t.answer_key.value)}</p>
          )}
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span>{formatDuration(t.time_ms ?? 0)} <span className="text-muted">of ≈ {t.expected_sec} s expected</span></span>
            {(t.changes ?? 0) > 0 && (
              <span className="inline-flex h-5 items-center rounded-pill bg-fg/10 px-2 text-[11px] font-semibold text-muted">Changed {t.changes}×</span>
            )}
          </p>
        </div>
      )}

      <TaskNotes
        attemptId={attemptId}
        taskId={t.id}
        questions={[...t.follow_ups, ...GENERIC_FOLLOW_UPS]}
        initialAsked={t.asked}
        initialNote={t.note}
      />
    </article>
  );
}

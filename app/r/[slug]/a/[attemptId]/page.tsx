import { notFound } from "next/navigation";
import { Equal, EqualNot, Timer } from "lucide-react";
import { ActionBar } from "@/components/ActionBar";
import { CandidateStatusProvider, DetailTopBar } from "@/components/CandidateStatus";
import { FlagLegend, FlagList } from "@/components/Flags";
import { TaskNotes } from "@/components/TaskNotes";
import { AvatarTile } from "@/components/ui/ListRow";
import { getCandidate, getCompany, type DetailTask } from "@/lib/recruiter";
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
  const sub = [
    attempt.finished_at ? `Finished ${formatClock(attempt.finished_at)}` : `In progress · ${answered}/${tasks.length}`,
    formatMinutes(totalMs),
    LANG_SHORT[attempt.lang] ?? attempt.lang,
  ].join(" · ");

  return (
    <CandidateStatusProvider key={attempt.id} attemptId={attempt.id} status={attempt.status} code={attempt.invite_code}>
      <DetailTopBar backHref={`/r/${slug}`} name={attempt.avatar_name} />

      <div className="flex flex-col gap-3 pb-16 pt-4 lg:pb-12">
        <header className="flex items-center gap-4 pb-1">
          <AvatarTile emoji={attempt.avatar_emoji} color={attempt.avatar_color} size={64} />
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-bold leading-tight tracking-tight">{attempt.avatar_name}</h1>
            <p className="mt-1 text-[13px] text-muted">{sub}</p>
            <p className="text-[13px] text-muted">
              Expected ≈ {formatMinutes(company.expected_sec * 1000)}{attempt.own_pace && " · own pace"}
            </p>
          </div>
        </header>

        <FlagLegend ownPace={attempt.own_pace} />

        {tasks.map((t, i) => (
          <TaskCard key={t.id} task={t} index={i} attemptId={attempt.id} />
        ))}
      </div>

      <ActionBar />
    </CandidateStatusProvider>
  );
}

// Neutral facts per task: answer, key match, time vs expected, flags, follow-ups.
function TaskCard({ task: t, index, attemptId }: { task: DetailTask; index: number; attemptId: string }) {
  const skipped = t.answered && t.answer === null;
  return (
    <article className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-tile bg-fg/10 text-sm font-bold tabular-nums">{index + 1}</span>
        <div className="min-w-0">
          <h2 className="font-semibold leading-snug">{t.payload.title}</h2>
          <p className="text-xs text-muted">{SKILLS[t.skill]} · {TYPE_LABELS[t.type]}</p>
        </div>
      </div>
      <p className="text-sm text-muted">{t.payload.prompt}</p>

      {!t.answered ? (
        <p className="text-sm text-muted">Not answered yet.</p>
      ) : (
        <>
          <div className="rounded-tile bg-bg/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Their answer</p>
            <p className="mt-1 font-semibold">{skipped ? "Skipped" : describeAnswer(t.type, t.payload, t.answer)}</p>
          </div>
          <ul className="flex flex-col gap-1.5 text-sm">
            {!skipped && (
              <li className="flex items-start gap-2">
                {t.matches_key
                  ? <Equal className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                  : <EqualNot className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />}
                <span>
                  {t.matches_key ? "Matches company key" : "Differs from key"}
                  {!t.matches_key && (
                    <span className="text-muted"> · key: {describeAnswer(t.type, t.payload, t.answer_key.value)}</span>
                  )}
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <Timer className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
              <span>
                {formatDuration(t.time_ms ?? 0)} <span className="text-muted">· expected ≈ {t.expected_sec} s</span>
                {(t.changes ?? 0) > 0 && <span className="text-muted"> · changed {t.changes}×</span>}
              </span>
            </li>
          </ul>
          <FlagList flags={t.flags} />
        </>
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { AvatarBadge } from "@/components/Avatar";
import { ActionBar } from "@/components/ActionBar";
import { FlagLegend, FlagList } from "@/components/Flags";
import { TaskNotes } from "@/components/TaskNotes";
import { getCandidate, getCompany } from "@/lib/recruiter";
import { describeAnswer, GENERIC_FOLLOW_UPS, SKILLS, TYPE_LABELS } from "@/lib/tasks";
import { formatClock, formatDuration, LANG_SHORT, STATUS_LABELS } from "@/lib/format";

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

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="h-1.5" style={{ background: company.color }} />
        <div className="mx-auto max-w-2xl px-4 py-3">
          <Link href={`/r/${slug}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-700">← All candidates</Link>
          <div className="mt-2 flex items-center gap-3">
            <AvatarBadge emoji={attempt.avatar_emoji} color={attempt.avatar_color} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{attempt.avatar_name}</h1>
              <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold ${STATUS_LABELS[attempt.status].className}`}>
                {STATUS_LABELS[attempt.status].label}
              </span>
              <p className="mt-1.5 text-sm text-slate-600">
                {attempt.finished_at ? `Finished ${formatClock(attempt.finished_at)}` : `In progress · ${answered}/${tasks.length}`}
                {" · "}{formatDuration(totalMs)} <span className="text-slate-400">(expected ≈ {formatDuration(company.expected_sec * 1000)})</span>
                {" · "}{LANG_SHORT[attempt.lang] ?? attempt.lang}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pb-40 pt-4">
        <FlagLegend ownPace={attempt.own_pace} />

        {tasks.map((t, i) => (
          <article key={t.id} className="flex flex-col gap-3 border border-slate-200 bg-white p-4">
            <div>
              <h2 className="font-bold">{i + 1}. {t.payload.title}</h2>
              <p className="text-xs text-slate-500">{SKILLS[t.skill]} · {TYPE_LABELS[t.type]}</p>
            </div>
            <p className="text-sm text-slate-600">{t.payload.prompt}</p>

            {!t.answered ? (
              <p className="text-sm text-slate-500">Not answered yet.</p>
            ) : (
              <>
                <div className="border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Their answer</p>
                  <p className="mt-1 font-semibold">{describeAnswer(t.type, t.payload, t.answer)}</p>
                </div>
                <p className="text-sm text-slate-700">
                  {t.answer === null ? "Skipped" : t.matches_key ? "Matches company key" : "Differs from key"}
                  {" · "}{formatDuration(t.time_ms ?? 0)} <span className="text-slate-400">of ≈ {t.expected_sec} s</span>
                  {(t.changes ?? 0) > 0 && ` · changed ${t.changes}×`}
                </p>
                {t.answer !== null && !t.matches_key && (
                  <p className="text-sm text-slate-500">Company key: {describeAnswer(t.type, t.payload, t.answer_key.value)}</p>
                )}
                <FlagList flags={t.flags} />
              </>
            )}

            <TaskNotes
              attemptId={attempt.id}
              taskId={t.id}
              questions={[...t.follow_ups, ...GENERIC_FOLLOW_UPS]}
              initialAsked={t.asked}
              initialNote={t.note}
            />
          </article>
        ))}
      </main>

      <ActionBar key={attempt.id} attemptId={attempt.id} status={attempt.status} inviteCode={attempt.invite_code} />
    </div>
  );
}

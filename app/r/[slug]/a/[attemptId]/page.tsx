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
      <header className="bg-white shadow-sm ring-1 ring-slate-200">
        <div className="h-1.5" style={{ background: company.color }} />
        <div className="mx-auto max-w-2xl px-5 py-4">
          <Link href={`/r/${slug}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-700">← All candidates</Link>
          <div className="mt-2 flex items-center gap-4">
            <AvatarBadge emoji={attempt.avatar_emoji} color={attempt.avatar_color} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{attempt.avatar_name}</h1>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_LABELS[attempt.status].className}`}>
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

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-5 pb-56 pt-5">
        <FlagLegend ownPace={attempt.own_pace} />

        {tasks.map((t, i) => (
          <article key={t.id} className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{i + 1}</span>
              <h2 className="font-bold">{t.payload.title}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{SKILLS[t.skill]}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{TYPE_LABELS[t.type]}</span>
            </div>
            <p className="text-sm text-slate-500">{t.payload.prompt}</p>

            {!t.answered ? (
              <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">Not answered yet.</p>
            ) : (
              <>
                <div className="rounded-2xl bg-brand-50/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Their answer</p>
                  <p className="mt-1 font-semibold">{describeAnswer(t.type, t.payload, t.answer)}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {t.answer === null ? (
                    <span className="rounded-xl bg-slate-100 px-3 py-1.5 font-medium text-slate-600">⤼ Skipped</span>
                  ) : t.matches_key ? (
                    <span className="rounded-xl bg-slate-100 px-3 py-1.5 font-medium text-slate-700">= Matches company key</span>
                  ) : (
                    <span className="rounded-xl bg-slate-100 px-3 py-1.5 font-medium text-slate-700">≠ Differs from key</span>
                  )}
                  <span className="rounded-xl bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
                    ⏱️ {formatDuration(t.time_ms ?? 0)} <span className="text-slate-400">/ ≈ {t.expected_sec} s</span>
                  </span>
                  {(t.changes ?? 0) > 0 && (
                    <span className="rounded-xl bg-slate-100 px-3 py-1.5 font-medium text-slate-700">✎ changed {t.changes}×</span>
                  )}
                </div>
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

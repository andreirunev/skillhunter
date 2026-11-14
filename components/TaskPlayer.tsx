"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TaskInput } from "@/components/TaskInputs";
import { AvatarBadge } from "@/components/Avatar";
import { isAnswered, type Answer } from "@/lib/tasks";
import { t, type MessageKey } from "@/lib/i18n";
import type { PlayerAttempt, PlayerTask, SavedAnswer } from "@/lib/data";

type Props = { attempt: PlayerAttempt; tasks: PlayerTask[]; saved: SavedAnswer[] };

export function TaskPlayer({ attempt, tasks, saved }: Props) {
  const router = useRouter();
  const lang = attempt.lang;
  const savedById = Object.fromEntries(saved.map((s) => [s.task_id, s]));

  const [index, setIndex] = useState(() => {
    const firstOpen = tasks.findIndex((task) => !savedById[task.id]);
    return firstOpen === -1 ? tasks.length - 1 : firstOpen;
  });
  const [answers, setAnswers] = useState<Record<string, Answer | undefined>>(() =>
    Object.fromEntries(saved.map((s) => [s.task_id, s.answer ?? undefined])));
  const [changes, setChanges] = useState<Record<string, number>>(() =>
    Object.fromEntries(saved.map((s) => [s.task_id, s.changes])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  // Time on each task accumulates across visits; only time on screen counts.
  const timeMs = useRef<Record<string, number>>(Object.fromEntries(saved.map((s) => [s.task_id, s.time_ms])));
  const lastSaved = useRef<Record<string, Answer | undefined>>(Object.fromEntries(saved.map((s) => [s.task_id, s.answer ?? undefined])));
  const enteredAt = useRef(0);
  useEffect(() => {
    enteredAt.current = performance.now();
  }, [index]);

  const task = tasks[index];
  const value = answers[task.id];
  const answered = value !== undefined && isAnswered(task.type, task.payload, value);
  const isLast = index === tasks.length - 1;

  function elapsed() {
    const now = performance.now();
    const ms = now - enteredAt.current;
    enteredAt.current = now;
    return ms;
  }

  async function save(answer: Answer): Promise<boolean> {
    const total = (timeMs.current[task.id] ?? 0) + elapsed();
    timeMs.current[task.id] = total;
    // A typed number counts as changed when it differs from an earlier saved value.
    const prev = lastSaved.current[task.id];
    const numberRevision = task.type === "number" && prev !== undefined && prev !== null && prev !== answer;
    const changeCount = (changes[task.id] ?? 0) + (numberRevision ? 1 : 0);
    if (numberRevision) setChanges((c) => ({ ...c, [task.id]: changeCount }));

    setBusy(true);
    setError(false);
    const res = await fetch(`/api/attempts/${attempt.id}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, answer, timeMs: total, changes: changeCount }),
    }).catch(() => null);
    setBusy(false);
    if (res?.status === 409) {
      router.replace(`/t/${attempt.id}/done`);
      return false;
    }
    if (!res?.ok) {
      setError(true);
      return false;
    }
    lastSaved.current[task.id] = answer ?? undefined;
    return true;
  }

  async function goNext(answer: Answer) {
    if (!(await save(answer))) return;
    if (!isLast) {
      setIndex(index + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    setBusy(true);
    await fetch(`/api/attempts/${attempt.id}/finish`, { method: "POST" }).catch(() => null);
    router.replace(`/t/${attempt.id}/done`);
  }

  async function goBack() {
    if (answered) {
      if (!(await save(value as Answer))) return;
    } else {
      timeMs.current[task.id] = (timeMs.current[task.id] ?? 0) + elapsed();
    }
    setIndex(index - 1);
    window.scrollTo({ top: 0 });
  }

  function onChange(next: Answer | undefined, revision: boolean) {
    setAnswers((a) => ({ ...a, [task.id]: next }));
    if (revision) setChanges((c) => ({ ...c, [task.id]: (c[task.id] ?? 0) + 1 }));
  }

  const progress = Math.round(((index + (answered ? 1 : 0)) / tasks.length) * 100);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[#f3f6fb] px-4 pb-3 pt-3">
        <div className="flex items-center gap-3">
          <AvatarBadge emoji={attempt.avatar_emoji} color={attempt.avatar_color} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{attempt.company_name}</p>
            <p className="text-xs text-slate-500">{t(lang, "progress", { i: index + 1, n: tasks.length })}</p>
          </div>
          {attempt.own_pace && (
            <span className="text-xs font-semibold text-slate-600">{t(lang, "ownPaceChip")}</span>
          )}
        </div>
        <div className="mt-3 h-2 overflow-hidden bg-slate-200" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-slate-900" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3 px-4 pb-32 pt-3">
        <section className="border border-slate-200 bg-white p-4">
          {task.payload.emoji && <div className="mb-3 text-center text-4xl leading-tight" aria-hidden>{task.payload.emoji}</div>}
          <h1 className="text-xl font-bold leading-snug">{task.payload.prompt}</h1>
          {task.payload.code && (
            <pre className="mt-4 overflow-x-auto bg-slate-900 p-4 font-mono text-sm leading-relaxed text-slate-100">{task.payload.code}</pre>
          )}
          <p className="mt-3 text-sm font-medium text-slate-500">{t(lang, `hint_${task.type}` as MessageKey)}</p>
        </section>

        <TaskInput key={task.id} type={task.type} payload={task.payload} value={value} onChange={onChange} lang={lang} />
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-300 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-md">
          {error && <p className="mb-2 text-center text-sm font-medium text-red-700" role="alert">{t(lang, "saveError")}</p>}
          <div className="flex items-center gap-3">
            {index > 0 && (
              <button type="button" onClick={goBack} disabled={busy}
                className="btn btn-secondary min-h-14 px-4 text-base">
                ← {t(lang, "back")}
              </button>
            )}
            {answered ? (
              <button type="button" onClick={() => goNext(value as Answer)} disabled={busy}
                className="btn btn-primary min-h-14 flex-1 text-lg">
                {busy ? "…" : isLast ? `${t(lang, "finish")} ✓` : `${t(lang, "next")} →`}
              </button>
            ) : (
              <button type="button" onClick={() => goNext(null)} disabled={busy}
                className="btn btn-secondary min-h-14 flex-1 text-base text-slate-600">
                {t(lang, "skip")} {isLast ? "✓" : "→"}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

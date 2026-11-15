"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/CandidateShell";
import { SimTaskView } from "@/components/SimInputs";
import { FlagMini } from "@/components/FlagLoader";
import type { Answer } from "@/lib/tasks";
import { isAnsweredSim, type PlayerTask, type QuickPayload } from "@/lib/sim";
import { t } from "@/lib/i18n";
import type { PlayerAttempt, SavedAnswer } from "@/lib/data";

type Props = { attempt: PlayerAttempt; tasks: PlayerTask[]; saved: SavedAnswer[] };

const clock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export function TaskPlayer({ attempt, tasks, saved }: Props) {
  const router = useRouter();
  const lang = useLang();
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

  // Countdown to the server deadline (started_at + limit), counted from the
  // server's remaining time so the phone's clock does not matter. The server
  // enforces the limit; this only shows it and leaves when it has passed.
  const [leftMs, setLeftMs] = useState(attempt.remaining_ms);
  useEffect(() => {
    const endAt = Date.now() + attempt.remaining_ms;
    const timer = setInterval(() => {
      const left = endAt - Date.now();
      setLeftMs(Math.max(0, left));
      if (left < -1500) {
        clearInterval(timer);
        router.replace(`/t/${attempt.id}/done`);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [attempt.id, attempt.remaining_ms, router]);

  // Time on each task accumulates across visits; only time on screen counts.
  const timeMs = useRef<Record<string, number>>(Object.fromEntries(saved.map((s) => [s.task_id, s.time_ms])));
  const lastSaved = useRef<Record<string, Answer | undefined>>(Object.fromEntries(saved.map((s) => [s.task_id, s.answer ?? undefined])));
  const enteredAt = useRef(0);
  useEffect(() => {
    enteredAt.current = performance.now();
  }, [index]);

  const task = tasks[index];
  const value = answers[task.id];
  const answered = value !== undefined && isAnsweredSim(task.format, task.payload, value);
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
    const isNumber = task.format === "quick_logic" && (task.payload as QuickPayload).kind === "number";
    const numberRevision = isNumber && prev !== undefined && prev !== null && prev !== answer;
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
  // Unanswered: the forward button skips (saves "no answer") and looks secondary.
  const forwardLabel = answered ? t(lang, isLast ? "finish" : "next") : t(lang, "skip");

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between text-[13px] font-semibold text-muted">
          <span>{t(lang, "progress", { i: index + 1, n: tasks.length })}</span>
          <span role="timer" className={`tabular-nums ${leftMs < 120_000 ? "text-warn" : ""}`}>
            {t(lang, "timeLeft", { time: clock(leftMs) })}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-pill bg-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-pill bg-accent transition-[width] duration-150" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Keyed by task: each new task fades in (150ms). */}
      <main key={task.id} className="flex flex-1 animate-fade flex-col gap-4 px-4 pb-32 pt-5">
        <SimTaskView task={task} value={value} onChange={onChange} lang={lang} />
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-bg px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-md">
          {error && <p className="mb-2 text-center text-sm font-medium text-bad" role="alert">{t(lang, "saveError")}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={goBack} disabled={busy || index === 0}
              className="ui-btn ui-btn-secondary min-h-14 text-base">
              {t(lang, "back")}
            </button>
            <button type="button" onClick={() => goNext(answered ? (value as Answer) : null)} disabled={busy} aria-busy={busy}
              className={`ui-btn min-h-14 text-base ${answered ? "ui-btn-primary" : "ui-btn-secondary"}`}>
              {busy ? <><FlagMini />{t(lang, "saving")}</> : forwardLabel}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

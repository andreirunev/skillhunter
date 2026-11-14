"use client";

import { useState } from "react";

// Follow-up at the booth: suggested questions, an "asked" tick and a short note.
export function TaskNotes({ attemptId, taskId, questions, initialAsked, initialNote }: {
  attemptId: string;
  taskId: string;
  questions: string[];
  initialAsked: boolean;
  initialNote: string;
}) {
  const [asked, setAsked] = useState(initialAsked);
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(nextAsked: boolean, nextNote: string) {
    setSaved("saving");
    const res = await fetch(`/api/attempts/${attemptId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, asked: nextAsked, note: nextNote }),
    }).catch(() => null);
    setSaved(res?.ok ? "saved" : "error");
  }

  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ask at the booth</p>
      <ul className="mt-1.5 space-y-1 text-sm text-slate-800">
        {questions.map((q) => <li key={q}>💬 {q}</li>)}
      </ul>
      <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={asked}
          onChange={(e) => {
            setAsked(e.target.checked);
            save(e.target.checked, note);
          }}
          className="h-5 w-5 accent-brand-700"
        />
        Asked and discussed
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => note !== initialNote && save(asked, note)}
        rows={2}
        maxLength={2000}
        placeholder="Note (what they explained)…"
        className="mt-1 w-full resize-y rounded-xl border border-slate-200 bg-white p-2.5 text-sm outline-none focus:border-brand-600"
      />
      {saved !== "idle" && (
        <p className={`text-xs ${saved === "error" ? "text-red-700" : "text-slate-500"}`}>
          {saved === "saving" ? "Saving…" : saved === "saved" ? "Saved" : "Could not save"}
        </p>
      )}
    </div>
  );
}

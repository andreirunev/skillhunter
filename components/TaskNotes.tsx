"use client";

import { useState } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { toast } from "@/components/ui/Toast";

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
  const [saved, setSaved] = useState<"idle" | "saving" | "error">("idle");

  async function save(nextAsked: boolean, nextNote: string) {
    setSaved("saving");
    const res = await fetch(`/api/attempts/${attemptId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, asked: nextAsked, note: nextNote }),
    }).catch(() => null);
    setSaved(res?.ok ? "idle" : "error");
    if (res?.ok) toast("Saved", 2000);
  }

  return (
    <div className="flex flex-col gap-3 rounded-tile border border-border p-3">
      <p className="text-sm font-semibold">Ask at the booth</p>
      <ul className="flex flex-col gap-2 text-sm">
        {questions.map((q) => (
          <li key={q} className="flex gap-2">
            <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />{q}
          </li>
        ))}
      </ul>
      <label className="flex min-h-9 cursor-pointer items-center gap-2 self-start text-[13px] font-medium text-muted">
        <input
          type="checkbox"
          checked={asked}
          onChange={(e) => {
            setAsked(e.target.checked);
            save(e.target.checked, note);
          }}
          className="size-4 accent-accent"
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
        className="w-full resize-y rounded-tile border border-border bg-bg p-2.5 text-base text-fg outline-none placeholder:text-muted focus:border-fg/40"
      />
      {saved !== "idle" && (
        <p className={`flex items-center gap-1.5 text-xs ${saved === "error" ? "text-bad" : "text-muted"}`}>
          {saved === "saving" ? <><Spinner />Saving…</> : "Could not save"}
        </p>
      )}
    </div>
  );
}

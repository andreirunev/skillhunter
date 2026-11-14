"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABELS } from "@/lib/format";

type Saved = { status: string; code: string | null };
type Action = { status: string; label: string };

const NOT_NOW = { status: "not_now", label: "Not now" };
const REVIEW = { status: "needs_review", label: "Review" };
const GOOD_FIT = { status: "good_fit", label: "Good fit" };
const INVITE = { status: "invited", label: "Invite to booth" };
const ARRIVED = { status: "at_booth", label: "Arrived" };
const INTERVIEW = { status: "interview", label: "Interview" };

// The next step of the booth flow sits on the right as the primary button.
function primaryFor(view: Saved): Action {
  if (!view.code) return INVITE;
  return view.status === "invited" ? ARRIVED : INTERVIEW;
}

// Fixed bottom bar: every label on a person is set here, by a human, one tap
// each. It shows the saved result straight from the API response, so it never
// waits for the (slower) page refresh. Keyed by attempt id in the parent.
export function ActionBar({ attemptId, status, inviteCode }: { attemptId: string; status: string; inviteCode: string | null }) {
  const router = useRouter();
  const [view, setView] = useState<Saved>({ status, code: inviteCode });
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function set(next: string) {
    setSaving(next);
    setMessage(null);
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 15_000);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
        signal: abort.signal,
      });
      const data: Partial<Saved> & { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.status !== "string") {
        setMessage({ kind: "error", text: `Could not save (${data.error ?? `HTTP ${res.status}`}). Tap again.` });
        return;
      }
      setView({ status: data.status, code: data.code ?? null });
      setMessage({ kind: "ok", text: `Saved: ${STATUS_LABELS[data.status]?.label ?? data.status}` });
      setTimeout(() => setMessage((m) => (m?.kind === "ok" ? null : m)), 2500);
      router.refresh(); // updates the header chip and the list in the background
    } catch {
      setMessage({
        kind: "error",
        text: abort.signal.aborted ? "No answer from the server. Check the connection and tap again." : "Network error. Check the connection and tap again.",
      });
    } finally {
      clearTimeout(timer);
      setSaving(null);
    }
  }

  const busy = saving !== null;
  const primary = primaryFor(view);
  const more = primary === INTERVIEW ? [] : [INTERVIEW];
  const info = busy
    ? "Saving…"
    : message?.text ?? (view.code ? `Booth code ${view.code}` : "Your call. Nothing is decided automatically.");

  const button = (a: Action, kind: "primary" | "secondary") => {
    const on = view.status === a.status;
    return (
      <button key={a.status} type="button" onClick={() => set(a.status)} disabled={busy} aria-pressed={on}
        className={`btn w-full px-1 ${kind === "primary" ? "btn-primary" : "btn-secondary"} ${on && kind === "secondary" ? "border-slate-900 bg-slate-100 font-bold" : ""}`}>
        {saving === a.status ? "Saving…" : on ? `✓ ${a.label}` : a.label}
      </button>
    );
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-300 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        <div className="flex min-h-11 items-center gap-2">
          <p aria-live="polite" className={`min-w-0 flex-1 text-sm ${
            message?.kind === "error" ? "font-semibold text-red-700" : view.code && !busy && !message ? "font-semibold text-slate-900" : "text-slate-600"
          }`}>
            {info}
          </p>
          {more.map((a) => <div key={a.status} className="w-1/4 shrink-0">{button(a, "secondary")}</div>)}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[NOT_NOW, REVIEW, GOOD_FIT].map((a) => button(a, "secondary"))}
          {button(primary, "primary")}
        </div>
      </div>
    </div>
  );
}

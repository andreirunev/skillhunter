"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABELS } from "@/lib/format";

const DECISIONS = [
  { status: "good_fit", emoji: "👍", label: "Good fit", sub: "my call" },
  { status: "needs_review", emoji: "🔎", label: "Review", sub: "later" },
  { status: "interview", emoji: "🤝", label: "Interview", sub: "offered" },
  { status: "not_now", emoji: "⏸️", label: "Not now", sub: "" },
];

type Saved = { status: string; code: string | null };

// Sticky bar: every label on a person is set here, by a human, one tap each.
// The bar shows the saved result straight from the API response, so it never
// waits for the (slower) page refresh. The parent keys it by attempt id so the
// state resets when another candidate is opened.
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
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        <p aria-live="polite" className={`min-h-5 text-center text-sm font-semibold ${
          message?.kind === "error" ? "text-red-700" : busy ? "text-slate-600" : "text-leaf-700"
        }`}>
          {busy ? "Saving…" : message?.text ?? ""}
        </p>
        {view.code ? (
          <div className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-brand-50 px-4">
            <span className="text-sm font-semibold text-brand-800">📍 Invited · code <span className="font-mono text-base">{view.code}</span></span>
            {view.status !== "at_booth" && (
              <button type="button" onClick={() => set("at_booth")} disabled={busy}
                className="min-h-10 rounded-xl bg-white px-3 text-sm font-semibold text-brand-800 ring-1 ring-brand-600/30 disabled:opacity-60">
                {saving === "at_booth" ? "Saving…" : "Arrived ✓"}
              </button>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => set("invited")} disabled={busy}
            className="min-h-12 rounded-2xl bg-brand-700 text-base font-bold text-white shadow-md shadow-brand-700/20 active:scale-[0.99] disabled:opacity-60">
            {saving === "invited" ? "Saving…" : "📍 Invite to booth"}
          </button>
        )}
        <div className="grid grid-cols-4 gap-2">
          {DECISIONS.map((d) => {
            const on = view.status === d.status;
            return (
              <button key={d.status} type="button" onClick={() => set(d.status)} disabled={busy} aria-pressed={on}
                className={`flex min-h-14 flex-col items-center justify-center rounded-xl text-xs font-semibold leading-tight transition disabled:opacity-60 ${
                  on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 active:bg-slate-200"
                }`}>
                <span className="text-base" aria-hidden>{saving === d.status ? "⏳" : d.emoji}</span>
                {saving === d.status ? "Saving…" : d.label}
                {d.sub && saving !== d.status && <span className={`font-normal ${on ? "text-white/70" : "text-slate-500"}`}>{d.sub}</span>}
              </button>
            );
          })}
        </div>
        <p className="text-center text-[11px] text-slate-500">Your decision, stored as a human label. SkillScan never labels people automatically.</p>
      </div>
    </div>
  );
}

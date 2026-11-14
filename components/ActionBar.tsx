"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DECISIONS = [
  { status: "good_fit", emoji: "👍", label: "Good fit", sub: "my call" },
  { status: "needs_review", emoji: "🔎", label: "Review", sub: "later" },
  { status: "interview", emoji: "🤝", label: "Interview", sub: "offered" },
  { status: "not_now", emoji: "⏸️", label: "Not now", sub: "" },
];

// Sticky bar: every label on a person is set here, by a human, one tap each.
export function ActionBar({ attemptId, status, inviteCode }: { attemptId: string; status: string; inviteCode: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function set(next: string) {
    setBusy(next);
    setError(false);
    const res = await fetch(`/api/attempts/${attemptId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    }).catch(() => null);
    setBusy(null);
    if (!res?.ok) setError(true);
    router.refresh();
  }

  const invited = Boolean(inviteCode);
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        {error && <p className="text-center text-sm font-medium text-red-700" role="alert">Could not save. Try again.</p>}
        {invited ? (
          <div className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-brand-50 px-4">
            <span className="text-sm font-semibold text-brand-800">📍 Invited · code <span className="font-mono text-base">{inviteCode}</span></span>
            {status !== "at_booth" && (
              <button type="button" onClick={() => set("at_booth")} disabled={busy !== null}
                className="min-h-10 rounded-xl bg-white px-3 text-sm font-semibold text-brand-800 ring-1 ring-brand-600/30">
                {busy === "at_booth" ? "…" : "Arrived ✓"}
              </button>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => set("invited")} disabled={busy !== null}
            className="min-h-12 rounded-2xl bg-brand-700 text-base font-bold text-white shadow-md shadow-brand-700/20 active:scale-[0.99] disabled:opacity-60">
            {busy === "invited" ? "…" : "📍 Invite to booth"}
          </button>
        )}
        <div className="grid grid-cols-4 gap-2">
          {DECISIONS.map((d) => {
            const on = status === d.status;
            return (
              <button key={d.status} type="button" onClick={() => set(d.status)} disabled={busy !== null} aria-pressed={on}
                className={`flex min-h-14 flex-col items-center justify-center rounded-xl text-xs font-semibold leading-tight transition ${
                  on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 active:bg-slate-200"
                }`}>
                <span className="text-base" aria-hidden>{busy === d.status ? "…" : d.emoji}</span>
                {d.label}
                {d.sub && <span className={`font-normal ${on ? "text-white/70" : "text-slate-500"}`}>{d.sub}</span>}
              </button>
            );
          })}
        </div>
        <p className="text-center text-[11px] text-slate-500">Your decision, stored as a human label. SkillScan never labels people automatically.</p>
      </div>
    </div>
  );
}

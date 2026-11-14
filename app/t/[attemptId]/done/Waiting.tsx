"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/CandidateShell";
import { t } from "@/lib/i18n";

type Invitation = { code: string };
type Props = { attemptId: string; booth: string; timeUp: boolean; initial: Invitation | null };

const POLL_MS = 5000;
const STEPS = ["stepBooth", "stepShow", "stepAsk"] as const;

// Finish screen. No score, no verdict: only "saved", then an invitation if a
// recruiter sends one.
export function Waiting({ attemptId, booth, timeUp, initial }: Props) {
  const lang = useLang();
  const [invitation, setInvitation] = useState<Invitation | null>(initial);

  // Polls only for "invited or not". The candidate never sees labels or notes.
  useEffect(() => {
    if (invitation) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/attempts/${attemptId}/invitation`, { cache: "no-store" }).catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if (data?.invited) setInvitation({ code: data.code });
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [attemptId, invitation]);

  if (invitation) {
    // Keyed so it mounts fresh and fades in (200ms) when the poll brings it.
    return (
      <main key="invited" className="mx-auto flex w-full max-w-md flex-1 animate-appear flex-col gap-4 px-4 pb-8 pt-6">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{t(lang, "invitedTitle", { booth })}</h1>
        <section className="flex flex-col items-center rounded-card border border-border bg-card p-5 text-center">
          <p className="text-[13px] font-semibold text-muted">{t(lang, "showCode")}</p>
          <p className="mt-2 font-mono text-5xl font-bold tracking-widest">{invitation.code}</p>
        </section>
        <ol className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
          {STEPS.map((key, i) => (
            <li key={key} className="flex items-center gap-3 text-base font-medium">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-pill bg-fg/10 text-sm font-bold tabular-nums">{i + 1}</span>
              {t(lang, key, { booth })}
            </li>
          ))}
        </ol>
        <p className="text-sm">{t(lang, "explain")}</p>
        <p className="text-[13px] text-muted">{t(lang, "deleted")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pb-8 pt-6">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">{t(lang, timeUp ? "timeUp" : "doneTitle")}</h1>
      <section className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
        <div className="flex items-center gap-3 font-semibold" role="status">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-pill bg-info opacity-50 motion-reduce:animate-none" />
            <span className="relative inline-flex size-3 rounded-pill bg-info" />
          </span>
          {t(lang, "waiting")}
        </div>
        <p className="text-sm text-muted">{t(lang, "doneBody", { booth })}</p>
        <p className="text-sm text-muted">{t(lang, "keepOpen")}</p>
      </section>
      <p className="text-sm">{t(lang, "noInviteNote")}</p>
      <p className="text-[13px] text-muted">{t(lang, "deleted")}</p>
    </main>
  );
}

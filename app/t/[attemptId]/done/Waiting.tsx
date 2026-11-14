"use client";

import { useEffect, useState } from "react";
import { t, type Lang } from "@/lib/i18n";

type Invitation = { code: string; qrSvg: string };
type Props = { attemptId: string; lang: Lang; booth: string; companyName: string; initial: Invitation | null };

const POLL_MS = 5000;

export function Waiting({ attemptId, lang, booth, companyName, initial }: Props) {
  const [invitation, setInvitation] = useState<Invitation | null>(initial);

  // Polls only for "invited or not". The candidate never sees labels or notes.
  useEffect(() => {
    if (invitation) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/attempts/${attemptId}/invitation`, { cache: "no-store" }).catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if (data?.invited) setInvitation({ code: data.code, qrSvg: data.qrSvg });
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [attemptId, invitation]);

  if (invitation) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 py-6">
        <section className="border border-slate-900 bg-slate-900 p-4 text-white">
          <h1 className="text-2xl font-bold">{t(lang, "invitedTitle", { booth })}</h1>
          <p className="mt-1 text-white/85">{companyName}</p>
        </section>
        <section className="border border-slate-200 bg-white p-4 text-center">
          <p className="text-sm font-semibold text-slate-500">{t(lang, "showCode")}</p>
          <p className="mt-2 font-mono text-5xl font-bold tracking-widest text-slate-900">{invitation.code}</p>
          <div className="mx-auto mt-5 w-48" dangerouslySetInnerHTML={{ __html: invitation.qrSvg }} />
        </section>
        <p className="border border-slate-200 bg-white p-4 text-slate-700">{t(lang, "explain")}</p>
        <p className="text-sm text-slate-500">{t(lang, "deleted")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 py-6">
      <section className="border border-slate-200 bg-white p-4">
        <h1 className="text-2xl font-bold">{t(lang, "doneTitle")}</h1>
        <p className="mt-3 text-slate-600">{t(lang, "doneBody", { booth })}</p>
        <div className="mt-4 flex items-center gap-3 border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-900" role="status">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping bg-slate-900 opacity-40 motion-reduce:animate-none" />
            <span className="relative inline-flex h-3 w-3 bg-slate-900" />
          </span>
          {t(lang, "waiting")}
        </div>
        <p className="mt-3 text-sm text-slate-500">{t(lang, "keepOpen")}</p>
      </section>
      <p className="border border-slate-200 bg-white p-4 text-slate-700">{t(lang, "noInviteNote")}</p>
      <p className="text-sm text-slate-500">{t(lang, "deleted")}</p>
    </main>
  );
}

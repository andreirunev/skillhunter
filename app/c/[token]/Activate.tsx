"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/CandidateShell";
import { Spinner } from "@/components/Spinner";
import { AvatarTile } from "@/components/ui/ListRow";
import { joinSep } from "@/components/ui/Sep";
import type { Avatar } from "@/lib/avatar";
import { t } from "@/lib/i18n";

type Props = {
  token: string;
  state: "ready" | "invalid" | "expired";
  avatar: Avatar;
  taskCount: number;
  minutes: number;
  limitMinutes: number;
  englishRequired: boolean;
};

// Start screen. The avatar was assigned when the code was entered and cannot
// be changed here. Pressing Start starts the clock on the server.
export function Activate({ token, state, avatar, taskCount, minutes, limitMinutes, englishRequired }: Props) {
  const router = useRouter();
  const lang = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...avatar, lang }),
    }).catch(() => null);
    const data = res?.ok ? await res.json() : null;
    if (!data?.attemptId) {
      setBusy(false);
      setError(res?.status === 403 ? t(lang, "otherDevice") : t(lang, "saveError"));
      return;
    }
    router.push(`/t/${data.attemptId}`);
  }

  if (state !== "ready") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pb-8 pt-6">
        <p className="rounded-card border border-border bg-card p-4 text-lg font-semibold">
          {t(lang, state)}
        </p>
        <Link href="/join" className="ui-btn ui-btn-primary min-h-12 text-base">{t(lang, "enterCode")}</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pb-8 pt-6">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{t(lang, "yourTest")}</h1>
        <p className="mt-1 text-[15px] text-muted">
          {joinSep([t(lang, "minutes", { min: minutes }), t(lang, "tasks", { n: taskCount }), t(lang, "limit", { min: limitMinutes })])}
        </p>
      </div>

      <p className="text-sm text-muted">{t(lang, "privacyLine")}</p>
      <p className="text-sm text-muted">
        {t(lang, "tasksEnglish")}{englishRequired && <> {t(lang, "englishNeeded")}</>}
      </p>

      <section className="flex items-center gap-4 rounded-card border border-border bg-card p-4">
        <AvatarTile emoji={avatar.emoji} color={avatar.color} size={64} />
        <div className="min-w-0">
          <p className="text-[13px] text-muted">{t(lang, "yourAvatar")}</p>
          <p className="truncate text-xl font-bold">{avatar.name}</p>
        </div>
      </section>

      {error && <p className="text-center text-sm font-medium text-bad" role="alert">{error}</p>}
      <button type="button" onClick={start} disabled={busy} aria-busy={busy}
        className="ui-btn ui-btn-primary min-h-14 w-full text-lg">
        {busy ? <><Spinner />{t(lang, "saving")}</> : t(lang, "start")}
      </button>
    </main>
  );
}

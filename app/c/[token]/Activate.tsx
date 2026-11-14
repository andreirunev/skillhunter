"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarBadge } from "@/components/Avatar";
import { makeAvatar, type Avatar } from "@/lib/avatar";
import { LANGS, LANG_NAMES, t, type Lang } from "@/lib/i18n";

type Props = {
  token: string;
  state: "ready" | "invalid" | "expired";
  initialAvatar: Avatar;
  company: { name: string; booth: string; color: string; testTitle: string } | null;
  taskCount: number;
  minutes: number;
};

export function Activate({ token, state, initialAvatar, company, taskCount, minutes }: Props) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [avatar, setAvatar] = useState(initialAvatar);
  const [ownPace, setOwnPace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...avatar, lang, ownPace }),
    }).catch(() => null);
    const data = res?.ok ? await res.json() : null;
    if (!data?.attemptId) {
      setBusy(false);
      setError(res?.status === 403 ? t(lang, "otherDevice") : t(lang, "saveError"));
      return;
    }
    router.push(`/t/${data.attemptId}`);
  }

  const languagePicker = (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t(lang, "language")}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lang === l}
          onClick={() => setLang(l)}
          className={`min-h-11 border text-sm font-semibold ${
            lang === l ? "border-slate-900 bg-slate-900 text-white" : "border-slate-400 bg-white text-slate-700"
          }`}
        >
          {LANG_NAMES[l]}
        </button>
      ))}
    </div>
  );

  if (state !== "ready" || !company) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 py-8">
        {languagePicker}
        <div className="border border-slate-200 bg-white p-4">
          <p className="text-lg font-semibold">{t(lang, state === "ready" ? "invalid" : state)}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 pb-28 pt-4">
      <header className="border border-slate-200 bg-white">
        <div className="h-2" style={{ background: company.color }} />
        <div className="p-4">
          <p className="text-sm font-medium text-slate-500">SkillScan · Booth {company.booth}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{company.name}</h1>
          <p className="mt-1 text-slate-600">{company.testTitle}</p>
          <p className="mt-2 text-sm text-slate-600">
            {t(lang, "minutes", { min: minutes })} · {t(lang, "tasks", { n: taskCount })}
          </p>
        </div>
      </header>

      {languagePicker}

      <section className="flex items-center gap-3 border border-slate-200 bg-white p-4">
        <AvatarBadge emoji={avatar.emoji} color={avatar.color} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500">{t(lang, "yourAvatar")}</p>
          <p className="truncate text-xl font-bold">{avatar.name}</p>
          <button
            type="button"
            onClick={() => setAvatar(makeAvatar())}
            className="btn btn-secondary mt-2"
          >
            {t(lang, "newAvatar")}
          </button>
        </div>
      </section>

      <label className="flex cursor-pointer items-center gap-3 border border-slate-200 bg-white p-4">
        <input
          type="checkbox"
          checked={ownPace}
          onChange={(e) => setOwnPace(e.target.checked)}
          className="peer sr-only"
        />
        <span className="relative h-8 w-14 shrink-0 bg-slate-300 transition peer-checked:bg-leaf-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100 after:absolute after:left-1 after:top-1 after:h-6 after:w-6 after:bg-white after:transition peer-checked:after:translate-x-6" />
        <span>
          <span className="block font-semibold">{t(lang, "ownPace")}</span>
          <span className="block text-sm text-slate-500">{t(lang, "ownPaceHint")}</span>
        </span>
      </label>

      <section className="border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <h2 className="font-semibold text-slate-900">{t(lang, "privacyTitle")}</h2>
        <ul className="mt-2 space-y-1.5">
          <li>✓ {t(lang, "privacy1")}</li>
          <li>✓ {t(lang, "privacy2")}</li>
          <li>✓ {t(lang, "privacy3")}</li>
          <li>✓ {t(lang, "privacy4")}</li>
        </ul>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-300 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-md">
          {error && <p className="mb-2 text-center text-sm font-medium text-red-700" role="alert">{error}</p>}
          <button
            type="button"
            onClick={start}
            disabled={busy}
            className="btn btn-primary min-h-14 w-full text-lg"
          >
            {busy ? "…" : `${t(lang, "start")} →`}
          </button>
        </div>
      </div>
    </main>
  );
}

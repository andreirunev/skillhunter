"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AvatarBadge } from "@/components/Avatar";
import { makeAvatar, type Avatar } from "@/lib/avatar";
import { LANGS, LANG_NAMES, t, type Lang } from "@/lib/i18n";

type Props = {
  token: string;
  state: "ready" | "invalid" | "expired" | "used";
  initialAvatar: Avatar;
  company: { name: string; booth: string; color: string; testTitle: string } | null;
  taskCount: number;
  minutes: number;
};

const storageKey = (token: string) => `skillscan:token:${token}`;

// The attempt started from this token on this phone, if any (kept only in this browser).
function useSavedAttempt(token: string) {
  return useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(storageKey(token));
      } catch {
        return null;
      }
    },
    () => null,
  );
}

export function Activate({ token, state, initialAvatar, company, taskCount, minutes }: Props) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [avatar, setAvatar] = useState(initialAvatar);
  const [ownPace, setOwnPace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedAttempt = useSavedAttempt(token);

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
      setError(res?.status === 409 ? t(lang, "used") : t(lang, "saveError"));
      return;
    }
    try {
      localStorage.setItem(storageKey(token), data.attemptId);
    } catch {}
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
          className={`min-h-12 rounded-xl text-sm font-semibold transition ${
            lang === l ? "bg-brand-700 text-white shadow" : "bg-white text-slate-700 ring-1 ring-slate-200"
          }`}
        >
          {LANG_NAMES[l]}
        </button>
      ))}
    </div>
  );

  if (state !== "ready" || !company) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-10">
        {languagePicker}
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <div className="text-5xl" aria-hidden>{state === "used" ? "🔒" : "🎫"}</div>
          <p className="mt-4 text-lg font-semibold">{t(lang, state === "ready" ? "invalid" : state)}</p>
          {state === "used" && savedAttempt && (
            <button
              type="button"
              onClick={() => router.push(`/t/${savedAttempt}`)}
              className="mt-6 min-h-14 w-full rounded-2xl bg-brand-700 text-lg font-semibold text-white"
            >
              {t(lang, "continue")}
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pb-32 pt-6">
      <header className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="h-2" style={{ background: company.color }} />
        <div className="p-5">
          <p className="text-sm font-medium text-slate-500">SkillScan · Booth {company.booth}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{company.name}</h1>
          <p className="mt-1 text-slate-600">{company.testTitle}</p>
          <div className="mt-3 flex gap-2 text-sm font-medium">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">⏱️ {t(lang, "minutes", { min: minutes })}</span>
            <span className="rounded-full bg-leaf-50 px-3 py-1 text-leaf-700">🧩 {t(lang, "tasks", { n: taskCount })}</span>
          </div>
        </div>
      </header>

      {languagePicker}

      <section className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <AvatarBadge emoji={avatar.emoji} color={avatar.color} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500">{t(lang, "yourAvatar")}</p>
          <p className="truncate text-xl font-bold">{avatar.name}</p>
          <button
            type="button"
            onClick={() => setAvatar(makeAvatar())}
            className="mt-2 min-h-11 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 active:bg-slate-200"
          >
            🎲 {t(lang, "newAvatar")}
          </button>
        </div>
      </section>

      <label className="flex cursor-pointer items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <input
          type="checkbox"
          checked={ownPace}
          onChange={(e) => setOwnPace(e.target.checked)}
          className="peer sr-only"
        />
        <span className="relative h-8 w-14 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-leaf-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100 after:absolute after:left-1 after:top-1 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-6" />
        <span>
          <span className="block font-semibold">🐢 {t(lang, "ownPace")}</span>
          <span className="block text-sm text-slate-500">{t(lang, "ownPaceHint")}</span>
        </span>
      </label>

      <section className="rounded-3xl bg-brand-50 p-5 text-sm text-slate-700">
        <h2 className="font-semibold text-brand-800">🔒 {t(lang, "privacyTitle")}</h2>
        <ul className="mt-2 space-y-1.5">
          <li>✓ {t(lang, "privacy1")}</li>
          <li>✓ {t(lang, "privacy2")}</li>
          <li>✓ {t(lang, "privacy3")}</li>
        </ul>
      </section>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-[#f3f6fb] via-[#f3f6fb] to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
        <div className="mx-auto max-w-md">
          {error && <p className="mb-2 text-center text-sm font-medium text-red-700" role="alert">{error}</p>}
          <button
            type="button"
            onClick={start}
            disabled={busy}
            className="min-h-16 w-full rounded-2xl bg-brand-700 text-xl font-bold text-white shadow-lg shadow-brand-700/25 transition active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? "…" : `${t(lang, "start")} →`}
          </button>
        </div>
      </div>
    </main>
  );
}

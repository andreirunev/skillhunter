"use client";

import { useCallback, useEffect, useState, type HTMLAttributes } from "react";
import { useLang } from "@/components/CandidateShell";
import { Spinner } from "@/components/Spinner";
import { t, type Lang } from "@/lib/i18n";
import { checkContact, isStage, type Stage } from "@/lib/stage";

type View = { code: string | null; stage: Stage };
type Props = { attemptId: string; booth: string; company: string; timeUp: boolean; initial: View };

const POLL_MS = 5000;
const STEPS = ["stepBooth", "stepShow", "stepAsk"] as const;
// After the candidate answers a contact request nothing changes any more.
const FINAL: Stage[] = ["full_interview", "contact_declined"];

// Finish screen. No score, no verdict: "saved", then whatever the recruiter
// decided at the booth (invitation, contact request, or a polite close).
export function Waiting({ attemptId, booth, company, timeUp, initial }: Props) {
  const lang = useLang();
  const [view, setView] = useState<View>(initial);
  const final = FINAL.includes(view.stage);

  // Returns only "invited or not", the booth code and the stage.
  const poll = useCallback(async () => {
    const res = await fetch(`/api/attempts/${attemptId}/invitation`, { cache: "no-store" }).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    if (data && isStage(data.stage)) setView({ code: data.invited ? data.code : null, stage: data.stage });
  }, [attemptId]);

  // Every 5 s and whenever the page comes back into view, until the candidate has answered.
  useEffect(() => {
    if (final) return;
    const timer = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [final, poll]);

  if (view.stage === "contact_requested") {
    return <ContactForm key="contact" attemptId={attemptId} company={company} lang={lang}
      onAnswered={(stage) => setView((v) => ({ ...v, stage }))} onStale={poll} />;
  }
  if (view.stage === "full_interview") return <Message key="sent" lang={lang} title={t(lang, "sentTitle")} />;
  if (view.stage === "contact_declined") return <Message key="declined" lang={lang} title={t(lang, "closedTitle")} body={t(lang, "notShared")} />;
  if (view.stage === "closed") return <Message key="closed" lang={lang} title={t(lang, "closedTitle")} body={t(lang, "closedBody")} />;

  if (view.code) {
    // Keyed so it mounts fresh and fades in (200ms) when the poll brings it.
    return (
      <main key="invited" className="mx-auto flex w-full max-w-md flex-1 animate-appear flex-col gap-4 px-4 pb-8 pt-6">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{t(lang, "invitedTitle", { booth })}</h1>
        <section className="flex flex-col items-center rounded-card border border-border bg-card p-5 text-center">
          <p className="text-[13px] font-semibold text-muted">{t(lang, "showCode")}</p>
          <p className="mt-2 pl-[0.35em] font-mono text-5xl font-bold tracking-[0.35em]">{view.code}</p>
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

// Plain end state: a title, maybe one neutral sentence. Never a reason or score.
function Message({ lang, title, body }: { lang: Lang; title: string; body?: string }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 animate-appear flex-col gap-4 px-4 pb-8 pt-6">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
      {body && <p className="rounded-card border border-border bg-card p-4 text-base">{body}</p>}
      <p className="text-[13px] text-muted">{t(lang, "deleted")}</p>
    </main>
  );
}

// Contact request: every field is typed by the candidate, nothing is sent
// without the consent tick, and "No thanks" stores nothing.
function ContactForm({ attemptId, company, lang, onAnswered, onStale }: {
  attemptId: string;
  company: string;
  lang: Lang;
  onAnswered: (stage: Stage) => void;
  onStale: () => void;
}) {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<"send" | "decline" | null>(null);
  const [error, setError] = useState(false);
  const valid = consent && checkContact(form) !== null;

  async function post(body: object, kind: "send" | "decline") {
    setBusy(kind);
    setError(false);
    const res = await fetch(`/api/attempts/${attemptId}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    setBusy(null);
    if (res?.ok && isStage(data?.stage)) onAnswered(data.stage);
    else if (res?.status === 409) onStale(); // the recruiter changed the step meanwhile
    else setError(true);
  }

  const field = (key: keyof typeof form, label: string, attrs: HTMLAttributes<HTMLInputElement> & { type: string; autoComplete: string }) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      <input {...attrs} value={form[key]} maxLength={key === "full_name" ? 100 : 120}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="min-h-12 w-full rounded-tile border border-border bg-bg px-3 text-base text-fg outline-none focus:border-fg/40" />
    </label>
  );

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 animate-appear flex-col gap-4 px-4 pb-8 pt-6">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">{t(lang, "nextTitle")}</h1>
      <p className="text-base">{t(lang, "nextBody")}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !busy) post({ ...form, consent: true }, "send");
        }}
        className="flex flex-col gap-3 rounded-card border border-border bg-card p-4"
      >
        {field("full_name", t(lang, "fieldName"), { type: "text", autoComplete: "name" })}
        {field("phone", t(lang, "fieldPhone"), { type: "tel", autoComplete: "tel", inputMode: "tel" })}
        {field("email", t(lang, "fieldEmail"), { type: "email", autoComplete: "email", inputMode: "email" })}
        <p className="text-[13px] text-muted">{t(lang, "contactHint")}</p>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-accent" />
          {t(lang, "consent", { company })}
        </label>
        <button type="submit" disabled={!valid || busy !== null} aria-busy={busy === "send"}
          className="ui-btn ui-btn-primary min-h-12 text-base">
          {busy === "send" ? <><Spinner />{t(lang, "saving")}</> : t(lang, "send")}
        </button>
        {error && <p role="alert" className="text-sm font-semibold text-bad">{t(lang, "saveError")}</p>}
      </form>
      <button type="button" onClick={() => post({ decline: true }, "decline")} disabled={busy !== null}
        className="inline-flex min-h-11 items-center gap-2 self-center px-4 text-sm font-semibold text-muted underline underline-offset-4">
        {busy === "decline" && <Spinner />}{t(lang, "noThanks")}
      </button>
    </main>
  );
}

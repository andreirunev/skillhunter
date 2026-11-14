"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight, BuildingComplex, CalendarDays, EyeOff, FlaskConical, ListX, LockKeyhole,
  MessagesSquare, Smartphone, Ticket, UserRound, type LucideIcon,
} from "lucide-react";
import { LangSelect } from "@/components/ui/LangSelect";
import { SectionCard } from "@/components/ui/SectionCard";
import { SectionLabel } from "@/components/ui/ScreenTitle";
import { joinSep } from "@/components/ui/Sep";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { t, type Lang } from "@/lib/i18n";
import { HOME } from "@/lib/i18n-home";

// One centred column: phone width, a little wider from tablets up.
const COL = "mx-auto w-full max-w-md px-4 md:max-w-3xl";

// Landing page: what SkillScan is and the two doors in. Same skin, theme
// toggle and EN/FI/SV select as the candidate screens. Every text is in
// lib/i18n-home.ts.
export function Landing({ lang: initial }: { lang: Lang }) {
  const [lang, setLang] = useState(initial);
  const m = HOME[lang];

  // The server sets the title from the cookie; keep it in step with the select.
  useEffect(() => {
    document.title = m.metaTitle;
  }, [m]);

  return (
    <div data-skin lang={lang}
      className="flex min-h-dvh flex-1 flex-col [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-fg [&_:focus-visible]:outline-solid">
      {/* Faint wash behind the header and hero: card fill fading into the page. */}
      <div className="bg-linear-to-b from-card to-bg">
        <header className={`${COL} flex items-center gap-2 py-3`}>
          <p className="min-w-0 flex-1 text-xl font-bold tracking-tight">SkillScan</p>
          <LangSelect size="lg" value={lang} onChange={setLang} label={t(lang, "language")} />
          <ThemeToggle size="lg" label={t(lang, "theme")} labels={{ light: t(lang, "light"), dark: t(lang, "dark") }} />
        </header>

        <section className={`${COL} flex min-h-[78svh] flex-col justify-center pb-14 pt-8 md:min-h-0 md:pb-16 md:pt-16`}>
          <SectionLabel as="p">{m.eyebrow}</SectionLabel>
          <h1 className="mt-3 text-balance break-words text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">{m.heroTitle}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">{m.heroSub}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/join" className="ui-btn ui-btn-primary min-h-12 justify-between rounded-lg px-5 text-base sm:min-w-60">
              {m.ctaCandidate}<ArrowRight className="size-5" aria-hidden />
            </Link>
            <Link href="/r" className="ui-btn ui-btn-secondary min-h-12 justify-between rounded-lg px-5 text-base sm:min-w-60">
              {m.ctaRecruiter}<ArrowRight className="size-5 text-muted" aria-hidden />
            </Link>
          </div>
        </section>
      </div>

      <main className="flex flex-col gap-16 pb-20 pt-6">
        <Section label={m.whyLabel}>
          <p className="text-xl font-semibold leading-snug tracking-tight">
            <span className="text-muted">{m.whyProblem}</span> {m.whyAnswer}
          </p>
        </Section>

        <Section label={m.flowLabel}>
          <ol className="flex flex-col md:grid md:grid-cols-3 md:gap-6">
            <Step n={1} label={m.before}>
              <p>{m.beforeBody}</p>
            </Step>
            <Step n={2} label={m.during} current>
              <ul className="flex flex-col gap-3">
                <IconLine icon={Ticket}>{m.duringCode}</IconLine>
                <IconLine icon={Smartphone}>{m.duringTasks}</IconLine>
                <IconLine icon={MessagesSquare}>{m.duringTalk}</IconLine>
              </ul>
            </Step>
            <Step n={3} label={m.after} last>
              <p>{m.afterBody}</p>
            </Step>
          </ol>
        </Section>

        <Section label={m.whoLabel}>
          <ul className="grid gap-3 md:grid-cols-3">
            <li><SectionCard icon={UserRound} tone="info" title={m.seekersTitle}><Body>{m.seekersBody}</Body></SectionCard></li>
            <li><SectionCard icon={BuildingComplex} tone="ok" title={m.companiesTitle}><Body>{m.companiesBody}</Body></SectionCard></li>
            <li><SectionCard icon={CalendarDays} tone="warn" title={m.organisersTitle}><Body>{m.organisersBody}</Body></SectionCard></li>
          </ul>
        </Section>

        <Section label={m.responsibleLabel}>
          <SectionCard flush>
            <ul className="divide-y divide-border">
              <IconLine icon={ListX} tone="text-ok" row>{m.noRanking}</IconLine>
              <IconLine icon={EyeOff} tone="text-ok" row>{m.noTracking}</IconLine>
              <IconLine icon={LockKeyhole} tone="text-ok" row>{m.consent}</IconLine>
              <IconLine icon={FlaskConical} tone="text-ok" row>{m.synthetic}</IconLine>
            </ul>
          </SectionCard>
          <p className="mt-3 text-[13px] text-muted">{m.aiAct}</p>
        </Section>
      </main>

      <footer className="mt-auto border-t border-border">
        <div className={`${COL} py-6 text-[13px] leading-relaxed text-muted`}>
          <p>{joinSep([m.footConcept, m.footChallenge, m.footEspoo])}</p>
          <p className="mt-1">{m.footDemo}</p>
        </div>
      </footer>
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className={COL}>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-muted">{children}</p>;
}

// Timeline step: big number with a thin line down to the next step on phones;
// three columns with a top rule from tablets up. The current step's label is
// the solid pill.
function Step({ n, label, current = false, last = false, children }: {
  n: number;
  label: string;
  current?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="relative grid grid-cols-[2.5rem_1fr] gap-x-3 pb-8 last:pb-0 md:block md:border-t md:border-border md:pb-0 md:pt-4">
      {!last && <span aria-hidden className="absolute bottom-2 left-5 top-11 border-l border-border md:hidden" />}
      <span aria-hidden className="text-center text-[32px] font-bold leading-none tabular-nums md:text-left">{n}</span>
      <div className="md:mt-3">
        <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-pill px-2.5 text-xs font-semibold ${
          current ? "bg-accent text-bg" : "bg-fg/10 text-fg/70"
        }`}>
          {label}
        </span>
        <div className="mt-3 text-[15px] leading-relaxed">{children}</div>
      </div>
    </li>
  );
}

// List line with a leading icon. `row` pads it as an edge-to-edge card row.
function IconLine({ icon: Icon, tone = "text-muted", row = false, children }: {
  icon: LucideIcon;
  tone?: string;
  row?: boolean;
  children: ReactNode;
}) {
  return (
    <li className={`flex items-start gap-3 ${row ? "px-4 py-3.5 text-[15px] leading-snug" : ""}`}>
      <Icon className={`mt-0.5 size-5 shrink-0 ${tone}`} strokeWidth={2} aria-hidden />
      <span>{children}</span>
    </li>
  );
}

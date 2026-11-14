import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { joinSep } from "@/components/ui/Sep";
import { EspooMap } from "./EspooMap";

// Headline face for this page only; body text is the system UI font.
const display = Space_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "SkillScan - skills over CVs at Espoo recruitment events",
  description: "Short practical tasks at the booth. Recruiters decide who to talk to.",
};

export const viewport: Viewport = { themeColor: "#f4f1ea" };

const COL = "mx-auto w-full max-w-[1080px] px-5 md:px-8";

// Entrance: fade + 8px rise; block n starts 60ms after block n-1. Off under
// prefers-reduced-motion (globals.css also stops every animation there).
const ENTER = "motion-safe:animate-enter";
const delay = (n: number): CSSProperties => ({ animationDelay: `${n * 60}ms` });

const STEPS = [
  { title: "Booth code", line: "The recruiter hands you a card with a code." },
  { title: "Short test", line: "About 10 minutes of practical tasks on your phone." },
  { title: "Recruiter review", line: "A person reads your answers. No score, no ranking." },
  { title: "Live talk at the booth", line: "If invited, you explain your answers in person." },
];

const PRINCIPLES = [
  "Humans decide.",
  "No scores shown to candidates.",
  "No contact data until you agree to share it.",
  "Data deleted after the event.",
];

// Landing page: who SkillScan is for and the two doors in (candidate -> /join,
// recruiter -> /r). Static; no data, no cookies.
export default function Home() {
  return (
    <div data-landing
      className={`${display.variable} flex min-h-dvh flex-1 flex-col overflow-x-clip [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-ink [&_:focus-visible]:outline-solid`}>
      <header className={ENTER} style={delay(0)}>
        <div className={`${COL} flex items-center justify-between py-5`}>
          <p className="font-display text-xl font-bold tracking-tight">SkillScan</p>
          <span className="border border-ink/30 px-2 py-0.5 text-[13px] font-medium text-ink/75">Demo</span>
        </div>
      </header>

      <main className="flex flex-col">
        <section className="relative overflow-hidden">
          <EspooMap className="pointer-events-none absolute -right-12 top-0 h-full w-auto text-ink opacity-[0.16] md:right-8 md:opacity-25" />
          <div className={`${COL} ${ENTER} relative pb-12 pt-8 md:pb-20 md:pt-16`} style={delay(1)}>
            <p className="text-sm font-medium text-ink/75">{joinSep(["City of Espoo", "Junction 2026"])}</p>
            <h1 className="mt-4 text-balance font-display text-[clamp(2.75rem,11vw,6rem)] font-bold leading-[0.95] tracking-[-0.035em]">
              Skills over CVs at job fairs
            </h1>
            <p className="mt-6 max-w-[30ch] text-lg leading-snug text-ink/75 md:text-xl">
              Short practical tasks at the booth. Recruiters decide who to talk to.
            </p>
          </div>
        </section>

        <section aria-label="Choose your role" className={`${COL} grid gap-4 md:grid-cols-2 md:gap-6`}>
          <RoleCard n={2} title={"I'm a candidate"} href="/join" action="Enter booth code" primary
            next="Type the code from your booth card. No name or CV needed.">
            Get a booth code, take a 10-minute test, talk to the recruiter at the stand.
          </RoleCard>
          <RoleCard n={3} title={"I'm a recruiter"} href="/r" action="Recruiter PIN"
            next="Enter the PIN you got from the fair organiser.">
            See anonymous answers, invite the best-fitting people to a short interview. You decide.
          </RoleCard>
        </section>

        <section className={`${COL} ${ENTER} pt-16 md:pt-24`} style={delay(4)}>
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">How it works</h2>
          <ol className="mt-6 grid md:grid-cols-4 md:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[2.75rem_1fr] border-t border-ink/20 py-4 md:block md:pb-0">
                <span className="font-display text-[28px] font-bold leading-none text-espoo tabular-nums" aria-hidden>{i + 1}</span>
                <div className="md:mt-4">
                  <h3 className="text-[17px] font-semibold leading-snug">{s.title}</h3>
                  <p className="mt-1 text-[15px] leading-snug text-ink/75">{s.line}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={`${COL} ${ENTER} pb-16 pt-16 md:pb-24 md:pt-24`} style={delay(5)}>
          <h2 className="sr-only">Principles</h2>
          <ul className="grid divide-y divide-ink/20 border-y border-ink/20 md:grid-cols-4 md:divide-x md:divide-y-0">
            {PRINCIPLES.map((p) => (
              <li key={p} className="py-4 text-[15px] font-medium leading-snug md:px-5 md:first:pl-0">
                {p}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className={`${ENTER} mt-auto`} style={delay(6)}>
        <div className={COL}>
          <p className="flex flex-wrap gap-x-6 gap-y-1 border-t border-ink/20 py-6 text-sm text-ink/75">
            <span>Demo with synthetic data.</span>
            <a href="https://www.openstreetmap.org/copyright" className="underline underline-offset-2">
              Map © OpenStreetMap contributors
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// One door in: what you do, what happens right after, and the one button.
function RoleCard({ n, title, href, action, primary = false, next, children }: {
  n: number;
  title: string;
  href: string;
  action: string;
  primary?: boolean;
  next: string;
  children: ReactNode;
}) {
  return (
    <div style={delay(n)} className={`${ENTER} flex flex-col border border-ink/20 bg-sheet p-5 md:p-7`}>
      <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight md:text-[32px]">{title}</h2>
      <p className="mb-6 mt-2 text-[17px] leading-snug text-ink/75">{children}</p>
      <p className="mt-auto border-t border-ink/15 pt-3 text-sm leading-snug text-ink/75">
        <span className="font-semibold text-ink">Next:</span> {next}
      </p>
      <Link href={href}
        className={`tap mt-4 flex min-h-14 items-center justify-center border px-5 text-base font-semibold ${
          primary ? "border-espoo bg-espoo text-white hover:bg-espoo/90" : "border-ink text-ink hover:bg-ink/5"
        }`}>
        {action}
      </Link>
    </div>
  );
}

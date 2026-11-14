import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { joinSep } from "@/components/ui/Sep";
import { EspooMap } from "./EspooMap";
import { Intro } from "./Intro";
import { CandidateStart, RecruiterStart } from "./LandingForms";

// Headline and button face for this page only (variable, used at 600-800);
// body text and inputs stay on the system UI font.
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "SkillScan - skills over CVs at Espoo recruitment events",
  description: "Short practical tasks at the booth. Recruiters decide who to talk to.",
};

export const viewport: Viewport = { themeColor: "#003580" };

const COL = "mx-auto w-full max-w-[1080px] px-5 md:px-8";

// Entrance for the sections below the fold: fade + 8px rise; block n starts
// 60ms after block n-1. Off under prefers-reduced-motion.
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

// Landing page, laid out like the flag: the blue top half is the candidate
// door (booth code), the white half below is the recruiter door (PIN), with
// the tab of the cross on the seam. The intro draws that cross on the first
// visit of the session. No data, no cookies until a form is sent.
export default function Home() {
  return (
    <div data-landing
      className={`${display.variable} flex min-h-dvh flex-1 flex-col overflow-x-clip [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-solid [&_:focus-visible]:outline-ink`}>
      <Intro />
      <main className="flex flex-col">
        <section data-hero aria-labelledby="candidate-title"
          className="relative min-h-(--seam) bg-flag-blue text-white [&_:focus-visible]:outline-white!">
          <EspooMap className="pointer-events-none absolute -right-16 top-0 h-full w-auto text-white opacity-[0.14] md:right-8 md:opacity-20" />
          <div className={`${COL} relative flex min-h-(--seam) flex-col pb-10 pt-5 md:pb-14`}>
            <header className="flex items-center justify-between">
              <p className="font-display text-xl font-bold tracking-tight">SkillScan</p>
              <span className="border border-white/40 px-2 py-0.5 text-[13px] font-medium text-white/85">Demo</span>
            </header>
            <div className="mt-auto pt-10">
              <p className="text-sm font-medium text-white/75">{joinSep(["City of Espoo", "Junction 2026"])}</p>
              <h1 className="mt-3 max-w-[14ch] text-balance font-display text-[clamp(40px,8vw,96px)] font-extrabold leading-[0.95] tracking-[-0.03em]">
                Skills over CVs at job fairs
              </h1>
              <p className="mt-5 hidden max-w-[34ch] text-xl leading-snug text-white/80 md:block">
                Short practical tasks at the booth. Recruiters decide who to talk to.
              </p>
              <div className="mt-8 max-w-[560px]">
                <h2 id="candidate-title" className="font-display text-xl font-bold tracking-tight">{"I'm a candidate"}</h2>
                <p className="mb-3 mt-1 text-[15px] leading-snug text-white/80">
                  Type the code from your booth card. No name or CV needed.
                </p>
                <CandidateStart />
              </div>
            </div>
          </div>
          <span className="seam-tab" aria-hidden />
        </section>

        <section aria-labelledby="recruiter-title" className={`${COL} pt-20 md:pt-24`}>
          <div className="max-w-[560px]">
            <h2 id="recruiter-title" className="font-display text-[28px] font-bold leading-tight tracking-[-0.02em] md:text-[36px]">
              {"I'm a recruiter"}
            </h2>
            <p className="mb-5 mt-2 text-[17px] leading-snug text-ink/75">
              See anonymous answers, invite people to a short talk at your booth. You decide. Use the PIN you got from the fair organiser.
            </p>
            <RecruiterStart />
          </div>
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

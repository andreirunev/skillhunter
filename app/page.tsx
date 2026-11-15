import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bricolage_Grotesque } from "next/font/google";
import { CandidateForm, RecruiterForm } from "./LandingForms";
import { LandingMotion } from "./LandingMotion";
import "./landing.css";

// Headline and button face for this page only; body text stays on Geist.
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  weight: "800",
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillHunter - skills over CVs at Espoo recruitment events",
  description: "Short practical tasks at the booth. Recruiters decide who to talk to.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

const i = (n: number) => ({ "--i": n }) as CSSProperties;

const MARQUEE = ["Triage", "Spot the error", "Next step", "Apply the rule", "Read & decide", "Handover", "Customer support", "Warehouse", "Junior developer", "Care assistant"];

const STEPS = [
  { title: "Get a booth code", line: "Single-use, handed out at the stand. No name, no CV.", icon: <><rect pathLength={1} x="5" y="10" width="30" height="20" rx="3" /><path pathLength={1} d="M11 17h9M11 23h13" /><path pathLength={1} d="M29 15v10" /></> },
  { title: "Do real tasks", line: "Short micro-tasks that mirror the job's actual duties, under an anonymous avatar.", icon: <><path pathLength={1} d="M7 12l3 3 6-6M7 26l3 3 6-6" /><path pathLength={1} d="M21 12h12M21 26h12" /></> },
  { title: "Recruiter sees the signal", line: "Answers, neutral comparison with the key, time vs expected. No score, no ranking.", icon: <><path pathLength={1} d="M3 20s6-10 17-10 17 10 17 10-6 10-17 10S3 20 3 20z" /><circle pathLength={1} cx="20" cy="20" r="4.5" /></> },
  { title: "A human decides", line: "Live mini-interview first. Contact details only with explicit consent from both sides.", icon: <><circle pathLength={1} cx="15" cy="13" r="5" /><path pathLength={1} d="M5 33c0-6 4-10 10-10s10 4 10 10" /><path pathLength={1} d="M26 18l3.5 3.5L36 14" /></> },
];

const PRINCIPLES = [
  { title: "A human decides every step", line: "No score, no ranking, no automatic rejection. Flags only explain." },
  { title: "Anonymous until mutual interest", line: "Candidates use an avatar. Names appear only when both sides agree." },
  { title: "Minimal data, explicit consent", line: "No CV, no IP addresses. Contact details only with consent." },
  { title: "Synthetic data only, EU AI Act in mind", line: "The demo runs on synthetic data. Event data is deleted afterwards." },
];

// Landing: a black and white split (candidate on white, recruiter on black)
// with a booth code and a PIN form, then How it works, Why not a CV,
// Responsible by design and a final call to action. Motion: CSS keyframes
// plus LandingMotion (IntersectionObserver); reduced motion shows the final
// frames.
export default function Home() {
  return (
    <div data-landing className={`${display.variable} lp`}>
      <LandingMotion />
      <header className="lp-header">
        <span className="lp-wordmark">SkillHunter</span>
        <span className="lp-pill">Demo</span>
      </header>

      <main>
        <h1 className="sr-only">SkillHunter: skills over CVs at job fairs</h1>
        <section className="lp-split" aria-label="Start">
          <div className="lp-half lp-light">
            <div className="lp-hero">
              <p className="lp-eyebrow">City of Espoo · Junction 2026</p>
              <h2 className="lp-h1">I&apos;m a candidate</h2>
              <p className="lp-lead">Take a short practical test at the booth. No CV, no name needed.</p>
              <CandidateForm />
              <div className="lp-art lp-art-phone" data-io aria-hidden>
                <Phone />
              </div>
            </div>
          </div>
          <div className="lp-half lp-dark">
            <div className="lp-hero">
              <p className="lp-eyebrow">For HR and booth staff</p>
              <h2 className="lp-h1">I&apos;m a recruiter</h2>
              <p className="lp-lead">See anonymous answers, invite the best-fitting people to a short interview. You decide.</p>
              <RecruiterForm />
              <div className="lp-art lp-art-cards" data-io aria-hidden>
                <Cards />
              </div>
            </div>
          </div>
        </section>

        <div className="lp-marquee lp-dark" data-io>
          <div className="lp-track">
            {[0, 1].map((copy) => (
              <ul key={copy} className="lp-marquee-list" aria-hidden={copy === 1}>
                {MARQUEE.map((m) => <li key={m}>{m}</li>)}
              </ul>
            ))}
          </div>
        </div>

        <section className="lp-section lp-light" aria-labelledby="how-title">
          <div className="lp-wrap">
            <h2 id="how-title" className="lp-h2">How it works</h2>
            <ol className="lp-steps" data-io>
              {STEPS.map((s, n) => (
                <li key={s.title} className="lp-step lp-reveal" style={i(n)}>
                  <div className="lp-step-top">
                    <span className="lp-num" aria-hidden>{`0${n + 1}`}</span>
                    <svg viewBox="0 0 40 40" className="lp-icon lp-draw" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {s.icon}
                    </svg>
                  </div>
                  <h3 className="lp-h3">{s.title}</h3>
                  <p className="lp-body">{s.line}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-section lp-dark" aria-labelledby="why-title">
          <div className="lp-wrap">
            <h2 id="why-title" className="lp-h2">Why not a CV?</h2>
            <div className="lp-why" data-io>
              <figure className="lp-why-col">
                <div className="lp-cvs" aria-hidden>
                  {[0, 1, 2, 3].map((n) => (
                    <div key={n} className="lp-cv lp-reveal" style={i(n)}>
                      <span className="lp-cv-bar lp-cv-name" />
                      <p>Results-driven team player with a passion for excellence.</p>
                      <span className="lp-cv-bar" />
                      <span className="lp-cv-bar lp-cv-short" />
                      <span className="lp-cv-bar" />
                    </div>
                  ))}
                </div>
                <figcaption className="lp-caption">AI-written CVs all sound the same</figcaption>
              </figure>
              <figure className="lp-why-col">
                <div className="lp-answers" aria-hidden>
                  <div className="lp-answer lp-reveal" style={i(1)}>
                    <p className="lp-answer-task">Spot the error</p>
                    <p className="lp-answer-text">Pallet 3 is labelled for the wrong dock.</p>
                  </div>
                  <div className="lp-answer lp-reveal" style={i(2)}>
                    <p className="lp-answer-task">Next step</p>
                    <p className="lp-chips"><span>Isolate</span>→<span>Test</span>→<span>Report</span></p>
                  </div>
                  <div className="lp-answer lp-reveal" style={i(3)}>
                    <p className="lp-answer-task">Read &amp; decide</p>
                    <p className="lp-answer-text">Call the shift lead before moving the patient.</p>
                    <p className="lp-answer-meta">Explained live at the booth</p>
                  </div>
                </div>
                <figcaption className="lp-caption">Work samples + a live follow-up are hard to fake</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="lp-section lp-light" aria-labelledby="resp-title">
          <div className="lp-wrap">
            <h2 id="resp-title" className="lp-h2">Responsible by design</h2>
            <ul className="lp-cards" data-io>
              {PRINCIPLES.map((p, n) => (
                <li key={p.title} className="lp-card lp-reveal" style={i(n)}>
                  <h3 className="lp-h3">{p.title}</h3>
                  <p className="lp-body">{p.line}</p>
                </li>
              ))}
            </ul>
            <p className="lp-note">Demo build, no login. Real deployment would use authenticated roles.</p>
          </div>
        </section>

        <section className="lp-section lp-dark lp-final" aria-labelledby="cta-title">
          <div className="lp-wrap">
            <h2 id="cta-title" className="lp-h1">Ready to try it?</h2>
            <div className="lp-cta">
              <Link href="/join" className="lp-btn lp-btn-white">I&apos;m a candidate</Link>
              <Link href="/r" className="lp-btn lp-btn-ghost">I&apos;m a recruiter</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer lp-dark">
        <p>City of Espoo · Junction 2026 · Rethinking Recruitment</p>
      </footer>
    </div>
  );
}

// Candidate illustration, an 8s loop (landing.css): the booth code types in,
// the avatar chip pops in, the three tasks get numbered badges, then "Sent".
function Phone() {
  return (
    <div className="lp-phone">
      <span className="lp-notch" />
      <div className="lp-screen">
        <div className="lp-screen-body lp-reset">
          <p className="lp-ph-label">Booth code</p>
          <p className="lp-ph-code"><span className="lp-ph-typed">K7Q-42M<span className="lp-ph-cover" /></span></p>
          <p className="lp-ph-chip"><span className="lp-ph-avatar">SP</span>Swift Penguin</p>
          <ol className="lp-ph-tasks">
            {["Spot the error", "Next step", "Apply the rule"].map((t, n) => (
              <li key={t}>
                <span className="lp-ph-badge"><span className={`lp-ph-fill lp-b${n + 1}`}>{n + 1}</span></span>
                {t}
              </li>
            ))}
          </ol>
          <p className="lp-ph-sent"><span className="lp-ph-check">✓</span>Sent</p>
        </div>
      </div>
    </div>
  );
}

// Recruiter illustration, an 8s loop: three answer cards slide in, the first
// is outlined and its Invite button pulses once.
function Cards() {
  return (
    <div className="lp-stack lp-reset">
      <div className="lp-rc lp-rc1">
        <div className="lp-rc-head">
          <p className="lp-rc-name">Swift Penguin</p>
          <span className="lp-rc-invite">Invite</span>
        </div>
        <p className="lp-rc-meta">Same as typical answer · 38s</p>
      </div>
      <div className="lp-rc lp-rc2">
        <p className="lp-rc-name">Calm Otter</p>
        <p className="lp-rc-meta">Differs from key · 52s</p>
      </div>
      <div className="lp-rc lp-rc3">
        <p className="lp-rc-name">Bold Fox</p>
        <p className="lp-rc-meta">No typical answer, discuss in the interview</p>
      </div>
    </div>
  );
}

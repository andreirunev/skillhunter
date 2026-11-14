import Link from "next/link";
import { FlagLegend } from "@/components/Flags";
import type { Company } from "@/lib/recruiter";

const STEPS = [
  "Hand each candidate a booth code. No CV, name or contact details.",
  "They solve short tasks under an anonymous avatar.",
  "You read answers, timings and flags. Nothing is scored, ranked or rejected automatically.",
  "Invite people to the booth and ask them to explain each answer.",
  "You decide. Every status label is set by you, one tap each.",
];

// Recruiter "About" tab: the test, how the booth flow works, privacy.
export function AboutTab({ company }: { company: Company }) {
  return (
    <>
      <section className="border border-slate-200 bg-white p-4">
        <h2 className="font-bold">Your test</h2>
        <p className="mt-1 text-sm text-slate-600">
          {company.test_title} · {company.task_count} tasks · ≈ {Math.max(1, Math.round(company.expected_sec / 60))} min
        </p>
      </section>

      <section className="border border-slate-200 bg-white p-4">
        <h2 className="font-bold">How it works</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
          {STEPS.map((s) => <li key={s}>{s}</li>)}
        </ol>
      </section>

      <FlagLegend ownPace={false} />

      <section className="border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <h2 className="font-bold text-slate-900">Privacy</h2>
        <ul className="mt-2 space-y-1.5">
          <li>✓ No names, contact details, IP addresses or location are stored.</li>
          <li>✓ All event data is deleted after the event.</li>
          <li>✓ This demo uses synthetic data only.</li>
        </ul>
      </section>

      <Link href="/" className="tap btn btn-secondary">Leave recruiter view</Link>
    </>
  );
}

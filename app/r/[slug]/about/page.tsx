import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { SectionLabel, ScreenTitle } from "@/components/ui/ScreenTitle";
import { getCompany, isDemoMode } from "@/lib/recruiter";
import { ResetDemo } from "./ResetDemo";

export const dynamic = "force-dynamic";

const STEPS = [
  "Hand out a booth code. No CV, name or contact details.",
  "The candidate solves short tasks under an anonymous avatar.",
  "You read answers, times and flags. Flags are plain rules, not AI.",
  "Invite them to the booth and ask them to explain each answer.",
  "You decide. Every label is set by you.",
];

const PRINCIPLES = [
  "Humans decide.",
  "No scores.",
  "No contact data stored.",
  "Data deleted after the event.",
];

// About tab: how the booth flow works and what the platform never does.
export default async function AboutPage(props: PageProps<"/r/[slug]/about">) {
  const { slug } = await props.params;
  const company = await getCompany(slug);
  if (!company) notFound();

  return (
    <div className="flex flex-col gap-4 pt-2">
      <ScreenTitle title="About" />

      <section className="rounded-card border border-border bg-card p-4">
        <p className="font-semibold">{company.test_title}</p>
        <p className="mt-0.5 text-[13px] text-muted">
          {company.task_count} tasks · ≈ {Math.max(1, Math.round(company.expected_sec / 60))} min
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>How it works</SectionLabel>
        <ol className="flex flex-col gap-3 rounded-card border border-border bg-card p-4 text-sm">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-pill bg-fg/10 text-xs font-bold tabular-nums">{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Privacy</SectionLabel>
        <ul className="grid grid-cols-2 gap-3">
          {PRINCIPLES.map((p) => (
            <li key={p} className="flex items-start gap-2 rounded-card border border-border bg-card p-3 text-sm font-semibold">
              <Check className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={2.5} aria-hidden />{p}
            </li>
          ))}
        </ul>
        <p className="text-[13px] text-muted">No IP addresses or location. This demo uses synthetic data only.</p>
      </section>

      {isDemoMode() && <ResetDemo />}

      <Link href="/" className="ui-btn ui-btn-secondary">Leave recruiter view</Link>
    </div>
  );
}

import Link from "next/link";
import type { Company } from "@/lib/recruiter";

const TABS = [
  { key: "candidates", label: "Candidates", query: "" },
  { key: "codes", label: "Booth codes", query: "?tab=codes" },
  { key: "about", label: "About", query: "?tab=about" },
] as const;

export type RecruiterTab = (typeof TABS)[number]["key"];

export function RecruiterHeader({ company }: { company: Company }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="h-1.5" style={{ background: company.color }} />
      <div className="mx-auto max-w-2xl px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">SkillScan · Recruiter · Booth {company.booth}</p>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight">{company.name}</h1>
      </div>
    </header>
  );
}

// Fixed bottom navigation on every recruiter screen. Text only; the active tab
// is underlined. Pages keep var(--tabbar) of space free at the bottom.
export function TabBar({ slug, active }: { slug: string; active: RecruiterTab }) {
  return (
    <nav data-dock aria-label="Recruiter sections"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-300 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid h-12 max-w-2xl grid-cols-3">
        {TABS.map((tab) => {
          const on = active === tab.key;
          return (
            <Link key={tab.key} href={`/r/${slug}${tab.query}`} aria-current={on ? "page" : undefined}
              className={`tap flex items-center justify-center text-sm font-semibold ${on ? "text-slate-900" : "text-slate-500"}`}>
              <span className={`border-b-2 py-1 ${on ? "border-slate-900" : "border-transparent"}`}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

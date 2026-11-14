import Link from "next/link";
import type { Company } from "@/lib/recruiter";

const TABS = [{ key: "candidates", label: "Candidates", href: (slug: string) => `/r/${slug}` }];

export function RecruiterHeader({ company, active }: { company: Company; active: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="h-1.5" style={{ background: company.color }} />
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">SkillScan · Recruiter · Booth {company.booth}</p>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight">{company.name}</h1>
        <nav className="mt-3 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href(company.slug)}
              className={`-mb-px min-h-11 whitespace-nowrap border-b-2 px-3 pt-2.5 text-sm font-semibold ${
                active === tab.key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

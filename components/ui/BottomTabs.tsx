"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, ClipboardList, QrCode, Users, type LucideIcon } from "lucide-react";

// `also`: sub-screens that keep the tab active (the ticket template editor,
// the contest builder, the template library).
const TABS: { path: string; label: string; icon: LucideIcon; also?: string[] }[] = [
  { path: "", label: "Candidates", icon: Users },
  { path: "/codes", label: "Booth codes", icon: QrCode, also: ["/tickets"] },
  { path: "/stats", label: "Stats", icon: ChartColumn },
  { path: "/contests", label: "Contests", icon: ClipboardList, also: ["/build", "/templates"] },
];

// Fixed bottom tab bar on phones; a left rail from 1024px. Candidate detail
// (/a/...) counts as Candidates. `contestsLabel`: the Contests tab follows the
// recruiter language (EN/FI/SV) like the screens it opens.
export function BottomTabs({ slug, contestsLabel }: { slug: string; contestsLabel: string }) {
  const pathname = usePathname();
  const base = `/r/${slug}`;
  const active = TABS.find((t) => t.path && [t.path, ...(t.also ?? [])].some((p) => pathname.startsWith(base + p)))?.path ?? "";

  return (
    <nav data-dock aria-label="Recruiter sections"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] lg:inset-y-0 lg:right-auto lg:w-(--rail) lg:border-r lg:border-t-0 lg:px-3 lg:pb-0 lg:pt-6">
      <p className="hidden px-3 pb-5 text-lg font-bold tracking-tight lg:block">SkillScan</p>
      <ul className="mx-auto grid h-14 max-w-[720px] grid-cols-4 lg:h-auto lg:grid-cols-1 lg:gap-1">
        {TABS.map(({ path, label: en, icon: Icon }) => {
          const label = path === "/contests" ? contestsLabel : en;
          const on = active === path;
          return (
            <li key={path || "/"}>
              <Link href={base + path} aria-current={on ? "page" : undefined}
                className={`tap flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-btn lg:px-3 lg:text-sm ${
                  on ? "text-fg lg:bg-card" : "text-muted"
                }`}>
                <Icon className="size-[22px] lg:size-5" strokeWidth={on ? 2.25 : 1.75} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

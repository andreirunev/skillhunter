import type { Viewport } from "next";
import Link from "next/link";
import { ClipboardList, KeyRound } from "lucide-react";
import { notFound } from "next/navigation";
import { BottomTabs } from "@/components/ui/BottomTabs";
import { joinSep } from "@/components/ui/Sep";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Toast } from "@/components/ui/Toast";
import { bt } from "@/lib/i18n-builder";
import { cookieLang } from "@/lib/lang";
import { getCompany } from "@/lib/recruiter";
import { SKIN_THEME_COLOR } from "@/lib/theme";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: SKIN_THEME_COLOR };

// Recruiter shell: light/dark skin, company line + theme toggle on top, tabs
// at the bottom (left rail on desktop). Content is one 720px column.
export default async function RecruiterLayout({ children, params }: LayoutProps<"/r/[slug]">) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const lang = (await cookieLang()) ?? "en";
  const editLabel = bt(lang, "editContest");

  return (
    <div data-skin className="flex min-h-dvh flex-1 flex-col lg:pl-(--rail)">
      <div className="mx-auto w-full max-w-[720px] flex-1 px-4 pb-[calc(var(--tabbar)_+_6rem)] pt-3 lg:pb-24 lg:pt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {joinSep([company.name, `Booth ${company.booth}`])}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link href={`/r/${slug}/build`} aria-label={editLabel} title={editLabel}
              className="tap inline-flex size-9 items-center justify-center rounded-pill bg-track text-muted">
              <ClipboardList className="size-4" aria-hidden />
            </Link>
            <Link href={`/r/${slug}?find=1`} aria-label="Find by code" title="Find by code"
              className="tap inline-flex size-9 items-center justify-center rounded-pill bg-track text-muted">
              <KeyRound className="size-4" aria-hidden />
            </Link>
            <ThemeToggle />
          </div>
        </div>
        {children}
      </div>
      <BottomTabs slug={slug} contestsLabel={bt(lang, "contests")} />
      <Toast />
    </div>
  );
}

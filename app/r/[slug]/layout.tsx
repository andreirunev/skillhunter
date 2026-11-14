import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { BottomTabs } from "@/components/ui/BottomTabs";
import { Toast } from "@/components/ui/Toast";
import { getCompany } from "@/lib/recruiter";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: "#0b0b0c" };

// Recruiter shell: dark skin, small company line on top, tabs at the bottom
// (left rail on desktop). Content is one 720px column.
export default async function RecruiterLayout({ children, params }: LayoutProps<"/r/[slug]">) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();

  return (
    <div data-skin="dark" className="flex min-h-dvh flex-1 flex-col lg:pl-(--rail)">
      <div className="mx-auto w-full max-w-[720px] flex-1 px-4 pb-[calc(var(--tabbar)_+_6rem)] pt-3 lg:pb-24 lg:pt-6">
        <p className="flex min-h-6 items-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          {company.name} · Booth {company.booth}
        </p>
        {children}
      </div>
      <BottomTabs slug={slug} />
      <Toast />
    </div>
  );
}

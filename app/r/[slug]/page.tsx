import Link from "next/link";
import { notFound } from "next/navigation";
import { AboutTab } from "@/components/AboutTab";
import { AvatarBadge } from "@/components/Avatar";
import { AutoRefresh } from "@/components/AutoRefresh";
import { PrintCodes } from "@/components/PrintCodes";
import { RecruiterHeader, TabBar, type RecruiterTab } from "@/components/RecruiterHeader";
import { getCompany, isStatus, listCandidates, listUnusedCodes, STATUSES, type Company } from "@/lib/recruiter";
import { MAX_CODES_PER_BATCH, PRINTED_CODE_DAYS } from "@/lib/codes";
import { formatClock, formatDuration, LANG_SHORT, STATUS_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

// One screen, three tabs (?tab=codes, ?tab=about), switched from the bottom bar.
export default async function RecruiterPage(props: PageProps<"/r/[slug]">) {
  const { slug } = await props.params;
  const { status, tab: rawTab } = await props.searchParams;
  const company = await getCompany(slug);
  if (!company) notFound();
  const tab: RecruiterTab = rawTab === "codes" || rawTab === "about" ? rawTab : "candidates";

  return (
    <div className="flex flex-1 flex-col">
      {tab !== "about" && <AutoRefresh seconds={10} />}
      <RecruiterHeader company={company} />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pb-[calc(var(--tabbar)_+_1.5rem)] pt-4">
        {tab === "candidates" && <CandidatesTab company={company} status={status} />}
        {tab === "codes" && <CodesTab company={company} />}
        {tab === "about" && <AboutTab company={company} />}
      </main>
      <TabBar slug={slug} active={tab} />
    </div>
  );
}

async function CodesTab({ company }: { company: Company }) {
  const codes = await listUnusedCodes(company.test_id);
  return <PrintCodes slug={company.slug} codes={codes} max={MAX_CODES_PER_BATCH} days={PRINTED_CODE_DAYS} />;
}

async function CandidatesTab({ company, status }: { company: Company; status: string | string[] | undefined }) {
  const slug = company.slug;
  const all = await listCandidates(company.test_id);
  const filter = isStatus(status) ? status : null;
  const shown = filter ? all.filter((c) => c.status === filter) : all;
  const counts = Object.fromEntries(STATUSES.map((s) => [s, all.filter((c) => c.status === s).length]));
  const finished = all.filter((c) => c.finished_at).length;

  return (
    <>
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-slate-900">{all.length}</span> candidates ·{" "}
        <span className="font-semibold text-slate-900">{finished}</span> finished ·{" "}
        {company.task_count} tasks, ≈ {Math.max(1, Math.round(company.expected_sec / 60))} min
      </p>

      <nav className="-mx-4 flex overflow-x-auto border-b border-slate-200 px-4 [scrollbar-width:none]" aria-label="Filter by status">
        <FilterChip href={`/r/${slug}`} active={!filter} label="All" count={all.length} />
        {STATUSES.filter((s) => counts[s] > 0 || s === filter).map((s) => (
          <FilterChip key={s} href={`/r/${slug}?status=${s}`} active={filter === s} label={STATUS_LABELS[s].label} count={counts[s]} />
        ))}
      </nav>

      <p className="text-sm text-slate-600">Newest first. No scores or ranking: you decide.</p>

      {shown.length === 0 && (
        <p className="border border-slate-200 bg-white p-4 text-center text-slate-500">No candidates here yet.</p>
      )}

      <ul className="flex flex-col gap-3">
        {shown.map((c) => (
          <li key={c.id}>
            <Link href={`/r/${slug}/a/${c.id}`}
              className="tap flex items-center gap-3 border border-slate-200 bg-white p-4 active:bg-slate-50">
              <AvatarBadge emoji={c.avatar_emoji} color={c.avatar_color} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-bold">{c.avatar_name}</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold ${STATUS_LABELS[c.status].className}`}>
                    {STATUS_LABELS[c.status].label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {c.finished_at
                    ? `Finished ${formatClock(c.finished_at)} · ${formatDuration(c.total_ms)}`
                    : `In progress · ${c.answered}/${company.task_count} tasks`}
                  {" · "}{LANG_SHORT[c.lang] ?? c.lang}
                  {c.own_pace && " · own pace"}
                </p>
                {c.invite_code && <p className="mt-0.5 text-sm font-semibold text-slate-900">Booth code {c.invite_code}</p>}
              </div>
              <span className="text-xl text-slate-300" aria-hidden>›</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function FilterChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`-mb-px flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-semibold ${
      active ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500"
    }`}>
      {label}
      <span className="font-normal text-slate-400">{count}</span>
    </Link>
  );
}

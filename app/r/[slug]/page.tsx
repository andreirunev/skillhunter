import Link from "next/link";
import { notFound } from "next/navigation";
import { AvatarBadge } from "@/components/Avatar";
import { AutoRefresh } from "@/components/AutoRefresh";
import { RecruiterHeader } from "@/components/RecruiterHeader";
import { getCompany, isStatus, listCandidates, STATUSES } from "@/lib/recruiter";
import { formatClock, formatDuration, LANG_SHORT, STATUS_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CandidatesPage(props: PageProps<"/r/[slug]">) {
  const { slug } = await props.params;
  const { status } = await props.searchParams;
  const company = await getCompany(slug);
  if (!company) notFound();

  const all = await listCandidates(company.test_id);
  const filter = isStatus(status) ? status : null;
  const shown = filter ? all.filter((c) => c.status === filter) : all;
  const counts = Object.fromEntries(STATUSES.map((s) => [s, all.filter((c) => c.status === s).length]));
  const finished = all.filter((c) => c.finished_at).length;

  return (
    <div className="flex flex-1 flex-col">
      <AutoRefresh seconds={10} />
      <RecruiterHeader company={company} active="candidates" />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-5 pb-16 pt-5">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{all.length}</span> candidates ·{" "}
          <span className="font-semibold text-slate-900">{finished}</span> finished ·{" "}
          {company.task_count} tasks, ≈ {Math.max(1, Math.round(company.expected_sec / 60))} min
        </p>

        <nav className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" aria-label="Filter by status">
          <FilterChip href={`/r/${slug}`} active={!filter} label="All" count={all.length} />
          {STATUSES.filter((s) => counts[s] > 0 || s === filter).map((s) => (
            <FilterChip key={s} href={`/r/${slug}?status=${s}`} active={filter === s} label={STATUS_LABELS[s].label} count={counts[s]} />
          ))}
        </nav>

        <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          🧭 Newest first. No scores, no ranking: open a candidate and decide yourself.
        </p>

        {shown.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-slate-500 ring-1 ring-slate-200">No candidates here yet.</p>
        )}

        <ul className="flex flex-col gap-3">
          {shown.map((c) => (
            <li key={c.id}>
              <Link href={`/r/${slug}/a/${c.id}`}
                className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition active:scale-[0.99]">
                <AvatarBadge emoji={c.avatar_emoji} color={c.avatar_color} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-bold">{c.avatar_name}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_LABELS[c.status].className}`}>
                      {STATUS_LABELS[c.status].label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {c.finished_at
                      ? `Finished ${formatClock(c.finished_at)} · ${formatDuration(c.total_ms)}`
                      : `In progress · ${c.answered}/${company.task_count} tasks`}
                    {" · "}{LANG_SHORT[c.lang] ?? c.lang}
                    {c.own_pace && " · 🐢 own pace"}
                  </p>
                  {c.invite_code && <p className="mt-0.5 text-sm font-semibold text-brand-800">📍 Code {c.invite_code}</p>}
                </div>
                <span className="text-xl text-slate-300" aria-hidden>›</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

function FilterChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link href={href} className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${
      active ? "bg-slate-900 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
    }`}>
      {label}
      <span className={active ? "text-white/70" : "text-slate-400"}>{count}</span>
    </Link>
  );
}

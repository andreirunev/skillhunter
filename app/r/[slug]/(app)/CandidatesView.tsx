"use client";

import { useState } from "react";
import { CircleDot, Handshake, Send, ThumbsUp, Ticket } from "lucide-react";
import { FilterPills } from "@/components/ui/FilterPills";
import { AvatarTile, ListRow } from "@/components/ui/ListRow";
import { SectionLabel } from "@/components/ui/ScreenTitle";
import { SearchInput } from "@/components/ui/SearchInput";
import { Segmented } from "@/components/ui/Segmented";
import { StatCard } from "@/components/ui/StatCard";
import { STATUS_TEXT, StatusPill } from "@/components/ui/StatusPill";
import type { Status } from "@/lib/recruiter";

export type CandidateItem = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: Status;
  finishedAt: number | null;
  sub: string;
  inviteCode: string | null;
};

type Scope = "mine" | "all";
type Filter = Status | "all";

const SCOPES = [
  { value: "mine", label: "Mine" },
  { value: "all", label: "All" },
] as const;

const FILTER_ORDER: Status[] = ["new", "invited", "at_booth", "good_fit", "needs_review", "not_now", "interview"];
const FILTERS = [{ value: "all" as Filter, label: "All" }, ...FILTER_ORDER.map((s) => ({ value: s as Filter, label: STATUS_TEXT[s] }))];

const STATS = [
  { status: "new", icon: CircleDot, tone: "muted" },
  { status: "invited", icon: Send, tone: "info" },
  { status: "at_booth", icon: Handshake, tone: "info" },
  { status: "good_fit", icon: ThumbsUp, tone: "ok" },
] as const;

// Items arrive newest first and stay in that order. "Mine" = candidates the
// recruiter has put a label on. Nothing here sorts or filters by results.
export function CandidatesView({ slug, items }: { slug: string; items: CandidateItem[] }) {
  const [scope, setScope] = useState<Scope>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const shown = items.filter((c) =>
    (scope === "all" || c.status !== "new") &&
    (filter === "all" || c.status === filter) &&
    (!q || c.name.toLowerCase().includes(q) || c.inviteCode?.toLowerCase().includes(q)));

  // Default view: finished candidates without a decision first (newest
  // finish first), then everyone else in arrival order.
  const split = scope === "all" && filter === "all" && !q;
  const needs = split
    ? shown.filter((c) => c.status === "new" && c.finishedAt !== null).sort((a, b) => b.finishedAt! - a.finishedAt!)
    : [];
  const rest = split ? shown.filter((c) => !needs.includes(c)) : shown;
  const restLabel = split
    ? "Everyone else"
    : q ? "Results" : filter !== "all" ? STATUS_TEXT[filter] : "Marked by you";

  function pickStat(status: Status) {
    setScope("all");
    setFilter(filter === status ? "all" : status);
  }

  return (
    <>
      <Segmented label="Whose candidates" options={SCOPES} value={scope} onChange={setScope} />

      <div className="grid grid-cols-2 gap-3">
        {STATS.map((s) => (
          <StatCard key={s.status} label={STATUS_TEXT[s.status]} icon={s.icon} tone={s.tone}
            value={items.filter((c) => c.status === s.status).length}
            active={filter === s.status} onClick={() => pickStat(s.status)} />
        ))}
      </div>

      <SearchInput label="Search candidates" placeholder="Search name or booth code" value={query} onChange={setQuery} />
      <FilterPills label="Filter by status" options={FILTERS} value={filter} onChange={setFilter} />

      {needs.length > 0 && <Section label={`Needs your call · ${needs.length}`} slug={slug} items={needs} />}
      {(rest.length > 0 || needs.length === 0) && <Section label={`${restLabel} · ${rest.length}`} slug={slug} items={rest} />}
    </>
  );
}

function Section({ label, slug, items }: { label: string; slug: string; items: CandidateItem[] }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionLabel>{label}</SectionLabel>
      {items.length === 0 ? (
        <p className="rounded-card border border-border bg-card p-4 text-center text-sm text-muted">No candidates here yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((c) => (
            <li key={c.id}>
              <ListRow href={`/r/${slug}/a/${c.id}`} title={c.name} sub={c.sub}
                leading={<AvatarTile emoji={c.emoji} color={c.color} />}
                meta={c.inviteCode && (
                  <span className="inline-flex items-center gap-1"><Ticket className="size-3.5" aria-hidden />{c.inviteCode}</span>
                )}
                trailing={<StatusPill status={c.status} />} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

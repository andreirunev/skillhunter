"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { CircleDot, Handshake, Lock, Send, ThumbsUp } from "lucide-react";
import { FindByCode, type CodeMatch } from "@/components/FindByCode";
import { FilterPills } from "@/components/ui/FilterPills";
import { AvatarTile, ListRow } from "@/components/ui/ListRow";
import { SectionLabel } from "@/components/ui/ScreenTitle";
import { SearchInput } from "@/components/ui/SearchInput";
import { joinSep } from "@/components/ui/Sep";
import { Segmented } from "@/components/ui/Segmented";
import { StatCard } from "@/components/ui/StatCard";
import { STATUS_TEXT, StatusPill } from "@/components/ui/StatusPill";
import type { Status } from "@/lib/recruiter";
import type { Contact } from "@/lib/stage";

export type CandidateItem = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: Status;
  finishedAt: number | null;
  sub: string[]; // facts, shown with dividers between them
  contact: Contact | null; // set only once the candidate shared details with consent
};

type Scope = "anonymous" | "shortlist";
type Filter = Status | "all";

const SCOPES = [
  { value: "anonymous", label: "Anonymous" },
  { value: "shortlist", label: "Shortlist" },
] as const;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "good_fit", label: "Good fit" },
  { value: "needs_review", label: "Check" },
  { value: "not_now", label: "Not now" },
];

const STATS = [
  { status: "new", icon: CircleDot, tone: "muted" },
  { status: "invited", icon: Send, tone: "info" },
  { status: "at_booth", icon: Handshake, tone: "info" },
  { status: "good_fit", icon: ThumbsUp, tone: "ok" },
] as const;

// Items arrive newest first and stay in that order. Two levels: Anonymous
// (avatar only, no contact data, found by code) and Shortlist (offered a full
// interview and shared contact details by consent, found by name). Nothing
// here sorts or filters by results.
export function CandidatesView({ slug, items, focusCode = false }: { slug: string; items: CandidateItem[]; focusCode?: boolean }) {
  const [scope, setScope] = useState<Scope>("anonymous");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [code, setCode] = useState<CodeMatch>(undefined);

  const pool = items.filter((c) => (scope === "shortlist") === (c.contact !== null));
  const q = scope === "shortlist" ? query.trim().toLowerCase() : "";
  // A code match is a direct lookup: it shows that one candidate, whatever the chips say.
  const shown = code !== undefined ? items.filter((c) => c.id === code) : pool.filter((c) =>
    (filter === "all" || c.status === filter) &&
    (!q || [c.name, c.contact?.full_name, c.contact?.phone, c.contact?.email]
      .some((x) => x?.toLowerCase().includes(q))));

  // Default anonymous view: finished candidates without a decision first
  // (newest finish first), then everyone else in arrival order.
  const split = scope === "anonymous" && filter === "all" && code === undefined;
  const needs = split
    ? shown.filter((c) => c.status === "new" && c.finishedAt !== null).sort((a, b) => b.finishedAt! - a.finishedAt!)
    : [];
  const rest = split ? shown.filter((c) => !needs.includes(c)) : shown;
  const restLabel = split
    ? "Everyone else"
    : code !== undefined ? "Code match"
    : q ? "Results"
    : filter !== "all" ? FILTERS.find((f) => f.value === filter)?.label ?? STATUS_TEXT[filter]
    : "Shared contact details";

  function pickScope(next: Scope) {
    setScope(next);
    setQuery("");
    setCode(undefined); // the code field unmounts with the Anonymous tab
  }

  function pickStat(status: Status) {
    setFilter(filter === status ? "all" : status);
  }

  return (
    <>
      <Segmented label="Candidate level" options={SCOPES} value={scope} onChange={pickScope} />
      {/* Keyed by tab, so switching tabs remounts it and it fades in (.page-in). */}
      <div key={scope} className="page-in flex flex-col gap-4">
        {scope === "shortlist" && <SearchInput label="Search candidates" placeholder="Search name" value={query} onChange={setQuery} />}
        {scope === "shortlist" && (
          <p className="flex items-start gap-2 rounded-card border border-border bg-card p-3 text-[13px] text-muted">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            Contact data is shared only by the candidate&apos;s consent. Delete with event data.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {STATS.map((s) => (
            <StatCard key={s.status} label={STATUS_TEXT[s.status]} icon={s.icon} tone={s.tone}
              value={pool.filter((c) => c.status === s.status).length}
              active={filter === s.status} onClick={() => pickStat(s.status)} />
          ))}
        </div>

        {scope === "anonymous" && <FindByCode slug={slug} autoFocus={focusCode} onMatch={setCode} />}
        <FilterPills label="Filter by status" options={FILTERS} value={filter} onChange={setFilter} />

        {needs.length > 0 && <Section label={joinSep(["Needs your call", needs.length])} slug={slug} items={needs} />}
        {(rest.length > 0 || needs.length === 0) && <Section label={joinSep([restLabel, rest.length])} slug={slug} items={rest} />}
      </div>
    </>
  );
}

function Section({ label, slug, items }: { label: ReactNode; slug: string; items: CandidateItem[] }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionLabel>{label}</SectionLabel>
      {items.length === 0 ? (
        <p className="rounded-card border border-border bg-card p-4 text-center text-sm text-muted">No candidates here yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((c) => (
            <li key={c.id}>
              {c.contact ? <ShortlistRow slug={slug} item={c} contact={c.contact} /> : <ListRow href={`/r/${slug}/a/${c.id}`} title={c.name} sub={joinSep(c.sub)}
                leading={<AvatarTile emoji={c.emoji} color={c.color} />}
                trailing={<StatusPill status={c.status} />} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Shortlisted candidate: the details they chose to share, then the usual facts.
function ShortlistRow({ slug, item: c, contact }: { slug: string; item: CandidateItem; contact: Contact }) {
  return (
    <Link href={`/r/${slug}/a/${c.id}`} className="tap flex items-start gap-3 rounded-card border border-border bg-card p-3 active:bg-track">
      <AvatarTile emoji={c.emoji} color={c.color} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-snug">{contact.full_name}</p>
        {contact.phone && <p className="mt-0.5 truncate text-sm">{contact.phone}</p>}
        {contact.email && <p className="mt-0.5 truncate text-sm">{contact.email}</p>}
        <p className="mt-1 truncate text-[13px] text-muted">{joinSep([c.name, ...c.sub])}</p>
      </div>
      <div className="shrink-0"><StatusPill status={c.status} /></div>
    </Link>
  );
}

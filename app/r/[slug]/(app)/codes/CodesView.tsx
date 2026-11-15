"use client";

import { useActionState, useCallback, useEffect, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, CircleCheck, CircleDot, Printer } from "lucide-react";
import { FlagMini } from "@/components/FlagLoader";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { FilterPills } from "@/components/ui/FilterPills";
import { SectionLabel } from "@/components/ui/ScreenTitle";
import { joinSep } from "@/components/ui/Sep";
import { StatCard } from "@/components/ui/StatCard";
import { toast } from "@/components/ui/Toast";
import type { ListedCode } from "@/lib/recruiter";
import { TICKETS_PER_SHEET } from "@/lib/tickets";
import { createCodes, deleteBatch } from "../actions";

type Batch = { id: string; size: number; taken: number; created: string; contest: string };
// note: why it cannot get codes ("Offline" or "Draft"), empty when live.
type ContestOption = { id: string; title: string; live: boolean; note: string };

const SHOWN_CODES = 30;

// Print tickets for one contest (rounded up to full A4 sheets; with several
// contests, or one that is not live, the recruiter picks one, preselected when
// only one is live; Offline and Draft contests are listed but disabled),
// reprint or delete a recent batch, and a small list of codes, filterable by
// contest. A free tile copies its one code; a taken tile only says "Taken"
// (never who or when). Deleting a batch hides it and its free codes at once
// and brings them back if the server says no.
export function CodesView({ slug, free, taken, codes, contests, preselect, contestLabels, batches, max, days, highlight }: {
  slug: string;
  free: number;
  taken: number;
  codes: ListedCode[];
  contests: ContestOption[];
  preselect: string;
  contestLabels: { question: string; choose: string };
  batches: Batch[];
  max: number;
  days: number;
  highlight: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createCodes, { error: "", created: 0, batch: null });
  const [count, setCount] = useState("10");
  const [contest, setContest] = useState(preselect);
  const showBatchContest = new Set(batches.map((b) => b.contest)).size > 1;
  const [pick, setPick] = useState("all");
  const [confirm, setConfirm] = useState<Batch | null>(null);
  const closeConfirm = useCallback(() => setConfirm(null), []);
  const [, startDelete] = useTransition();
  const [gone, hide] = useOptimistic<string[], string>([], (ids, id) => [...ids, id]);

  const shownBatches = batches.filter((b) => !gone.includes(b.id));
  const freeNow = free - batches.filter((b) => gone.includes(b.id)).reduce((n, b) => n + b.size - b.taken, 0);
  const allCodes = codes.filter((c) => c.taken || !gone.includes(c.batch));
  const titles = new Map(contests.map((c) => [c.id, c.title]));
  const perContest = contests
    .map((c) => ({ id: c.id, title: c.title, n: allCodes.filter((x) => x.contest === c.id).length }))
    .filter((c) => c.n > 0);
  const chips = [{ value: "all", label: "All" }, ...perContest.map((c) => ({ value: c.id, label: `${c.title} ${c.n}` }))];
  const filter = chips.some((c) => c.value === pick) ? pick : "all"; // its codes may all be gone
  const shownCodes = filter === "all" ? allCodes : allCodes.filter((c) => c.contest === filter);

  const asked = Number(count);
  const valid = Number.isInteger(asked) && asked >= 1 && asked <= max;
  const tickets = valid ? Math.min(max, Math.ceil(asked / TICKETS_PER_SHEET) * TICKETS_PER_SHEET) : 0;
  const sheets = tickets / TICKETS_PER_SHEET;

  // New batch: straight to its print view, which opens the print dialog.
  useEffect(() => {
    if (state.batch) router.push(`/r/${slug}/print/${state.batch}?auto=1`);
  }, [state, router, slug]);

  function remove(b: Batch) {
    setConfirm(null);
    startDelete(async () => {
      hide(b.id);
      const ok = await deleteBatch(slug, b.id).catch(() => false);
      toast(ok ? "Batch deleted" : "Could not delete the batch. Try again.");
    });
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast("Copied");
    } catch {
      toast("Copy did not work here. Long-press the code.");
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Free" value={freeNow} icon={CircleDot} tone="ok" />
        <StatCard label="Taken" value={taken} icon={CircleCheck} tone="muted" />
      </div>

      <section className="flex flex-col gap-3">
        <SectionLabel>Print tickets</SectionLabel>
        <form action={formAction}
          className={`flex flex-col gap-3 rounded-card border bg-card p-4 ${highlight ? "border-fg/60" : "border-border"}`}>
          <input type="hidden" name="slug" value={slug} />
          {contests.length > 1 || !contests[0]?.live ? (
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {contestLabels.question}
              <select name="contest" required value={contest} onChange={(e) => setContest(e.target.value)}
                className="h-11 w-full border border-border bg-bg px-3 text-base font-semibold text-fg outline-none focus:border-fg/40">
                <option value="" disabled>{contestLabels.choose}</option>
                {contests.map((c) => (
                  <option key={c.id} value={c.id} disabled={!c.live}>{c.live ? c.title : `${c.title} (${c.note})`}</option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="contest" value={contest} />
          )}
          <label className="flex items-center justify-between gap-3 text-sm font-semibold">
            How many tickets
            <input name="count" type="number" inputMode="numeric" min={1} max={max} required
              value={count} onChange={(e) => setCount(e.target.value)}
              className="h-11 w-24 rounded-btn border border-border bg-bg px-3 text-right text-base font-semibold tabular-nums outline-none focus:border-fg/40" />
          </label>
          <p className="text-[13px] text-muted">
            {valid
              ? `${tickets} tickets on ${sheets} A4 sheet${sheets === 1 ? "" : "s"} (${TICKETS_PER_SHEET} per sheet, rounded up).`
              : `Choose 1 to ${max}.`}
          </p>
          <button type="submit" disabled={pending || !valid || !contest} aria-busy={pending} className="ui-btn ui-btn-primary min-h-12 w-full text-base">
            {pending ? <><FlagMini />Creating…</> : <><Printer className="size-4" aria-hidden />Create and print</>}
          </button>
          <p aria-live="polite" className={`text-[13px] ${state.error ? "font-medium text-bad" : "text-muted"}`}>
            {state.error || `Each code works once and expires after ${days} days.`}
          </p>
          <Link href={`/r/${slug}/tickets`} className="tap -my-1 inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold">
            Edit ticket template<ChevronRight className="size-4" aria-hidden />
          </Link>
        </form>
      </section>

      {shownBatches.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionLabel>{joinSep(["Recent batches", shownBatches.length])}</SectionLabel>
          <ul className="flex flex-col gap-2">
            {shownBatches.map((b) => (
              <li key={b.id} className="flex items-stretch rounded-card border border-border bg-card">
                <Link href={`/r/${slug}/print/${b.id}`}
                  className="tap flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-l-card py-2.5 pl-3.5 pr-3 active:bg-track">
                  <Printer className="size-4 shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{joinSep([`${b.size} tickets`, b.created])}</span>
                    {showBatchContest && <span className="block truncate text-[13px] text-muted">{b.contest}</span>}
                    <span className="block text-[13px] text-muted">{joinSep([`${b.size - b.taken} free`, `${b.taken} taken`])}</span>
                  </span>
                  <span className="text-sm font-semibold">Reprint</span>
                </Link>
                <button type="button" onClick={() => setConfirm(b)} aria-label={`Delete batch: ${b.size} tickets, ${b.created}`}
                  className="tap shrink-0 rounded-r-card border-l border-border px-3.5 text-sm font-semibold text-bad/80 active:bg-track">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ActionSheet open={confirm !== null} title="Delete this batch?" onClose={closeConfirm}>
        <p className="mb-1 text-sm text-muted">
          Unused codes will stop working.
          {confirm && confirm.taken > 0 && ` ${confirm.taken} code${confirm.taken === 1 ? " is" : "s are"} already used and will be kept.`}
        </p>
        <button type="button" onClick={() => confirm && remove(confirm)} className="ui-btn min-h-12 border-bad bg-bad text-base text-white">Delete</button>
      </ActionSheet>

      <section className="flex flex-col gap-3">
        <SectionLabel>{joinSep(["Codes", shownCodes.length])}</SectionLabel>
        {allCodes.length > 0 && <FilterPills label="Filter codes by contest" options={chips} value={filter} onChange={setPick} />}
        {shownCodes.length === 0 ? (
          <p className="rounded-card border border-border bg-card p-4 text-center text-sm text-muted">No codes yet. Print some above.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {shownCodes.slice(0, SHOWN_CODES).map((c) => (
              <li key={c.code}>
                {c.taken ? (
                  <div className="flex flex-col items-center gap-1.5 rounded-tile border border-border bg-card px-1 py-2.5 opacity-55">
                    <span className="font-mono text-sm font-bold tracking-wider text-muted line-through decoration-1">{c.code}</span>
                    <span className="w-full truncate px-1 text-center text-[11px] text-muted">{titles.get(c.contest)}</span>
                    <span className="rounded-pill bg-fg/10 px-2 py-0.5 text-[11px] font-semibold text-muted">Taken</span>
                  </div>
                ) : (
                  <button type="button" onClick={() => copy(c.code)} aria-label={`Copy code ${c.code}`}
                    className="flex w-full flex-col items-center gap-1.5 rounded-tile border border-border bg-card px-1 py-2.5 active:bg-track">
                    <span className="font-mono text-sm font-bold tracking-wider">{c.code}</span>
                    <span className="w-full truncate px-1 text-center text-[11px] text-muted">{titles.get(c.contest)}</span>
                    <span className="rounded-pill bg-ok/15 px-2 py-0.5 text-[11px] font-semibold text-ok">Free</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {shownCodes.length > SHOWN_CODES && (
          <p className="text-[13px] text-muted">and {shownCodes.length - SHOWN_CODES} more</p>
        )}
      </section>
    </>
  );
}

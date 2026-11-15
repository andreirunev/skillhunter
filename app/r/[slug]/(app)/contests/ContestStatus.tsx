"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "@/components/ui/Toast";
import { setContestStatus } from "../actions";

export type ContestStatusLabels = {
  live: string;
  offline: string;
  draft: string;
  goOffline: string;
  goLive: string;
  publishFirst: string;
  failed: string;
};

// Status chip of one contest, also its Live/Offline switch. Optimistic: it
// flips at once and the refreshed page confirms it (or it flips back with a
// toast). A Draft, never published, is disabled: edit and publish it first.
// The chip looks small; the button around it is 44px tall.
export function ContestStatus({ slug, contestId, published, live, labels }: {
  slug: string;
  contestId: string;
  published: boolean;
  live: boolean;
  labels: ContestStatusLabels;
}) {
  const [shownLive, setShownLive] = useOptimistic(live);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !shownLive;
    startTransition(async () => {
      setShownLive(next);
      if (!(await setContestStatus(slug, contestId, next))) toast(labels.failed);
    });
  }

  const on = published && shownLive;
  return (
    <button type="button" onClick={toggle} disabled={!published} aria-pressed={on}
      title={!published ? labels.publishFirst : on ? labels.goOffline : labels.goLive}
      className="-my-2.5 inline-flex min-h-11 shrink-0 items-center disabled:cursor-not-allowed">
      <span className={`inline-flex h-6 items-center gap-1.5 rounded-[2px] border px-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${
        on ? "border-ok/40 text-ok" : published ? "border-muted/50 text-muted" : "border-border text-muted/70"}`}>
        <span aria-hidden className={`size-1.5 rounded-[1px] ${on ? "bg-ok" : published ? "border border-muted" : "hidden"}`} />
        {!published ? labels.draft : on ? labels.live : labels.offline}
      </span>
    </button>
  );
}

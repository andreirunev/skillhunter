"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Ellipsis } from "lucide-react";
import { useCandidateStatus } from "@/components/CandidateStatus";
import { Spinner } from "@/components/Spinner";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { STATUS_TEXT } from "@/components/ui/StatusPill";
import { toast } from "@/components/ui/Toast";
import type { Status } from "@/lib/recruiter";

type Action = { status: Status; label: string };

const isStatus = (x: unknown): x is Status => typeof x === "string" && Object.hasOwn(STATUS_TEXT, x);

const INVITE: Action = { status: "invited", label: "Invite to booth" };
const ARRIVED: Action = { status: "at_booth", label: "Arrived" };
const INTERVIEW: Action = { status: "interview", label: "Interview" };
const MORE: Action[] = [
  ARRIVED,
  { status: "good_fit", label: "Good fit" },
  { status: "needs_review", label: "Review" },
  INTERVIEW,
  { status: "not_now", label: "Not now" },
];

// The next step of the booth flow is the primary button.
function primaryFor(status: Status, code: string | null): Action {
  if (!code) return INVITE;
  return status === "invited" ? ARRIVED : INTERVIEW;
}

type Saving = { status: Status; from: "primary" | "more" };

// Bar fixed above the tab bar: every label on a person is set here, by a
// human. Primary next step + "More" (sheet with the other labels). The saved
// result comes straight from the API response; the page refresh follows.
export function ActionBar() {
  const router = useRouter();
  const { attemptId, status, code, setSaved } = useCandidateStatus();
  const [saving, setSaving] = useState<Saving | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const closeSheet = useCallback(() => setSheet(false), []);

  async function save(next: Status, from: Saving["from"]) {
    setSheet(false);
    setSaving({ status: next, from });
    setError(null);
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 15_000);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
        signal: abort.signal,
      });
      const data: { status?: unknown; code?: string | null; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !isStatus(data.status)) {
        setError(`Could not save (${data.error ?? `HTTP ${res.status}`}). Tap again.`);
        return;
      }
      setSaved({ status: data.status, code: data.code ?? null });
      toast("Saved", 2000);
      router.refresh(); // the list and stats pick it up in the background
    } catch {
      setError(abort.signal.aborted ? "No answer from the server. Tap again." : "Network error. Tap again.");
    } finally {
      clearTimeout(timer);
      setSaving(null);
    }
  }

  const busy = saving !== null;
  const primary = primaryFor(status, code);
  const primaryOn = status === primary.status;
  const info = error ?? (code ? `Booth code ${code}` : "Your call. Nothing is decided automatically.");

  return (
    <>
      <div data-dock className="fixed inset-x-0 bottom-(--tabbar) z-20 border-t border-border bg-bg px-4 pb-3 pt-2 lg:left-(--rail)">
        <div className="mx-auto flex max-w-[720px] flex-col gap-2">
          <p aria-live="polite" className={`truncate text-[13px] ${error ? "font-semibold text-bad" : code ? "font-semibold text-fg" : "text-muted"}`}>
            {info}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => save(primary.status, "primary")} disabled={busy}
              aria-pressed={primaryOn} aria-busy={saving?.from === "primary"}
              className="ui-btn ui-btn-primary min-h-12 px-2 text-base">
              {saving?.from === "primary"
                ? <><Spinner />Saving…</>
                : <>{primaryOn && <Check className="size-4" strokeWidth={2.75} aria-hidden />}{primary.label}</>}
            </button>
            <button type="button" onClick={() => setSheet(true)} disabled={busy}
              aria-haspopup="dialog" aria-busy={saving?.from === "more"}
              className="ui-btn ui-btn-secondary min-h-12 px-2 text-base">
              {saving?.from === "more" ? <><Spinner />Saving…</> : <><Ellipsis className="size-4" aria-hidden />More</>}
            </button>
          </div>
        </div>
      </div>

      <ActionSheet open={sheet} title="Set status · your call" onClose={closeSheet}>
        {MORE.map((a) => {
          const on = status === a.status;
          return (
            <button key={a.status} type="button" onClick={() => save(a.status, "more")} aria-pressed={on}
              className={`ui-btn min-h-12 justify-between text-base ${on ? "ui-btn-primary" : "ui-btn-secondary"}`}>
              {a.label}
              {on && <Check className="size-4" strokeWidth={2.75} aria-hidden />}
            </button>
          );
        })}
      </ActionSheet>
    </>
  );
}

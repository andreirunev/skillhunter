"use client";

import { useCallback, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Ellipsis } from "lucide-react";
import { useCandidateStatus } from "@/components/CandidateStatus";
import { Spinner } from "@/components/Spinner";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { STATUS_TEXT } from "@/components/ui/StatusPill";
import { toast } from "@/components/ui/Toast";
import type { Status } from "@/lib/recruiter";
import { isRecruiterStage, isStage, normalizeInviteCode, type RecruiterStage, type Stage } from "@/lib/stage";

const isStatus = (x: unknown): x is Status => typeof x === "string" && Object.hasOwn(STATUS_TEXT, x);

// Labels the recruiter can put on a person at any time (never set by the system).
const LABELS: { status: Status; label: string }[] = [
  { status: "good_fit", label: "Good fit" },
  { status: "needs_review", label: "Review" },
  { status: "interview", label: "Interview" },
  { status: "not_now", label: "Not now" },
];

type Busy = "invite" | "start" | "next" | "close" | "status";
type Confirm = { to: RecruiterStage; from: Stage; busy: Busy };

function infoFor(stage: Stage, code: string | null): string {
  switch (stage) {
    case "mini_interview": return "Short interview started · your call on the next step";
    case "contact_requested": return "Waiting for candidate details";
    case "closed": return "Not this time · the candidate sees a polite thank-you";
    case "full_interview": return "Contact details received · see Identified";
    case "contact_declined": return "The candidate chose not to share details";
    default: return code ? "Invited · type the code from the candidate's phone" : "Your call. Nothing is decided automatically.";
  }
}

function confirmText({ to, from }: Confirm) {
  if (to === "contact_requested") return {
    title: "Request contact details?",
    body: "The candidate is asked for their name and a phone or email, with consent. They can say no. You can undo until they answer.",
    action: "Request contact details",
  };
  if (to === "closed") return {
    title: "Not this time?",
    body: "The candidate sees a polite thank-you, with no reasons or scores. You can undo this.",
    action: "Not this time",
  };
  return {
    title: from === "contact_requested" ? "Withdraw the contact request?" : "Undo “Not this time”?",
    body: "The candidate sees their booth invitation again.",
    action: "Undo",
  };
}

// Bar fixed above the tab bar. Every step on a person is a human tap here:
// invite, start the short interview with the candidate's code, then request
// contact details or "Not this time" (both confirmed, undoable until the
// candidate answers). "Set status" holds the recruiter's own labels.
export function ActionBar() {
  const router = useRouter();
  const { attemptId, status, code, stage, setSaved } = useCandidateStatus();
  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusSheet, setStatusSheet] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [typed, setTyped] = useState("");
  const closeStatus = useCallback(() => setStatusSheet(false), []);
  const closeConfirm = useCallback(() => setConfirm(null), []);

  async function call(path: string, body: object, kind: Busy): Promise<Record<string, unknown> | null> {
    setStatusSheet(false);
    setConfirm(null);
    setBusy(kind);
    setError(null);
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 15_000);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abort.signal,
      });
      const data: Record<string, unknown> = await res.json().catch(() => ({}));
      if (res.status === 409 && isStage(data.stage)) {
        setSaved({ stage: data.stage });
        setError("The candidate has already answered.");
        router.refresh();
        return null;
      }
      if (!res.ok) {
        setError(data.error === "wrong_code"
          ? "That code does not match. Check the candidate's phone."
          : `Could not save (${data.error ?? `HTTP ${res.status}`}). Tap again.`);
        return null;
      }
      toast("Saved", 2000);
      router.refresh(); // the list and stats pick it up in the background
      return data;
    } catch {
      setError(abort.signal.aborted ? "No answer from the server. Tap again." : "Network error. Tap again.");
      return null;
    } finally {
      clearTimeout(timer);
      setBusy(null);
    }
  }

  async function saveStatus(next: Status, kind: Busy) {
    const data = await call("status", { status: next }, kind);
    if (data && isStatus(data.status)) setSaved({ status: data.status, code: typeof data.code === "string" ? data.code : null });
  }

  async function start(e: FormEvent) {
    e.preventDefault();
    if (normalizeInviteCode(typed).length !== 4 || busy) return;
    const data = await call("start", { code: typed }, "start");
    if (data && isStage(data.stage) && isStatus(data.status)) {
      setSaved({ stage: data.stage, status: data.status });
      setTyped("");
    }
  }

  async function moveStage(c: Confirm) {
    const data = await call("stage", { stage: c.to }, c.busy);
    if (data && isRecruiterStage(data.stage)) setSaved({ stage: data.stage });
  }

  const label = (kind: Busy, text: ReactNode) => (busy === kind ? <><Spinner />Saving…</> : text);
  const moreButton = (
    <button type="button" onClick={() => setStatusSheet(true)} disabled={busy !== null}
      aria-haspopup="dialog" aria-label="Set status" aria-busy={busy === "status"}
      className="ui-btn ui-btn-secondary min-h-12 w-12 px-0">
      {busy === "status" ? <Spinner /> : <Ellipsis className="size-5" aria-hidden />}
    </button>
  );

  let buttons: ReactNode;
  if (stage === "mini_interview" || stage === "contact_requested" || stage === "closed") {
    const requested = stage === "contact_requested";
    const closed = stage === "closed";
    buttons = (
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <button type="button" disabled={busy !== null} aria-pressed={requested} aria-busy={busy === "next"}
          onClick={() => setConfirm({ to: requested ? "mini_interview" : "contact_requested", from: stage, busy: "next" })}
          className={`ui-btn min-h-12 px-2 text-sm ${closed ? "ui-btn-secondary" : "ui-btn-primary"}`}>
          {label("next", requested ? <><Check className="size-4" strokeWidth={2.75} aria-hidden />Details requested</> : "Request contact details")}
        </button>
        <button type="button" disabled={busy !== null} aria-pressed={closed} aria-busy={busy === "close"}
          onClick={() => setConfirm({ to: closed ? "mini_interview" : "closed", from: stage, busy: "close" })}
          className={`ui-btn min-h-12 px-2 text-sm ${closed ? "ui-btn-primary" : "ui-btn-secondary"}`}>
          {label("close", closed ? <><Check className="size-4" strokeWidth={2.75} aria-hidden />Not this time</> : "Not this time")}
        </button>
        {moreButton}
      </div>
    );
  } else if (stage === "anonymous" && code) {
    buttons = (
      <form onSubmit={start} className="grid grid-cols-[1fr_auto_auto] gap-2">
        <input value={typed} onChange={(e) => setTyped(e.target.value.toUpperCase())} disabled={busy !== null}
          aria-label="Candidate's 4-character code" placeholder="Candidate's 4-character code" maxLength={6}
          autoComplete="off" autoCapitalize="characters" spellCheck={false}
          className="min-h-12 w-full min-w-0 rounded-btn border border-border bg-card px-3 text-base font-semibold tracking-[0.08em] text-fg outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-muted focus:border-fg/40" />
        <button type="submit" disabled={busy !== null || normalizeInviteCode(typed).length !== 4} aria-busy={busy === "start"}
          className="ui-btn ui-btn-primary min-h-12 px-4 text-base">
          {label("start", "Start")}
        </button>
        {moreButton}
      </form>
    );
  } else if (stage === "anonymous") {
    buttons = (
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => saveStatus("invited", "invite")} disabled={busy !== null} aria-busy={busy === "invite"}
          className="ui-btn ui-btn-primary min-h-12 px-2 text-base">
          {label("invite", "Invite to booth")}
        </button>
        <button type="button" onClick={() => setStatusSheet(true)} disabled={busy !== null} aria-haspopup="dialog" aria-busy={busy === "status"}
          className="ui-btn ui-btn-secondary min-h-12 px-2 text-base">
          {label("status", "Set status")}
        </button>
      </div>
    );
  } else {
    // The candidate has answered the contact request: only labels remain.
    buttons = (
      <button type="button" onClick={() => setStatusSheet(true)} disabled={busy !== null} aria-haspopup="dialog" aria-busy={busy === "status"}
        className="ui-btn ui-btn-secondary min-h-12 w-full text-base">
        {label("status", "Set status")}
      </button>
    );
  }

  const info = error ?? infoFor(stage, code);
  const strong = error || stage === "contact_requested" || stage === "full_interview";
  const sheetText = confirm && confirmText(confirm);

  return (
    <>
      <div data-dock className="fixed inset-x-0 bottom-(--tabbar) z-20 border-t border-border bg-bg px-4 pb-3 pt-2 lg:left-(--rail)">
        <div className="mx-auto flex max-w-[720px] flex-col gap-2">
          <p aria-live="polite" className={`truncate text-[13px] ${error ? "font-semibold text-bad" : strong ? "font-semibold text-fg" : "text-muted"}`}>
            {info}
          </p>
          {buttons}
        </div>
      </div>

      <ActionSheet open={statusSheet} title="Set status · your call" onClose={closeStatus}>
        {LABELS.map((a) => {
          const on = status === a.status;
          return (
            <button key={a.status} type="button" onClick={() => saveStatus(a.status, "status")} aria-pressed={on}
              className={`ui-btn min-h-12 justify-between text-base ${on ? "ui-btn-primary" : "ui-btn-secondary"}`}>
              {a.label}
              {on && <Check className="size-4" strokeWidth={2.75} aria-hidden />}
            </button>
          );
        })}
      </ActionSheet>

      <ActionSheet open={confirm !== null} title={sheetText?.title ?? ""} onClose={closeConfirm}>
        {confirm && sheetText && (
          <>
            <p className="mb-1 text-base">{sheetText.body}</p>
            <button type="button" onClick={() => moveStage(confirm)} className="ui-btn ui-btn-primary min-h-12 text-base">
              {sheetText.action}
            </button>
          </>
        )}
      </ActionSheet>
    </>
  );
}

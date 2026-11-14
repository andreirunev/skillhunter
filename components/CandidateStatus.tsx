"use client";

import Link from "@/components/TransitionLink";
import { createContext, useContext, useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import type { Status } from "@/lib/recruiter";
import type { Stage } from "@/lib/stage";

// "invited" and "verified" only: the interview code never reaches the recruiter.
type Saved = { status: Status; invited: boolean; verified: boolean; stage: Stage };
type Value = Saved & { attemptId: string; setSaved: (patch: Partial<Saved>) => void };

const Ctx = createContext<Value | null>(null);

// The candidate's current label, invitation, code check and booth-flow
// stage, shared by the top bar pill and the action bar, so a saved decision
// shows at once without a reload. A server refresh (e.g. the candidate shared
// details) replaces it. Keyed by attempt id in the parent.
export function CandidateStatusProvider({ attemptId, status, invited, verified, stage, children }: Saved & {
  attemptId: string;
  children: ReactNode;
}) {
  const [saved, setSavedState] = useState<Saved>({ status, invited, verified, stage });
  const [server, setServer] = useState<Saved>({ status, invited, verified, stage });
  if (server.status !== status || server.invited !== invited || server.verified !== verified || server.stage !== stage) {
    setServer({ status, invited, verified, stage });
    setSavedState({ status, invited, verified, stage });
  }
  const setSaved = (patch: Partial<Saved>) => setSavedState((s) => ({ ...s, ...patch }));
  return <Ctx.Provider value={{ ...saved, attemptId, setSaved }}>{children}</Ctx.Provider>;
}

export function useCandidateStatus() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useCandidateStatus needs CandidateStatusProvider");
  return value;
}

// Sticky top bar: Back, name, current label.
export function DetailTopBar({ backHref, name }: { backHref: string; name: string }) {
  const { status } = useCandidateStatus();
  return (
    <div className="sticky top-0 z-10 -mx-4 grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-border bg-bg px-4 py-1">
      <Link href={backHref} className="tap -ml-2 inline-flex min-h-11 items-center gap-0.5 pr-2 text-sm font-medium text-muted">
        <ChevronLeft className="size-5" aria-hidden />Back
      </Link>
      <p className="truncate text-center text-base font-semibold">{name}</p>
      <StatusPill status={status} />
    </div>
  );
}

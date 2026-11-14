"use client";

import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import type { Status } from "@/lib/recruiter";

type Saved = { status: Status; code: string | null };
type Value = Saved & { attemptId: string; setSaved: (s: Saved) => void };

const Ctx = createContext<Value | null>(null);

// The candidate's current label and booth code, shared by the top bar pill
// and the action bar, so a saved decision shows at once without a reload.
// Keyed by attempt id in the parent.
export function CandidateStatusProvider({ attemptId, status, code, children }: {
  attemptId: string;
  status: Status;
  code: string | null;
  children: ReactNode;
}) {
  const [saved, setSaved] = useState<Saved>({ status, code });
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

"use client";

import { useCallback, useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { FlagMini } from "@/components/FlagLoader";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { toast } from "@/components/ui/Toast";
import { resetDemo } from "../actions";

// Demo only: wipes every demo booth's candidates and codes, then seeds the
// synthetic data again. Confirmed in a sheet.
export function ResetDemo() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const close = useCallback(() => setOpen(false), []);

  function confirm() {
    setOpen(false);
    start(async () => {
      const ok = await resetDemo();
      toast(ok ? "Demo data reset" : "Could not reset. Try again.");
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={pending} aria-busy={pending}
        className="ui-btn ui-btn-secondary text-bad">
        {pending ? <><FlagMini />Resetting…</> : <><RotateCcw className="size-4" aria-hidden />Reset demo data</>}
      </button>
      <ActionSheet open={open} title="Reset all demo booths?" onClose={close}>
        <p className="mb-1 text-sm text-muted">Deletes every candidate, note and booth code, then loads the synthetic demo data again.</p>
        <button type="button" onClick={confirm} className="ui-btn min-h-12 border-bad bg-bad text-base text-white">Reset demo data</button>
      </ActionSheet>
    </>
  );
}

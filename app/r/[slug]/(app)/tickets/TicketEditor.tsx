"use client";

import { useActionState, useEffect, useState } from "react";
import { FlagMini } from "@/components/FlagLoader";
import { Ticket } from "@/components/Ticket";
import { SectionLabel } from "@/components/ui/ScreenTitle";
import { toast } from "@/components/ui/Toast";
import { TICKET_LIMITS, type TicketTemplate } from "@/lib/tickets";
import { saveTicketTemplate } from "../actions";

const FIELDS: { key: keyof TicketTemplate; label: string; long?: boolean }[] = [
  { key: "companyName", label: "Company name" },
  { key: "booth", label: "Booth number" },
  { key: "sector", label: "Sector" },
  { key: "duration", label: "Test duration" },
  { key: "rules", label: "Rules", long: true },
  { key: "footer", label: "Footer" },
];

// Small form + a live preview at print size (95 x 55 mm). Empty fields print
// the default text.
export function TicketEditor({ slug, initial, defaults, tasks, sample }: {
  slug: string;
  initial: TicketTemplate;
  defaults: TicketTemplate;
  tasks: number;
  sample: { code: string; url: string; qrSvg: string };
}) {
  const [state, formAction, pending] = useActionState(saveTicketTemplate, { error: "", saved: 0 });
  const [draft, setDraft] = useState(initial);
  const shown = Object.fromEntries(Object.entries(draft).map(([k, v]) =>
    [k, v.trim() || defaults[k as keyof TicketTemplate]])) as TicketTemplate;

  useEffect(() => {
    if (state.saved) toast("Saved", 2000);
  }, [state]);

  return (
    <>
      <section className="flex flex-col gap-3">
        <SectionLabel>Preview</SectionLabel>
        <div className="tk-preview overflow-x-auto">
          <div className="w-max outline-1 outline-dashed outline-muted">
            <Ticket template={shown} tasks={tasks} code={sample.code} url={sample.url} qrSvg={sample.qrSvg} />
          </div>
        </div>
        <p className="text-[13px] text-muted">Actual size, 95 x 55 mm. Sample code; printed tickets get real ones.</p>
      </section>

      <form action={formAction} className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
        <input type="hidden" name="slug" value={slug} />
        {FIELDS.map(({ key, label, long }) => (
          <label key={key} className="flex flex-col gap-1.5 text-sm font-semibold">
            {label}
            {long ? (
              <textarea name={key} value={draft[key]} maxLength={TICKET_LIMITS[key]} rows={3}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                className="resize-y rounded-btn border border-border bg-bg p-2.5 text-base font-normal outline-none focus:border-fg/40" />
            ) : (
              <input name={key} value={draft[key]} maxLength={TICKET_LIMITS[key]}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                className="h-11 rounded-btn border border-border bg-bg px-3 text-base font-normal outline-none focus:border-fg/40" />
            )}
          </label>
        ))}
        <p aria-live="polite" className={`text-[13px] ${state.error ? "font-medium text-bad" : "text-muted"}`}>
          {state.error || "Saved for this company. Empty fields print the default text."}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setDraft(defaults)} disabled={pending} className="ui-btn ui-btn-secondary min-h-12 text-base">
            Use defaults
          </button>
          <button type="submit" disabled={pending} aria-busy={pending} className="ui-btn ui-btn-primary min-h-12 text-base">
            {pending ? <><FlagMini />Saving…</> : "Save"}
          </button>
        </div>
      </form>
    </>
  );
}

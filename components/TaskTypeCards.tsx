import type { Format } from "@/lib/sim";

// The three task types offered for new tasks (the builder's Add task picker
// and the Contests tab). Older formats keep working for tasks that use them.
export const NEW_TASK_FORMATS = ["triage", "read_decide", "next_step"] as const satisfies readonly Format[];
export type NewTaskFormat = (typeof NEW_TASK_FORMATS)[number];

export type TypeCardText = { title: string; line: string; exampleLabel: string; example: string };

const LABEL = "text-[10px] font-semibold uppercase tracking-[0.08em] text-muted";

// Square cards, 3 in a row from 640px; on phones 2 columns with the third
// card full width (2:1, so it is as tall as the others). Square is a minimum
// (container width units), so long text in FI/SV grows the card instead of
// spilling out. With `onPick` each card is a button; without, it only shows
// the type.
export function TaskTypeCards({ items, onPick }: {
  items: { format: NewTaskFormat; text: TypeCardText }[];
  onPick?: (format: NewTaskFormat) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map(({ format, text }, i) => {
        const wide = i === 2 && items.length === 3;
        const card = `flex h-full w-full flex-col gap-1.5 border border-border bg-card p-3 text-left ${
          wide ? "min-h-[50cqw] sm:min-h-[100cqw]" : "min-h-[100cqw]"}`;
        const body = (
          <>
            <Demo format={format} />
            <span className="mt-1 block text-sm font-semibold leading-snug">{text.title}</span>
            <span className="block text-[13px] leading-snug">{text.line}</span>
            <span className="mt-auto block pt-1 text-[12px] leading-snug text-muted">
              <span className={`mb-0.5 block ${LABEL}`}>{text.exampleLabel}</span>
              {text.example}
            </span>
          </>
        );
        return (
          <li key={format} className={`@container ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
            {onPick ? (
              <button type="button" onClick={() => onPick(format)}
                className={`${card} hover:border-fg/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg/60`}>
                {body}
              </button>
            ) : (
              <div className={card}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// A small looping demo of the type (CSS only, classes in globals.css). The
// static styles are the last frame, shown as is under reduced motion.
function Demo({ format }: { format: NewTaskFormat }) {
  if (format === "triage") {
    // Three bars; the first and last swap into order.
    const bars = [
      { top: 0, width: "55%", anim: "tt-from-below", strong: true },
      { top: 14, width: "72%", anim: "", strong: false },
      { top: 28, width: "90%", anim: "tt-from-above", strong: true },
    ];
    return (
      <span aria-hidden className="relative block h-10 w-full">
        {bars.map((b) => (
          <span key={b.top} className={`absolute inset-x-0 flex h-2.5 items-center gap-1.5 ${b.anim}`} style={{ top: b.top }}>
            <span className={`size-2.5 shrink-0 ${b.strong ? "bg-fg" : "bg-fg/30"}`} />
            <span className={`h-1.5 ${b.strong ? "bg-fg/60" : "bg-fg/20"}`} style={{ width: b.width }} />
          </span>
        ))}
      </span>
    );
  }
  if (format === "read_decide") {
    // A mini table: the highlight moves to the second row, then a check pops in.
    return (
      <span aria-hidden className="relative block h-10 w-full">
        <span className="tt-scan absolute left-0 right-6 h-3 border border-info bg-info/15" style={{ top: 13 }} />
        {[0, 14, 28].map((top) => (
          <span key={top} className="absolute left-1 right-7 flex h-2.5 items-center gap-2" style={{ top: top + 1 }}>
            <span className="h-1.5 w-2/5 bg-fg/30" />
            <span className="h-1.5 w-1/4 bg-fg/20" />
          </span>
        ))}
        <span className="tt-check absolute right-0 flex size-4 items-center justify-center bg-ok text-white" style={{ top: 11 }}>
          <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.2 5 8.5l4.5-5" />
          </svg>
        </span>
      </span>
    );
  }
  // Three option chips; the first is picked with a small pop.
  return (
    <span aria-hidden className="flex h-10 w-full items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`relative flex h-6 flex-1 items-center justify-center border border-border ${i === 0 ? "tt-pop" : ""}`}>
          {i === 0 && <span className="tt-fill absolute -inset-px border border-info bg-info/20" />}
          <span className="relative h-1.5 w-1/2 bg-fg/30" />
        </span>
      ))}
    </span>
  );
}

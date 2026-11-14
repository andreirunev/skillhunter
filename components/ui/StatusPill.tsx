import type { Status } from "@/lib/recruiter";

export const STATUS_TEXT: Record<Status, string> = {
  new: "New",
  invited: "Invited",
  at_booth: "At booth",
  good_fit: "Good fit",
  needs_review: "Review",
  not_now: "Not now",
  interview: "Interview",
};

const COLORS: Record<Status, string> = {
  new: "bg-fg/10 text-fg/70",
  invited: "bg-info/15 text-info",
  at_booth: "bg-info/15 text-info",
  good_fit: "bg-ok/15 text-ok",
  needs_review: "bg-warn/15 text-warn",
  not_now: "bg-bad/15 text-bad",
  interview: "bg-ok-dark text-white",
};

// A label set by the recruiter ("New" until they decide). Never a system verdict.
export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-pill px-2.5 text-xs font-semibold ${COLORS[status]}`}>
      {STATUS_TEXT[status]}
    </span>
  );
}

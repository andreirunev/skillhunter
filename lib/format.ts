// Display helpers shared by recruiter screens.

export const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-slate-100 text-slate-700" },
  invited: { label: "Invited to booth", className: "bg-brand-100 text-brand-800" },
  at_booth: { label: "At booth", className: "bg-brand-100 text-brand-800" },
  good_fit: { label: "Good fit (my call)", className: "bg-leaf-50 text-leaf-700" },
  needs_review: { label: "Needs review", className: "bg-amber-50 text-amber-800" },
  interview: { label: "Interview offered", className: "bg-leaf-600 text-white" },
  not_now: { label: "Not now", className: "bg-slate-200 text-slate-600" },
};

export function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return s % 60 ? `${m} min ${s % 60} s` : `${m} min`;
}

// Event local time, regardless of the server's timezone.
const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Helsinki", hour: "2-digit", minute: "2-digit" });
export const formatClock = (d: Date) => clock.format(d);

export const LANG_SHORT: Record<string, string> = { en: "EN", fi: "FI", sv: "SV" };

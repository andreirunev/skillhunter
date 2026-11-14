// Display helpers shared by recruiter screens.

export function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return s % 60 ? `${m} min ${s % 60} s` : `${m} min`;
}

// Rounded for list rows, e.g. "4 min".
export function formatMinutes(ms: number) {
  const m = Math.round(ms / 60_000);
  return m < 1 ? "<1 min" : `${m} min`;
}

// Event local time, regardless of the server's timezone.
const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Helsinki", hour: "2-digit", minute: "2-digit" });
export const formatClock = (d: Date) => clock.format(d);

export const LANG_SHORT: Record<string, string> = { en: "EN", fi: "FI", sv: "SV" };

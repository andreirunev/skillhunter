// Printable booth tickets: the editable text, its defaults and limits.
// Pure module (no database), used by the print view and the editor preview.

export type TicketTemplate = {
  companyName: string;
  booth: string;
  sector: string;
  duration: string;
  rules: string;
  footer: string;
};

export const TICKET_FIELDS = ["companyName", "booth", "sector", "duration", "rules", "footer"] as const;

export const TICKET_LIMITS: Record<keyof TicketTemplate, number> = {
  companyName: 40,
  booth: 12,
  sector: 40,
  duration: 24,
  rules: 220,
  footer: 80,
};

export const TICKET_LABEL = ["SkillHunter", "Junction 2026 demo"];
export const TICKETS_PER_SHEET = 10;

export const DEFAULT_RULES =
  "One code, one test, one device. Code works once. Your answers are anonymous. No contact details are stored. The booth decides next steps.";
export const DEFAULT_FOOTER = "Data deleted after the event.";

const SECTORS: Record<string, string> = {
  cleaning: "Cleaning",
  construction: "Construction & welding",
  logistics: "Logistics",
  it: "IT",
  general: "General",
};

export function defaultTicket(company: { name: string; booth: string; sector: string; expected_sec: number }): TicketTemplate {
  return {
    companyName: company.name,
    booth: company.booth,
    sector: SECTORS[company.sector] ?? company.sector,
    duration: `about ${Math.max(1, Math.round(company.expected_sec / 60))} min`,
    rules: DEFAULT_RULES,
    footer: DEFAULT_FOOTER,
  };
}

// A saved template (jsonb, may be partial or from an older version) over the
// defaults. Empty or non-text fields fall back; everything is trimmed to its limit.
export function mergeTicket(saved: unknown, defaults: TicketTemplate): TicketTemplate {
  const s = (saved && typeof saved === "object" ? saved : {}) as Record<string, unknown>;
  const out = { ...defaults };
  for (const key of TICKET_FIELDS) {
    const v = s[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim().slice(0, TICKET_LIMITS[key]);
  }
  return out;
}

// "UQE6CRCP" -> "UQE6 CRCP": easier to read aloud and type (/join ignores spaces).
export const formatCode = (code: string) => (code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code);

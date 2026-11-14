// Booth flow after the test. Every step is a human action: the recruiter
// starts the mini-interview and decides the next step, the candidate decides
// whether to share contact details. Shared by server and client code.

export const STAGES = ["anonymous", "mini_interview", "contact_requested", "full_interview", "contact_declined", "closed"] as const;
export type Stage = (typeof STAGES)[number];
export const isStage = (x: unknown): x is Stage => typeof x === "string" && (STAGES as readonly string[]).includes(x);

// The recruiter can move between these until the candidate acts.
export const RECRUITER_STAGES = ["mini_interview", "contact_requested", "closed"] as const;
export type RecruiterStage = (typeof RECRUITER_STAGES)[number];
export const isRecruiterStage = (x: unknown): x is RecruiterStage =>
  typeof x === "string" && (RECRUITER_STAGES as readonly string[]).includes(x);

// Typed by the candidate after consent. Name plus a phone or an email.
export type Contact = { full_name: string; phone: string; email: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s()-]{6,24}$/;

export function checkContact(raw: { full_name?: unknown; phone?: unknown; email?: unknown }): Contact | null {
  const text = (x: unknown) => (typeof x === "string" ? x.trim() : "");
  const full_name = text(raw.full_name);
  const phone = text(raw.phone);
  const email = text(raw.email);
  if (full_name.length < 2 || full_name.length > 100) return null;
  if (!phone && !email) return null;
  if (phone && (!PHONE.test(phone) || phone.replace(/\D/g, "").length < 6)) return null;
  if (email && (email.length > 120 || !EMAIL.test(email))) return null;
  return { full_name, phone, email };
}

// Booth invite codes look like "KX-47"; typed with or without the dash.
export const normalizeInviteCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "");

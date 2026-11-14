"use server";

import { refresh } from "next/cache";
import { createTokens } from "@/lib/data";
import { db } from "@/lib/db";
import { batchOf, getCompany, isDemoMode, saveTicket } from "@/lib/recruiter";
import { seed } from "@/lib/seed";
import { MAX_CODES_PER_BATCH, PRINTED_CODE_DAYS } from "@/lib/codes";
import { TICKET_FIELDS, TICKET_LIMITS, TICKETS_PER_SHEET, type TicketTemplate } from "@/lib/tickets";

export type CodesState = { error: string; created: number; batch: string | null };

// "Create and print": new single-use booth codes for this company's test,
// rounded up to full A4 sheets of 10. Returns the batch for the print view.
export async function createCodes(_prev: CodesState, formData: FormData): Promise<CodesState> {
  const slug = String(formData.get("slug") ?? "");
  const asked = Number(formData.get("count"));
  if (!Number.isInteger(asked) || asked < 1 || asked > MAX_CODES_PER_BATCH) {
    return { error: `Choose 1 to ${MAX_CODES_PER_BATCH} tickets.`, created: 0, batch: null };
  }
  const count = Math.min(MAX_CODES_PER_BATCH, Math.ceil(asked / TICKETS_PER_SHEET) * TICKETS_PER_SHEET);
  const tokens = await createTokens(slug, count, PRINTED_CODE_DAYS);
  const batch = tokens.length ? await batchOf(tokens[0]) : null;
  if (!batch) return { error: "Could not create codes. Try again.", created: 0, batch: null };
  refresh();
  return { error: "", created: tokens.length, batch };
}

export type TicketState = { error: string; saved: number };

// Ticket template editor: stores the text per company (companies.ticket).
// Empty fields fall back to the defaults when printing.
export async function saveTicketTemplate(_prev: TicketState, formData: FormData): Promise<TicketState> {
  const company = await getCompany(String(formData.get("slug") ?? ""));
  if (!company) return { error: "Unknown company.", saved: 0 };
  const template = Object.fromEntries(TICKET_FIELDS.map((key) =>
    [key, String(formData.get(key) ?? "").trim().slice(0, TICKET_LIMITS[key])])) as TicketTemplate;
  if (!(await saveTicket(company.id, template))) return { error: "Could not save. Try again.", saved: 0 };
  refresh();
  return { error: "", saved: Date.now() };
}

// "Reset demo data" (About tab): same as `npm run db:reseed`. Refused unless
// DEMO_MODE is set, whatever the client sends.
export async function resetDemo(): Promise<boolean> {
  if (!isDemoMode()) return false;
  try {
    await seed(db(), { fresh: true });
  } catch {
    return false;
  }
  refresh();
  return true;
}

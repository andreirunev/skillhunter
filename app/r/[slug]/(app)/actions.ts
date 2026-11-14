"use server";

import { refresh } from "next/cache";
import { createTokens } from "@/lib/data";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/recruiter";
import { seed } from "@/lib/seed";
import { MAX_CODES_PER_BATCH, PRINTED_CODE_DAYS } from "@/lib/codes";

export type CodesState = { error: string; created: number };

// "Print codes": a batch of new single-use booth codes for this company's test.
export async function createCodes(_prev: CodesState, formData: FormData): Promise<CodesState> {
  const slug = String(formData.get("slug") ?? "");
  const count = Number(formData.get("count"));
  if (!Number.isInteger(count) || count < 1 || count > MAX_CODES_PER_BATCH) {
    return { error: `Choose 1 to ${MAX_CODES_PER_BATCH} codes.`, created: 0 };
  }
  const tokens = await createTokens(slug, count, PRINTED_CODE_DAYS);
  if (!tokens.length) return { error: "Could not create codes. Try again.", created: 0 };
  refresh();
  return { error: "", created: tokens.length };
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

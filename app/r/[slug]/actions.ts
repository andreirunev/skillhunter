"use server";

import { refresh } from "next/cache";
import { createTokens } from "@/lib/data";
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

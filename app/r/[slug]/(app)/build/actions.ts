"use server";

import { refresh } from "next/cache";
import { isUuid } from "@/lib/data";
import { db } from "@/lib/db";
import { getCompany } from "@/lib/recruiter";
import { publishTest, type Draft } from "@/lib/sim-store";

export type PublishResult = { ok: true; version: number; contestId: string } | { ok: false; error: string };

// Publish from the builder: validates the draft against the task library and
// stores a new frozen version of one contest (contestId null = create it;
// lib/sim-store.ts). Demo access as everywhere in /r/[slug]: by company slug,
// no staff login.
export async function publishDraft(slug: string, contestId: string | null, draft: Draft): Promise<PublishResult> {
  const company = await getCompany(String(slug));
  if (!company || (contestId !== null && !isUuid(contestId))) return { ok: false, error: "failed" };
  try {
    const result = await publishTest(db(), company.id, contestId, draft);
    if ("error" in result) return { ok: false, error: result.error };
    refresh();
    return { ok: true, version: result.version, contestId: result.testId };
  } catch {
    return { ok: false, error: "failed" };
  }
}

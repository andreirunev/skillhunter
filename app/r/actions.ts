"use server";

import { redirect } from "next/navigation";
import { getCompany } from "@/lib/recruiter";

// Demo PIN = company slug. A real deployment needs proper staff login.
export async function checkPin(_prev: { error: string }, formData: FormData) {
  const pin = String(formData.get("pin") ?? "").trim().toLowerCase();
  const company = /^[a-z0-9-]{1,40}$/.test(pin) ? await getCompany(pin) : null;
  if (!company) return { error: "Wrong PIN." };
  redirect(`/r/${company.slug}`);
}

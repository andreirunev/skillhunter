"use client";

import { useRouter } from "next/navigation";
import { LangSelect } from "@/components/ui/LangSelect";
import type { Lang } from "@/lib/i18n";

// Recruiter-side language (builder and Contests strings). Same preference
// cookie as the candidate screens; the server page re-renders with it.
export function RecruiterLang({ value, label }: { value: Lang; label: string }) {
  const router = useRouter();
  return <LangSelect value={value} label={label} onChange={() => router.refresh()} />;
}

import type { Viewport } from "next";
import { checkCode } from "@/lib/data";
import { normalizeCode } from "@/lib/codes";
import { deviceHash } from "@/lib/device";
import { cookieLang } from "@/lib/lang";
import { SKIN_THEME_COLOR } from "@/lib/theme";
import { CandidateShell } from "@/components/CandidateShell";
import { JoinForm } from "./JoinForm";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: SKIN_THEME_COLOR };

// Entering a code (POST /api/join) burns it. Coming back here with ?code=...
// only reports "used/expired", "paused" (its contest is Offline) or "not
// found": never which company or candidate.
export default async function JoinPage(props: PageProps<"/join">) {
  const { code: raw } = await props.searchParams;
  const typed = typeof raw === "string" ? normalizeCode(raw.slice(0, 20)) : null;
  const check = typed !== null ? await checkCode(typed, await deviceHash()) : null;
  const error = check === "missing" || check === "paused" ? check : check === "used" || check === "mine" ? "used" : null;

  return (
    <CandidateShell lang={(await cookieLang()) ?? "en"} company={null}>
      <JoinForm initialCode={typed ?? ""} error={error} continueHref={check === "mine" && typed ? `/c/${typed}` : null} />
    </CandidateShell>
  );
}

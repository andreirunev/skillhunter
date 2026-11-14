import type { Viewport } from "next";
import { redirect } from "next/navigation";
import { getTokenView } from "@/lib/data";
import { deviceHash } from "@/lib/device";
import { makeAvatar } from "@/lib/avatar";
import { cookieLang } from "@/lib/lang";
import { SKIN_THEME_COLOR } from "@/lib/theme";
import { TIME_LIMIT_MINUTES } from "@/lib/timing";
import { CandidateShell } from "@/components/CandidateShell";
import { OtherDevice } from "@/components/OtherDevice";
import { Activate } from "./Activate";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: SKIN_THEME_COLOR };

// Seeded from the token so the server and the browser render the same avatar.
function seededRand(text: string) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
}

// Setup screen for the attempt this device started at /join. A code that was
// never entered goes to /join first (entering it is what burns it).
export default async function ActivatePage(props: PageProps<"/c/[token]">) {
  const { token } = await props.params;
  const view = await getTokenView(token, await deviceHash());
  if (view?.status === "new" && !view.expired) redirect(`/join?code=${encodeURIComponent(token)}`);
  if (view?.status === "activated" && !view.owned) return <OtherDevice />;
  if (view?.owned && view.started) redirect(`/t/${view.attempt_id}`);

  const ready = Boolean(view?.owned);
  const avatar = ready && view?.avatar_name && view.avatar_emoji && view.avatar_color
    ? { name: view.avatar_name, emoji: view.avatar_emoji, color: view.avatar_color }
    : makeAvatar(seededRand(token));
  return (
    <CandidateShell lang={(await cookieLang()) ?? "en"} company={ready && view ? { name: view.company_name, booth: view.booth } : null}>
      <Activate
        token={token}
        state={!view ? "invalid" : ready ? "ready" : "expired"}
        avatar={avatar}
        taskCount={view?.task_count ?? 0}
        minutes={Math.max(1, Math.round((view?.expected_sec ?? 0) / 60))}
        limitMinutes={TIME_LIMIT_MINUTES}
      />
    </CandidateShell>
  );
}

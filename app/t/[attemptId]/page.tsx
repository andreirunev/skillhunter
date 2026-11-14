import type { Viewport } from "next";
import { notFound, redirect } from "next/navigation";
import { getPlayerData } from "@/lib/data";
import { cookieLang } from "@/lib/lang";
import { SKIN_THEME_COLOR } from "@/lib/theme";
import { CandidateShell } from "@/components/CandidateShell";
import { TaskPlayer } from "@/components/TaskPlayer";
import { OtherDevice } from "@/components/OtherDevice";
import { isMyAttempt } from "@/lib/device";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: SKIN_THEME_COLOR };

export default async function PlayerPage(props: PageProps<"/t/[attemptId]">) {
  const { attemptId } = await props.params;
  if (!(await isMyAttempt(attemptId))) return <OtherDevice />;
  const data = await getPlayerData(attemptId);
  if (!data || data.tasks.length === 0) notFound();
  if (data.attempt.finished) redirect(`/t/${attemptId}/done`);
  return (
    <CandidateShell lang={(await cookieLang()) ?? data.attempt.lang} company={{ name: data.attempt.company_name, booth: data.attempt.booth }}>
      <TaskPlayer attempt={data.attempt} tasks={data.tasks} saved={data.answers} />
    </CandidateShell>
  );
}

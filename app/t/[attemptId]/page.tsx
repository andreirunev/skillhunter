import { notFound, redirect } from "next/navigation";
import { getPlayerData } from "@/lib/data";
import { TaskPlayer } from "@/components/TaskPlayer";

export const dynamic = "force-dynamic";

export default async function PlayerPage(props: PageProps<"/t/[attemptId]">) {
  const { attemptId } = await props.params;
  const data = await getPlayerData(attemptId);
  if (!data || data.tasks.length === 0) notFound();
  if (data.attempt.finished) redirect(`/t/${attemptId}/done`);
  return <TaskPlayer attempt={data.attempt} tasks={data.tasks} saved={data.answers} />;
}

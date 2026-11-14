import { getTokenView } from "@/lib/data";
import { makeAvatar } from "@/lib/avatar";
import { Activate } from "./Activate";

export const dynamic = "force-dynamic";

// Seeded from the token so the server and the browser render the same avatar.
function seededRand(text: string) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
}

export default async function ActivatePage(props: PageProps<"/c/[token]">) {
  const { token } = await props.params;
  const view = await getTokenView(token);
  const state = !view ? "invalid" : view.status === "activated" ? "used" : view.expired ? "expired" : "ready";

  return (
    <Activate
      token={token}
      state={state}
      initialAvatar={makeAvatar(seededRand(token))}
      company={view && { name: view.company_name, booth: view.booth, color: view.color, testTitle: view.test_title }}
      taskCount={view?.task_count ?? 0}
      minutes={Math.max(1, Math.round((view?.expected_sec ?? 0) / 60))}
    />
  );
}

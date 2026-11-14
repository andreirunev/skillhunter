import { saveAnswer } from "@/lib/data";
import { isMyAttempt } from "@/lib/device";

export const dynamic = "force-dynamic";

const STATUS = { ok: 200, not_found: 404, finished: 409, invalid: 400 } as const;

// Autosave of one answer: the answer, total time on the task and change count.
export async function POST(request: Request, ctx: RouteContext<"/api/attempts/[id]/answers">) {
  const { id } = await ctx.params;
  if (!(await isMyAttempt(id))) return Response.json({ error: "other_device" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const { taskId, answer, timeMs, changes } = body ?? {};
  if (typeof taskId !== "string" || typeof timeMs !== "number" || typeof changes !== "number" || answer === undefined) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const result = await saveAnswer(id, taskId, answer, timeMs, changes);
  return Response.json({ result }, { status: STATUS[result] });
}

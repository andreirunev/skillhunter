import { finishAttempt } from "@/lib/data";
import { isMyAttempt } from "@/lib/device";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, ctx: RouteContext<"/api/attempts/[id]/finish">) {
  const { id } = await ctx.params;
  if (!(await isMyAttempt(id))) return Response.json({ error: "other_device" }, { status: 403 });
  const ok = await finishAttempt(id);
  return Response.json({ ok }, { status: ok ? 200 : 404 });
}

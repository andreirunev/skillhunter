import { finishAttempt } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, ctx: RouteContext<"/api/attempts/[id]/finish">) {
  const { id } = await ctx.params;
  const ok = await finishAttempt(id);
  return Response.json({ ok }, { status: ok ? 200 : 404 });
}

import { getInvitationView } from "@/lib/data";
import { isMyAttempt } from "@/lib/device";

export const dynamic = "force-dynamic";

// Polled by the candidate's waiting screen. Returns only "invited or not",
// the booth code and the booth-flow stage; never a status label, flag or score.
export async function GET(_request: Request, ctx: RouteContext<"/api/attempts/[id]/invitation">) {
  const { id } = await ctx.params;
  if (!(await isMyAttempt(id))) return Response.json({ error: "other_device" }, { status: 403 });
  const view = await getInvitationView(id);
  if (!view) return Response.json({ error: "not_found" }, { status: 404 });
  if (!view.code) return Response.json({ invited: false, stage: view.stage }, { headers: { "Cache-Control": "no-store" } });
  return Response.json({ invited: true, code: view.code, booth: view.booth, stage: view.stage }, { headers: { "Cache-Control": "no-store" } });
}

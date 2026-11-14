import { setStage } from "@/lib/recruiter";
import { isRecruiterStage } from "@/lib/stage";

export const dynamic = "force-dynamic";

// Recruiter's next step after the mini-interview (or undo). Returns the stored
// stage: if the candidate already acted, that stage wins and nothing changes.
export async function POST(request: Request, ctx: RouteContext<"/api/attempts/[id]/stage">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!isRecruiterStage(body?.stage)) return Response.json({ error: "invalid" }, { status: 400 });
  const stage = await setStage(id, body.stage);
  if (!stage) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ stage }, { status: stage === body.stage ? 200 : 409 });
}

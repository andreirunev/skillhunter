import { startInterview } from "@/lib/recruiter";

export const dynamic = "force-dynamic";

// Recruiter types the code from the candidate's phone: the mini-interview starts.
export async function POST(request: Request, ctx: RouteContext<"/api/attempts/[id]/start">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (typeof body?.code !== "string") return Response.json({ error: "invalid" }, { status: 400 });
  const result = await startInterview(id, body.code);
  if (result === "not_found") return Response.json({ error: "not_found" }, { status: 404 });
  if (result === "wrong_code") return Response.json({ error: "wrong_code" }, { status: 409 });
  return Response.json({ stage: "mini_interview", status: "at_booth" });
}

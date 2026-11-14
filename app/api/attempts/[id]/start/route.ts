import { startInterview } from "@/lib/recruiter";

export const dynamic = "force-dynamic";

// Start the short interview. Needs a code verified in the last 30 minutes.
export async function POST(_request: Request, ctx: RouteContext<"/api/attempts/[id]/start">) {
  const { id } = await ctx.params;
  const result = await startInterview(id);
  if (result === "not_found") return Response.json({ error: "not_found" }, { status: 404 });
  if (result === "not_verified") return Response.json({ error: "not_verified" }, { status: 409 });
  return Response.json({ stage: "mini_interview", status: "at_booth" });
}

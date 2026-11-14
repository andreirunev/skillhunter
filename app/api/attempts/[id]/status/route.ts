import { isStatus, setStatus } from "@/lib/recruiter";

export const dynamic = "force-dynamic";

// Recruiter button press: a human label, stored as such.
export async function POST(request: Request, ctx: RouteContext<"/api/attempts/[id]/status">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!isStatus(body?.status)) return Response.json({ error: "invalid" }, { status: 400 });
  const result = await setStatus(id, body.status);
  if (!result) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ status: body.status, code: result.code });
}

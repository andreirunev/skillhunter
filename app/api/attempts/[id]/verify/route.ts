import { companyOfAttempt, verifyCode } from "@/lib/recruiter";

export const dynamic = "force-dynamic";

// From a candidate card: the recruiter types the code from the candidate's
// phone. Answers only "verified or not"; the code is never sent back.
export async function POST(request: Request, ctx: RouteContext<"/api/attempts/[id]/verify">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (typeof body?.code !== "string") return Response.json({ error: "invalid" }, { status: 400 });
  const companyId = await companyOfAttempt(id);
  if (!companyId) return Response.json({ error: "not_found" }, { status: 404 });
  const check = await verifyCode(companyId, body.code, id);
  if (!check.ok) return Response.json({ error: check.error }, { status: check.error === "rate_limited" ? 429 : 409 });
  return Response.json({ verified: true });
}

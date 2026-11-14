import { getCompany, verifyCode } from "@/lib/recruiter";

export const dynamic = "force-dynamic";

// "Find by code": the recruiter types the code from a candidate's phone; a
// match within this company opens that card, already verified.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.slug !== "string" || typeof body?.code !== "string") return Response.json({ error: "invalid" }, { status: 400 });
  const company = await getCompany(body.slug);
  if (!company) return Response.json({ error: "not_found" }, { status: 404 });
  const check = await verifyCode(company.id, body.code);
  if (!check.ok) return Response.json({ error: check.error }, { status: check.error === "rate_limited" ? 429 : 404 });
  return Response.json({ attemptId: check.attemptId });
}

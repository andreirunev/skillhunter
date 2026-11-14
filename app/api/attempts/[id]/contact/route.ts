import { declineContact, submitContact } from "@/lib/data";
import { isMyAttempt } from "@/lib/device";
import { checkContact } from "@/lib/stage";

export const dynamic = "force-dynamic";

// Candidate's answer to a contact request: details with consent, or "No
// thanks" (nothing stored). Only the device that took the test can answer.
export async function POST(request: Request, ctx: RouteContext<"/api/attempts/[id]/contact">) {
  const { id } = await ctx.params;
  if (!(await isMyAttempt(id))) return Response.json({ error: "other_device" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (body?.decline === true) {
    return (await declineContact(id))
      ? Response.json({ stage: "contact_declined" })
      : Response.json({ error: "not_requested" }, { status: 409 });
  }
  const contact = body?.consent === true ? checkContact(body) : null;
  if (!contact) return Response.json({ error: "invalid" }, { status: 400 });
  return (await submitContact(id, contact))
    ? Response.json({ stage: "full_interview" })
    : Response.json({ error: "not_requested" }, { status: 409 });
}

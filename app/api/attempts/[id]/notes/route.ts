import { saveNote } from "@/lib/recruiter";

export const dynamic = "force-dynamic";

// Per-task follow-up: "asked at the booth" + a short recruiter note.
export async function POST(request: Request, ctx: RouteContext<"/api/attempts/[id]/notes">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const { taskId, asked, note } = body ?? {};
  if (typeof taskId !== "string" || typeof asked !== "boolean" || typeof note !== "string") {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const ok = await saveNote(id, taskId, asked, note);
  return Response.json({ ok }, { status: ok ? 200 : 404 });
}

import QRCode from "qrcode";
import { getInvitationView } from "@/lib/data";

export const dynamic = "force-dynamic";

// Polled by the candidate's waiting screen. Returns only "invited or not"
// and the booth code; never a status label, flag or score.
export async function GET(_request: Request, ctx: RouteContext<"/api/attempts/[id]/invitation">) {
  const { id } = await ctx.params;
  const view = await getInvitationView(id);
  if (!view) return Response.json({ error: "not_found" }, { status: 404 });
  if (!view.code) return Response.json({ invited: false }, { headers: { "Cache-Control": "no-store" } });
  const qrSvg = await QRCode.toString(`SKILLSCAN ${view.code}`, { type: "svg", margin: 1, color: { dark: "#0f172a", light: "#ffffff" } });
  return Response.json({ invited: true, code: view.code, booth: view.booth, qrSvg }, { headers: { "Cache-Control": "no-store" } });
}

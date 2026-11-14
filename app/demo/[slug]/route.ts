import { createToken } from "@/lib/data";

export const dynamic = "force-dynamic";

// Demo shortcut: issues a fresh single-use token for the company's test and
// opens it, as if the candidate had scanned a printed QR code at the booth.
export async function GET(request: Request, ctx: RouteContext<"/demo/[slug]">) {
  const { slug } = await ctx.params;
  const token = await createToken(slug);
  if (!token) return new Response("Unknown company", { status: 404 });
  return Response.redirect(new URL(`/c/${token}`, request.url), 303);
}

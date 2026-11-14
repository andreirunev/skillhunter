import { NextResponse, type NextRequest } from "next/server";
import { createToken, enterCode } from "@/lib/data";
import { DEVICE_COOKIE, readDevice, setDeviceCookie } from "@/lib/device";

export const dynamic = "force-dynamic";

// Demo shortcut: a fresh single-use code for the company's test, burned at once
// for this device, exactly as if the candidate had typed it at /join.
export async function GET(request: NextRequest, ctx: RouteContext<"/demo/[slug]">) {
  const { slug } = await ctx.params;
  const token = await createToken(slug);
  if (!token) return new Response("Unknown company", { status: 404 });
  const device = readDevice(request.cookies.get(DEVICE_COOKIE)?.value);
  if (!(await enterCode(token, device.hash))) return new Response("Could not start", { status: 500 });
  const res = NextResponse.redirect(new URL(`/c/${token}`, request.url), 303);
  if (device.isNew) setDeviceCookie(res, device.id);
  return res;
}

import { NextResponse, type NextRequest } from "next/server";
import { enterCode } from "@/lib/data";
import { isCodeShape, normalizeCode } from "@/lib/codes";
import { DEVICE_COOKIE, readDevice, setDeviceCookie } from "@/lib/device";

export const dynamic = "force-dynamic";

// Burn on entry: the first valid entry of a code starts one attempt bound to
// this device. Anything else goes back to /join, which says "used" or "not found".
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const code = normalizeCode(String(form?.get("code") ?? "").slice(0, 20));
  const device = readDevice(request.cookies.get(DEVICE_COOKIE)?.value);
  const attemptId = isCodeShape(code) ? await enterCode(code, device.hash) : null;
  if (!attemptId) return NextResponse.redirect(new URL(`/join?code=${encodeURIComponent(code)}`, request.url), 303);
  const res = NextResponse.redirect(new URL(`/c/${code}`, request.url), 303);
  if (device.isNew) setDeviceCookie(res, device.id);
  return res;
}

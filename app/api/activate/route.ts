import { setupAttempt } from "@/lib/data";
import { deviceHash } from "@/lib/device";
import { isLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Avatar, UI language and own pace for the attempt this device started at
// /join. Only the owning device can change it, and only before it finishes.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { token, name, emoji, color, lang, ownPace } = body ?? {};
  const valid =
    typeof token === "string" && token.length <= 32 &&
    typeof name === "string" && name.length > 0 && name.length <= 40 &&
    typeof emoji === "string" && emoji.length > 0 && emoji.length <= 8 &&
    typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color) &&
    isLang(lang) && typeof ownPace === "boolean";
  if (!valid) return Response.json({ error: "invalid" }, { status: 400 });

  const owner = await deviceHash();
  const attemptId = owner ? await setupAttempt(token, owner, { name, emoji, color, lang, ownPace }) : null;
  if (!attemptId) return Response.json({ error: "other_device" }, { status: 403 });
  return Response.json({ attemptId });
}

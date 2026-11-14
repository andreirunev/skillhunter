import { setupAttempt } from "@/lib/data";
import { deviceHash } from "@/lib/device";
import { isLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// UI language for the attempt this device started at /join. Only the owning
// device, only before it finishes. The request shape is unchanged, but the
// avatar fields and `ownPace` are ignored: the avatar assigned at entry stays
// and time is always counted.
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
  const attemptId = owner ? await setupAttempt(token, owner, lang) : null;
  if (!attemptId) return Response.json({ error: "other_device" }, { status: 403 });
  return Response.json({ attemptId });
}

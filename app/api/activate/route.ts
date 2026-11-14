import { activateToken } from "@/lib/data";
import { isLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Starts an attempt from a single-use QR token. Stores only the anonymous
// avatar, the UI language and the own-pace choice.
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

  const attemptId = await activateToken(token, { name, emoji, color, lang, ownPace });
  if (!attemptId) return Response.json({ error: "used_or_expired" }, { status: 409 });
  return Response.json({ attemptId });
}

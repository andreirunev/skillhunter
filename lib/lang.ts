import { cookies } from "next/headers";
import { isLang, LANG_COOKIE, type Lang } from "./i18n.ts";

// The UI language the candidate picked in the top bar, if any.
export async function cookieLang(): Promise<Lang | null> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : null;
}

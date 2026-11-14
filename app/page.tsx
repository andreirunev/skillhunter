import type { Metadata, Viewport } from "next";
import { HOME } from "@/lib/i18n-home";
import { cookieLang } from "@/lib/lang";
import { SKIN_THEME_COLOR } from "@/lib/theme";
import { Landing } from "./Landing";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: SKIN_THEME_COLOR };

export async function generateMetadata(): Promise<Metadata> {
  const m = HOME[(await cookieLang()) ?? "en"];
  return { title: m.metaTitle, description: m.metaDescription };
}

// Landing page for Espoo recruitment events: candidate door -> /join,
// recruiter door -> /r. The language comes from the same cookie as the
// candidate screens.
export default async function Home() {
  return <Landing lang={(await cookieLang()) ?? "en"} />;
}

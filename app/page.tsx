import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { cookieLang } from "@/lib/lang";
import { Landing } from "./Landing";

// Headline and button face for this page only (variable, used at 600-800);
// body text and inputs stay on the system UI font.
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "SkillScan - skills over CVs at Espoo recruitment events",
  description: "Short practical tasks at the booth. Recruiters decide who to talk to.",
};

export const viewport: Viewport = { themeColor: "#003580" };

// Landing: one screen, candidate door and recruiter door. The UI language
// comes from the same preference cookie as the candidate screens.
export default async function Home() {
  return <Landing lang={(await cookieLang()) ?? "en"} className={display.variable} />;
}

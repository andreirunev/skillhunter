import type { Metadata, Viewport } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SkillHunter - skills over CVs at Espoo recruitment events",
  description: "Short practical tasks at the booth. Recruiters decide who to talk to.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

// Pill buttons: 56px tall, hover grows 3% with a soft shadow (200ms; no grow
// under reduced motion), press shrinks via .tap.
const BTN = "tap inline-flex min-h-14 items-center justify-center rounded-full px-10 text-lg font-semibold tracking-tight transition duration-200 ease-out motion-safe:hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-solid";

// Landing: the wordmark and two doors. White candidate half, black recruiter
// half, side by side on desktop and stacked on a phone. "Skill" and "Hunter"
// meet on the seam: across the vertical split at the top on desktop, across
// the horizontal split on a phone. Booth codes and PINs are asked on the
// next page.
export default function Home() {
  return (
    <main data-landing className="relative grid min-h-svh flex-1 grid-cols-1 grid-rows-[1fr_1fr] font-sans md:grid-cols-2 md:grid-rows-1">
      <h1 aria-label="SkillHunter"
        className="pointer-events-none absolute inset-x-0 top-1/2 grid -translate-y-1/2 grid-rows-2 text-center text-[40px] font-bold leading-[1.15] tracking-[-0.03em] md:top-12 md:translate-y-0 md:grid-cols-2 md:grid-rows-1 md:text-[52px]">
        <span aria-hidden className="text-black md:text-right">Skill</span>
        <span aria-hidden className="text-white md:text-left">Hunter</span>
      </h1>
      <div className="flex items-center justify-center bg-white px-6 pb-14 pt-8 md:py-24">
        <Link href="/join"
          className={`${BTN} bg-black text-white hover:shadow-[0_12px_32px_-10px_rgb(0_0_0/0.45)] focus-visible:outline-black`}>
          I&apos;m a candidate
        </Link>
      </div>
      <div className="flex items-center justify-center bg-black px-6 pb-8 pt-14 md:py-24">
        <Link href="/r"
          className={`${BTN} bg-white text-black hover:shadow-[0_12px_32px_-10px_rgb(255_255_255/0.4)] focus-visible:outline-white`}>
          I&apos;m a recruiter
        </Link>
      </div>
    </main>
  );
}

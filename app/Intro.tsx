"use client";

import { useEffect, useRef } from "react";
import { INTRO_KEY, INTRO_MS } from "@/lib/motion";

// Flag intro, once per session (lib/motion.ts sets <html data-intro> before
// first paint; the animation itself is CSS, see .intro in globals.css). Here:
// remember it was seen, fit the cross to the real blue half, and end it early
// on any tap or key. The page under it is already rendered and interactive.
export function Intro() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!("intro" in root.dataset)) return;
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {}

    // The blue half can be taller than its 62svh minimum (short phones).
    const landing = ref.current?.closest<HTMLElement>("[data-landing]");
    const hero = landing?.querySelector<HTMLElement>("[data-hero]");
    const bar = ref.current?.querySelector<HTMLElement>(".intro-h");
    if (landing && hero && bar) {
      const seam = Math.min(hero.offsetHeight, window.innerHeight);
      landing.style.setProperty("--seam", `${seam}px`);
      landing.style.setProperty("--fill", String(Math.ceil(seam / bar.offsetHeight) + 1));
    }

    const end = () => {
      delete root.dataset.intro;
      window.removeEventListener("pointerdown", end);
      window.removeEventListener("keydown", end);
    };
    window.addEventListener("pointerdown", end);
    window.addEventListener("keydown", end);
    // Not cleared on unmount: the attribute must go even if the visitor
    // leaves within the 1.4s, or a later visit to / would replay it.
    window.setTimeout(end, INTRO_MS + 50);
  }, []);

  return (
    <div ref={ref} className="intro" aria-hidden>
      <div className="intro-h" />
      <div className="intro-v" />
    </div>
  );
}

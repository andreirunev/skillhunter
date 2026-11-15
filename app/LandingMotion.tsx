"use client";

import { useEffect } from "react";

// Scroll motion for the landing. Marks each [data-io] block with data-in while
// it is on screen (its loops run only then) and data-seen once (reveals and
// line drawing). data-motion on the root switches the hidden start states on,
// so without JS, or with reduced motion, everything shows its final frame.
export function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-landing]");
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.dataset.motion = "";
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) {
          el.dataset.in = "";
          el.dataset.seen = "";
        } else {
          delete el.dataset.in;
        }
      }
    }, { threshold: 0.15 });
    root.querySelectorAll("[data-io]").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      delete root.dataset.motion;
    };
  }, []);
  return null;
}

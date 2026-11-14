// Flag motion: the route wipe (components/TransitionProvider.tsx), the landing
// intro (app/Intro.tsx) and their timings. Server-safe: no "use client" here,
// so the root layout can inline MOTION_SCRIPT.

export const COVER_MS = 350; // bars flood the screen
export const REVEAL_MS = 350; // bars retract
export const WAIT_MS = 900; // longest wait for real content (not a loading.tsx shell) after the cover
export const SAFETY_MS = 3000; // the overlay never stays longer than this
export const FADE_MS = 150; // reduced motion, back/forward
export const INTRO_MS = 1400;

// A native form POST (booth code) covers the screen, then the browser loads
// the next document; this key tells that document to start covered and reveal.
export const RELOAD_KEY = "ss-wipe";
export const INTRO_KEY = "ss-intro";

// Inlined in <head> before first paint: <html data-ft="in"> after a covered
// form POST, <html data-intro> on the first landing visit of the session.
// Neither runs under reduced motion. CSS alone finishes both animations, so a
// failed hydration still ends with nothing on screen.
export const MOTION_SCRIPT = `(function(){try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var d=document.documentElement,s=sessionStorage;if(s.getItem("${RELOAD_KEY}")){s.removeItem("${RELOAD_KEY}");d.setAttribute("data-ft","in")}else if(location.pathname==="/"&&!s.getItem("${INTRO_KEY}")){d.setAttribute("data-intro","")}}catch(e){}})()`;

export function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

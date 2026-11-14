"use client";

import { createContext, useContext, useEffect, useState, ViewTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FlagLoader, routeLoaderCount } from "@/components/FlagLoader";
import { COVER_MS, FADE_MS, RELOAD_KEY, REVEAL_MS, SAFETY_MS, WAIT_MS, reducedMotion } from "@/lib/motion";

type AppRouter = ReturnType<typeof useRouter>;

type Phase = "idle" | "cover" | "hold" | "reveal";
type NavOptions = { scroll?: boolean };

export type FlagNav = {
  push: (href: string, options?: NavOptions) => void;
  replace: (href: string, options?: NavOptions) => void;
  // A navigation Next.js starts by itself (a server action that redirects).
  cover: () => void;
  // ...that did not happen after all (the action returned an error).
  cancel: () => void;
  // A native form POST: cover now, the next document starts covered and reveals.
  coverForReload: () => void;
};

const Ctx = createContext<FlagNav | null>(null);

// Every in-app navigation goes through this: <TransitionLink>, useFlagNav().
export function useFlagNav() {
  const nav = useContext(Ctx);
  if (!nav) throw new Error("useFlagNav outside TransitionProvider");
  return nav;
}

// React <ViewTransition> crossfades the page only for navigations tagged with
// this type, never for router.refresh() or server action updates.
const TYPES = ["ft-nav"];

// The branded route wipe. On start a blue bar sweeps across, a second one
// down, and together they flood the screen (COVER_MS) while the next route
// fetches and renders in parallel. Once the URL has changed and no loading.tsx
// shell is showing (or WAIT_MS has passed), the bars retract (REVEAL_MS) and
// focus moves to the new page's h1. Back/forward get a short fade instead;
// reduced motion gets a 150ms fade. The overlay never outlives SAFETY_MS.
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [{ nav, popped, restored, takePopped }] = useState(() => createNav(router, setPhase));

  useEffect(() => {
    const root = document.documentElement;
    // Arrived covered from a form POST: CSS is already revealing.
    let arrival = 0;
    if (root.dataset.ft === "in") {
      arrival = window.setTimeout(() => {
        delete root.dataset.ft;
        focusHeading();
      }, REVEAL_MS + 150);
    }
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      restored();
      delete root.dataset.ft;
    };
    window.addEventListener("popstate", popped);
    window.addEventListener("pageshow", onShow);
    return () => {
      clearTimeout(arrival);
      window.removeEventListener("popstate", popped);
      window.removeEventListener("pageshow", onShow);
    };
  }, [popped, restored]);

  // Back/forward: Next.js renders the previous route itself; fade it in.
  useEffect(() => {
    if (takePopped()) fadeIn();
  }, [pathname, takePopped]);

  return (
    <Ctx.Provider value={nav}>
      <ViewTransition default="none" update={{ "ft-nav": "ft-fade", default: "none" }}>
        <div id={PAGE_ID} className="flex min-h-full flex-1 flex-col">{children}</div>
      </ViewTransition>
      <div className="ft" data-phase={phase} aria-hidden>
        <div className="ft-h" />
        <div className="ft-v" />
        {phase === "hold" && (
          <div className="ft-mark">
            <FlagLoader tone="white" />
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

const PAGE_ID = "ft-page";

function fadeIn() {
  document.getElementById(PAGE_ID)?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: "ease-out" });
}

// After a wipe, keyboard and screen reader users land on the new page's
// heading. A field the page focused itself (autoFocus) keeps focus.
function focusHeading() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.matches("input, textarea, select")) return;
  const h = document.querySelector<HTMLElement>("main h1") ?? document.querySelector<HTMLElement>("h1");
  if (!h) return;
  if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
  h.focus({ preventScroll: true });
}

// All wipe state lives in this closure, outside React's render.
function createNav(router: AppRouter, setPhase: (p: Phase) => void) {
  const r = { phase: "idle" as Phase, from: "", coverDone: false, committed: false, cancelled: false, coverAt: 0, fade: false, popped: false, timers: [] as number[] };
  const set = (p: Phase) => {
    r.phase = p;
    setPhase(p);
  };
  const later = (ms: number, fn: () => void) => r.timers.push(window.setTimeout(fn, ms));
  const clear = () => {
    r.timers.forEach(clearTimeout);
    r.timers = [];
  };
  const finish = () => {
    clear();
    set("idle");
  };
  const reveal = () => {
    clear();
    set("reveal");
    later(REVEAL_MS, () => {
      finish();
      // Next frame: the new page's commit may still be queued behind its view transition.
      if (!r.cancelled) requestAnimationFrame(focusHeading);
    });
    later(SAFETY_MS, finish);
  };
  // Polled every 50ms while covered: has the new route committed (the URL
  // changed), and is it past its loading shell?
  const check = () => {
    if (!r.committed && location.href !== r.from) r.committed = true;
    if (!r.coverDone || !r.committed) return later(50, check);
    if (r.cancelled || routeLoaderCount() === 0 || performance.now() - r.coverAt > WAIT_MS) return reveal();
    later(50, check);
  };
  const start = () => {
    clear();
    r.from = location.href;
    r.coverDone = false;
    r.committed = false;
    r.cancelled = false;
    set("cover");
    later(COVER_MS, () => {
      r.coverDone = true;
      r.coverAt = performance.now();
      if (r.phase === "cover") set("hold");
    });
    later(50, check);
    later(SAFETY_MS, finish);
  };
  // Reduced motion: fade the new page in once the URL has changed. Tagged
  // navigations already crossfade where view transitions exist.
  const startFade = (tagged: boolean) => {
    r.from = location.href;
    r.fade = true;
    const t0 = performance.now();
    const poll = () => {
      if (location.href !== r.from) {
        r.fade = false;
        if (!tagged || typeof document.startViewTransition !== "function") fadeIn();
        focusHeading();
      } else if (performance.now() - t0 < SAFETY_MS) later(50, poll);
      else r.fade = false;
    };
    later(50, poll);
  };
  const go = (method: "push" | "replace", href: string, options?: NavOptions) => {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return location.assign(url.href);
    // Same URL, or a wipe already running (double tap): no second wipe.
    if (url.href === location.href) return router[method](href, options);
    if (r.phase !== "idle" || r.fade) return;
    if (reducedMotion()) startFade(true);
    else start();
    router[method](href, { ...options, transitionTypes: TYPES });
  };
  const nav: FlagNav = {
    push: (href, options) => go("push", href, options),
    replace: (href, options) => go("replace", href, options),
    cover: () => {
      if (r.phase !== "idle") return;
      if (reducedMotion()) startFade(false);
      else start();
    },
    cancel: () => {
      if (r.fade) {
        r.fade = false;
        return clear();
      }
      if (r.phase === "idle") return;
      r.cancelled = true;
      r.committed = true;
    },
    coverForReload: () => {
      try {
        sessionStorage.setItem(RELOAD_KEY, "1");
      } catch {}
      if (r.phase === "idle" && !reducedMotion()) start();
    },
  };
  return {
    nav,
    // Back/forward: Next.js renders the previous route itself; drop any wipe.
    popped: () => {
      clear();
      r.fade = false;
      r.popped = true;
      set("idle");
    },
    // Safari's back-forward cache restored the page as it was left: covered.
    restored: () => {
      clear();
      set("idle");
    },
    // The route changed; true if it came from back/forward.
    takePopped: () => {
      const was = r.popped;
      r.popped = false;
      return was;
    },
  };
}

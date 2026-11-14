"use client";

import { useEffect } from "react";

// Route loaders (loading.tsx) currently on screen. The route wipe waits for
// this to reach 0 before it reveals, so it uncovers the page, not its shell.
let routeLoaders = 0;
export const routeLoaderCount = () => routeLoaders;

// Branded loader: a Nordic cross whose two bars grow out of the crossing and
// retract, in a loop. Reduced motion: a static cross with a slow opacity pulse
// (globals.css, .fl). `tone`: blue on light, white on the blue overlay.
export function FlagLoader({ size = "md", tone = "blue", caption, route = false, className = "" }: {
  size?: "md" | "lg";
  tone?: "blue" | "white";
  caption?: string;
  route?: boolean;
  className?: string;
}) {
  useEffect(() => {
    if (!route) return;
    routeLoaders++;
    return () => {
      routeLoaders--;
    };
  }, [route]);

  return (
    <span role="status" data-tone={tone} className={`fl fl-${size} ${className}`}>
      <Cross />
      {caption ? <span className="fl-caption">{caption}</span> : <span className="sr-only">Loading</span>}
    </span>
  );
}

// Inline version for buttons that are saving: current text colour, about one
// letter tall. The button's own label ("Saving...") is what screen readers get.
export function FlagMini() {
  return (
    <span aria-hidden className="fl fl-mini">
      <Cross />
    </span>
  );
}

// Full-height centred loader for loading.tsx files.
export function RouteLoader({ caption }: { caption?: string }) {
  return (
    <div className="flex min-h-[60dvh] flex-1 items-center justify-center px-4 py-16">
      <FlagLoader route size="lg" caption={caption} />
    </div>
  );
}

function Cross() {
  return (
    <span className="fl-flag" aria-hidden>
      <span className="fl-h" />
      <span className="fl-v" />
    </span>
  );
}

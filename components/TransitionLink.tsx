"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { useFlagNav } from "@/components/TransitionProvider";

// next/link with the flag route wipe. Keeps Link's prefetching and its
// handling of new-tab clicks (Ctrl/Cmd/middle click open normally).
export default function TransitionLink({ href, replace, scroll, onNavigate, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const nav = useFlagNav();
  return (
    <Link
      {...rest}
      href={href}
      replace={replace}
      scroll={scroll}
      onNavigate={(e) => {
        onNavigate?.(e);
        e.preventDefault();
        nav[replace ? "replace" : "push"](href, scroll === undefined ? undefined : { scroll });
      }}
    />
  );
}

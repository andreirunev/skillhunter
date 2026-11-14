import Link from "@/components/TransitionLink";
import type { ReactNode } from "react";

// Full-width tappable card: leading tile, title, grey sub line, optional meta
// line with small icons, and a pill on the right.
export function ListRow({ href, leading, title, sub, meta, trailing }: {
  href: string;
  leading?: ReactNode;
  title: string;
  sub?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <Link href={href} className="tap flex items-center gap-3 rounded-card border border-border bg-card p-3 active:bg-track">
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-snug">{title}</p>
        {sub && <p className="mt-0.5 truncate text-[13px] text-muted">{sub}</p>}
        {meta && <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">{meta}</div>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </Link>
  );
}

// Candidate avatar: their emoji on a tile in their colour (content, not chrome).
export function AvatarTile({ emoji, color, size = 44 }: { emoji: string; color: string; size?: number }) {
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-tile"
      style={{ width: size, height: size, background: `${color}33`, fontSize: Math.round(size * 0.5) }}>
      {emoji}
    </span>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

// Large title top-left, one optional help link top-right.
export function ScreenTitle({ title, help }: { title: string; help?: { href: string; label: string; icon?: ReactNode } }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
      {help && (
        <Link href={help.href} className="tap -mr-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-medium text-muted">
          {help.icon}{help.label}
        </Link>
      )}
    </div>
  );
}

// Small caps grey label above a list, e.g. "Needs your call" <Sep /> "3".
// `as="p"` for an eyebrow above a page's h1.
export function SectionLabel({ children, as: Tag = "h2" }: { children: ReactNode; as?: "h2" | "p" }) {
  return <Tag className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{children}</Tag>;
}

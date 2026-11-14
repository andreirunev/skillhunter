import { Fragment, type ReactNode } from "react";

// Divider between inline facts ("Needs your call | 2"): a thin muted line,
// never a typed character, so screen readers skip it. Styled only here.
export function Sep() {
  return <span aria-hidden="true" className="mx-2 inline-block h-[0.9em] w-0 border-l border-current align-[-0.1em] opacity-45" />;
}

// Joins parts with <Sep />, dropping empty ones. Each divider is glued to the
// first word after it, so a wrapped line never ends with a divider.
export function joinSep(parts: ReactNode[]): ReactNode {
  const kept = parts.filter((p) => p !== null && p !== undefined && p !== false && p !== "");
  return kept.map((part, i) => {
    if (i === 0) return <Fragment key={i}>{part}</Fragment>;
    if (typeof part === "string" || typeof part === "number") {
      const text = String(part);
      const cut = text.indexOf(" ");
      return (
        <Fragment key={i}>
          <span className="whitespace-nowrap"><Sep />{cut === -1 ? text : text.slice(0, cut)}</span>
          {cut === -1 ? null : text.slice(cut)}
        </Fragment>
      );
    }
    return <span key={i} className="whitespace-nowrap"><Sep />{part}</span>;
  });
}

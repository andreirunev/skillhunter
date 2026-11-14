// The candidate's booth code, big enough to compare with their phone at a glance.
export function BigCode({ code }: { code: string }) {
  return <span className="text-[44px] font-bold leading-none tabular-nums tracking-[0.12em] text-fg">{code}</span>;
}

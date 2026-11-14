const SIZES = {
  sm: "h-10 w-10 text-xl",
  md: "h-14 w-14 text-3xl",
  lg: "h-24 w-24 text-5xl",
};

export function AvatarBadge({ emoji, color, size = "md" }: { emoji: string; color: string; size?: keyof typeof SIZES }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ring-4 ring-white ${SIZES[size]}`}
      style={{ background: `${color}22`, boxShadow: `0 0 0 2px ${color}` }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}

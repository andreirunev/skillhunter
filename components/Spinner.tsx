// Small loading arc for buttons. Holds still under reduced motion.
export function Spinner() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-3.5 shrink-0 animate-spin" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

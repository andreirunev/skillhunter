// Inline busy mark for buttons that are saving: a Nordic cross whose two bars
// grow out of the crossing and retract, in the current text colour, about one
// letter tall (globals.css, .fl). Reduced motion: a static cross with a slow
// opacity pulse. The button's own label ("Saving...") is what screen readers get.
export function FlagMini() {
  return (
    <span aria-hidden className="fl-mini">
      <span className="fl-flag">
        <span className="fl-h" />
        <span className="fl-v" />
      </span>
    </span>
  );
}

// Full-height placeholder for loading.tsx files: static, no motion, so a
// navigation shows nothing animated. Without a caption only screen readers
// hear "Loading" (candidate screens, nothing to translate).
export function RouteLoader({ caption }: { caption?: string }) {
  return (
    <div role="status" className="flex min-h-[60dvh] flex-1 items-center justify-center px-4 py-16 text-sm font-medium opacity-60">
      {caption ?? <span className="sr-only">Loading</span>}
    </div>
  );
}

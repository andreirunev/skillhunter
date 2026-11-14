"use client";

type Option<T extends string> = { value: T; label: string };

// One horizontal row of filter pills; scrolls sideways, active pill is white.
export function FilterPills<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={`min-h-10 shrink-0 rounded-pill border px-4 text-sm font-semibold ${
              on ? "border-accent bg-accent text-bg" : "border-border bg-card text-fg/80"
            }`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

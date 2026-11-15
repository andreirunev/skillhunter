"use client";

type Option<T extends string> = { value: T; label: string };

// Two or three options in a grey track; the active one is a solid white tab.
// Track uses the card radius; the tab is that minus the p-1 inset, so corners nest evenly.
export function Segmented<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col rounded-card bg-track p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={`min-h-9 rounded-[calc(var(--radius-card)_-_var(--spacing))] px-3 text-sm font-semibold ${on ? "bg-accent text-bg" : "text-muted"}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Answer, Option, TaskPayload, TaskType } from "@/lib/tasks";
import { t, type Lang } from "@/lib/i18n";

// onChange(next, revision): revision = the candidate replaced or removed part
// of an answer they had already given. That is what "answer changes" counts.
type InputProps<T> = { value: T | undefined; onChange: (next: T | undefined, revision: boolean) => void };

const PAIR_COLORS = ["#1e5bd8", "#0f9f6e", "#d97706", "#7c3aed", "#db2777", "#0891b2"];

function OptionFace({ option, big }: { option: Option; big?: boolean }) {
  return (
    <>
      {option.emoji && <span className={option.label ? "text-2xl" : big ? "text-5xl" : "text-4xl"} aria-hidden>{option.emoji}</span>}
      {option.label && <span className="text-base font-semibold leading-snug">{option.label}</span>}
      {!option.label && option.emoji && <span className="sr-only">{option.emoji}</span>}
    </>
  );
}

function tileClass(selected: boolean, grid: boolean) {
  return [
    "flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition active:scale-[0.98]",
    grid ? "flex-col justify-center text-center" : "",
    selected ? "border-brand-600 bg-brand-50 shadow-sm" : "border-slate-200 bg-white",
  ].join(" ");
}

function ChoiceInput({ options, layout, value, onChange }: InputProps<string> & { options: Option[]; layout?: string }) {
  const grid = layout === "grid";
  return (
    <div className={grid ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} className={tileClass(value === o.id, grid)}
          onClick={() => value !== o.id && onChange(o.id, value !== undefined)}>
          <OptionFace option={o} big={grid} />
        </button>
      ))}
    </div>
  );
}

function MultiInput({ options, layout, value = [], onChange }: InputProps<string[]> & { options: Option[]; layout?: string }) {
  const grid = layout === "grid";
  return (
    <div className={grid ? "grid grid-cols-3 gap-3" : "flex flex-col gap-3"}>
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button key={o.id} type="button" aria-pressed={on} className={`relative ${tileClass(on, grid)}`}
            onClick={() => {
              const next = on ? value.filter((id) => id !== o.id) : [...value, o.id];
              onChange(next.length ? next : undefined, on);
            }}>
            <span className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border-2 text-sm font-bold ${on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white"}`} aria-hidden>
              {on ? "✓" : ""}
            </span>
            <OptionFace option={o} big={grid} />
          </button>
        );
      })}
    </div>
  );
}

function OrderInput({ options, value = [], onChange, lang }: InputProps<string[]> & { options: Option[]; lang: Lang }) {
  const byId = (id: string) => options.find((o) => o.id === id)!;
  const remaining = options.filter((o) => !value.includes(o.id));
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-slate-100 p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-sm font-semibold text-slate-600">{t(lang, "yourOrder")}</span>
          {value.length > 0 && (
            <button type="button" className="min-h-10 rounded-lg px-3 text-sm font-semibold text-brand-700" onClick={() => onChange(undefined, true)}>
              ↺ {t(lang, "clear")}
            </button>
          )}
        </div>
        <ol className="flex flex-col gap-2">
          {options.map((_, i) => {
            const id = value[i];
            return (
              <li key={i}>
                {id ? (
                  <button type="button" className="flex min-h-14 w-full items-center gap-3 rounded-xl bg-white px-3 text-left shadow-sm ring-2 ring-brand-600"
                    onClick={() => onChange(value.filter((x) => x !== id).length ? value.filter((x) => x !== id) : undefined, true)}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 font-bold text-white">{i + 1}</span>
                    <OptionFace option={byId(id)} />
                    <span className="ml-auto text-slate-400" aria-hidden>✕</span>
                  </button>
                ) : (
                  <div className="flex min-h-14 items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 px-3 text-slate-400">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 font-bold">{i + 1}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      {remaining.length > 0 && (
        <div className="flex flex-col gap-3">
          {remaining.map((o) => (
            <button key={o.id} type="button" className={tileClass(false, false)} onClick={() => onChange([...value, o.id], false)}>
              <OptionFace option={o} />
              <span className="ml-auto text-2xl text-brand-600" aria-hidden>＋</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchInput({ left, right, value = {}, onChange }: InputProps<Record<string, string>> & { left: Option[]; right: Option[] }) {
  const [active, setActive] = useState<string | null>(null);
  const colorOf = (leftId: string) => PAIR_COLORS[left.findIndex((l) => l.id === leftId) % PAIR_COLORS.length];
  const leftFor = (rightId: string) => Object.keys(value).find((l) => value[l] === rightId);

  function pick(rightId: string) {
    const owner = leftFor(rightId);
    if (!active) {
      if (owner) {
        const next = { ...value };
        delete next[owner];
        onChange(Object.keys(next).length ? next : undefined, true);
      }
      return;
    }
    const next = { ...value };
    const revision = Boolean(next[active]) || Boolean(owner && owner !== active);
    if (owner) delete next[owner];
    next[active] = rightId;
    setActive(null);
    onChange(next, revision);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-3">
        {left.map((o, i) => {
          const paired = Boolean(value[o.id]);
          const isActive = active === o.id;
          return (
            <button key={o.id} type="button" aria-pressed={isActive}
              onClick={() => setActive(isActive ? null : o.id)}
              className={`relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-2 text-center transition ${isActive ? "border-brand-600 bg-brand-50 ring-4 ring-brand-100" : "border-slate-200 bg-white"}`}
              style={paired && !isActive ? { borderColor: colorOf(o.id), background: `${colorOf(o.id)}14` } : undefined}>
              <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: colorOf(o.id) }}>
                {i + 1}
              </span>
              <OptionFace option={o} />
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-3">
        {right.map((o) => {
          const owner = leftFor(o.id);
          return (
            <button key={o.id} type="button" onClick={() => pick(o.id)}
              className={`relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-2 text-center transition ${active && !owner ? "border-dashed border-brand-600 bg-white" : "border-slate-200 bg-white"}`}
              style={owner ? { borderColor: colorOf(owner), background: `${colorOf(owner)}14` } : undefined}>
              {owner && (
                <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: colorOf(owner) }}>
                  {left.findIndex((l) => l.id === owner) + 1}
                </span>
              )}
              <OptionFace option={o} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NumberInput({ unit, value, onChange }: InputProps<number> & { unit?: string }) {
  const [text, setText] = useState(value === undefined ? "" : String(value));
  return (
    <label className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 focus-within:border-brand-600">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.,-]/g, "").slice(0, 12);
          setText(raw);
          const n = Number(raw.replace(",", "."));
          onChange(raw.trim() !== "" && Number.isFinite(n) ? n : undefined, false);
        }}
        className="min-h-16 w-full bg-transparent text-3xl font-bold outline-none"
        placeholder="0"
        aria-label="Answer"
      />
      {unit && <span className="text-lg font-semibold text-slate-500">{unit}</span>}
    </label>
  );
}

export function TaskInput({ type, payload, value, onChange, lang }: {
  type: TaskType;
  payload: TaskPayload;
  value: Answer | undefined;
  onChange: (next: Answer | undefined, revision: boolean) => void;
  lang: Lang;
}) {
  switch (type) {
    case "choice":
      return <ChoiceInput options={payload.options ?? []} layout={payload.layout} value={value as string | undefined} onChange={onChange} />;
    case "multi":
      return <MultiInput options={payload.options ?? []} layout={payload.layout} value={value as string[] | undefined} onChange={onChange} />;
    case "order":
      return <OrderInput options={payload.options ?? []} value={value as string[] | undefined} onChange={onChange} lang={lang} />;
    case "match":
      return <MatchInput left={payload.left ?? []} right={payload.right ?? []} value={value as Record<string, string> | undefined} onChange={onChange} />;
    case "number":
      return <NumberInput unit={payload.unit} value={value as number | undefined} onChange={onChange} />;
  }
}

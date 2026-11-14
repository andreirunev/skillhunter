import { describeAnswer, isAnswered, matchesKey, type Answer, type AnswerKey, type TaskPayload, type TaskType } from "./tasks.ts";

// Job simulation: one micro-task per duty of the role. Seven formats; the
// first six mirror real work, quick_logic is the older abstract task (also
// how attempts from before the simulation model are shown). Shared by the
// server, the candidate player, the recruiter card and the builder.

export const FORMATS = ["triage", "spot_error", "next_step", "apply_rule", "read_decide", "handover", "quick_logic"] as const;
export type Format = (typeof FORMATS)[number];
export const isFormat = (x: unknown): x is Format => typeof x === "string" && (FORMATS as readonly string[]).includes(x);

export const FORMAT_LABELS: Record<Format, string> = {
  triage: "Prioritise",
  spot_error: "Spot the error",
  next_step: "Next step",
  apply_rule: "Apply a rule",
  read_decide: "Read and decide",
  handover: "Handover",
  quick_logic: "Quick logic",
};

// exact = one right answer; typical = what most experienced people pick (a
// guide for the conversation, not a right answer); none = no comparison.
export type KeyKind = "exact" | "typical" | "none";
export type SkillKind = "hard" | "soft";

export type Item = { id: string; text: string };
// One labelled field of an artifact (an order line, a code line, a chart row).
export type Field = { id: string; label: string; value: string };
// A small document on screen. `ref` panels are for reading only (spot_error
// taps happen on the other panels); `mono` renders values as code.
export type Panel = { title: string; fields?: Field[]; lines?: string[]; ref?: boolean; mono?: boolean };

// What the candidate sees. Answer keys never go in here.
export type SimPayload = {
  prompt: string;
  items?: Item[]; // triage
  panels?: Panel[]; // spot_error (tappable fields), next_step (situation)
  rules?: string[]; // apply_rule
  case?: string; // apply_rule
  table?: { columns: string[]; rows: string[][] }; // read_decide
  bars?: { label: string; value: number }[]; // read_decide
  unit?: string; // read_decide bars
  question?: string; // read_decide
  options?: Item[]; // next_step, apply_rule, read_decide, handover (notes)
};
// quick_logic keeps the older task shape plus its renderer type.
export type QuickPayload = TaskPayload & { kind: TaskType };
export type AnyPayload = SimPayload | QuickPayload;

// triage: ordered ids. spot_error: wrong field ids. next_step / handover:
// typical option ids. apply_rule / read_decide: the option id. quick_logic:
// the older { value, tolerance }. null when key_kind is "none".
export type SimKey = string | string[] | AnswerKey | null;

// A task as published into a company test (and as the player and the
// recruiter card read it). `id` is a fresh uuid per published version, so
// answers always point at the exact text the candidate saw.
export type SimTask = {
  id: string;
  library_id: string;
  duty: string;
  format: Format;
  title: string;
  skill_tag: string;
  skill_kind: SkillKind;
  expected_seconds: number;
  payload: AnyPayload;
  key: SimKey;
  key_kind: KeyKind;
  good_looks_like: string[];
  not_measure_note: string;
  followups: string[];
};

// What the candidate's phone gets: no key, no guide.
export type PlayerTask = { id: string; format: Format; duty: string; title: string; payload: AnyPayload };
export const toPlayerTask = (t: SimTask): PlayerTask => ({ id: t.id, format: t.format, duty: t.duty, title: t.title, payload: t.payload });

// Library entry (task_library row).
export type LibraryTask = Omit<SimTask, "id" | "library_id" | "duty"> & {
  id: string;
  role_tags: string[];
  duty_hint: string;
  default_order: number;
};

export type TemplateDuty = { id: string; title: string; task_id: string };
export type RoleTemplate = { slug: string; name: string; summary: string; duties: TemplateDuty[] };

const asIds = (x: unknown): string[] => (Array.isArray(x) ? x.filter((v): v is string => typeof v === "string") : typeof x === "string" ? [x] : []);
const optionIds = (p: SimPayload) => (p.options ?? []).map((o) => o.id);
const tappableIds = (p: SimPayload) => (p.panels ?? []).filter((pn) => !pn.ref).flatMap((pn) => (pn.fields ?? []).map((f) => f.id));

export function isAnsweredSim(format: Format, payload: AnyPayload, answer: Answer): boolean {
  if (answer === null || answer === undefined) return false;
  if (format === "quick_logic") return isAnswered((payload as QuickPayload).kind, payload as TaskPayload, answer);
  const p = payload as SimPayload;
  switch (format) {
    case "triage": {
      const ids = (p.items ?? []).map((i) => i.id);
      return Array.isArray(answer) && answer.length === ids.length && new Set(answer).size === ids.length &&
        answer.every((id) => ids.includes(id as string));
    }
    case "spot_error": {
      const ids = tappableIds(p);
      return Array.isArray(answer) && answer.length > 0 && answer.every((id) => ids.includes(id as string));
    }
    default:
      return typeof answer === "string" && optionIds(p).includes(answer);
  }
}

// The neutral fact stored in answers.matches_key. Always false for "none"
// (the recruiter card then says there is nothing to compare).
export function compareSim(task: Pick<SimTask, "format" | "payload" | "key" | "key_kind">, answer: Answer): boolean {
  if (answer === null || answer === undefined || task.key_kind === "none" || task.key === null) return false;
  if (task.format === "quick_logic") return matchesKey((task.payload as QuickPayload).kind, answer, task.key as AnswerKey);
  const want = asIds(task.key);
  switch (task.format) {
    case "triage":
      return Array.isArray(answer) && answer.length === want.length && answer.every((id, i) => id === want[i]);
    case "spot_error":
      return Array.isArray(answer) && answer.length === want.length && want.every((id) => (answer as string[]).includes(id));
    default:
      return typeof answer === "string" && want.includes(answer);
  }
}

// Neutral wording for the recruiter: "key" only where there is one right
// answer; "typical answer" where experienced people usually pick it.
export function compareLabel(keyKind: KeyKind, matches: boolean): string {
  if (keyKind === "exact") return matches ? "Matches key" : "Differs from key";
  if (keyKind === "typical") return matches ? "Same as typical answer" : "Different from typical answer";
  return "No typical answer, discuss in the interview";
}

const fieldText = (p: SimPayload, id: string) => {
  for (const pn of p.panels ?? []) {
    const f = pn.fields?.find((x) => x.id === id);
    if (f) return pn.mono ? `${pn.title} line ${f.label}: ${f.value.trim()}` : `${pn.title}: ${f.label} ${f.value}`;
  }
  return "?";
};
const itemText = (list: Item[] | undefined, id: string) => list?.find((x) => x.id === id)?.text ?? "?";

// Human-readable answer (or key) for recruiter screens, as parts shown with
// dividers between them.
export function describeSim(format: Format, payload: AnyPayload, answer: Answer | SimKey): string[] {
  if (answer === null || answer === undefined) return ["Skipped"];
  if (format === "quick_logic") {
    const value = typeof answer === "object" && !Array.isArray(answer) && "value" in answer ? (answer as AnswerKey).value : answer;
    return describeAnswer((payload as QuickPayload).kind, payload as TaskPayload, value as Answer);
  }
  const p = payload as SimPayload;
  const ids = asIds(answer);
  switch (format) {
    case "triage":
      return ids.map((id, i) => `${i + 1}. ${itemText(p.items, id)}`);
    case "spot_error":
      return ids.map((id) => fieldText(p, id));
    default:
      return ids.map((id) => itemText(p.options, id));
  }
}

// A key the builder may set for this task: right shape, known ids.
export function isValidKey(format: Format, payload: AnyPayload, keyKind: KeyKind, key: unknown): key is SimKey {
  if (keyKind === "none") return key === null;
  if (format === "quick_logic") return false; // older tasks keep their key
  const p = payload as SimPayload;
  const ids = asIds(key);
  if (!Array.isArray(key) && typeof key !== "string") return false;
  if (new Set(ids).size !== ids.length) return false;
  switch (format) {
    case "triage": {
      const all = (p.items ?? []).map((i) => i.id);
      return Array.isArray(key) && ids.length === all.length && ids.every((id) => all.includes(id));
    }
    case "spot_error": {
      const all = tappableIds(p);
      return Array.isArray(key) && ids.length > 0 && ids.every((id) => all.includes(id));
    }
    case "apply_rule":
    case "read_decide":
      return typeof key === "string" && optionIds(p).includes(key);
    default: // next_step, handover: one or more typical options
      return Array.isArray(key) && ids.length > 0 && ids.every((id) => optionIds(p).includes(id));
  }
}

// Wording that describes people instead of tasks. The builder shows a soft
// warning, never blocks.
const LOADED = /\b(native|mother tongue|young|youthful|energetic|digital native|perfect (english|finnish|swedish)|fluent|recent graduate|fresh graduate|under \d\d|max(imum)? age|good[- ]looking|able[- ]bodied|culture fit|cultural fit|no accent|girls?|guys?)\b/i;
export const hasLoadedWording = (text: string) => LOADED.test(text);

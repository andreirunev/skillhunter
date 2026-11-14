// Task model shared by the library, the database rows, the player and the
// recruiter view. Five formats, all answerable by tapping (number = one field).

export const TASK_TYPES = ["choice", "multi", "order", "match", "number"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TYPE_LABELS: Record<TaskType, string> = {
  choice: "Pick one",
  multi: "Pick all that apply",
  order: "Put in order",
  match: "Match pairs",
  number: "Number",
};

export const SKILLS = {
  spatial: "Spatial",
  logical: "Logical",
  procedural: "Procedural",
  attention: "Attention to detail",
  safety: "Safety awareness",
} as const;
export type Skill = keyof typeof SKILLS;

export const SECTORS = {
  general: { label: "General aptitude", emoji: "🧩" },
  cleaning: { label: "Cleaning", emoji: "🧽" },
  construction: { label: "Construction & welding", emoji: "🏗️" },
  logistics: { label: "Logistics", emoji: "📦" },
  it: { label: "IT", emoji: "💻" },
} as const;
export type Sector = keyof typeof SECTORS;

export type Option = { id: string; label: string; emoji?: string };

export type TaskPayload = {
  title: string; // short name for builders and recruiters
  prompt: string; // what the candidate reads
  emoji?: string; // big visual above the prompt
  code?: string; // optional code block
  options?: Option[]; // choice, multi, order (shown in this scrambled order)
  layout?: "list" | "grid";
  left?: Option[]; // match
  right?: Option[]; // match (scrambled)
  unit?: string; // number
};

// null = the candidate skipped the task.
export type Answer = string | string[] | Record<string, string> | number | null;
export type AnswerKey = { value: Exclude<Answer, null>; tolerance?: number };

export type TaskDef = {
  id: string;
  sector: Sector;
  skill: Skill;
  type: TaskType;
  payload: TaskPayload;
  key: AnswerKey;
  expectedSec: number;
  followUps: string[]; // company-authored questions for the live conversation
};

// Asked about every answer, on top of the task's own follow-ups.
export const GENERIC_FOLLOW_UPS = [
  "Walk me through how you got this answer.",
  "What would you do differently on a real job?",
];

export function isAnswered(type: TaskType, payload: TaskPayload, answer: Answer): boolean {
  if (answer === null || answer === undefined) return false;
  switch (type) {
    case "choice":
      return typeof answer === "string" && answer !== "";
    case "multi":
      return Array.isArray(answer) && answer.length > 0;
    case "order":
      return Array.isArray(answer) && answer.length === (payload.options?.length ?? 0);
    case "match":
      return typeof answer === "object" && !Array.isArray(answer) &&
        Object.keys(answer).length === (payload.left?.length ?? 0);
    case "number":
      return typeof answer === "number" && Number.isFinite(answer);
  }
}

// A neutral fact for the recruiter: does the answer equal the company's key?
export function matchesKey(type: TaskType, answer: Answer, key: AnswerKey): boolean {
  if (answer === null || answer === undefined) return false;
  const v = key.value;
  switch (type) {
    case "choice":
      return answer === v;
    case "multi": {
      if (!Array.isArray(answer) || !Array.isArray(v)) return false;
      return answer.length === v.length && v.every((id) => answer.includes(id));
    }
    case "order":
      return Array.isArray(answer) && Array.isArray(v) &&
        answer.length === v.length && answer.every((id, i) => id === v[i]);
    case "match": {
      if (typeof answer !== "object" || Array.isArray(answer) || typeof v !== "object" || Array.isArray(v)) return false;
      const want = Object.entries(v as Record<string, string>);
      return want.length === Object.keys(answer).length && want.every(([l, r]) => answer[l] === r);
    }
    case "number":
      return typeof answer === "number" && typeof v === "number" && Math.abs(answer - v) <= (key.tolerance ?? 0);
  }
}

const optionText = (o?: Option) => (o ? [o.emoji, o.label].filter(Boolean).join(" ") : "?");

// Human-readable answer (or key) for the recruiter screen, as parts the page
// shows with dividers between them (one part per pair for "match").
export function describeAnswer(type: TaskType, payload: TaskPayload, answer: Answer): string[] {
  if (answer === null || answer === undefined) return ["Skipped"];
  const find = (list: Option[] | undefined, id: string) => optionText(list?.find((o) => o.id === id));
  switch (type) {
    case "choice":
      return [find(payload.options, answer as string)];
    case "multi":
      return [(answer as string[]).map((id) => find(payload.options, id)).join(", ")];
    case "order":
      return [(answer as string[]).map((id, i) => `${i + 1}. ${find(payload.options, id)}`).join("  ")];
    case "match":
      return Object.entries(answer as Record<string, string>)
        .map(([l, r]) => `${find(payload.left, l)} → ${find(payload.right, r)}`);
    case "number":
      return [`${answer}${payload.unit ? ` ${payload.unit}` : ""}`];
  }
}

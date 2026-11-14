// Informational flags: three plain rules, no ML, no hidden signals.
// They never lower anything and never sort anyone; they only suggest what to ask.

export type FlagCode = "fast" | "slow" | "changes";

export const FLAG_RULES = {
  fastBelowShare: 0.15, // under 15% of the expected time
  slowAboveFactor: 3, // more than 3x the expected time
  changesAtLeast: 3,
};

export function computeFlags(input: {
  timeMs: number;
  expectedSec: number;
  changes: number;
  ownPace: boolean;
  skipped: boolean;
}): FlagCode[] {
  const flags: FlagCode[] = [];
  const expectedMs = input.expectedSec * 1000;
  // Own-pace mode switches time flags off; a skipped task has no meaningful time.
  if (!input.ownPace && !input.skipped) {
    if (input.timeMs < expectedMs * FLAG_RULES.fastBelowShare) flags.push("fast");
    if (input.timeMs > expectedMs * FLAG_RULES.slowAboveFactor) flags.push("slow");
  }
  if (input.changes >= FLAG_RULES.changesAtLeast) flags.push("changes");
  return flags;
}

export const FLAG_INFO: Record<FlagCode, { emoji: string; label: string; rule: string; notMeaning: string; ask: string }> = {
  fast: {
    emoji: "⚡",
    label: "Very fast",
    rule: "Answered in under 15% of the expected time.",
    notMeaning: "It does NOT mean cheating. Some people simply know this.",
    ask: "Ask them to explain the answer in their own words.",
  },
  slow: {
    emoji: "🕰️",
    label: "Took longer",
    rule: "Took more than 3× the expected time.",
    notMeaning: "It does NOT mean a weaker answer. It could be a break, a phone call or reading in a second language. No penalty.",
    ask: "Ask how they approached it.",
  },
  changes: {
    emoji: "🔁",
    label: "Changed 3+ times",
    rule: "The answer was changed 3 or more times.",
    notMeaning: "It does NOT mean guessing. Double-checking is often careful work.",
    ask: "Ask what made them change their mind.",
  },
};

export const OWN_PACE_NOTE = "Own-pace mode was on: time flags are switched off for this candidate.";

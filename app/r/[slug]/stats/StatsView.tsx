"use client";

import { useState } from "react";
import { CircleCheck, CircleX, Handshake, Hourglass, Send, ThumbsUp } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { StatCard } from "@/components/ui/StatCard";

export type Counts = { finished: number; inProgress: number; invited: number; atBooth: number; goodFit: number; notNow: number };

const PERIODS = [
  { value: "week", label: "This week" },
  { value: "all", label: "All time" },
] as const;

export function StatsView({ week, all }: { week: Counts; all: Counts }) {
  const [period, setPeriod] = useState<"week" | "all">("week");
  const c = period === "week" ? week : all;

  return (
    <>
      <Segmented label="Period" options={PERIODS} value={period} onChange={setPeriod} />
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Finished" value={c.finished} icon={CircleCheck} tone="muted" />
        <StatCard label="In progress" value={c.inProgress} icon={Hourglass} tone="muted" />
        <StatCard label="Invited" value={c.invited} icon={Send} tone="info" />
        <StatCard label="At booth" value={c.atBooth} icon={Handshake} tone="info" />
        <StatCard label="Good fit" value={c.goodFit} icon={ThumbsUp} tone="ok" />
        <StatCard label="Not now" value={c.notNow} icon={CircleX} tone="bad" />
      </div>
      <p className="text-[13px] text-muted">Counts only. No ranking.</p>
    </>
  );
}

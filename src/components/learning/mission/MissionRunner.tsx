"use client";

import { useState } from "react";
import type { RoundMission } from "@/lib/rounds";
import type { MatchResult } from "@/types/game";
import { SpotView } from "./SpotView";
import { FixView } from "./FixView";
import { BudgetView } from "./BudgetView";
import type { MissionResult } from "./useMissionAttempts";

const TABS = [
  { variant: "spot", label: "1 SPOT IT" },
  { variant: "fix", label: "2 FIX IT" },
  { variant: "budget", label: "3 BEAT THE BUDGET" },
] as const;

interface Props {
  missions: RoundMission[];
  /** Reports one settled mission to the game engine (same shape as a matching set) */
  onSettled: (result: MatchResult) => void;
  onComplete: () => void;
}

/** Plays the missions of a round one after another. The player decides when to move on. */
export function MissionRunner({ missions, onSettled, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const mission = missions[index];
  if (!mission) return null;
  const isLast = index >= missions.length - 1;

  const settle = (r: MissionResult) => {
    setDone(true);
    onSettled({
      setId: mission.id,
      concepts: mission.concepts,
      attemptCorrect: r.attemptCorrect,
      hintUsed: r.hintUsed,
    });
  };

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setIndex(index + 1);
      setDone(false);
    }
  };

  return (
    <div>
      <div className="mx-auto mb-4 flex max-w-6xl flex-wrap items-center gap-2">
        {missions.map((m, i) => {
          const tab = TABS.find((t) => t.variant === m.variant);
          const state = i < index ? "done" : i === index ? "active" : "todo";
          return (
            <span
              key={m.id}
              className={`rounded-full border px-4 py-1.5 font-mono text-[11px] tracking-widest ${
                state === "active"
                  ? "border-accent bg-accent font-bold text-white"
                  : state === "done"
                    ? "border-success/50 text-success"
                    : "border-edge text-muted"
              }`}
            >
              {state === "done" ? "✓ " : ""}
              {tab?.label ?? m.variant}
            </span>
          );
        })}
      </div>

      {mission.variant === "spot" && <SpotView key={mission.id} onSettle={settle} />}
      {mission.variant === "fix" && <FixView key={mission.id} onSettle={settle} />}
      {mission.variant === "budget" && <BudgetView key={mission.id} onSettle={settle} />}

      {done && (
        <div className="mx-auto mt-5 flex max-w-6xl justify-end">
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-accent px-6 py-3 font-mono text-sm font-bold tracking-widest text-white"
          >
            {isLast ? "FINISH MISSIONS →" : "NEXT MISSION →"}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { getCourseMasteryPercents } from "@/lib/gameLogic";
import { COURSE_UNITS, type GameState } from "@/types/game";

interface MasteryViewProps {
  state: GameState;
}

export function MasteryView({ state }: MasteryViewProps) {
  const mastery = getCourseMasteryPercents(state);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-violet">
          Course Mastery
        </h2>
        <p className="mt-1 text-xs text-muted">
          CSC 3501 · correct / attempted by lecture family
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {COURSE_UNITS.map((unit) => {
          const pct = mastery[unit];
          const width = pct == null ? 0 : pct;
          const entry = state.courseMastery?.[unit];
          return (
            <li key={unit}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-mono text-xs text-foreground">{unit}</span>
                <span className="font-mono text-[11px] tabular-nums text-muted">
                  {pct == null
                    ? "—"
                    : `${pct}% (${entry?.correct ?? 0}/${entry?.attempted ?? 0})`}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-edge/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet to-accent transition-all duration-500"
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

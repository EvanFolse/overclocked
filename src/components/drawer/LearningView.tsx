"use client";

import { CHECKPOINTS } from "@/data/checkpoints";
import { getCourseMasteryPercents } from "@/lib/gameLogic";
import { COURSE_UNITS, type GameState } from "@/types/game";
import type { LearningCheckpoint } from "@/data/checkpoints";

interface LearningViewProps {
  state: GameState;
  activeCheckpoint: LearningCheckpoint | null;
  onOpenCheckpoint: () => void;
  onPractice: () => void;
}

export function LearningView({
  state,
  activeCheckpoint,
  onOpenCheckpoint,
  onPractice,
}: LearningViewProps) {
  const mastery = getCourseMasteryPercents(state);
  const completed = new Set(state.completedLearningCheckpoints);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-violet">
          Learning
        </h2>
        <p className="mt-1 text-xs text-muted">
          Required architecture checkpoints unlock CPU features. Production pauses until
          each is solved.
        </p>
      </div>

      {activeCheckpoint ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-warning">
            Active Checkpoint
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-foreground">
            {activeCheckpoint.title}
          </p>
          <p className="mt-1 text-xs text-muted">{activeCheckpoint.stallBody}</p>
          <button
            type="button"
            onClick={onOpenCheckpoint}
            className="mt-3 w-full rounded-lg border border-warning/50 bg-warning/15 px-3 py-2 font-mono text-xs font-semibold text-warning"
          >
            Continue Lesson
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-edge bg-panel-muted p-3">
          <p className="text-xs text-muted">
            No active stall. Keep upgrading — the next architectural wall will pause the
            CPU when it matters.
          </p>
          <button
            type="button"
            onClick={onPractice}
            className="mt-3 w-full rounded-lg border border-violet/40 bg-violet-soft px-3 py-2 font-mono text-xs font-semibold text-violet"
          >
            Optional Practice Challenge
          </button>
        </div>
      )}

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Checkpoint Path
        </h3>
        <ol className="mt-2 flex flex-col gap-1.5">
          {CHECKPOINTS.map((cp) => {
            const done = completed.has(cp.id);
            const active = activeCheckpoint?.id === cp.id;
            return (
              <li
                key={cp.id}
                className={`rounded-lg border px-2.5 py-2 font-mono text-[11px] ${
                  active
                    ? "border-warning/40 bg-warning/10 text-warning"
                    : done
                      ? "border-success/30 bg-success-soft text-success"
                      : "border-edge bg-panel text-muted"
                }`}
              >
                {done ? "✓ " : active ? "● " : "○ "}
                {cp.title}
              </li>
            );
          })}
        </ol>
      </div>

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Course Mastery
        </h3>
        <ul className="mt-2 flex flex-col gap-2">
          {COURSE_UNITS.map((unit) => {
            const pct = mastery[unit];
            return (
              <li key={unit}>
                <div className="mb-0.5 flex justify-between text-[11px]">
                  <span className="font-mono text-foreground">{unit}</span>
                  <span className="font-mono text-muted">
                    {pct == null ? "—" : `${pct}%`}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-edge/40">
                  <div
                    className="h-full rounded-full bg-violet/70"
                    style={{ width: `${pct ?? 0}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

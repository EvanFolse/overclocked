"use client";

import { STAGES } from "@/data/stages";
import { getCourseMasteryPercents, isStageComplete } from "@/lib/gameLogic";
import { formatMoney } from "@/lib/format";
import { COURSE_UNITS, type GameState } from "@/types/game";
import type { LearningCheckpoint } from "@/data/checkpoints";

interface LearningViewProps {
  state: GameState;
  activeCheckpoint: LearningCheckpoint | null;
  onStartStage: (stageId: number) => void;
  onPractice: () => void;
}

export function LearningView({
  state,
  activeCheckpoint,
  onStartStage,
  onPractice: _onPractice,
}: LearningViewProps) {
  const mastery = getCourseMasteryPercents(state);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-violet">
          Stages
        </h2>
        <p className="mt-1 text-xs text-muted">
          CP keeps growing while you learn. Knowledge unlocks the next stage.
          Prices are placeholders.
        </p>
      </div>

      <ol className="flex flex-col gap-2">
        {STAGES.map((stage) => {
          const done = isStageComplete(state, stage);
          const active = activeCheckpoint?.id === stage.checkpointId;
          const previous = STAGES.find((item) => item.id === stage.id - 1);
          const locked = Boolean(previous && !isStageComplete(state, previous));
          const shortfall = Math.max(0, stage.price - state.money);
          const canStart = !done && !locked && !state.activeCheckpointId && shortfall <= 0;

          return (
            <li
              key={stage.id}
              className={`rounded-xl border p-3 ${
                active
                  ? "border-warning/40 bg-warning/10"
                  : done
                    ? "border-success/30 bg-success-soft"
                    : "border-edge bg-panel"
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Stage {stage.id}
                {done ? " · cleared" : active ? " · in progress" : locked ? " · locked" : ""}
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                {stage.title}
              </p>
              <p className="mt-1 text-xs text-muted">{stage.goal}</p>
              <p className="mt-2 font-mono text-[11px] text-accent-text">
                Price {formatMoney(stage.price)}
              </p>
              {canStart && (
                <button
                  type="button"
                  onClick={() => onStartStage(stage.id)}
                  className="mt-3 w-full rounded-lg border border-violet/40 bg-violet-soft px-3 py-2 font-mono text-xs font-semibold text-violet"
                >
                  Start Stage {stage.id}
                </button>
              )}
              {!done && !locked && !active && shortfall > 0 && (
                <p className="mt-2 font-mono text-[11px] text-warning">
                  Need {formatMoney(shortfall)} more
                </p>
              )}
              {active && (
                <button
                  type="button"
                  onClick={() => onStartStage(stage.id)}
                  className="mt-3 w-full rounded-lg border border-warning/50 bg-warning/15 px-3 py-2 font-mono text-xs font-semibold text-warning"
                >
                  Continue Stage {stage.id}
                </button>
              )}
            </li>
          );
        })}
      </ol>

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

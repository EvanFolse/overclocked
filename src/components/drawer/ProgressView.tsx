"use client";

import { ACHIEVEMENTS } from "@/data/achievements";
import { CPU_ERAS, getCurrentEra, getEraProgress } from "@/data/eras";
import type { GameState } from "@/types/game";

interface ProgressViewProps {
  state: GameState;
  cpuLevel: number;
}

export function ProgressView({ state, cpuLevel }: ProgressViewProps) {
  const current = getCurrentEra(state);
  const { next, progress } = getEraProgress(state);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-accent-text">
          Progress
        </h2>
        <p className="mt-1 text-xs text-muted">
          Build level {cpuLevel}
          {next ? ` · ${Math.round(progress * 100)}% to ${next.name}` : ""}
        </p>
      </div>

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted">
          CPU Eras
        </h3>
        <ol className="mt-2 flex flex-col">
          {CPU_ERAS.map((era, index) => {
            const unlocked = current.minLevel >= era.minLevel;
            const isCurrent = current.id === era.id;
            return (
              <li key={era.id} className="flex gap-3">
                <div className="flex w-5 flex-col items-center">
                  <div
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${
                      isCurrent
                        ? "bg-accent"
                        : unlocked
                          ? "bg-success"
                          : "bg-edge"
                    }`}
                  />
                  {index < CPU_ERAS.length - 1 && (
                    <div className={`w-px flex-1 ${unlocked ? "bg-success/40" : "bg-edge"}`} />
                  )}
                </div>
                <div className={`pb-3 ${isCurrent ? "" : "opacity-60"}`}>
                  <p className="font-mono text-[10px] text-muted">{era.year}</p>
                  <p
                    className={`font-mono text-xs font-semibold ${
                      isCurrent ? "text-accent-text" : "text-foreground"
                    }`}
                  >
                    {era.name}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-warning">
          Achievements · {state.unlockedAchievements.length}/{ACHIEVEMENTS.length}
        </h3>
        <ul className="mt-2 flex flex-col gap-1.5">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = state.unlockedAchievements.includes(a.id);
            return (
              <li
                key={a.id}
                className={`rounded-lg border px-2.5 py-2 text-[11px] ${
                  unlocked
                    ? "border-warning/30 bg-warning/10 text-foreground"
                    : "border-edge bg-panel-muted text-muted opacity-60"
                }`}
              >
                <span className="font-mono font-semibold">
                  {unlocked ? "★ " : "☆ "}
                  {a.name}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

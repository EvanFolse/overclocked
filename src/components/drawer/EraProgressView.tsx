"use client";

import { CPU_ERAS, getCurrentEra, getEraProgress } from "@/data/eras";
import { UPGRADES } from "@/data/upgrades";
import type { GameState } from "@/types/game";

interface EraProgressViewProps {
  state: GameState;
  cpuLevel: number;
}

export function EraProgressView({ state, cpuLevel }: EraProgressViewProps) {
  const current = getCurrentEra(state);
  const { next, progress } = getEraProgress(state);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-accent-text">
          Architecture / Eras
        </h2>
        <p className="mt-1 text-xs text-muted">
          Build level {cpuLevel}
          {next ? ` · ${Math.round(progress * 100)}% to ${next.name}` : " · flagship class"}
        </p>
      </div>

      <ol className="flex flex-col">
        {CPU_ERAS.map((era, index) => {
          const unlocked = current.minLevel >= era.minLevel;
          const isCurrent = current.id === era.id;
          return (
            <li key={era.id} className="flex gap-3">
              <div className="flex w-6 flex-col items-center">
                <div
                  className={`mt-1 h-3 w-3 rounded-full border-2 ${
                    isCurrent
                      ? "border-accent bg-accent"
                      : unlocked
                        ? "border-success bg-success"
                        : "border-edge bg-panel"
                  }`}
                />
                {index < CPU_ERAS.length - 1 && (
                  <div
                    className={`w-px flex-1 ${
                      unlocked ? "bg-success/50" : "bg-edge"
                    }`}
                  />
                )}
              </div>
              <div className={`pb-5 ${isCurrent ? "" : "opacity-70"}`}>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  {era.year}
                </p>
                <p
                  className={`font-mono text-sm font-semibold ${
                    isCurrent ? "text-accent-text" : "text-foreground"
                  }`}
                >
                  {era.name}
                  {isCurrent ? " · current" : ""}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  {era.architectureFocus}
                </p>
                {isCurrent && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                    {era.summary}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Current Specs
        </h3>
        <ul className="mt-2 grid gap-1">
          {UPGRADES.map((u) => (
            <li
              key={u.id}
              className="rounded-lg border border-edge/70 bg-panel-muted px-2.5 py-1.5 font-mono text-[11px] text-muted"
            >
              <span className="text-accent-text">{u.shortName}:</span>{" "}
              {u.formatSpec(state.upgradeLevels[u.id] ?? 0)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

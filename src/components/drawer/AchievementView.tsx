"use client";

import { ACHIEVEMENTS } from "@/data/achievements";
import type { GameState } from "@/types/game";

interface AchievementViewProps {
  state: GameState;
}

export function AchievementView({ state }: AchievementViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-warning">
          Achievements
        </h2>
        <p className="mt-1 text-xs text-muted">
          {state.unlockedAchievements.length} / {ACHIEVEMENTS.length} unlocked
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = state.unlockedAchievements.includes(achievement.id);
          return (
            <li
              key={achievement.id}
              className={`rounded-xl border px-3 py-2.5 ${
                unlocked
                  ? "border-warning/40 bg-warning/10"
                  : "border-edge bg-panel-muted opacity-60"
              }`}
            >
              <p
                className={`font-mono text-xs font-semibold ${
                  unlocked ? "text-warning" : "text-muted"
                }`}
              >
                {unlocked ? "★ " : "☆ "}
                {achievement.name}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">{achievement.description}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

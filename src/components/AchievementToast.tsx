"use client";

import { ACHIEVEMENTS } from "@/data/achievements";

interface AchievementToastProps {
  achievementId: string | null;
}

export function AchievementToast({ achievementId }: AchievementToastProps) {
  if (!achievementId) return null;
  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!achievement) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 animate-toast-in">
      <div className="rounded-xl border border-warning/50 bg-panel/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-warning">
          Achievement Unlocked
        </p>
        <p className="mt-1 font-mono text-sm font-semibold text-foreground">
          ★ {achievement.name}
        </p>
        <p className="mt-0.5 text-xs text-muted">{achievement.description}</p>
      </div>
    </div>
  );
}

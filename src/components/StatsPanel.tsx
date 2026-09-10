"use client";

import { ACHIEVEMENTS } from "@/data/achievements";
import { UPGRADES } from "@/data/upgrades";
import { getCurrentEra } from "@/data/eras";
import { formatMoney, formatRate } from "@/lib/format";
import type { GameState } from "@/types/game";

interface StatsPanelProps {
  state: GameState;
  incomePerSecond: number;
  cpuLevel: number;
}

export function StatsPanel({ state, incomePerSecond, cpuLevel }: StatsPanelProps) {
  const era = getCurrentEra(state);
  const stats = [
    { label: "Total Earned", value: formatMoney(state.totalEarned) },
    { label: "Money / sec", value: formatRate(incomePerSecond) },
    { label: "Questions", value: String(state.questionsAnswered) },
    { label: "Correct", value: String(state.correctAnswers) },
    { label: "Build Level", value: String(cpuLevel) },
    {
      label: "Accuracy",
      value:
        state.questionsAnswered === 0
          ? "—"
          : `${Math.round((state.correctAnswers / state.questionsAnswered) * 100)}%`,
    },
  ];

  return (
    <section className="rounded-2xl border border-edge bg-panel p-4 shadow-sm sm:p-5">
      <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-accent-text">
        Stats
      </h2>
      <p className="mt-1 text-xs text-muted">
        Era: <span className="font-semibold text-foreground">{era.name}</span> ({era.year})
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-edge bg-panel-muted px-3 py-2"
          >
            <dt className="text-[10px] uppercase tracking-wider text-muted">{stat.label}</dt>
            <dd className="mt-1 font-mono text-sm font-semibold text-foreground tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-6 font-mono text-xs font-semibold uppercase tracking-widest text-accent-text">
        Current Specs
      </h3>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
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

      <h3 className="mt-6 font-mono text-xs font-semibold uppercase tracking-widest text-warning">
        Achievements
      </h3>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = state.unlockedAchievements.includes(achievement.id);
          return (
            <li
              key={achievement.id}
              className={`rounded-xl border px-3 py-2 ${
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
    </section>
  );
}

"use client";

import { ACHIEVEMENTS } from "@/data/achievements";
import { UPGRADES } from "@/data/upgrades";
import { getCurrentEra } from "@/data/eras";
import { formatIps } from "@/lib/cpuStats";
import { getCourseMasteryPercents } from "@/lib/gameLogic";
import { formatMoney, formatPercent, formatRate } from "@/lib/format";
import { COURSE_UNITS, type CpuPerformance, type GameState } from "@/types/game";
import { CpuCycleVisual } from "@/components/CpuCycleVisual";
import { MemoryHierarchyVisual } from "@/components/MemoryHierarchyVisual";

interface StatsPanelProps {
  state: GameState;
  incomePerSecond: number;
  cpuLevel: number;
  cpuStats: CpuPerformance;
}

export function StatsPanel({
  state,
  incomePerSecond,
  cpuLevel,
  cpuStats,
}: StatsPanelProps) {
  const era = getCurrentEra(state);
  const mastery = getCourseMasteryPercents(state);

  const perfStats = [
    { label: "Clock", value: cpuStats.clockLabel },
    { label: "CPI", value: cpuStats.cpi.toFixed(2) },
    { label: "Cache Hit Rate", value: formatPercent(cpuStats.cacheHitRate) },
    {
      label: "Pipeline Efficiency",
      value: formatPercent(cpuStats.pipelineEfficiency),
    },
    {
      label: "Branch Accuracy",
      value: formatPercent(cpuStats.branchAccuracy),
    },
    { label: "Cores", value: String(cpuStats.coreCount) },
    { label: "Instructions / sec", value: formatIps(cpuStats.ips) },
    { label: "Compute / sec", value: formatRate(incomePerSecond) },
  ];

  const metaStats = [
    { label: "Total Compute", value: formatMoney(state.totalEarned) },
    { label: "Challenges", value: String(state.questionsAnswered) },
    { label: "Correct", value: String(state.correctAnswers) },
    { label: "Build Level", value: String(cpuLevel) },
    { label: "Bottlenecks Fixed", value: String(state.bottlenecksResolved) },
    {
      label: "Overall Accuracy",
      value:
        state.questionsAnswered === 0
          ? "—"
          : `${Math.round((state.correctAnswers / state.questionsAnswered) * 100)}%`,
    },
  ];

  return (
    <section className="rounded-2xl border border-edge bg-panel p-4 shadow-sm sm:p-5">
      <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-accent-text">
        CPU Performance
      </h2>
      <p className="mt-1 text-xs text-muted">
        Era: <span className="font-semibold text-foreground">{era.name}</span> ({era.year})
      </p>
      <p className="mt-0.5 text-[11px] text-accent-text">{era.architectureFocus}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">{era.summary}</p>

      <p className="mt-3 rounded-lg border border-edge/70 bg-panel-muted px-2.5 py-2 font-mono text-[10px] leading-relaxed text-muted">
        IPS ≈ (clock / CPI) × cores × pipeline efficiency — upgrades change these stats,
        which drive Compute Points.
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {perfStats.map((stat) => (
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

      <h3 className="mt-6 font-mono text-xs font-semibold uppercase tracking-widest text-violet">
        Course Mastery · CSC 3501
      </h3>
      <p className="mt-1 text-[11px] text-muted">
        Correct / attempted by lecture family — easy to show during a class demo.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {COURSE_UNITS.map((unit) => {
          const pct = mastery[unit];
          const width = pct == null ? 0 : pct;
          return (
            <li key={unit}>
              <div className="mb-0.5 flex items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] text-foreground">{unit}</span>
                <span className="font-mono text-[11px] tabular-nums text-muted">
                  {pct == null ? "—" : `${pct}%`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-edge/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet to-accent transition-all duration-500"
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <CpuCycleVisual />
        <MemoryHierarchyVisual />
      </div>

      <h3 className="mt-6 font-mono text-xs font-semibold uppercase tracking-widest text-accent-text">
        Progress
      </h3>
      <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metaStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-edge/70 bg-panel-muted px-3 py-2"
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

"use client";

import { formatMoney, formatPercent, formatRate } from "@/lib/format";
import { formatIps } from "@/lib/cpuStats";
import { useTheme } from "@/lib/theme";
import type { CpuPerformance } from "@/types/game";

interface HeaderProps {
  money: number;
  incomePerSecond: number;
  cpuStats: CpuPerformance;
  hasBottleneck: boolean;
  onOpenQuiz: () => void;
  onReset: () => void;
}

export function Header({
  money,
  incomePerSecond,
  cpuStats,
  hasBottleneck,
  onOpenQuiz,
  onReset,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-edge bg-panel/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge bg-accent-soft font-mono text-sm font-bold text-accent-text">
            CPU
          </div>
          <div>
            <h1 className="font-mono text-xl font-bold tracking-wide text-accent-text sm:text-2xl">
              Overclocked
            </h1>
            <p className="text-xs text-muted">
              Computer Organization idle lab · {cpuStats.clockLabel} ·{" "}
              {formatIps(cpuStats.ips)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="rounded-lg border border-success/30 bg-success-soft px-3 py-2">
            <p className="text-[10px] uppercase tracking-widest text-success/80">
              Compute Points
            </p>
            <p className="font-mono text-lg font-semibold text-success tabular-nums">
              {formatMoney(money)}
            </p>
          </div>
          <div className="rounded-lg border border-edge bg-accent-soft px-3 py-2">
            <p className="text-[10px] uppercase tracking-widest text-accent-text/80">
              Throughput
            </p>
            <p className="font-mono text-lg font-semibold text-accent-text tabular-nums">
              {formatRate(incomePerSecond)}
            </p>
          </div>
          <div className="hidden rounded-lg border border-edge bg-panel-muted px-3 py-2 sm:block">
            <p className="text-[10px] uppercase tracking-widest text-muted">CPI</p>
            <p className="font-mono text-sm font-semibold tabular-nums">{cpuStats.cpi}</p>
          </div>
          <div className="hidden rounded-lg border border-edge bg-panel-muted px-3 py-2 md:block">
            <p className="text-[10px] uppercase tracking-widest text-muted">Hit Rate</p>
            <p className="font-mono text-sm font-semibold tabular-nums">
              {formatPercent(cpuStats.cacheHitRate)}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="rounded-lg border border-edge bg-panel-muted px-3 py-2 font-mono text-xs font-semibold text-foreground transition hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button
            type="button"
            onClick={onOpenQuiz}
            className={`rounded-lg border px-4 py-2 font-mono text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-violet/50 ${
              hasBottleneck
                ? "animate-pulse border-warning/60 bg-warning/15 text-warning"
                : "border-violet/40 bg-violet-soft text-violet hover:opacity-90"
            }`}
          >
            {hasBottleneck ? "Fix Bottleneck" : "CPU Challenge"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-edge bg-panel-muted px-3 py-2 text-xs text-muted transition hover:border-rose-400/40 hover:text-rose-500 focus:outline-none focus:ring-2 focus:ring-edge"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}

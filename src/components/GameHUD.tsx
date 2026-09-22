"use client";

import { formatIps } from "@/lib/cpuStats";
import { formatMoney, formatRate } from "@/lib/format";
import type { CpuPerformance } from "@/types/game";

interface GameHUDProps {
  money: number;
  incomePerSecond: number;
  cpuStats: CpuPerformance;
  eraName: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
}

export function GameHUD({
  money,
  incomePerSecond,
  cpuStats,
  eraName,
  menuOpen,
  onToggleMenu,
}: GameHUDProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 sm:p-5">
      <div className="mx-auto flex max-w-[1400px] items-start justify-between gap-3">
        {/* Top-left brand */}
        <div className="pointer-events-auto min-w-0">
          <h1 className="font-mono text-sm font-bold tracking-[0.2em] text-accent-text sm:text-base">
            OVERCLOCKED
          </h1>
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-muted sm:text-[11px]">
            {eraName}
          </p>
        </div>

        {/* Top-center currency */}
        <div className="pointer-events-none absolute left-1/2 top-3 w-[min(100%-7rem,20rem)] -translate-x-1/2 text-center sm:top-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
            Compute Points
          </p>
          <p className="mt-0.5 font-mono text-2xl font-bold tabular-nums text-success sm:text-3xl">
            {formatMoney(money)}
          </p>
          <p className="mt-0.5 font-mono text-xs tabular-nums text-accent-text sm:text-sm">
            +{formatRate(incomePerSecond)}
            <span className="mx-1.5 text-muted">·</span>
            <span className="text-muted">{formatIps(cpuStats.ips)}</span>
          </p>
        </div>

        {/* Top-right hamburger */}
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="pointer-events-auto flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-edge bg-panel/80 backdrop-blur-md transition hover:border-accent/50 hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <span
            className={`block h-0.5 w-5 rounded-full bg-foreground transition ${
              menuOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 rounded-full bg-foreground transition ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 rounded-full bg-foreground transition ${
              menuOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}

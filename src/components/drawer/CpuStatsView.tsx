"use client";

import { formatIps } from "@/lib/cpuStats";
import { formatPercent, formatRate } from "@/lib/format";
import { CpuCycleVisual } from "@/components/CpuCycleVisual";
import { MemoryHierarchyVisual } from "@/components/MemoryHierarchyVisual";
import type { CpuPerformance } from "@/types/game";

interface CpuStatsViewProps {
  cpuStats: CpuPerformance;
  incomePerSecond: number;
  cpuLevel: number;
}

export function CpuStatsView({
  cpuStats,
  incomePerSecond,
  cpuLevel,
}: CpuStatsViewProps) {
  const rows = [
    { label: "Clock Speed", value: cpuStats.clockLabel },
    { label: "CPI", value: cpuStats.cpi.toFixed(2) },
    { label: "Core Count", value: String(cpuStats.coreCount) },
    { label: "Cache Hit Rate", value: formatPercent(cpuStats.cacheHitRate) },
    {
      label: "Pipeline Efficiency",
      value: formatPercent(cpuStats.pipelineEfficiency),
    },
    {
      label: "Branch Accuracy",
      value: formatPercent(cpuStats.branchAccuracy),
    },
    { label: "Instructions / sec", value: formatIps(cpuStats.ips) },
    { label: "Compute / sec", value: formatRate(incomePerSecond) },
    { label: "Build Level", value: String(cpuLevel) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-accent-text">
          CPU Stats
        </h2>
        <p className="mt-1 text-xs text-muted">
          IPS ≈ (clock / CPI) × cores × pipeline efficiency
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-xl border border-edge bg-panel-muted px-3 py-2"
          >
            <dt className="text-[10px] uppercase tracking-wider text-muted">
              {row.label}
            </dt>
            <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <CpuCycleVisual compact />
      <MemoryHierarchyVisual compact />
    </div>
  );
}

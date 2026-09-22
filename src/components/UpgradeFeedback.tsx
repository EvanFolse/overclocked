"use client";

import { useEffect } from "react";
import { formatIps } from "@/lib/cpuStats";
import { formatPercent, formatRate } from "@/lib/format";
import type { StatDelta } from "@/types/game";

interface UpgradeFeedbackProps {
  delta: StatDelta | null;
  onDismiss: () => void;
}

function row(
  label: string,
  before: string,
  after: string,
  improved: boolean
) {
  return (
    <div className="flex items-center justify-between gap-3 font-mono text-[11px]">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums text-foreground">
        <span className="text-muted">{before}</span>
        <span className="mx-1.5 text-accent-text">→</span>
        <span className={improved ? "text-success" : "text-foreground"}>{after}</span>
      </span>
    </div>
  );
}

export function UpgradeFeedback({ delta, onDismiss }: UpgradeFeedbackProps) {
  useEffect(() => {
    if (!delta) return;
    const t = window.setTimeout(onDismiss, 6500);
    return () => window.clearTimeout(t);
  }, [delta, onDismiss]);

  if (!delta) return null;

  const { before, after, explanation } = delta;

  return (
    <div className="fixed bottom-4 left-4 z-40 w-[min(100%-2rem,22rem)] rounded-2xl border border-accent/40 bg-panel p-4 shadow-xl">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-text">
          Upgrade Impact
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-muted hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {row(
          "CPI",
          before.cpi.toFixed(2),
          after.cpi.toFixed(2),
          after.cpi < before.cpi
        )}
        {row(
          "Cache hit",
          formatPercent(before.cacheHitRate),
          formatPercent(after.cacheHitRate),
          after.cacheHitRate > before.cacheHitRate
        )}
        {row(
          "Pipe eff.",
          formatPercent(before.pipelineEfficiency),
          formatPercent(after.pipelineEfficiency),
          after.pipelineEfficiency > before.pipelineEfficiency
        )}
        {row(
          "Branch acc.",
          formatPercent(before.branchAccuracy),
          formatPercent(after.branchAccuracy),
          after.branchAccuracy > before.branchAccuracy
        )}
        {row(
          "IPS",
          formatIps(before.ips),
          formatIps(after.ips),
          after.ips > before.ips
        )}
        {row(
          "Compute/s",
          formatRate(before.computePerSecond),
          formatRate(after.computePerSecond),
          after.computePerSecond > before.computePerSecond
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">{explanation}</p>
    </div>
  );
}

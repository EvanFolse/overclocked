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
    const t = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(t);
  }, [delta, onDismiss]);

  if (!delta) return null;

  const { before, after, explanation } = delta;

  return (
    <div className="fixed left-4 top-24 z-30 w-[min(100%-2rem,18rem)] animate-toast-in rounded-2xl border border-accent/40 bg-panel/95 p-3.5 shadow-xl backdrop-blur-md sm:top-28">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-text">
          Upgrade Impact
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-muted hover:text-foreground"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {row(
          "CPI",
          before.cpi.toFixed(2),
          after.cpi.toFixed(2),
          after.cpi < before.cpi
        )}
        {row(
          "Hit rate",
          formatPercent(before.cacheHitRate),
          formatPercent(after.cacheHitRate),
          after.cacheHitRate > before.cacheHitRate
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
      <p className="mt-2 text-[11px] leading-relaxed text-muted">{explanation}</p>
    </div>
  );
}

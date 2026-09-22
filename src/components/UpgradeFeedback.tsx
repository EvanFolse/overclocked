"use client";

import { useEffect } from "react";
import { formatIps } from "@/lib/cpuStats";
import { formatPercent, formatRate } from "@/lib/format";
import type { CheckpointResolveResult, StatDelta } from "@/types/game";

interface UpgradeFeedbackProps {
  delta: StatDelta | null;
  resolve: CheckpointResolveResult | null;
  onDismissDelta: () => void;
  onDismissResolve: () => void;
}

export function UpgradeFeedback({
  delta,
  resolve,
  onDismissDelta,
  onDismissResolve,
}: UpgradeFeedbackProps) {
  useEffect(() => {
    if (!delta) return;
    const t = window.setTimeout(onDismissDelta, 4000);
    return () => window.clearTimeout(t);
  }, [delta, onDismissDelta]);

  useEffect(() => {
    if (!resolve) return;
    const t = window.setTimeout(onDismissResolve, 5500);
    return () => window.clearTimeout(t);
  }, [resolve, onDismissResolve]);

  if (resolve) {
    return (
      <div className="fixed left-4 top-24 z-30 w-[min(100%-2rem,18rem)] animate-toast-in rounded-2xl border border-success/40 bg-panel/95 p-3.5 shadow-xl backdrop-blur-md sm:top-28">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-success">
          {resolve.title}
        </p>
        <p className="mt-1 text-xs text-muted">{resolve.body}</p>
        <p className="mt-2 font-mono text-[11px] tabular-nums text-foreground">
          Compute/sec {formatRate(resolve.beforeRate)} →{" "}
          <span className="text-success">{formatRate(resolve.afterRate)}</span>
        </p>
        {resolve.relevantLabel && (
          <p className="mt-1 font-mono text-[11px] tabular-nums text-accent-text">
            {resolve.relevantLabel} {resolve.relevantBefore} → {resolve.relevantAfter}
          </p>
        )}
      </div>
    );
  }

  if (!delta) return null;

  const { before, after, explanation } = delta;
  const hitChanged = Math.abs(after.cacheHitRate - before.cacheHitRate) > 0.005;
  const cpiChanged = Math.abs(after.cpi - before.cpi) > 0.05;
  const coresChanged = after.coreCount !== before.coreCount;

  return (
    <div className="fixed left-4 top-24 z-30 w-[min(100%-2rem,18rem)] animate-toast-in rounded-2xl border border-accent/40 bg-panel/95 p-3.5 shadow-xl backdrop-blur-md sm:top-28">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-text">
        Upgrade Impact
      </p>
      <p className="mt-2 font-mono text-[11px] tabular-nums">
        Compute/sec {formatRate(before.computePerSecond)} →{" "}
        <span className="text-success">{formatRate(after.computePerSecond)}</span>
      </p>
      {hitChanged && (
        <p className="mt-1 font-mono text-[11px] tabular-nums text-accent-text">
          Hit rate {formatPercent(before.cacheHitRate)} →{" "}
          {formatPercent(after.cacheHitRate)}
        </p>
      )}
      {cpiChanged && (
        <p className="mt-1 font-mono text-[11px] tabular-nums text-accent-text">
          CPI {before.cpi.toFixed(2)} → {after.cpi.toFixed(2)}
        </p>
      )}
      {coresChanged && (
        <p className="mt-1 font-mono text-[11px] tabular-nums text-accent-text">
          Cores {before.coreCount} → {after.coreCount}
        </p>
      )}
      {!hitChanged && !cpiChanged && !coresChanged && (
        <p className="mt-1 font-mono text-[11px] tabular-nums text-muted">
          IPS {formatIps(before.ips)} → {formatIps(after.ips)}
        </p>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-muted">{explanation}</p>
      <button
        type="button"
        onClick={onDismissDelta}
        className="mt-2 text-[10px] text-muted hover:text-foreground"
      >
        Dismiss
      </button>
    </div>
  );
}

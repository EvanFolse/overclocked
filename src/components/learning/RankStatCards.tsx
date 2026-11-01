"use client";

import type { RankSpec } from "@/lib/cpuRanks";

/** The four numbers under the CPU. They change (with a short flash) whenever the rank changes. */
export function RankStatCards({ spec }: { spec: RankSpec }) {
    const items = [
        ["Clock", spec.clock],
        ["FLOPs", spec.flops],
        ["Instructions", spec.instructions],
        ["Bits", spec.bits],
    ] as const;

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map(([label, value]) => (
                <div
                    key={`${label}-${spec.rank}`}
                    className="rank-stat-flash rounded-xl border border-edge bg-panel/70 px-4 py-3 backdrop-blur-sm"
                >
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">{label}</p>
                    <p className="mt-1 font-mono text-lg font-bold text-foreground">{value}</p>
                </div>
            ))}
        </div>
    );
}
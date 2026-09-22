"use client";

import type { CycleStage } from "@/types/game";

const STAGES: { id: CycleStage; label: string; hint: string }[] = [
  { id: "fetch", label: "FETCH", hint: "Read next instruction from memory" },
  { id: "decode", label: "DECODE", hint: "Interpret the instruction bits" },
  { id: "execute", label: "EXECUTE", hint: "Perform the operation (e.g. ALU)" },
];

interface CpuCycleVisualProps {
  active?: CycleStage | null;
  compact?: boolean;
}

export function CpuCycleVisual({ active = null, compact = false }: CpuCycleVisualProps) {
  return (
    <div
      className={`rounded-xl border border-edge bg-panel-muted ${compact ? "p-2.5" : "p-3"}`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-text">
        Basic CPU Cycle
      </p>
      <p className="mt-0.5 text-[10px] text-muted">
        Fetch → Decode → Execute (pipelined designs refine this into IF → ID → EX → MEM → WB)
      </p>
      <div className={`mt-3 flex items-stretch gap-1.5 ${compact ? "" : "sm:gap-2"}`}>
        {STAGES.map((stage, i) => {
          const on = active === stage.id;
          return (
            <div key={stage.id} className="flex min-w-0 flex-1 items-center gap-1.5">
              <div
                className={`flex-1 rounded-lg border px-2 py-2 text-center transition ${
                  on
                    ? "border-accent/60 bg-accent-soft shadow-[0_0_0_1px_var(--color-accent)]"
                    : "border-edge/70 bg-panel"
                }`}
              >
                <p
                  className={`font-mono text-[11px] font-semibold ${
                    on ? "text-accent-text" : "text-foreground"
                  }`}
                >
                  {stage.label}
                </p>
                {!compact && (
                  <p className="mt-0.5 text-[9px] leading-snug text-muted">{stage.hint}</p>
                )}
              </div>
              {i < STAGES.length - 1 && (
                <span className="shrink-0 font-mono text-xs text-muted">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import type { MemoryLevel } from "@/types/game";

const LEVELS: {
  id: MemoryLevel;
  label: string;
  note: string;
  width: string;
}[] = [
  { id: "registers", label: "Registers", note: "Fastest · tiniest", width: "42%" },
  { id: "l1", label: "L1 Cache", note: "On-core · very fast", width: "52%" },
  { id: "l2", label: "L2 Cache", note: "Larger · a bit slower", width: "64%" },
  { id: "l3", label: "L3 Cache", note: "Shared LLC · still >> RAM", width: "76%" },
  { id: "ram", label: "RAM", note: "Main memory · DRAM", width: "88%" },
  { id: "storage", label: "Storage", note: "SSD / HDD · slowest · largest", width: "100%" },
];

interface MemoryHierarchyVisualProps {
  active?: MemoryLevel | null;
  compact?: boolean;
}

export function MemoryHierarchyVisual({
  active = null,
  compact = false,
}: MemoryHierarchyVisualProps) {
  return (
    <div
      className={`rounded-xl border border-edge bg-panel-muted ${compact ? "p-2.5" : "p-3"}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-text">
          Memory Hierarchy
        </p>
        <p className="text-[9px] text-muted">faster / smaller ↑ · slower / larger ↓</p>
      </div>
      <ul className={`mt-3 flex flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
        {LEVELS.map((level) => {
          const on = active === level.id;
          return (
            <li key={level.id} className="flex justify-center">
              <div
                className={`rounded-md border px-2 py-1.5 text-center transition ${
                  on
                    ? "border-accent/60 bg-accent-soft"
                    : "border-edge/70 bg-panel"
                }`}
                style={{ width: level.width }}
              >
                <p
                  className={`font-mono text-[11px] font-semibold ${
                    on ? "text-accent-text" : "text-foreground"
                  }`}
                >
                  {level.label}
                </p>
                {!compact && (
                  <p className="text-[9px] text-muted">{level.note}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

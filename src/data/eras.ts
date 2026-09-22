import type { CpuEra, GameState } from "@/types/game";

/** Historical path tied to architecture milestones */
export const CPU_ERAS: CpuEra[] = [
  {
    id: "4004",
    name: "Intel 4004 Class",
    year: "1971",
    summary:
      "First commercial microprocessor — basic CU, ALU, registers, and a ~740 kHz clock. No on-chip cache, no pipeline.",
    minLevel: 0,
    architectureFocus: "Stage 1 · Basic CPU datapath",
  },
  {
    id: "8086",
    name: "16-bit / Early x86 Era",
    year: "1978–1985",
    summary:
      "Richer register files and stronger control. Memory systems and buses become first-class design concerns.",
    minLevel: 8,
    architectureFocus: "Stage 2 · Memory performance emerging",
  },
  {
    id: "pentium",
    name: "Superscalar / Pipeline Era",
    year: "1993–2004",
    summary:
      "On-chip caches, wider buses, and pipelined/superscalar execution. CPI and hazards dominate textbooks.",
    minLevel: 20,
    architectureFocus: "Stages 3–4 · Pipelines, stalls, forwarding",
  },
  {
    id: "multicore",
    name: "Multi-Core Revolution",
    year: "2005–2015",
    summary:
      "Power walls end the pure clock race. Branch predictors mature; dual- and many-core CPUs go mainstream.",
    minLevel: 35,
    architectureFocus: "Stages 5–6 · Prediction + parallelism",
  },
  {
    id: "chiplet",
    name: "Chiplet & Fabric Era",
    year: "2017–2023",
    summary:
      "Deep caches, fast fabrics, and chiplet packages. Memory hierarchy and interconnect decide performance.",
    minLevel: 55,
    architectureFocus: "Advanced cache / bus / multicore scaling",
  },
  {
    id: "2026",
    name: "2026 Flagship Class",
    year: "2026",
    summary:
      "High-GHz boost, huge LLC, and up to ~256-core server silicon — all the architecture lessons stacked together.",
    minLevel: 80,
    architectureFocus: "Full stack: clock, cache, pipe, predict, cores",
  },
];

function totalLevel(state: GameState): number {
  return Object.values(state.upgradeLevels).reduce((sum, level) => sum + level, 0);
}

export function getCurrentEra(state: GameState): CpuEra {
  const level = totalLevel(state);
  let current = CPU_ERAS[0]!;
  for (const era of CPU_ERAS) {
    if (level >= era.minLevel) current = era;
  }
  return current;
}

export function getEraProgress(state: GameState): {
  era: CpuEra;
  next: CpuEra | null;
  progress: number;
} {
  const level = totalLevel(state);
  const era = getCurrentEra(state);
  const idx = CPU_ERAS.findIndex((e) => e.id === era.id);
  const next = idx >= 0 && idx < CPU_ERAS.length - 1 ? CPU_ERAS[idx + 1]! : null;
  if (!next) return { era, next: null, progress: 1 };
  const span = next.minLevel - era.minLevel;
  const progress = Math.min(1, Math.max(0, (level - era.minLevel) / span));
  return { era, next, progress };
}

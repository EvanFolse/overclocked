import type { CpuEra, GameState } from "@/types/game";

/** Historical path: first commercial CPU → Sept 2026 flagship class */
export const CPU_ERAS: CpuEra[] = [
  {
    id: "4004",
    name: "Intel 4004 Class",
    year: "1971",
    summary:
      "The first commercial microprocessor — a 4-bit chip with ~2,300 transistors, one core path, and a ~740 kHz clock. Your starting silicon.",
    minLevel: 0,
  },
  {
    id: "8086",
    name: "16-bit / Early x86 Era",
    year: "1978–1985",
    summary:
      "Stronger CU/ALU pipelines and richer register files. The IBM PC era proves the CPU as a general-purpose engine.",
    minLevel: 8,
  },
  {
    id: "pentium",
    name: "Superscalar Desktop Era",
    year: "1993–2004",
    summary:
      "On-chip cache, wider buses, and multi-issue execution. Clocks climb into the GHz range.",
    minLevel: 20,
  },
  {
    id: "multicore",
    name: "Multi-Core Revolution",
    year: "2005–2015",
    summary:
      "Power walls end the pure clock race. Dual-, quad-, and many-core CPUs become mainstream.",
    minLevel: 35,
  },
  {
    id: "chiplet",
    name: "Chiplet & ISA Diversity",
    year: "2017–2023",
    summary:
      "Chiplets, big.LITTLE, ARM laptops, and open RISC-V join x86. Cache and interconnect dominate design.",
    minLevel: 55,
  },
  {
    id: "2026",
    name: "2026 Flagship Class",
    year: "2026",
    summary:
      "Modern monsters: up to 256-core server silicon (AMD EPYC Venice / Intel Diamond Rapids class), huge LLC, and high-GHz boost — or 96-core Threadripper workstation beasts.",
    minLevel: 80,
  },
];

function totalLevel(state: GameState): number {
  return Object.values(state.upgradeLevels).reduce((sum, level) => sum + level, 0);
}

export function getCurrentEra(state: GameState): CpuEra {
  const level = totalLevel(state);
  let current = CPU_ERAS[0];
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
  const next = idx >= 0 && idx < CPU_ERAS.length - 1 ? CPU_ERAS[idx + 1] : null;
  if (!next) return { era, next: null, progress: 1 };
  const span = next.minLevel - era.minLevel;
  const progress = Math.min(1, Math.max(0, (level - era.minLevel) / span));
  return { era, next, progress };
}

import type { UpgradeDefinition, UpgradeId } from "@/types/game";

/** Cores: start like 4004 (1), climb toward 2026 server flagships (256) */
function coreCount(level: number): number {
  const table = [1, 2, 4, 8, 16, 24, 32, 48, 64, 96, 128, 192, 256];
  if (level <= 0) return 1;
  if (level <= table.length) return table[level - 1]!;
  return 256 + (level - table.length) * 32;
}

function clockLabel(level: number): string {
  if (level <= 0) return "~740 kHz (4004-class)";
  if (level === 1) return "5 MHz class";
  if (level === 2) return "25 MHz class";
  if (level === 3) return "100 MHz class";
  if (level === 4) return "500 MHz class";
  if (level === 5) return "1.0 GHz";
  if (level === 6) return "2.0 GHz boost";
  if (level === 7) return "3.5 GHz boost";
  if (level === 8) return "4.5 GHz boost";
  if (level === 9) return "5.0 GHz+ boost";
  return `${(5.0 + (level - 9) * 0.1).toFixed(1)} GHz class`;
}

function cacheLabel(level: number): string {
  if (level <= 0) return "No on-chip cache (DRAM only)";
  const tiers = [
    "Tiny L1 only",
    "L1 + small L2",
    "8 MB shared L3",
    "32 MB L3",
    "96 MB L3",
    "256 MB LLC",
    "512 MB LLC",
    "1 GB class LLC (2026 server)",
  ];
  return tiers[Math.min(level - 1, tiers.length - 1)]!;
}

function cuLabel(level: number): string {
  const tiers = [
    "Basic fetch/decode sequencer",
    "Pipelined control paths",
    "Out-of-order issue control",
    "Wide decode + branch prediction assist",
    "Multi-thread aware CU",
    "Chiplet / multi-tile orchestration",
  ];
  if (level <= 0) return tiers[0]!;
  return tiers[Math.min(level, tiers.length - 1)]!;
}

function aluLabel(level: number): string {
  const tiers = [
    "4-bit ALU (4004-class)",
    "8-bit ALU",
    "16-bit ALU + flags",
    "32-bit ALU + barrel shifter",
    "64-bit + SIMD units",
    "Wide vector / AI accel ALUs",
    "Many parallel execution ports",
  ];
  if (level <= 0) return tiers[0]!;
  return tiers[Math.min(level, tiers.length - 1)]!;
}

function registerLabel(level: number): string {
  if (level <= 0) return "Handful of 4-bit scratch registers";
  const tiers = [
    "Small GP register file",
    "x86-like GP + segment regs",
    "Larger RF + rename buffers",
    "Deep physical register file",
    "Per-core RF + vector regs",
    "Massive OOO rename pool",
  ];
  return tiers[Math.min(level - 1, tiers.length - 1)]!;
}

function busLabel(level: number): string {
  if (level <= 0) return "Narrow external bus only";
  const tiers = [
    "8/16-bit system bus",
    "32-bit address/data buses",
    "FSB + dedicated cache bus",
    "HyperTransport / QPI era",
    "Infinity Fabric / mesh on-die",
    "PCIe Gen5/6 + ultra-wide memory",
  ];
  return tiers[Math.min(level - 1, tiers.length - 1)]!;
}

function pipelineLabel(level: number): string {
  if (level <= 0) return "Multi-cycle (no pipeline)";
  const tiers = [
    "5-stage: IF → ID → EX → MEM → WB",
    "Deeper pipe + better balancing",
    "Superscalar dual-issue",
    "Wider issue / more stages",
    "OOO pipeline with rename",
    "Modern deep speculative pipeline",
  ];
  return tiers[Math.min(level - 1, tiers.length - 1)]!;
}

function forwardingLabel(level: number): string {
  if (level <= 0) return "No forwarding (full stalls on RAW)";
  const tiers = [
    "EX→EX ALU forwarding",
    "MEM→EX forwarding paths",
    "Full bypass network",
    "Load-use hazard mitigation",
    "Aggressive bypass + early resolve",
  ];
  return tiers[Math.min(level - 1, tiers.length - 1)]!;
}

function branchLabel(level: number): string {
  if (level <= 0) return "Always-not-taken / stall on branch";
  const tiers = [
    "1-bit local predictor",
    "2-bit saturating counters",
    "Two-level / correlating predictor",
    "Tournament predictor",
    "Modern TAGE-class predictor",
  ];
  return tiers[Math.min(level - 1, tiers.length - 1)]!;
}

function overclockLabel(level: number): string {
  if (level <= 0) return "Locked multiplier (no OC)";
  const tiers = [
    "Unlocked multiplier (basic OC)",
    "Stable +100–200 MHz headroom",
    "XMP/EXPO-friendly platform",
    "Aggressive boost algorithms",
    "Liquid-cooled OC profile",
    "Extreme bench capable",
  ];
  return tiers[Math.min(level - 1, tiers.length - 1)]!;
}

function coolingLabel(level: number): string {
  if (level <= 0) return "Passive / tiny stock sink";
  const tiers = [
    "Low-profile air cooler",
    "Tower dual-tower air",
    "240mm AIO liquid",
    "360mm AIO liquid",
    "Custom loop / cold plate",
  ];
  return tiers[Math.min(level - 1, tiers.length - 1)]!;
}

export const STAGE_LABELS: Record<string, string> = {
  basic: "Stage 1 · Basic CPU",
  memory: "Stage 2 · Memory Performance",
  pipeline: "Stage 3 · Pipelining",
  hazards: "Stage 4 · Pipeline Hazards",
  branch: "Stage 5 · Branch Prediction",
  multicore: "Stage 6 · Multicore",
};

export const UPGRADES: UpgradeDefinition[] = [
  {
    id: "controlUnit",
    name: "Control Unit (CU)",
    shortName: "CU",
    category: "Fetch · decode · direct",
    stage: "basic",
    description:
      "The director of the processor. It fetches instructions, decodes them, and coordinates the rest of the CPU.",
    baseCost: 12,
    costMultiplier: 1.15,
    incomePerLevel: 0.4,
    requiresUnlock: true,
    unlockTag: "controlUnit",
    unlockHint: "Complete the CPU Basics boot sequence.",
    educationalNote:
      "A stronger CU improves instruction sequencing and slightly helps pipeline control and branch handling.",
    formatSpec: cuLabel,
  },
  {
    id: "alu",
    name: "Arithmetic Logic Unit (ALU)",
    shortName: "ALU",
    category: "Math · logic · comparisons",
    stage: "basic",
    description:
      "Performs arithmetic and logical operations. A wider, faster ALU reduces cycles spent in execute.",
    baseCost: 18,
    costMultiplier: 1.15,
    incomePerLevel: 0.55,
    requiresUnlock: true,
    unlockTag: "alu",
    unlockHint: "Complete the CPU Basics boot sequence.",
    educationalNote:
      "ALU upgrades lower effective CPI on compute-heavy work by finishing EX-stage work sooner.",
    formatSpec: aluLabel,
  },
  {
    id: "registers",
    name: "Registers",
    shortName: "Regs",
    category: "On-chip ultra-fast storage",
    stage: "basic",
    description:
      "Tiny, ultra-fast storage inside the CPU for the data and addresses the processor is using right now.",
    baseCost: 25,
    costMultiplier: 1.15,
    incomePerLevel: 0.7,
    requiresUnlock: true,
    unlockTag: "registers",
    unlockHint: "Complete the CPU Basics boot sequence.",
    educationalNote:
      "More/faster registers reduce spills to memory and slightly improve cache hit behavior.",
    formatSpec: registerLabel,
  },
  {
    id: "clock",
    name: "Internal Clock",
    shortName: "Clock",
    category: "Timing · hertz · sync",
    stage: "basic",
    description:
      "Generates timing pulses that synchronize CPU operations. Higher clock → more cycles per second.",
    baseCost: 80,
    costMultiplier: 1.15,
    incomePerLevel: 1.4,
    requiresUnlock: true,
    unlockTag: "clock",
    unlockHint: "Complete the CPU Basics boot sequence.",
    educationalNote:
      "Clock speed raises cycles/sec. Throughput still depends on CPI: IPS ≈ clock / CPI × cores.",
    formatSpec: clockLabel,
  },
  {
    id: "cache",
    name: "Cache Memory",
    shortName: "Cache",
    category: "L1 / L2 / L3 · hit rate",
    stage: "memory",
    description:
      "Fast on-chip memory that stores recently used data/instructions so the CPU waits less on main memory.",
    baseCost: 400,
    costMultiplier: 1.15,
    incomePerLevel: 3.5,
    requiresUnlock: true,
    unlockTag: "cache",
    unlockHint: "Diagnose a memory-latency bottleneck to unlock.",
    educationalNote:
      "Higher cache hit rate cuts expensive DRAM accesses, lowering effective CPI and raising IPS.",
    formatSpec: cacheLabel,
  },
  {
    id: "buses",
    name: "System Buses",
    shortName: "Buses",
    category: "Data · address · control paths",
    stage: "memory",
    description:
      "Pathways that move data between the CPU, cache, and memory. Wider/faster buses reduce miss penalties.",
    baseCost: 1_200,
    costMultiplier: 1.14,
    incomePerLevel: 8,
    requiresUnlock: true,
    unlockTag: "buses",
    unlockHint: "Solve a memory-access challenge to unlock.",
    educationalNote:
      "Better buses shrink the cycle cost of a cache miss, improving memory-bound CPI.",
    formatSpec: busLabel,
  },
  {
    id: "pipeline",
    name: "Instruction Pipeline",
    shortName: "Pipe",
    category: "IF · ID · EX · MEM · WB",
    stage: "pipeline",
    description:
      "Overlaps fetch, decode, execute, memory, and write-back so multiple instructions are in flight.",
    baseCost: 3_500,
    costMultiplier: 1.14,
    incomePerLevel: 20,
    requiresUnlock: true,
    unlockTag: "pipeline",
    unlockHint: "Solve a low-throughput / pipeline challenge to unlock.",
    educationalNote:
      "Pipelining drives ideal CPI toward ~1 and raises pipeline efficiency — until hazards appear.",
    formatSpec: pipelineLabel,
  },
  {
    id: "forwarding",
    name: "Data Forwarding",
    shortName: "Fwd",
    category: "RAW hazards · stalls · bypass",
    stage: "hazards",
    description:
      "Bypasses results from later pipeline stages back to earlier ones so dependent instructions stall less.",
    baseCost: 9_000,
    costMultiplier: 1.13,
    incomePerLevel: 40,
    requiresUnlock: true,
    unlockTag: "forwarding",
    unlockHint: "Diagnose a data-hazard bottleneck to unlock.",
    educationalNote:
      "Forwarding reduces RAW-hazard stalls, cutting extra CPI that a naive pipeline would otherwise pay.",
    formatSpec: forwardingLabel,
  },
  {
    id: "branchPrediction",
    name: "Branch Prediction",
    shortName: "Branch",
    category: "Control hazards · speculation",
    stage: "branch",
    description:
      "Guesses branch outcomes so the pipeline keeps fetching useful instructions instead of flushing.",
    baseCost: 22_000,
    costMultiplier: 1.13,
    incomePerLevel: 75,
    requiresUnlock: true,
    unlockTag: "branch",
    unlockHint: "Diagnose frequent pipeline flushes to unlock.",
    educationalNote:
      "Higher prediction accuracy wastes fewer cycles on mispredict flushes, improving CPI and IPS.",
    formatSpec: branchLabel,
  },
  {
    id: "cores",
    name: "Processing Cores",
    shortName: "Cores",
    category: "Parallel execution engines",
    stage: "multicore",
    description:
      "Independent cores that run threads in parallel — from one 4004-style path to many-core flagships.",
    baseCost: 50_000,
    costMultiplier: 1.13,
    incomePerLevel: 120,
    requiresUnlock: true,
    unlockTag: "cores",
    unlockHint: "Solve a parallel-workload challenge to unlock.",
    educationalNote:
      "More cores multiply throughput for parallel work: IPS scales roughly with core count.",
    formatSpec: (level) => `${coreCount(level)} core${coreCount(level) === 1 ? "" : "s"}`,
  },
  {
    id: "overclocking",
    name: "Overclocking Support",
    shortName: "OC",
    category: "Unlocked multipliers · boost",
    stage: "basic",
    description:
      "Raises clock beyond stock settings. Needs thermal headroom to stay stable.",
    baseCost: 80_000,
    costMultiplier: 1.12,
    incomePerLevel: 150,
    requiresUnlock: true,
    unlockTag: "overclocking",
    unlockHint: "Solve a clock-speed challenge to unlock.",
    educationalNote:
      "Overclocking increases cycles/sec. Without cooling and solid CPI, gains are limited.",
    formatSpec: overclockLabel,
  },
  {
    id: "cooling",
    name: "Thermal Solution",
    shortName: "Cooling",
    category: "Heatsink · AIO · custom loop",
    stage: "basic",
    description:
      "Removes heat so higher clocks and core counts can sustain boost.",
    baseCost: 120_000,
    costMultiplier: 1.12,
    incomePerLevel: 200,
    requiresUnlock: true,
    unlockTag: "cooling",
    unlockHint: "Solve a thermal / sustained-clock challenge to unlock.",
    educationalNote:
      "Cooling unlocks sustained clock boosts from overclocking — more stable cycles/sec.",
    formatSpec: coolingLabel,
  },
];

export const UPGRADE_MAP: Record<UpgradeId, UpgradeDefinition> = UPGRADES.reduce(
  (acc, upgrade) => {
    acc[upgrade.id] = upgrade;
    return acc;
  },
  {} as Record<UpgradeId, UpgradeDefinition>
);

/** Soft floor so early game still ticks while stats are weak */
export const BASE_COMPUTE = 0.35;

export function getUpgradeCost(upgrade: UpgradeDefinition, level: number): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
}

export function getCoreCount(level: number): number {
  return coreCount(level);
}

export const EMPTY_UPGRADE_LEVELS: Record<UpgradeId, number> = {
  controlUnit: 0,
  alu: 0,
  registers: 0,
  cache: 0,
  clock: 0,
  buses: 0,
  cores: 0,
  pipeline: 0,
  forwarding: 0,
  branchPrediction: 0,
  overclocking: 0,
  cooling: 0,
};

export const STARTING_UNLOCKS: UpgradeId[] = [];

/** Core parts granted when the intro checkpoint finishes */
export const BOOT_UNLOCKS: UpgradeId[] = [
  "controlUnit",
  "alu",
  "registers",
  "clock",
];

/** Map legacy save IDs → new upgrade IDs */
export const LEGACY_UPGRADE_MAP: Record<string, UpgradeId> = {
  isa: "pipeline",
  generation: "forwarding",
  socket: "branchPrediction",
};

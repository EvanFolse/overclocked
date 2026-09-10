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
    "Wide decode + branch prediction",
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

function isaLabel(level: number): string {
  if (level <= 0) return "Tiny custom 4-bit ISA";
  const tiers = [
    "Early CISC (8086-class x86)",
    "Mature x86 CISC + extensions",
    "ARM RISC (mobile → laptop)",
    "RISC-V open modular ISA",
    "Multi-ISA design fluency (x86/ARM/RISC-V)",
    "Custom accelerators + ISA extensions",
  ];
  return tiers[Math.min(level - 1, tiers.length - 1)]!;
}

function generationLabel(level: number): string {
  if (level <= 0) return "Gen 0 — 4004 pioneer (1971)";
  const tiers = [
    "Early PC generation",
    "Pentium / superscalar gen",
    "NetBurst / Athlon gen",
    "Core / Phenom multi-core gen",
    "Zen / modern client gen",
    "Chiplet datacenter gen",
    "2026 Venice / Diamond Rapids class",
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
    "Extreme bench / LN2 capable",
  ];
  return tiers[Math.min(level - 1, tiers.length - 1)]!;
}

function socketLabel(level: number): string {
  if (level <= 0) return "Early DIP / proprietary package";
  const tiers = [
    "PGA / early desktop socket",
    "LGA 775 / AM2 class",
    "LGA 115x / AM3+",
    "LGA 1700 / AM4",
    "LGA 1851 / AM5",
    "SP5 / SP7 server socket class",
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

export const UPGRADES: UpgradeDefinition[] = [
  {
    id: "controlUnit",
    name: "Control Unit (CU)",
    shortName: "CU",
    category: "Fetch · decode · direct",
    description:
      "The director of the processor. It fetches instructions from memory, decodes them, and directs the rest of the CPU to execute those commands.",
    baseCost: 12,
    costMultiplier: 1.15,
    incomePerLevel: 0.4,
    requiresUnlock: false,
    unlockHint: "Available from the start.",
    formatSpec: cuLabel,
  },
  {
    id: "alu",
    name: "Arithmetic Logic Unit (ALU)",
    shortName: "ALU",
    category: "Math · logic · comparisons",
    description:
      "The computational engine. It performs arithmetic (add/sub/mul/div) and logical operations (comparisons, AND/OR/NOT).",
    baseCost: 18,
    costMultiplier: 1.15,
    incomePerLevel: 0.55,
    requiresUnlock: false,
    unlockHint: "Available from the start.",
    formatSpec: aluLabel,
  },
  {
    id: "registers",
    name: "Registers",
    shortName: "Regs",
    category: "On-chip ultra-fast storage",
    description:
      "Tiny, ultra-fast storage locations inside the CPU. They temporarily hold the data, instructions, or addresses the processor is actively using.",
    baseCost: 25,
    costMultiplier: 1.15,
    incomePerLevel: 0.7,
    requiresUnlock: false,
    unlockHint: "Available from the start.",
    formatSpec: registerLabel,
  },
  {
    id: "clock",
    name: "Internal Clock",
    shortName: "Clock",
    category: "Timing · hertz · sync",
    description:
      "Generates steady electrical pulses (hertz) that synchronize every operation inside the processor — from 4004-era kHz to multi-GHz boost.",
    baseCost: 80,
    costMultiplier: 1.15,
    incomePerLevel: 1.4,
    requiresUnlock: false,
    unlockHint: "Available from the start.",
    formatSpec: clockLabel,
  },
  {
    id: "cache",
    name: "Cache Memory",
    shortName: "Cache",
    category: "L1 / L2 / L3 · on-die SRAM",
    description:
      "Extremely fast memory on or near the CPU that keeps copies of frequently used data and instructions so you wait less on slower RAM.",
    baseCost: 400,
    costMultiplier: 1.15,
    incomePerLevel: 3.5,
    requiresUnlock: true,
    unlockTag: "cache",
    unlockHint: "Answer a cache question correctly to unlock.",
    formatSpec: cacheLabel,
  },
  {
    id: "buses",
    name: "System Buses",
    shortName: "Buses",
    category: "Data · address · control paths",
    description:
      "Internal electrical pathways that transport data, instructions, and control signals between the CPU and other components.",
    baseCost: 1_200,
    costMultiplier: 1.14,
    incomePerLevel: 8,
    requiresUnlock: true,
    unlockTag: "buses",
    unlockHint: "Answer a buses question correctly to unlock.",
    formatSpec: busLabel,
  },
  {
    id: "cores",
    name: "Processing Cores",
    shortName: "Cores",
    category: "Parallel execution engines",
    description:
      "Independent processing engines on the package — from a single 4004-style path to 96–256 core 2026 flagship designs.",
    baseCost: 3_000,
    costMultiplier: 1.14,
    incomePerLevel: 18,
    requiresUnlock: true,
    unlockTag: "cores",
    unlockHint: "Answer a multi-core CPU question correctly to unlock.",
    formatSpec: (level) => `${coreCount(level)} core${coreCount(level) === 1 ? "" : "s"}`,
  },
  {
    id: "isa",
    name: "Instruction Set (ISA)",
    shortName: "ISA",
    category: "x86 · ARM · RISC-V · MIPS · AVR",
    description:
      "Defines the instructions a CPU can execute. Progress through CISC x86, efficient ARM RISC, open RISC-V, and other families used in PCs, phones, and embedded systems.",
    baseCost: 8_000,
    costMultiplier: 1.13,
    incomePerLevel: 35,
    requiresUnlock: true,
    unlockTag: "isa",
    unlockHint: "Answer an ISA question correctly to unlock.",
    formatSpec: isaLabel,
  },
  {
    id: "generation",
    name: "CPU Generation",
    shortName: "Gen",
    category: "Architectural era",
    description:
      "Advances the CPU’s architectural generation — affecting performance, efficiency, features, and compatibility as you move from 1971 pioneers to 2026 flagships.",
    baseCost: 20_000,
    costMultiplier: 1.13,
    incomePerLevel: 70,
    requiresUnlock: true,
    unlockTag: "generation",
    unlockHint: "Answer a CPU generation question correctly to unlock.",
    formatSpec: generationLabel,
  },
  {
    id: "overclocking",
    name: "Overclocking Support",
    shortName: "OC",
    category: "Unlocked multipliers · boost",
    description:
      "The ability to raise clock speed beyond factory settings for higher performance — from locked chips to extreme OC platforms.",
    baseCost: 45_000,
    costMultiplier: 1.12,
    incomePerLevel: 110,
    requiresUnlock: true,
    unlockTag: "overclocking",
    unlockHint: "Answer an overclocking question correctly to unlock.",
    formatSpec: overclockLabel,
  },
  {
    id: "socket",
    name: "Socket Type",
    shortName: "Socket",
    category: "CPU ↔ motherboard interface",
    description:
      "The physical interface connecting the CPU to the motherboard — from early packages to modern AM5 / LGA / SP7-class server sockets.",
    baseCost: 90_000,
    costMultiplier: 1.12,
    incomePerLevel: 180,
    requiresUnlock: true,
    unlockTag: "socket",
    unlockHint: "Answer a socket/platform question correctly to unlock.",
    formatSpec: socketLabel,
  },
  {
    id: "cooling",
    name: "Thermal Solution",
    shortName: "Cooling",
    category: "Heatsink · AIO · custom loop",
    description:
      "Keeps the silicon in its boost window. Essential once clocks and core counts climb toward 2026 flagship power levels.",
    baseCost: 150_000,
    costMultiplier: 1.12,
    incomePerLevel: 250,
    requiresUnlock: true,
    unlockTag: "cooling",
    unlockHint: "Answer a cooling/thermal question correctly to unlock.",
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

export const BASE_INCOME = 1;

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
  isa: 0,
  generation: 0,
  overclocking: 0,
  socket: 0,
  cooling: 0,
};

export const STARTING_UNLOCKS: UpgradeId[] = [
  "controlUnit",
  "alu",
  "registers",
  "clock",
];

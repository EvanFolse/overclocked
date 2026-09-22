import { getCoreCount } from "@/data/upgrades";
import type { CpuPerformance, GameState, UpgradeId } from "@/types/game";

/** Scale IPS down to a Cookie-Clicker-friendly compute/sec number */
export const IPS_TO_COMPUTE = 1_000_000;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Educational clock model: 4004-class → multi-GHz with OC/cooling headroom */
export function getClockHz(levels: Record<UpgradeId, number>): number {
  const clock = levels.clock ?? 0;
  const oc = levels.overclocking ?? 0;
  const cool = levels.cooling ?? 0;

  // Base ladder (Hz)
  const ladder = [
    740_000, // 4004
    5_000_000,
    25_000_000,
    100_000_000,
    500_000_000,
    1_000_000_000,
    2_000_000_000,
    3_500_000_000,
    4_500_000_000,
    5_000_000_000,
  ];
  let hz = ladder[Math.min(clock, ladder.length - 1)]!;
  if (clock >= ladder.length) {
    hz = 5_000_000_000 + (clock - (ladder.length - 1)) * 100_000_000;
  }

  // Overclocking / cooling unlock extra boost (educational, not physics)
  const boost = 1 + oc * 0.04 + Math.min(cool, oc) * 0.02;
  return hz * boost;
}

export function formatClockHz(hz: number): string {
  if (hz >= 1_000_000_000) return `${(hz / 1_000_000_000).toFixed(2)} GHz`;
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(1)} MHz`;
  if (hz >= 1_000) return `${(hz / 1_000).toFixed(0)} kHz`;
  return `${Math.round(hz)} Hz`;
}

export function formatIps(ips: number): string {
  if (ips >= 1_000_000_000_000) return `${(ips / 1_000_000_000_000).toFixed(2)} TIPS`;
  if (ips >= 1_000_000_000) return `${(ips / 1_000_000_000).toFixed(2)} GIPS`;
  if (ips >= 1_000_000) return `${(ips / 1_000_000).toFixed(1)} MIPS`;
  if (ips >= 1_000) return `${(ips / 1_000).toFixed(1)} KIPS`;
  return `${ips.toFixed(0)} IPS`;
}

/**
 * Simplified educational CPU model:
 * IPS ≈ (clockHz / CPI) × cores × pipelineEfficiency
 *
 * Upgrades change behavior:
 * - Clock / OC / cooling → clockHz
 * - Cache / buses → hit rate → lower effective CPI
 * - Pipeline → lower base CPI + efficiency
 * - Forwarding → fewer hazard stalls → lower CPI
 * - Branch prediction → fewer flush penalties → lower CPI
 * - Cores → parallel throughput multiplier
 */
export function computeCpuPerformance(
  levels: Record<UpgradeId, number>
): CpuPerformance {
  const cu = levels.controlUnit ?? 0;
  const alu = levels.alu ?? 0;
  const regs = levels.registers ?? 0;
  const cache = levels.cache ?? 0;
  const buses = levels.buses ?? 0;
  const pipeline = levels.pipeline ?? 0;
  const forwarding = levels.forwarding ?? 0;
  const branch = levels.branchPrediction ?? 0;
  const coresLevel = levels.cores ?? 0;

  const clockHz = getClockHz(levels);
  const coreCount = getCoreCount(coresLevel);

  // Cache hit rate: DRAM-only start → strong with cache + buses
  const cacheHitRate = clamp(0.18 + cache * 0.09 + buses * 0.025 + regs * 0.01, 0.15, 0.97);

  // Branch prediction accuracy
  const branchAccuracy =
    branch <= 0
      ? clamp(0.5 + cu * 0.01, 0.5, 0.6)
      : clamp(0.62 + branch * 0.055 + cu * 0.01, 0.62, 0.98);

  // Pipeline efficiency (fraction of ideal throughput realized)
  let pipelineEfficiency: number;
  if (pipeline <= 0) {
    // Multi-cycle non-pipelined path
    pipelineEfficiency = clamp(0.22 + cu * 0.02 + alu * 0.015, 0.2, 0.4);
  } else {
    pipelineEfficiency = clamp(
      0.55 + pipeline * 0.05 + forwarding * 0.04 + branch * 0.02,
      0.5,
      0.96
    );
  }

  // Effective CPI — start high, improve with architecture
  let cpi: number;
  if (pipeline <= 0) {
    // Non-pipelined: several cycles per instruction
    cpi = 4.8 - cu * 0.08 - alu * 0.1 - regs * 0.06;
  } else {
    // Ideal pipelined CPI ≈ 1, then add penalties
    cpi = 1.15 - Math.min(pipeline, 6) * 0.05;
  }

  // Memory stall contribution (misses are expensive)
  const missPenalty = clamp(18 - buses * 1.2, 6, 18);
  const memoryCpi = (1 - cacheHitRate) * missPenalty * 0.12;
  cpi += memoryCpi;

  // Data-hazard stalls without forwarding
  if (pipeline > 0) {
    const hazardPenalty = clamp(0.9 - forwarding * 0.18, 0.05, 0.9);
    cpi += hazardPenalty;
  }

  // Branch mispredict flushes
  const mispredictRate = 1 - branchAccuracy;
  const flushPenalty = pipeline > 0 ? 2.5 : 0.4;
  cpi += mispredictRate * flushPenalty;

  cpi = clamp(cpi, 0.55, 5.5);

  // Classic teaching formula with efficiency scale
  const ips = (clockHz / cpi) * coreCount * pipelineEfficiency;

  return {
    clockHz,
    clockLabel: formatClockHz(clockHz),
    cpi: Math.round(cpi * 100) / 100,
    cacheHitRate: Math.round(cacheHitRate * 1000) / 1000,
    pipelineEfficiency: Math.round(pipelineEfficiency * 1000) / 1000,
    branchAccuracy: Math.round(branchAccuracy * 1000) / 1000,
    coreCount,
    ips,
    computePerSecond: ips / IPS_TO_COMPUTE,
  };
}

export function getCpuPerformance(state: GameState): CpuPerformance {
  return computeCpuPerformance(state.upgradeLevels);
}

export function levelsWithUpgrade(
  levels: Record<UpgradeId, number>,
  id: UpgradeId,
  delta = 1
): Record<UpgradeId, number> {
  return { ...levels, [id]: (levels[id] ?? 0) + delta };
}

import { STAGES } from "@/data/stages";

export type CpuRank = 0 | 1 | 2 | 3 | 4 | 5;

export interface RankSpec {
    rank: CpuRank;
    name: string;
    tagline: string;
    clock: string;
    flops: string;
    instructions: string;
    bits: string;
}

/**
 * PLACEHOLDER numbers. The fact-checker must verify them against the textbook before release.
 * Rank 0 keeps the values the game shows today. Ranks 1 and 5 follow the design mock-up.
 */
export const CPU_RANKS: RankSpec[] = [
    { rank: 0, name: "Bare chip", tagline: "Nothing installed yet", clock: "5 MHz", flops: "—", instructions: "4", bits: "4-bit" },
    { rank: 1, name: "Basic CPU", tagline: "8-bit · 25 MHz", clock: "25 MHz", flops: "—", instructions: "16", bits: "8-bit" },
    { rank: 2, name: "Pipelined", tagline: "5-stage pipeline", clock: "100 MHz", flops: "2 MFLOPS", instructions: "64", bits: "16-bit" },
    { rank: 3, name: "RISC / CISC", tagline: "Harvard split", clock: "500 MHz", flops: "50 MFLOPS", instructions: "128", bits: "32-bit" },
    { rank: 4, name: "Memory hierarchy", tagline: "L1 · L2 · L3 cache", clock: "1.5 GHz", flops: "10 GFLOPS", instructions: "256", bits: "64-bit" },
    { rank: 5, name: "CPU + GPU + NPU", tagline: "3.2 GHz · TFLOPs", clock: "3.2 GHz", flops: "2 TFLOPS", instructions: "512", bits: "64-bit" },
];

export function getRankSpec(rank: CpuRank): RankSpec {
    return CPU_RANKS[rank]!;
}

/** Rank = number of stages cleared in order. A pass that is not paid for yet does not count. */
export function getCpuRank(completedCheckpoints: readonly string[]): CpuRank {
    let rank = 0;
    for (const stage of STAGES) {
        if (completedCheckpoints.includes(stage.checkpointId)) rank = stage.id;
        else break;
    }
    return rank as CpuRank;
}
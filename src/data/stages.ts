import type { CheckpointId } from "@/data/checkpoints";

export type StageId = 1 | 2 | 3 | 4 | 5;

export interface StageDef {
  id: StageId;
  title: string;
  goal: string;
  checkpointId: CheckpointId;
  /** Placeholder unlock price in CP. Stage 1 is free so the game can start immediately. */
  price: number;
}

/**
 * v1 uses one existing checkpoint per stage so the loop can run this week.
 * Extra checkpoints (hazards, boolean-alu, …) stay in the file but are not launched yet.
 */
export const STAGES: StageDef[] = [
  {
    id: 1,
    title: "KNOW CPU",
    goal: "Know what each part is and what it does.",
    checkpointId: "cpu-basics",
    price: 0,
  },
  {
    id: 2,
    title: "The CPU in Motion",
    goal: "See how parts work together in the instruction cycle.",
    checkpointId: "fetch-decode-execute",
    price: 40,
  },
  {
    id: 3,
    title: "Two Ways to Build a CPU",
    goal: "Temporary stand-in: pipeline as a design choice. CISC/RISC quiz comes later.",
    checkpointId: "pipeline",
    price: 120,
  },
  {
    id: 4,
    title: "The Memory Hierarchy",
    goal: "Trade-offs between registers, cache, and distance from the core.",
    checkpointId: "cache-hierarchy",
    price: 300,
  },
  {
    id: 5,
    title: "Beyond the CPU",
    goal: "Where the CPU sits next to parallel hardware.",
    checkpointId: "cpu-vs-gpu",
    price: 800,
  },
];

export function getStage(id: number): StageDef | undefined {
  return STAGES.find((stage) => stage.id === id);
}

export function getStageByCheckpoint(
  checkpointId: string | null | undefined
): StageDef | undefined {
  if (!checkpointId) return undefined;
  return STAGES.find((stage) => stage.checkpointId === checkpointId);
}

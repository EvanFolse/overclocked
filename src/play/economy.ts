import { STAGES } from "@/data/stages";

/** CP/s gained when each stage is completed (from CPU_Builder.docx / the demo video). Total 35.6. */
export const STAGE_CPS: Record<number, number> = {
  1: 6.0,
  2: 8.6,
  3: 5.0,
  4: 7.7,
  5: 8.3,
};

/** Total CP/s = sum of the rewards of the completed stages. Starts at 0. */
export function stageIncome(completedCheckpointIds: string[]): number {
  let total = 0;
  for (const stage of STAGES) {
    if (completedCheckpointIds.includes(stage.checkpointId)) {
      total += STAGE_CPS[stage.id] ?? 0;
    }
  }
  return Math.round(total * 10) / 10;
}

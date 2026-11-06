import type { ComponentType } from "react";
import type { StagePlayProps } from "./types";
import { PlaceholderPlay } from "./PlaceholderPlay";

export interface StageCopy {
  tip: string; // 1-2 sentences, a hint not the answer
  why: string; // shown only after the player acts
}

export const STAGE_COPY: Record<number, StageCopy> = {
  1: {
    tip: "Every part has a job. Think calculator, boss, notepad, beat and pocket.",
    why: "The ALU performs arithmetic and logic. No ALU, no sum.",
  },
  2: {
    tip: "Instructions move through stages. Watch where they wait.",
    why: "A hazard means one instruction needs data that is not ready yet.",
  },
  3: {
    tip: "One dial, two philosophies.",
    why: "Rich instructions pay off when the work is complex.",
  },
  4: {
    tip: "Closer memory is faster but smaller.",
    why: "A cache hit skips the slow trip to main memory.",
  },
  5: {
    tip: "Each processor is built for a kind of work.",
    why: "Matching the task to the hardware removes the slowest lane.",
  },
};

/** Swap in a real play component per stage as each one is built. */
export const STAGE_PLAYS: Record<number, ComponentType<StagePlayProps>> = {
  1: PlaceholderPlay,
  2: PlaceholderPlay,
  3: PlaceholderPlay,
  4: PlaceholderPlay,
  5: PlaceholderPlay,
};

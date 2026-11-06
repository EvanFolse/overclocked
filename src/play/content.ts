import { Stage1Play } from "./stage1/Stage1Play";
import type { ComponentType } from "react";
import type { StagePlayProps } from "./types";
import { PlaceholderPlay } from "./PlaceholderPlay";

export interface StageCopy {
  title: string;   // shown in the header and the intro banner
  mission: string; // mechanic name from the design doc
  tip: string;     // 1-2 sentences, a hint not the answer
  why: string;     // shown only after the player acts
  cards?: { part: string; analogy: string; color: string; icon: string }[]; // optional TIP cards
}

export const STAGE_COPY: Record<number, StageCopy> = {
  1: {
    title: "Know the CPU",
    mission: "BUILD & DIAGNOSE",
    cards: [
      { part: "ALU", analogy: "Calculator", color: "#f5c242", icon: "🧮" },
      { part: "CONTROL UNIT", analogy: "Boss", color: "#a994f5", icon: "👑" },
      { part: "REGISTERS", analogy: "Notepad", color: "#4ec3d0", icon: "📝" },
      { part: "CLOCK", analogy: "Beat", color: "#5fd3a0", icon: "🥁" },
      { part: "CACHE", analogy: "Pocket", color: "#5b8def", icon: "👝" },
    ],
    tip: "Every part has a job. Think calculator, boss, notepad, beat and pocket.",
    why: "The ALU performs arithmetic and logic. No ALU, no sum.",
  },
  2: {
    title: "The CPU in Motion",
    mission: "OPERATE & OPTIMIZE",
    tip: "Instructions move through stages. Watch where they wait.",
    why: "A hazard means one instruction needs data that is not ready yet.",
  },
  3: {
    title: "Two Ways to Build a CPU",
    mission: "DESIGN & COMPARE",
    tip: "One dial, two philosophies.",
    why: "Rich instructions pay off when the work is complex.",
  },
  4: {
    title: "The Memory Hierarchy",
    mission: "EXPERIMENT & OPTIMIZE",
    tip: "Closer memory is faster but smaller.",
    why: "A cache hit skips the slow trip to main memory.",
  },
  5: {
    title: "Beyond the CPU",
    mission: "ASSIGN & COORDINATE",
    tip: "Each processor is built for a kind of work.",
    why: "Matching the task to the hardware removes the slowest lane.",
  },
};

/** Swap in a real play component per stage as each one is built. */
export const STAGE_PLAYS: Record<number, ComponentType<StagePlayProps>> = {
  1: Stage1Play,
  2: PlaceholderPlay,
  3: PlaceholderPlay,
  4: PlaceholderPlay,
  5: PlaceholderPlay,
};

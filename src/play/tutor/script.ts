import type { Mood } from "../types";

export interface Brief {
  mission: string; // what you do
  how: string;     // how to play
  learn: string;   // what you learn
}

/** Opening briefing per stage: one short sentence each. Stages 2-5 are drafts, adjust when those stages are built. */
export const BRIEFS: Record<number, Brief> = {
  1: {
    mission: "Build the CPU, then fix what breaks.",
    how: "Drag each part from the tray onto the die. When the chip fails, probe it and put the right part back.",
    learn: "What each CPU part does.",
  },
  2: {
    mission: "Keep instructions flowing through the pipeline.",
    how: "Drag BUBBLE and FORWARD WIRE onto the timeline to clear the hazards.",
    learn: "How a CPU runs instructions step by step.",
  },
  3: {
    mission: "Fit one CPU design to two very different jobs.",
    how: "Slide the dial between RISC-like and CISC-like, then lock a design that fits each job's limits.",
    learn: "Why there is more than one way to build a CPU.",
  },
  4: {
    mission: "Tune the memory so the CPU never waits.",
    how: "Place data in registers, cache and memory, then watch the access time change.",
    learn: "Why closer memory is faster but smaller.",
  },
  5: {
    mission: "Hand every task to the processor that fits it best.",
    how: "Drag tasks onto the CPU, GPU and NPU lanes, then run it and watch the slowest lane.",
    learn: "Why CPUs, GPUs and NPUs share the work.",
  },
};

/** What the Tutor says the moment a part is picked up, dropped right, or dropped wrong. One sentence. */
export const PART_INFO: Record<string, { nick: string; what: string }> = {
  alu: { nick: "Calculator", what: "The calculator: it adds, subtracts and compares numbers." },
  control: { nick: "Boss", what: "The boss: it reads each instruction and tells every part what to do." },
  registers: { nick: "Notepad", what: "The notepad: tiny, super-fast storage for the numbers in use right now." },
  clock: { nick: "Beat", what: "The beat: every tick tells the CPU to take its next step." },
  cache: { nick: "Pocket", what: "The pocket: it keeps recently used data close so the CPU doesn't wait on memory." },
};

/** Default mood follows the tag of the line (a line can also set its own mood). */
export function moodFor(tag: string): Mood {
  switch (tag) {
    case "RESULT":
      return "cheer";
    case "HINT":
    case "UNSEEN":
      return "think";
    case "EVENT":
    case "SYMPTOM":
      return "oops";
    default:
      return "idle";
  }
}

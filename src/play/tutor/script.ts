export type Mood = "idle" | "think" | "oops" | "cheer";

/** One short line per stage: what you do, what you learn. Keep it tiny: players do not want to read. */
export const BRIEFS: Record<number, { doing: string; learning: string }> = {
  1: { doing: "Build the chip, then fix what breaks.", learning: "What each CPU part does." },
  2: { doing: "Move instructions through the pipeline and clear the hazards.", learning: "How a CPU runs instructions step by step." },
  3: { doing: "Tune one dial to fit two different jobs.", learning: "Why there is more than one way to design a CPU." },
  4: { doing: "Place data in registers, cache and memory.", learning: "Why closer memory is faster but smaller." },
  5: { doing: "Hand each task to the processor that fits.", learning: "Why CPUs, GPUs and NPUs share the work." },
};

/** The Tutor's mood follows the tag of the line it is saying. */
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

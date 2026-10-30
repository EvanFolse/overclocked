import { getRoundItems } from "@/lib/rounds";
import type { GameState } from "@/types/game";

/**
 * Paged explanation after a failed round (design doc 6.1).
 * Pages are built from the wrong options the player picked, plus the matching sets that
 * were not solved on the first try. All text is hard-coded.
 * DRAFT TEXT: every part description must be checked against the textbook by a teammate.
 */

export type PartId = "alu" | "control" | "pc" | "decoder" | "registers" | "cache" | "clock" | "biu";

export interface ReviewPage {
  key: string;
  /** The CPU part this page is about (used later to highlight a weak spot on the CPU model) */
  part: PartId | null;
  partName: string | null;
  title: string;
  body: string;
}

export interface WrongPick {
  id: string;
  /** Original option index (the order written in the question bank) */
  choice: number;
}

const PART_INFO: Record<PartId, { name: string; text: string }> = {
  alu: {
    name: "ALU",
    text: "The ALU performs arithmetic (addition, subtraction) and logical (AND, OR, comparison) operations. It computes, but it does not decide what runs next.",
  },
  control: {
    name: "Control Unit",
    text: "The Control Unit directs the datapath, memory and I/O so that they work together. It does not process the data itself.",
  },
  pc: {
    name: "Program Counter",
    text: "The Program Counter holds the memory address of the next instruction to be executed. It points to the next instruction; it does not decode or run it.",
  },
  decoder: {
    name: "Instruction Decoder",
    text: "The Instruction Decoder interprets the binary encoding of an instruction and produces the matching control signals. It works out what to do; it does not do the computing.",
  },
  registers: {
    name: "Registers",
    text: "Registers are tiny, very fast storage inside the processor that hold the values being used right now. They store data; they do not compute.",
  },
  cache: {
    name: "Cache",
    text: "The Cache is a small, fast memory between the CPU and main memory that keeps copies of frequently used data, so repeated accesses avoid slow trips to main memory.",
  },
  clock: {
    name: "Clock",
    text: "The Clock provides synchronizing timing signals that coordinate the hardware components. It sets the pace; it does not carry data or compute.",
  },
  biu: {
    name: "Bus Interface Unit",
    text: "The Bus Interface Unit manages data transfer between the CPU core and the external bus and memory.",
  },
};

/** Which part does this answer option name? Options that list several things return null. */
function partOf(choice: string): PartId | null {
  const c = choice.toLowerCase();
  if (c.includes(",") || / and /.test(c)) return null;
  if (c.includes("arithmetic logic") || c === "alu") return "alu";
  if (c.includes("control unit")) return "control";
  if (c.includes("program counter") || c === "counter") return "pc";
  if (c.includes("decoder")) return "decoder";
  if (c.includes("register")) return "registers";
  if (c.includes("cache")) return "cache";
  if (c.includes("clock")) return "clock";
  if (c.includes("bus")) return "biu";
  return null;
}

const MAX_PAGES = 5;

/**
 * Call with the state from BEFORE finishRound clears the round.
 * `picks` are the wrong options the player chose during this round.
 */
export function buildReviewPages(state: GameState, picks: WrongPick[]): ReviewPage[] {
  const items = getRoundItems(state);
  const pages: ReviewPage[] = [];
  const seen = new Set<string>();

  // 1) One page per misunderstood part (or per question when the option is not a single part)
  for (const pick of picks) {
    const item = items.find((it) => it.id === pick.id);
    if (!item || item.kind !== "mc") continue;
    if (pick.choice === item.correctIndex) continue;
    const picked = item.choices[pick.choice];
    if (picked === undefined) continue;

    const correct = item.choices[item.correctIndex] ?? "";
    const part = partOf(picked);
    const key = part ? `part-${part}` : `q-${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const intro = part ? `${PART_INFO[part].text}\n\n` : `You chose “${picked}”.\n\n`;
    pages.push({
      key,
      part,
      partName: part ? PART_INFO[part].name : null,
      title: part ? `You chose “${picked}”` : `Review: ${item.concept}`,
      body: `${intro}For this question the answer is “${correct}”. ${item.explanation}`,
    });
  }

  // 2) One page per matching set that was not solved on the first attempt
  for (const item of items) {
    if (item.kind !== "match") continue;
    const record = [...state.answerLog].reverse().find((r) => r.id === item.id);
    if (!record || record.attemptCorrect === 1) continue;
    pages.push({
      key: `match-${item.id}`,
      part: null,
      partName: null,
      title: `Review: ${item.concepts.join(", ")}`,
      body: item.pairs.map((p) => `• ${p.item}: ${p.description}`).join("\n"),
    });
  }

  return pages.slice(0, MAX_PAGES);
}

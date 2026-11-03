/**
 * Pure logic of the three Stage 2 missions (Spot it, Fix it, Beat the budget).
 * No React, no imports. Every answer comes from the simulator, not from a stored option.
 */

export type Stage = "IF" | "ID" | "EX" | "MEM" | "WB";
export type Op = "lw" | "alu" | "beq";

export interface Instr {
  id: string;
  text: string;
  op: Op;
  dest?: string;
  srcs: string[];
}

/** One box of the time-space diagram. `held` = the instruction waits in this stage. */
export interface Cell {
  cycle: number;
  stage: Stage;
  held: boolean;
}

export interface Row {
  instr: Instr;
  cells: Cell[];
  /** Bubbles this instruction caused (cycles it waited in ID) */
  stalls: number;
}

export interface Schedule {
  rows: Row[];
  cycles: number;
  stalls: number;
}

/**
 * In-order 5-stage pipeline.
 * With forwarding: an ALU result can be used in the next EX, a loaded value one cycle later.
 * Without forwarding: the consumer must read the register after the producer's WB.
 */
export function schedule(order: Instr[], forwarding = true): Schedule {
  const ifC: number[] = [];
  const idC: number[] = [];
  const exC: number[] = [];

  order.forEach((ins, i) => {
    const f = i === 0 ? 1 : Math.max(ifC[i - 1]! + 1, idC[i - 1]!);
    const d = Math.max(f + 1, i === 0 ? 0 : exC[i - 1]!);
    let ready = 0;
    for (const s of ins.srcs) {
      for (let j = i - 1; j >= 0; j--) {
        const p = order[j]!;
        if (p.dest !== s) continue;
        const need = forwarding ? (p.op === "lw" ? exC[j]! + 2 : exC[j]! + 1) : exC[j]! + 3;
        ready = Math.max(ready, need);
        break;
      }
    }
    ifC[i] = f;
    idC[i] = d;
    exC[i] = Math.max(d + 1, ready);
  });

  const rows: Row[] = order.map((instr, i) => {
    const cells: Cell[] = [];
    for (let c = ifC[i]!; c < idC[i]!; c++) cells.push({ cycle: c, stage: "IF", held: c > ifC[i]! });
    for (let c = idC[i]!; c < exC[i]!; c++) cells.push({ cycle: c, stage: "ID", held: c > idC[i]! });
    cells.push({ cycle: exC[i]!, stage: "EX", held: false });
    cells.push({ cycle: exC[i]! + 1, stage: "MEM", held: false });
    cells.push({ cycle: exC[i]! + 2, stage: "WB", held: false });
    return { instr, cells, stalls: exC[i]! - idC[i]! - 1 };
  });

  const cycles = Math.max(...rows.map((r) => r.cells[r.cells.length - 1]!.cycle));
  return { rows, cycles, stalls: rows.reduce((s, r) => s + r.stalls, 0) };
}

/* ------------------------------------------------------------ Spot it */

export const SPOT_PROGRAM: Instr[] = [
  { id: "I1", text: "LW R1, 0(R2)", op: "lw", dest: "R1", srcs: ["R2"] },
  { id: "I2", text: "ADD R4, R5, R6", op: "alu", dest: "R4", srcs: ["R5", "R6"] },
  { id: "I3", text: "SUB R7, R8, R9", op: "alu", dest: "R7", srcs: ["R8", "R9"] },
  { id: "I4", text: "OR R10, R11, R12", op: "alu", dest: "R10", srcs: ["R11", "R12"] },
];

/** One shared memory port: every fetch and every LW's MEM stage uses it. */
export function memoryUsers(s: Schedule): Record<number, string[]> {
  const use: Record<number, string[]> = {};
  for (const r of s.rows) {
    for (const c of r.cells) {
      const uses = (c.stage === "IF" && !c.held) || (c.stage === "MEM" && r.instr.op === "lw");
      if (uses) (use[c.cycle] ??= []).push(r.instr.id);
    }
  }
  return use;
}

export function memoryCollisions(s: Schedule): number[] {
  return Object.entries(memoryUsers(s))
    .filter(([, ids]) => ids.length > 1)
    .map(([c]) => Number(c));
}

export type Hazard = "data" | "structural" | "control";

export interface SpotCheck {
  cycleOk: boolean;
  hazardOk: boolean;
  correct: boolean;
}

export function checkSpot(answer: { cycle: number | null; hazard: Hazard | null }): SpotCheck {
  const hit = memoryCollisions(schedule(SPOT_PROGRAM));
  const cycleOk = answer.cycle !== null && hit.includes(answer.cycle);
  const hazardOk = answer.hazard === "structural"; // a collision on shared hardware
  return { cycleOk, hazardOk, correct: cycleOk && hazardOk };
}

/* ------------------------------------------------------------ Fix it */

export type Tool = "stall" | "forward" | "flush";

/** BEQ is decided at the end of EX. In the diagram that is cycle 3. */
export const BRANCH_EX_CYCLE = 3;
export const FLUSH_CYCLE = BRANCH_EX_CYCLE + 1;

export function checkFix(tool: Tool, cycle: number): { correct: boolean; why: string } {
  if (tool === "stall")
    return { correct: false, why: "A stall holds new instructions back, but ADD and SUB are already inside the pipeline." };
  if (tool === "forward")
    return { correct: false, why: "Forwarding passes a computed value forward. Nothing is missing here: the wrong instructions themselves are the problem." };
  if (cycle < FLUSH_CYCLE)
    return { correct: false, why: "BEQ has not finished EX yet. The CPU cannot know the guess was wrong at this cycle." };
  if (cycle > FLUSH_CYCLE)
    return { correct: false, why: "Too late. The wrong-path instructions keep moving toward WB, where they would change a register. Cancel them the moment the jump is known." };
  return { correct: true, why: "BEQ is decided at the end of EX in cycle 3. In cycle 4 the CPU flushes ADD and SUB, and OR (the jump target) is fetched. Cost: 2 wasted cycles." };
}

/* ------------------------------------------------------------ Beat the budget */

export const BUDGET_PROGRAM: Instr[] = [
  { id: "I1", text: "LW R1, 0(R2)", op: "lw", dest: "R1", srcs: ["R2"] },
  { id: "I2", text: "ADD R3, R1, R4", op: "alu", dest: "R3", srcs: ["R1", "R4"] },
  { id: "I3", text: "SUB R5, R6, R7", op: "alu", dest: "R5", srcs: ["R6", "R7"] },
  { id: "I4", text: "OR R8, R9, R10", op: "alu", dest: "R8", srcs: ["R9", "R10"] },
];
export const BUDGET_CYCLES = 8;

/** An order is legal if no dependent pair (RAW, WAR, WAW) swaps places. */
export function isLegalOrder(original: Instr[], order: Instr[]): boolean {
  const pos = new Map(order.map((x, i) => [x.id, i]));
  for (let a = 0; a < original.length; a++) {
    for (let b = a + 1; b < original.length; b++) {
      const x = original[a]!;
      const y = original[b]!;
      const raw = !!x.dest && y.srcs.includes(x.dest);
      const war = !!y.dest && x.srcs.includes(y.dest);
      const waw = !!x.dest && x.dest === y.dest;
      if ((raw || war || waw) && pos.get(x.id)! > pos.get(y.id)!) return false;
    }
  }
  return true;
}

export function checkBudget(order: Instr[]) {
  const s = schedule(order, true);
  const legal = isLegalOrder(BUDGET_PROGRAM, order);
  return { legal, cycles: s.cycles, stalls: s.stalls, correct: legal && s.cycles <= BUDGET_CYCLES };
}

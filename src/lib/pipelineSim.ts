import type { FixId, GridSpec, StageName } from "@/data/bank/pipelineSpec";

/**
 * Tiny pipeline simulator for the Stage 2 missions (design doc 3).
 * It only draws the time-space diagram for the sandbox. It does not score anything.
 * Rows are instructions, columns are clock cycles (1-based).
 */

export type CellKind = "stage" | "wait" | "flush" | "wrong";

export interface SimCell {
    text: string;
    stage?: StageName;
    kind: CellKind;
    /** Part of the collision, or the too-early read */
    bad?: boolean;
    /** Source or target of a forwarding path */
    fwd?: boolean;
}

export interface SimRow {
    label: string;
    /** The instruction was never fetched in this run */
    skipped?: boolean;
    cells: Record<number, SimCell>;
}

export interface SimResult {
    rows: SimRow[];
    /** Cycles until the last useful instruction is written back */
    cycles: number;
    /** Cycles an ideal pipeline needs for the instructions that really run */
    ideal: number;
    status: "cleared" | "open" | "none";
    message: string;
}

/** Number of cycle columns drawn for each hazard type (fixed, so the grid does not jump around) */
export const COLS: Record<GridSpec["hazard"], number> = { raw: 9, structural: 9, control: 10 };

type Token = StageName | "wait" | "flush";
const FULL: Token[] = ["IF", "ID", "EX", "MEM", "WB"];

interface Opts {
    bad?: number[];
    fwd?: number[];
    wrong?: boolean;
}

/** One row: the tokens occupy consecutive cycles from `start`. */
function build(label: string, start: number, tokens: Token[], o: Opts = {}): SimRow {
    const cells: Record<number, SimCell> = {};
    tokens.forEach((t, i) => {
        const c = start + i;
        if (t === "wait") {
            cells[c] = { text: "⏸", kind: "wait" };
        } else if (t === "flush") {
            cells[c] = { text: "✗", kind: "flush" };
        } else {
            cells[c] = {
                text: t,
                stage: t,
                kind: o.wrong ? "wrong" : "stage",
                bad: o.bad?.includes(c) ?? false,
                fwd: o.fwd?.includes(c) ?? false,
            };
        }
    });
    return { label, cells };
}

function skipped(label: string): SimRow {
    return { label, skipped: true, cells: {} };
}

function finish(rows: SimRow[], ideal: number, status: SimResult["status"], message: string): SimResult {
    let cycles = 0;
    for (const r of rows) {
        for (const [k, cell] of Object.entries(r.cells)) {
            if (cell.kind !== "flush") cycles = Math.max(cycles, Number(k));
        }
    }
    return { rows, cycles, ideal, status, message };
}

export function simulate(spec: GridSpec, fix: FixId | null, taken: boolean): SimResult {
    const [i0 = "", i1 = "", i2 = "", i3 = ""] = spec.instrs;
    const miss = fix ? "That fix does not apply to this hazard. " : "";

    if (spec.hazard === "raw") {
        if (fix === "forward") {
            return finish(
                [build(i0, 1, FULL, { fwd: [3] }), build(i1, 2, FULL, { fwd: [4] }), build(i2, 3, FULL)],
                7,
                "cleared",
                "Cleared. The ALU result of the first instruction is forwarded straight into the EX stage of the second one. No idle cycles.",
            );
        }
        if (fix === "stall") {
            return finish(
                [
                    build(i0, 1, FULL),
                    build(i1, 2, ["IF", "ID", "wait", "wait", "EX", "MEM", "WB"]),
                    build(i2, 3, ["IF", "wait", "wait", "ID", "EX", "MEM", "WB"]),
                ],
                7,
                "cleared",
                "Cleared, but sub and the instruction behind it wait two idle cycles until $t0 has been written back.",
            );
        }
        return finish(
            [build(i0, 1, FULL, { bad: [5] }), build(i1, 2, FULL, { bad: [3] }), build(i2, 3, FULL)],
            7,
            "open",
            `${miss}sub reads $t0 in cycle 3, but add only writes it in cycle 5. sub gets the old value, so the result is wrong.`,
        );
    }

    if (spec.hazard === "structural") {
        if (fix === "split") {
            return finish(
                [build(i0, 1, FULL), build(i1, 2, FULL), build(i2, 3, FULL), build(i3, 4, FULL)],
                8,
                "cleared",
                "Cleared. Fetch uses the instruction memory and MEM uses the data memory, so they no longer collide.",
            );
        }
        if (fix === "stall") {
            return finish(
                [
                    build(i0, 1, FULL),
                    build(i1, 2, FULL),
                    build(i2, 3, FULL),
                    build(i3, 4, ["wait", "IF", "ID", "EX", "MEM", "WB"]),
                ],
                8,
                "cleared",
                "Cleared, but the fourth instruction has to wait one idle cycle before it can be fetched.",
            );
        }
        return finish(
            [
                build(i0, 1, FULL, { bad: [4] }),
                build(i1, 2, FULL),
                build(i2, 3, FULL),
                build(i3, 4, FULL, { bad: [4] }),
            ],
            8,
            "open",
            `${miss}In cycle 4 the load (MEM) and the fourth instruction (IF) both need the one shared memory.`,
        );
    }

    // control hazard: the branch is resolved at the end of EX (cycle 3)
    const beq = build(i0, 1, FULL);
    if (fix === "predict") {
        if (!taken) {
            return finish(
                [beq, build(i1, 2, FULL), build(i2, 3, FULL), build(i3, 4, FULL)],
                8,
                "cleared",
                "Guess right: the instructions fetched after the branch were the right ones. 0 extra cycles.",
            );
        }
        return finish(
            [beq, build(i1, 2, ["IF", "ID", "flush"]), build(i2, 3, ["IF", "flush"]), build(i3, 4, FULL)],
            6,
            "cleared",
            "Guess wrong: the two wrong-path instructions are flushed (✗) before they can do any harm. Cost: 2 cycles.",
        );
    }
    if (fix === "stall") {
        if (!taken) {
            return finish(
                [
                    beq,
                    build(i1, 2, ["wait", "wait", "IF", "ID", "EX", "MEM", "WB"]),
                    build(i2, 5, FULL),
                    build(i3, 6, FULL),
                ],
                8,
                "cleared",
                "Cleared, but the pipeline waits two cycles every time, even though the branch was not taken.",
            );
        }
        return finish(
            [beq, build(i1, 2, ["wait", "wait"]), skipped(i2), build(i3, 4, FULL)],
            6,
            "cleared",
            "Cleared. Nothing wrong was fetched, but the pipeline waited two cycles for the branch.",
        );
    }
    if (!taken) {
        return finish(
            [beq, build(i1, 2, FULL), build(i2, 3, FULL), build(i3, 4, FULL)],
            8,
            "none",
            `${miss}Branch not taken: fetching in order was the right guess, so nothing is lost. Switch to Taken to see the hazard.`,
        );
    }
    return finish(
        [beq, build(i1, 2, FULL, { wrong: true }), build(i2, 3, FULL, { wrong: true }), build(i3, 4, FULL)],
        6,
        "open",
        `${miss}Branch taken: the two instructions after it are on the wrong path, but they ran anyway (red).`,
    );
}

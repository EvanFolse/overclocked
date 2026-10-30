/**
 * CPU VIEW panel data for Stage 1 mission questions, keyed by question id.
 * A mission without an entry here simply shows no left panel.
 */

export interface CpuViewNode {
    /** Write "???" for the failing part: it is replaced by the correct choice once answered. */
    label: string;
    detail: string;
    state: "ok" | "fail" | "idle";
}

export interface CpuView {
    command: string;
    nodes: CpuViewNode[];
    /** Detail line shown on the "???" row after a correct answer. */
    fixedDetail?: string;
    /** Part of the scenario's first sentence to show in bold. Must match its text exactly. */
    emphasis?: string;
}

export const STAGE_1_CPU_VIEWS: Record<string, CpuView> = {
    // ALU
    "s1-ms-01": {
        command: "> ADD R1, R2, R3",
        emphasis: "no sum is ever produced.",
        fixedDetail: "adds R2 + R3",
        nodes: [
            { label: "FETCH", detail: "instruction fetched", state: "ok" },
            { label: "DECODE", detail: "operation recognised", state: "ok" },
            { label: "OPERANDS", detail: "R2, R3 read", state: "ok" },
            { label: "???", detail: "sum is never produced", state: "fail" },
            { label: "R1", detail: "still holds old value", state: "idle" },
        ],
    },

    // Program Counter
    "s1-ms-02": {
        command: "> ADD R1, R2, R3",
        emphasis: "the same instruction over and over.",
        fixedDetail: "points to the next instruction",
        nodes: [
            { label: "FETCH", detail: "same instruction fetched again", state: "ok" },
            { label: "DECODE", detail: "operation recognised", state: "ok" },
            { label: "EXECUTE", detail: "result written to R1", state: "ok" },
            { label: "???", detail: "next address never updated", state: "fail" },
            { label: "NEXT", detail: "stuck on the same instruction", state: "idle" },
        ],
    },

    // Instruction Decoder
    "s1-ms-03": {
        command: "> 1011 0001 0010 0011",
        emphasis: "the CPU cannot tell whether it means add, load or store.",
        fixedDetail: "turns the bits into control signals",
        nodes: [
            { label: "FETCH", detail: "instruction arrived", state: "ok" },
            { label: "???", detail: "meaning of the bits unknown", state: "fail" },
            { label: "OPERANDS", detail: "not selected", state: "idle" },
            { label: "EXECUTE", detail: "no control signals", state: "idle" },
            { label: "R1", detail: "still holds old value", state: "idle" },
        ],
    },

    // Bus Interface Unit
    "s1-ms-04": {
        command: "> ADD R1, R2, R3",
        emphasis: "cannot fetch instructions or data from main memory.",
        fixedDetail: "moves data to and from memory",
        nodes: [
            { label: "???", detail: "cannot reach main memory", state: "fail" },
            { label: "FETCH", detail: "no instruction arrives", state: "idle" },
            { label: "DECODE", detail: "nothing to decode", state: "idle" },
            { label: "EXECUTE", detail: "nothing to run", state: "idle" },
            { label: "R1", detail: "still holds old value", state: "idle" },
        ],
    },

    // Clock (spare)
    "s1-ms-05": {
        command: "> ADD R1, R2, R3",
        emphasis: "they act out of step with each other.",
        fixedDetail: "keeps every stage in step",
        nodes: [
            { label: "FETCH", detail: "works on its own", state: "ok" },
            { label: "DECODE", detail: "works on its own", state: "ok" },
            { label: "EXECUTE", detail: "works on its own", state: "ok" },
            { label: "???", detail: "stages never run in step", state: "fail" },
            { label: "R1", detail: "value is unreliable", state: "idle" },
        ],
    },
};
/**
 * Bold phrase for plain multiple-choice questions, keyed by question id.
 * The phrase must appear in the question's scenario exactly as written.
 * Questions without an entry are shown without bold.
 */
export const STAGE_1_EMPHASIS: Record<string, string> = {
    // "s1-mc-03": "next instruction",
};

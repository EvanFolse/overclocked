/**
 * Data for the Stage 2 pipeline panel. It is shown instead of the node list
 * when a CpuView has a `pipeline` field (see RoundView and PipelineView).
 */

export type StageName = "IF" | "ID" | "EX" | "MEM" | "WB";
export type FixId = "stall" | "forward" | "predict" | "split";
export type HazardKind = "raw" | "structural" | "control";

export interface WalkStep {
    stage: StageName;
    /** Parts of the CPU that are busy in this stage (names from WalkSpec.parts) */
    lit: string[];
    note: string;
}

/** Mission 1: walk one instruction through the five stages and see which part is busy. */
export interface WalkSpec {
    kind: "walk";
    parts: string[];
    steps: WalkStep[];
}

/** Missions 2 to 4: a pipeline time-space diagram with a free fix sandbox. */
export interface GridSpec {
    kind: "grid";
    hazard: HazardKind;
    /** One label per instruction row, in program order (4 for structural and control, 3 for raw) */
    instrs: string[];
}

export type PipelineSpec = WalkSpec | GridSpec;

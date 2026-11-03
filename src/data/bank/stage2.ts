import type { StageBank } from "@/data/bank/types";

/**
 * Stage 2 · THE CPU IN MOTION
 *
 * Source: Stage2_Question_Bank.docx (team). Converted by script, text unchanged except:
 * - Required round: MC1, MC3, MC4, MC5 and matching 1 and 2. MC2 (RAW definition) is a spare because
 *   mission M2 asks the player to name the RAW hazard. This follows the design note
 *   "4 missions + 4 multiple choice + 2 matching" and needs teammate confirmation.
 * - Spare: MC2, MC6, MC7 and the four "Extra" questions MC8 to MC11, plus matching 3 and 4.
 * - Reading text and the two open questions are placeholders written for the first build.
 *
 * The four interactive missions (M1 Walk, M2 Data, M3 Structural, M4 Control) are not part of this
 * file yet. Until they exist the round has no mission group and its weight goes to the other two.
 */
export const STAGE_2_BANK: StageBank = {
    stageId: 2,

    /** Interactive missions (Spot it, Fix it, Beat the budget). Answers come from the simulator. */
    missions: [
        { id: "s2-mission-spot", variant: "spot", concept: "Structural hazard", concepts: ["Structural hazard"] },
        { id: "s2-mission-fix", variant: "fix", concept: "Control hazard", concepts: ["Control hazard", "Flush"] },
        { id: "s2-mission-budget", variant: "budget", concept: "Forwarding and reordering", concepts: ["Forwarding", "Instruction reordering"] },
    ],

    reading:
        "Every instruction goes through five steps: fetch (IF), decode (ID), execute (EX), memory access (MEM) and write back (WB). Without a pipeline the CPU finishes one instruction before it starts the next, so most of the hardware sits idle. A pipeline overlaps the instructions: while one is executing, the next is being decoded and a third is being fetched, like a laundry line. Each instruction still takes about the same time, but more instructions finish every second. The overlap is fragile. An instruction can need a result that is not ready yet (data hazard), two instructions can need the same hardware (structural hazard), or a branch can make the fetched instructions wrong (control hazard).",
    readingDraft: true,

    mc: [
        {
            // docx MC1 (Core)
            id: "s2-mc-01",
            concept: "Pipelining throughput",
            scenario:
                "What is the primary advantage of pipelining in a CPU?",
            choices: [
                "It raises throughput: more instructions finish per unit time.",
                "It cuts the latency of each individual instruction.",
                "It automatically removes all data and control hazards.",
                "It simplifies the datapath and control logic.",
                "It removes the need for a clock signal.",
            ],
            correctIndex: 0,
            hint: "Overlapping instructions does not make any single instruction faster. Ask what it improves for the program as a whole.",
            explanation:
                "Overlap raises throughput. A single instruction's latency stays the same or gets slightly longer because of pipeline-register overhead. Hazards still exist, and hardware gets more complex.",
            draft: true,
        },
        {
            // docx MC2 (Core) · spare (moved from Core, see header)
            id: "s2-mc-02",
            concept: "RAW data hazard",
            scenario:
                "Which situation is a RAW (Read After Write) data hazard in a 5-stage pipeline?",
            choices: [
                "Two instructions need the same memory port in the same cycle.",
                "An instruction needs a register value that an earlier instruction has not yet written back.",
                "A branch changes the PC, so the instructions already fetched after it are wrong.",
                "Two instructions write the same register and their writes could complete out of order.",
                "The ALU receives an opcode it does not recognize.",
            ],
            correctIndex: 1,
            hint: "Read the name literally: which instruction reads, which one writes, and which of the two must happen first?",
            explanation:
                "RAW means a later instruction reads a register before the earlier instruction's result has been written back. Two instructions competing for one memory port is a structural hazard, a branch that changes the PC is a control hazard, and two writes completing out of order is WAW.",
            spare: true,
            draft: true,
        },
        {
            // docx MC3 (Core)
            id: "s2-mc-03",
            concept: "Forwarding",
            scenario:
                "Which hardware technique removes most RAW data hazards without inserting idle cycles (stalls)?",
            choices: [
                "Dynamic branch prediction",
                "Inserting bubbles between the dependent instructions",
                "Separate instruction and data memories",
                "Forwarding (bypassing)",
                "Flushing the pipeline",
            ],
            correctIndex: 3,
            hint: "The needed value already exists inside the pipeline before it reaches the register file. Which technique hands it over early?",
            explanation:
                "Forwarding sends a result from the EX/MEM or MEM/WB register straight to the ALU input, so the dependent instruction does not wait for write-back. (The load-use case still needs one stall.)",
            draft: true,
        },
        {
            // docx MC4 (Core)
            id: "s2-mc-04",
            concept: "Structural hazard",
            scenario:
                "Which situation is a structural hazard in a classic 5-stage pipeline?",
            choices: [
                "An instruction fetch and a data access both need one shared memory port.",
                "An instruction needs a result that an earlier instruction has not yet written back.",
                "A conditional branch is mispredicted.",
                "A load's data is not yet available when the next instruction needs it.",
                "The program needs more variables than the register file has registers.",
            ],
            correctIndex: 0,
            hint: "\"Structural\" points at the hardware itself. Which option is a conflict over a physical unit, not over data or branch outcomes?",
            explanation:
                "A structural hazard happens when two instructions need the same hardware resource in the same cycle. A result that is not ready yet (including a load's data) is a data hazard, a mispredicted branch is a control hazard, and running out of registers is not a pipeline hazard.",
            draft: true,
        },
        {
            // docx MC5 (Core)
            id: "s2-mc-05",
            concept: "Control hazard",
            scenario:
                "What is a control hazard, and how is it typically reduced?",
            choices: [
                "Two instructions need one memory port; reduced by adding a second port.",
                "A register is read before it is written; reduced by sign-extending immediates.",
                "The ALU result arrives too late; reduced by lengthening the clock cycle.",
                "Write-back is blocked; reduced by enlarging the write-back buffer.",
                "The next PC is unknown until a branch resolves; reduced by branch prediction and flushing.",
            ],
            correctIndex: 4,
            hint: "A branch decides which instruction comes next. What does the pipeline do while it does not yet know?",
            explanation:
                "The pipeline keeps fetching before the branch outcome is known, so some fetched instructions may be wrong. Branch prediction reduces this, and a flush removes wrong-path instructions after a misprediction.",
            draft: true,
        },
        {
            // docx MC6 (Spare) · spare
            id: "s2-mc-06",
            concept: "Pipeline stages",
            scenario:
                "In what order does an instruction pass through the five stages of the classic MIPS pipeline: Instruction Fetch (IF), Instruction Decode (ID), Execute (EX), Memory Access (MEM) and Write Back (WB)?",
            choices: [
                "IF → ID → MEM → EX → WB",
                "IF → EX → ID → MEM → WB",
                "ID → IF → EX → MEM → WB",
                "IF → ID → EX → MEM → WB",
                "IF → ID → EX → WB → MEM",
            ],
            correctIndex: 3,
            hint: "Ask what each stage needs from the one before it: an address must be calculated before memory is accessed, and a loaded value must exist before it can be written to a register.",
            explanation:
                "Fetch, then decode and read registers, then compute, then access memory, then write the result back.",
            spare: true,
            draft: true,
        },
        {
            // docx MC7 (Spare) · spare
            id: "s2-mc-07",
            concept: "Instruction scheduling",
            scenario:
                "Which software technique reduces data-hazard stalls at compile time without changing what the program computes?",
            choices: [
                "Adding forwarding paths to the ALU inputs",
                "Predicting branch outcomes with a history table",
                "Duplicating the instruction and data memories",
                "Flushing the pipeline whenever a hazard is detected",
                "Reordering independent instructions to fill the gaps between dependent ones",
            ],
            correctIndex: 4,
            hint: "The compiler cannot change the hardware, but it can change the instruction order. What could it place between two dependent instructions?",
            explanation:
                "Instruction scheduling moves independent instructions into the gap, so the pipeline stays busy. The other four options are all hardware mechanisms.",
            spare: true,
            draft: true,
        },
        {
            // docx MC8 (Extra) · spare
            id: "s2-mc-08",
            concept: "Load-use stall",
            scenario:
                "A 5-stage MIPS pipeline has full forwarding. lw $t0, 0($s0) is immediately followed by add $t1, $t0, $t2. How many stall cycles are needed?",
            choices: [
                "0",
                "1",
                "2",
                "3",
                "4",
            ],
            correctIndex: 1,
            hint: "Forwarding can only pass a value on once it exists. In which stage does a load obtain its data, and in which stage does the add need it?",
            explanation:
                "The loaded data is only available at the end of MEM, but the add needs it at the start of its EX, which is one cycle too early. One bubble fixes this, and the value is then forwarded from MEM/WB.",
            spare: true,
            draft: true,
        },
        {
            // docx MC9 (Extra) · spare
            id: "s2-mc-09",
            concept: "Pipeline cycle count",
            scenario:
                "An ideal 5-stage pipeline (one cycle per stage, no hazards, no stalls) runs 6 instructions. How many clock cycles pass from the first fetch to the last write-back?",
            choices: [
                "6",
                "9",
                "10",
                "11",
                "30",
            ],
            correctIndex: 2,
            hint: "The first instruction needs 5 cycles to get through. After that, how often does another instruction finish?",
            explanation:
                "5 + (6 − 1) = 10 cycles. 30 would be with no overlap at all, and 11 counts one cycle too many.",
            spare: true,
            draft: true,
        },
        {
            // docx MC10 (Extra) · spare
            id: "s2-mc-10",
            concept: "Clock period",
            scenario:
                "A 5-stage pipeline has stage delays of 200, 100, 200, 300 and 100 ps. Ignoring pipeline-register overhead, what is the shortest possible clock period?",
            choices: [
                "100 ps",
                "180 ps",
                "200 ps",
                "300 ps",
                "900 ps",
            ],
            correctIndex: 3,
            hint: "All stages tick on the same clock, and every stage must finish within one tick. Which stage limits it?",
            explanation:
                "The slowest stage (300 ps) sets the clock. 900 ps is the sum of all stage delays, which is what a non-pipelined design needs, and 180 ps is the average, which the 300 ps stage cannot meet.",
            spare: true,
            draft: true,
        },
        {
            // docx MC11 (Extra) · spare
            id: "s2-mc-11",
            concept: "Branch flush",
            scenario:
                "A 5-stage pipeline resolves branches at the end of the EX stage and always keeps fetching the next sequential instruction. A branch turns out to be taken. How many younger instructions must be flushed?",
            choices: [
                "0",
                "1",
                "2",
                "3",
                "4",
            ],
            correctIndex: 2,
            hint: "Picture the pipeline in the cycle when the branch is in EX. Which stages are holding younger instructions?",
            explanation:
                "While the branch is in EX, the next two sequential instructions are in ID and IF, and both are on the wrong path.",
            spare: true,
            draft: true,
        },
    ],

    matching: [
        {
            // docx Matching 1: Five stages and their functions (Main line)
            id: "s2-match-01",
            concepts: ["IF", "ID", "EX", "MEM"],
            pairs: [
                {
                    item: "IF (Instruction Fetch)",
                    description:
                        "Uses the PC to fetch the next instruction from instruction memory.",
                },
                {
                    item: "ID (Instruction Decode)",
                    description:
                        "Reads the source registers and decodes the instruction into control signals.",
                },
                {
                    item: "EX (Execute)",
                    description:
                        "Performs ALU operations, including address calculation for loads and stores.",
                },
                {
                    item: "MEM (Memory Access)",
                    description:
                        "Reads or writes data memory for load and store instructions.",
                },
            ],
            distractor:
                "Writes the result of an instruction back into the register file.",
            hint: "Follow one instruction in order: fetch it, decode it, compute, then access memory. One card describes a stage that is not on the left.",
            draft: true,
        },
        {
            // docx Matching 2: Hazards and their fixes (Main line)
            id: "s2-match-02",
            concepts: ["Structural hazard", "RAW data hazard", "Control hazard", "Pipeline stall"],
            pairs: [
                {
                    item: "Structural hazard",
                    description:
                        "Typically fixed by duplicating the contested hardware, e.g. separate instruction and data memories.",
                },
                {
                    item: "Data hazard (RAW)",
                    description:
                        "Typically fixed by forwarding a result from a later pipeline register straight to the ALU input.",
                },
                {
                    item: "Control hazard",
                    description:
                        "Typically reduced by branch prediction and flushing wrongly fetched instructions.",
                },
                {
                    item: "Pipeline stall (bubble)",
                    description:
                        "A cycle in which a stage does no useful work, inserted on purpose to wait for a hazard to clear.",
                },
            ],
            distractor:
                "Typically fixed by making the cache larger so that every access hits.",
            hint: "Match each hazard to its usual cure. One left card is not a hazard but what the pipeline does while it waits.",
            draft: true,
        },
        {
            // docx Matching 3: Pipeline registers (Spare)
            id: "s2-match-03",
            concepts: ["Pipeline registers"],
            pairs: [
                {
                    item: "IF/ID register",
                    description:
                        "Holds the fetched instruction word and PC+4.",
                },
                {
                    item: "ID/EX register",
                    description:
                        "Holds the two register values just read, the sign-extended immediate and the control signals for later stages.",
                },
                {
                    item: "EX/MEM register",
                    description:
                        "Holds the ALU result (the address for a load or store) and the data to be stored.",
                },
                {
                    item: "MEM/WB register",
                    description:
                        "For a load, holds the data just read from memory, together with the ALU result and the destination register number, waiting for write-back.",
                },
            ],
            distractor:
                "Holds the branch history table that predicts whether branches are taken.",
            hint: "Each register stores what the next stage still needs. Ask what Decode, Execute, Memory and Write-Back each need to receive.",
            spare: true,
            draft: true,
        },
        {
            // docx Matching 4: Performance terms (Spare)
            id: "s2-match-04",
            concepts: ["Throughput", "CPI", "Pipeline speedup", "Forwarding"],
            pairs: [
                {
                    item: "Instruction throughput",
                    description:
                        "The number of instructions completed per unit of time.",
                },
                {
                    item: "CPI (cycles per instruction)",
                    description:
                        "Total clock cycles divided by the number of instructions completed.",
                },
                {
                    item: "Pipeline speedup",
                    description:
                        "Execution time without pipelining divided by execution time with pipelining.",
                },
                {
                    item: "Forwarding (bypassing)",
                    description:
                        "Passing a result straight from a pipeline register to the ALU input of a dependent instruction, before it reaches the register file.",
                },
            ],
            distractor:
                "The total time one instruction takes from fetch to write-back (latency).",
            hint: "Check the units: instructions per time, cycles per instruction, and a time divided by a time.",
            spare: true,
            draft: true,
        },
    ],

    // The first bonus question is always this one. PLACEHOLDER written for the first build.
    openFirst: {
        id: "s2-oe-01",
        prompt:
            "Pipelining does not make a single instruction faster, yet a program finishes sooner. Explain in your own words why.",
        fullAt: 3,
        halfAt: 2,
        groups: [
            {
                label: "Instructions overlap",
                terms: [["overlap", "overlaps", "overlapped", "at the same time", "simultaneously", "in parallel", "assembly line", "laundry"]],
            },
            {
                label: "More instructions finish per unit of time (throughput)",
                terms: [["throughput", "per second", "per unit time", "more instructions", "finish more", "completes more", "completed per"]],
            },
            {
                label: "One instruction takes about the same time (latency)",
                terms: [["latency", "same time", "not faster", "no faster", "does not get faster", "doesn't get faster", "still takes"]],
            },
        ],
        explanation:
            "The stages overlap, so a new instruction can start before the previous one has finished. Each instruction still needs about the same time from fetch to write-back (latency), but more instructions are finished per unit of time (throughput).",
        draft: true,
    },

    // The second bonus question is drawn at random from this pool. PLACEHOLDER written for the first build.
    openPool: [
        {
            id: "s2-oe-02",
            prompt:
                "Name the three kinds of pipeline hazard and give one way to reduce each of them.",
            fullAt: 3,
            halfAt: 2,
            groups: [
                {
                    label: "Structural hazard and its fix",
                    terms: [["structural"]],
                    near: ["duplicate", "separate", "second port", "extra port", "two memories", "separate memories", "more hardware"],
                },
                {
                    label: "Data hazard and its fix",
                    terms: [["data hazard", "raw", "read after write", "data"]],
                    near: ["forward", "forwarding", "bypass", "stall", "bubble", "reorder", "schedule"],
                },
                {
                    label: "Control hazard and its fix",
                    terms: [["control hazard", "branch", "control"]],
                    near: ["predict", "prediction", "flush", "delay slot"],
                },
            ],
            explanation:
                "A structural hazard (two instructions need the same hardware) is fixed by duplicating the hardware, for example separate instruction and data memories. A data hazard (a result is not ready) is reduced by forwarding, by stalling or by reordering instructions. A control hazard (the next instruction depends on an unresolved branch) is reduced by branch prediction and by flushing wrongly fetched instructions.",
            draft: true,
        },
    ],
};

export interface MatchItem {
    id: string;
    text: string;
}

export interface MatchSet {
    id: string;
    title: string;
    leftItems: MatchItem[];
    rightItems: MatchItem[];
    correctPairs: Record<string, string>;
}

// Initial 2 active match sets for Stage 1
export const STAGE_1_ACTIVE_SETS: MatchSet[] = [
    {
        id: "match-1",
        title: "CPU Core Components & Functions",
        leftItems: [
            { id: "l1", text: "1. Arithmetic Logic Unit (ALU)" },
            { id: "l2", text: "2. Control Unit (Control Unit)" },
            { id: "l3", text: "3. Program Counter (PC)" },
            { id: "l4", text: "4. Registers (Registers)" },
        ],
        rightItems: [
            { id: "r_distractor", text: "E. System software that compiles high-level language into machine code (Distractor)" },
            { id: "r1", text: "A. Holds the memory address of the instruction currently being executed" },
            { id: "r2", text: "B. Performs arithmetic addition, subtraction, and logic operations" },
            { id: "r3", text: "C. Directs datapath, memory, and I/O devices to work collaboratively" },
            { id: "r4", text: "D. Ultra-fast storage inside processor for temporary operands and results" },
        ],
        correctPairs: { l1: "r2", l2: "r3", l3: "r1", l4: "r4" },
    },
    {
        id: "match-2",
        title: "Processor Underlying Support & Interface",
        leftItems: [
            { id: "l1", text: "1. Clock (Clock)" },
            { id: "l2", text: "2. Instruction Decoder (Decoder)" },
            { id: "l3", text: "3. Bus Interface Unit (BIU)" },
            { id: "l4", text: "4. Datapath (Datapath)" },
        ],
        rightItems: [
            { id: "r1", text: "A. Provides synchronous clock ticks to coordinate hardware components" },
            { id: "r2", text: "B. Parses binary instruction encoding to generate control signals" },
            { id: "r_distractor", text: "E. Responsible for graphic rendering acceleration for web browsers (Distractor)" },
            { id: "r3", text: "C. Manages data transmission between CPU core and external bus/memory" },
            { id: "r4", text: "D. Contains ALU and registers, handles data processing and computation" },
        ],
        correctPairs: { l1: "r1", l2: "r2", l3: "r3", l4: "r4" },
    },
];

// Backup question bank sets for retry/fail fallback
export const STAGE_1_BANK_SETS: MatchSet[] = [
    {
        id: "match-bank-1",
        title: "Five Classic Computer Components Instances (Backup)",
        leftItems: [
            { id: "l1", text: "1. Input Device (Input Device)" },
            { id: "l2", text: "2. Output Device (Output Device)" },
            { id: "l3", text: "3. Memory (Memory)" },
            { id: "l4", text: "4. Processor (Processor)" },
        ],
        rightItems: [
            { id: "r1", text: "A. Keyboards and mice providing information to the computer" },
            { id: "r_distractor", text: "E. Hard disk platters used for storing operating system images (Distractor)" },
            { id: "r2", text: "B. Monitors and printers displaying computation results to users" },
            { id: "r3", text: "C. DRAM chip groups holding currently running programs and data" },
            { id: "r4", text: "D. Core chip (CPU) executing instruction computation and system control" },
        ],
        correctPairs: { l1: "r1", l2: "r2", l3: "r3", l4: "r4" },
    },
    {
        id: "match-bank-2",
        title: "CPU Performance Metrics Matching (Backup)",
        leftItems: [
            { id: "l1", text: "1. Clock Speed (Clock Speed)" },
            { id: "l2", text: "2. Core Count (Cores)" },
            { id: "l3", text: "3. Thread Count (Threads)" },
            { id: "l4", text: "4. Thermal Design Power (TDP)" },
        ],
        rightItems: [
            { id: "r1", text: "A. Represents CPU 'brain' count; higher count enables stronger multitasking" },
            { id: "r2", text: "B. Represents working clock frequency, like brain rotation speed (GHz)" },
            { id: "r3", text: "C. Assigns helpers to each brain to work concurrently and boost efficiency" },
            { id: "r4", text: "D. Determines CPU heat dissipation size for choosing compatible coolers" },
            { id: "r_distractor", text: "E. Determines display maximum resolution and color vibrancy (Distractor)" },
        ],
        correctPairs: { l1: "r2", l2: "r1", l3: "r3", l4: "r4" },
    },
];

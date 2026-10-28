import type { StageBank } from "@/data/bank/types";

/**
 * Stage 1 · KNOW CPU
 *
 * Source: Stage1_Question_Bank_EN.docx (team), with these changes:
 * - Cache questions added (s1-mc-08, s1-mc-10, s1-mc-11), marked draft: true.
 * - Docx Q8, Q9, Q10 (too simple or duplicated) are not used.
 * - Docx Q12 (FPU) and Match Set 4 (clock speed, cores, threads, TDP) are not used:
 *   they are outside the eight Stage 1 parts. They stay in the docx.
 * - Docx Q7 moved to the spare group so that a Cache question is in the required round.
 * - Q11: two input/output distractors replaced by Registers and Cache.
 *
 * Required: 8 multiple choice, 2 matching sets. Spare: 3 multiple choice, 1 matching set.
 */
export const STAGE_1_BANK: StageBank = {
    stageId: 1,

    reading:
        "The processor has two main sides: the datapath, which works on data, and the control, which directs the work. The Control Unit directs the other parts, and the Instruction Decoder turns each instruction’s binary code into control signals. The ALU performs arithmetic and logic operations. Registers are tiny, very fast storage for the values being used right now, and the Program Counter holds the address of the next instruction. A cache is a small, fast memory between the CPU and main memory that keeps copies of frequently used data. The Clock sets the pace, and the Bus Interface Unit moves data between the CPU and memory.",
    readingDraft: true,

    mc: [
        // ---------- Required (8) ----------
        // ---------- Missions: "What's broken?" (4 required, 1 spare) ----------
        {
            id: "s1-ms-01",
            group: "mission",
            concept: "ALU",
            scenario:
                "An ADD instruction runs, but no sum is ever produced. Which part is missing or failing?",
            choices: [
                "Bus Interface Unit",
                "ALU",
                "Control Unit",
                "Clock",
                "Registers",
            ],
            correctIndex: 1,
            hint: "Think about which part computes, as opposed to storing or directing.",
            explanation:
                "The ALU performs the arithmetic. Without it the instruction is fetched and decoded, but nothing computes the sum.",
            draft: true,
        },
        {
            id: "s1-ms-02",
            group: "mission",
            concept: "Program Counter",
            scenario:
                "The CPU keeps running the same instruction over and over. Which part is missing or failing?",
            choices: [
                "ALU",
                "Clock",
                "Cache",
                "Program Counter",
                "Instruction Decoder",
            ],
            correctIndex: 3,
            hint: "After each instruction, something must point to the next one. Which part holds that address?",
            explanation:
                "The Program Counter holds the address of the next instruction and moves on after each one. If it never advances, the same instruction is fetched again and again.",
            draft: true,
        },
        {
            id: "s1-ms-03",
            group: "mission",
            concept: "Instruction Decoder",
            scenario:
                "An instruction arrives, but the CPU cannot tell whether it means add, load or store. Which part is missing or failing?",
            choices: [
                "ALU",
                "Registers",
                "Instruction Decoder",
                "Bus Interface Unit",
                "Clock",
            ],
            correctIndex: 2,
            hint: "The instruction is just a pattern of bits. Which part works out what that pattern asks for?",
            explanation:
                "The Instruction Decoder reads the bits of an instruction and works out which operation it asks for and which operands it uses.",
            draft: true,
        },
        {
            id: "s1-ms-04",
            group: "mission",
            concept: "Bus Interface Unit",
            scenario:
                "The CPU cannot fetch instructions or data from main memory. Which part is missing or failing?",
            choices: [
                "Control Unit",
                "ALU",
                "Registers",
                "Program Counter",
                "Bus Interface Unit",
            ],
            correctIndex: 4,
            hint: "Which part is the CPU's connection to everything outside the chip?",
            explanation:
                "The Bus Interface Unit connects the CPU to main memory and to input/output through the buses.",
            draft: true,
        },
        {
            // spare mission, only drawn after a failed round
            id: "s1-ms-05",
            group: "mission",
            spare: true,
            concept: "Clock",
            scenario:
                "All parts work, but they act out of step with each other. Which part is missing or failing?",
            choices: [
                "Clock",
                "Registers",
                "Cache",
                "ALU",
                "Instruction Decoder",
            ],
            correctIndex: 0,
            hint: "Think of a drummer keeping the beat. Which part sets the rhythm for every step?",
            explanation:
                "The Clock sends regular timing pulses so that every step happens in rhythm.",
            draft: true,
        },
        {
            // docx Q1
            id: "s1-mc-01",
            concept: "Datapath and control",
            scenario:
                "In a computer, the core functions of the processor (CPU) are usually divided into which two main parts?",
            choices: [
                "Input and output",
                "Datapath and control",
                "Memory and peripherals",
                "Registers and cache",
                "Decoder and counter",
            ],
            correctIndex: 1,
            hint: "Think of the processor as having a “doing” side and a “managing” side. One part works on the data; the other decides what work happens and when.",
            explanation:
                "The processor is divided into the datapath, which performs operations on data, and the control, which directs the datapath, memory, and I/O according to the program’s instructions.",
            draft: true,
        },
        {
            // docx Q2
            id: "s1-mc-02",
            concept: "Instruction Decoder",
            scenario:
                "Which processor component identifies and interprets a machine instruction fetched from memory or the instruction cache, in order to determine which operation it specifies?",
            choices: [
                "Arithmetic Logic Unit",
                "Instruction Decoder",
                "Register file",
                "Floating-point unit",
                "Bus controller",
            ],
            correctIndex: 1,
            hint: "An instruction arrives as a pattern of 0s and 1s. Which component turns that pattern into “what should be done”?",
            explanation:
                "The Instruction Decoder interprets the binary encoding of an instruction and produces the control signals for the operation it specifies.",
            draft: true,
        },
        {
            // docx Q3
            id: "s1-mc-03",
            concept: "Clock",
            scenario:
                "In a computer system, what is the source of the synchronizing timing signal that coordinates the pace of all operations inside the processor?",
            choices: [
                "Decoder",
                "Arithmetic Logic Unit (ALU)",
                "Clock",
                "Bus",
                "Counter",
            ],
            correctIndex: 2,
            hint: "Picture a drummer keeping the beat for a band. Which component plays that role for the CPU?",
            explanation:
                "The clock provides the synchronizing timing signal that sets the pace of all operations inside the processor.",
            draft: true,
        },
        {
            // docx Q4
            id: "s1-mc-04",
            concept: "Control Unit",
            scenario:
                "Among the five classic components of a computer, which one directs the datapath, memory, and input/output devices to work together according to the program’s instructions?",
            choices: [
                "Arithmetic Logic Unit (ALU)",
                "Control Unit",
                "Cache",
                "Bus Interface Unit",
                "Program Counter (PC)",
            ],
            correctIndex: 1,
            hint: "Think of an orchestra conductor: it plays no instrument, but tells everyone else what to do and when. Which component fits that job?",
            explanation:
                "The Control Unit directs the datapath, memory, and I/O devices according to the instructions of the program. It does not process the data itself.",
            draft: true,
        },
        {
            // docx Q5 (fixed in the docx: option C is the ALU only)
            id: "s1-mc-05",
            concept: "ALU",
            scenario:
                "Which core processor component performs arithmetic operations (such as addition and subtraction) and logical operations (such as AND and OR)?",
            choices: [
                "Control Unit",
                "Program Counter (PC)",
                "Arithmetic Logic Unit (ALU)",
                "Register file",
                "Cache",
            ],
            correctIndex: 2,
            hint: "Re-read the two kinds of operations in the question. One of the options is named after exactly those two things.",
            explanation:
                "The ALU performs arithmetic operations (add, subtract) and logical operations (AND, OR). The datapath is larger: it contains the ALU and the registers.",
            draft: true,
        },
        {
            // docx Q6 (reworded in the docx)
            id: "s1-mc-06",
            concept: "Registers",
            scenario:
                "Which very fast, small-capacity storage units inside the processor hold the data currently being processed?",
            choices: [
                "Main memory (DRAM)",
                "Registers",
                "Hard disk",
                "Flash memory",
                "Video memory (VRAM)",
            ],
            correctIndex: 1,
            hint: "Think about speed and size together: which storage sits so close to the processor’s core that it is the fastest, and also the smallest?",
            explanation:
                "Registers are very fast, small storage locations inside the processor. They hold the operands and results the processor is working on right now.",
            draft: true,
        },
        {
            // docx Q11 (reworded in the docx; two distractors replaced)
            id: "s1-mc-07",
            concept: "ALU",
            scenario:
                "Which CPU component performs comparisons, such as checking whether a student’s mark is greater than or equal to a required passing value?",
            choices: ["ALU", "Registers", "Cache", "Printer", "Control Unit"],
            correctIndex: 0,
            hint: "Checking “greater than or equal to” is a decision made from math. Which component does math and logic, rather than directing others or showing results?",
            explanation:
                "The ALU performs logical operations, including comparisons. The Control Unit directs which operation runs, but it does not do the comparison itself.",
            draft: true,
        },
        {
            // New (AI-drafted): Cache in the required round
            id: "s1-mc-08",
            concept: "Cache",
            scenario:
                "The CPU keeps asking main memory (DRAM) for the same data again and again, and every trip to main memory is slow. Which component is designed to reduce these slow trips?",
            choices: [
                "Cache",
                "Clock",
                "Instruction Decoder",
                "Program Counter",
                "ALU",
            ],
            correctIndex: 0,
            hint: "Think of keeping the books you use most on your desk instead of walking to the library every time.",
            explanation:
                "A cache is a small, fast memory between the CPU and main memory. It keeps copies of frequently used data, so repeated accesses avoid the slow trip to DRAM.",
            draft: true,
        },

        // ---------- Spare (3) ----------
        {
            // docx Q7 (reworded in the docx: Computer Organization and Design abstraction)
            id: "s1-mc-09",
            concept: "Five classic components",
            scenario:
                "In the classic Computer Organization and Design abstraction, which of the following lists the five classic components of computer hardware?",
            choices: [
                "Input, output, memory, datapath, control",
                "CPU, GPU, memory, hard disk, network card",
                "Arithmetic unit, logic unit, registers, cache, bus",
                "Motherboard, power supply, fan, optical drive, monitor",
                "Compiler, operating system, assembler, application software, hardware",
            ],
            correctIndex: 0,
            hint: "Follow the whole journey of information: it goes in, it is stored, it is worked on (by a part that computes and a part that directs), and it comes out. Rule out options that are software or physical accessories.",
            explanation:
                "The five classic components are input, output, memory, datapath, and control. The datapath and the control together make up the processor.",
            spare: true,
            draft: true,
        },
        {
            // New (AI-drafted)
            id: "s1-mc-10",
            concept: "Cache",
            scenario: "Compared with main memory (DRAM), a cache is generally:",
            choices: [
                "Smaller and faster",
                "Larger and slower",
                "Larger and faster",
                "Smaller and slower",
                "The same size and speed",
            ],
            correctIndex: 0,
            hint: "If a memory could be both large and fast at a low cost, why would computers still need main memory at all?",
            explanation:
                "A cache is much smaller than main memory but much faster. Fast memory costs more per byte, so only a small amount is placed close to the CPU.",
            spare: true,
            draft: true,
        },
        {
            // New (AI-drafted)
            id: "s1-mc-11",
            concept: "Cache",
            scenario:
                "A program loops over the same small set of data many times. Why does a cache help this program run faster?",
            choices: [
                "Repeated accesses can be served from the fast cache instead of slow main memory",
                "It makes the clock tick faster",
                "It lets the ALU skip arithmetic operations",
                "It keeps the program stored when the power is off",
                "It replaces the registers inside the CPU",
            ],
            correctIndex: 0,
            hint: "Which is quicker to reach: something kept nearby or something far away? What happens the second time you need the same item?",
            explanation:
                "The first access copies the data into the cache. Later accesses to the same data are served from the cache, which is much faster than main memory.",
            spare: true,
            draft: true,
        },
    ],

    matching: [
        // ---------- Required (2) ----------
        {
            // docx Match Set 1 (description of the PC fixed in the docx)
            id: "s1-match-01",
            concepts: ["ALU", "Control Unit", "Program Counter", "Registers"],
            pairs: [
                {
                    item: "Arithmetic Logic Unit (ALU)",
                    description:
                        "Performs arithmetic (addition, subtraction) and logical (AND, OR) operations",
                },
                {
                    item: "Control Unit",
                    description: "Directs the datapath, memory, and I/O to work together",
                },
                {
                    item: "Program Counter (PC)",
                    description:
                        "Holds the memory address of the next instruction to be executed",
                },
                {
                    item: "Registers",
                    description:
                        "Extremely fast storage inside the processor for temporarily holding operands and intermediate results",
                },
            ],
            distractor:
                "System software that compiles high-level languages into machine code",
            hint: "Match the surest pair first: only one item does math and logic. Then, for the PC, think of a bookmark that always points to where you will read next.",
        },
        {
            // docx Match Set 2
            id: "s1-match-02",
            concepts: ["Clock", "Instruction Decoder", "Bus Interface Unit", "Datapath"],
            pairs: [
                {
                    item: "Clock",
                    description:
                        "Provides synchronizing timing signals that coordinate the hardware components",
                },
                {
                    item: "Instruction Decoder",
                    description:
                        "Interprets the binary encoding of an instruction to produce the corresponding control signals",
                },
                {
                    item: "Bus Interface Unit (BIU)",
                    description:
                        "Manages data transfer between the CPU core and the external bus / memory",
                },
                {
                    item: "Datapath",
                    description:
                        "Contains the ALU and registers and carries out the actual data processing and computation",
                },
            ],
            distractor: "Accelerates graphics rendering for web browsers",
            hint: "Start with the item about timing, like a metronome. For the rest, ask which one translates, which one connects to the outside world, and which one is the working area that contains other parts.",
        },

        // ---------- Spare (1) ----------
        {
            // docx Match Set 3 (distractor replaced in the docx)
            id: "s1-match-03",
            concepts: ["Input device", "Output device", "Memory", "Processor"],
            pairs: [
                {
                    item: "Input device",
                    description:
                        "Devices such as a keyboard or mouse that give information to the computer",
                },
                {
                    item: "Output device",
                    description:
                        "Devices such as a monitor or printer that show results to the user",
                },
                {
                    item: "Memory",
                    description:
                        "The DRAM chips that hold the currently running programs and the data they need",
                },
                {
                    item: "Processor",
                    description:
                        "The core chip (CPU) that executes instructions and controls the system",
                },
            ],
            distractor:
                "An operating system that manages files and running programs",
            hint: "For each item, ask: does it bring information in, show results out, hold what is running right now, or do the thinking? One description fits none of them.",
            spare: true,
        },
    ],

    // The first bonus question is always this one (docx OE5).
    openFirst: {
        id: "s1-oe-05",
        prompt:
            "Look at the CPU diagram. Choose ANY THREE parts from the diagram and briefly explain what each one does in your own words.",
        fullAt: 3,
        halfAt: 2,
        groups: [
            {
                label: "ALU",
                terms: [["alu", "arithmetic logic unit"]],
                near: ["add", "subtract", "math", "logic", "compare"],
            },
            {
                label: "Control Unit",
                terms: [["cu", "control unit"]],
                near: ["signal", "signals", "direct", "directs", "coordinate", "coordinates"],
            },
            {
                label: "Program Counter",
                terms: [["pc", "program counter"]],
                near: ["next instruction", "address"],
            },
            {
                label: "Instruction Decoder",
                terms: [["decoder", "instruction decoder"]],
                near: ["interpret", "interprets", "translate", "translates", "machine code"],
            },
            {
                label: "Registers",
                terms: [["register", "registers"]],
                near: ["temporary", "temporarily", "hold", "holds", "fast storage"],
            },
            {
                label: "Cache",
                terms: [["cache"]],
                near: ["frequently used", "often used", "commonly used", "faster than memory"],
            },
            {
                label: "Clock",
                terms: [["clock"]],
                near: ["synchronize", "synchronizes", "timing", "rhythm"],
            },
            {
                label: "Bus Interface Unit",
                terms: [["biu", "bus interface unit", "bus interface"]],
                near: ["connect", "connects", "memory", "bus", "transfer", "transfers"],
            },
        ],
        explanation:
            "Any three of these: the ALU does arithmetic and logic; the Control Unit directs the other parts with control signals; the Program Counter holds the address of the next instruction; the Instruction Decoder interprets the binary instruction; Registers hold data temporarily in fast storage; the Cache keeps frequently used data close to the CPU; the Clock synchronizes timing; the Bus Interface Unit transfers data between the CPU and memory.",
        draft: true,
    },

    // The second bonus question is drawn at random from this pool (docx OE1 to OE4).
    openPool: [
        {
            id: "s1-oe-01",
            prompt:
                "Briefly list the five classic components of a computer. Then explain what the processor’s two core sub-components, the datapath and the control, are each responsible for.",
            fullAt: 3,
            halfAt: 2,
            groups: [
                {
                    label: "Five components (at least 4 of 5)",
                    terms: [
                        ["input"],
                        ["output"],
                        ["memory"],
                        ["datapath"],
                        ["control"],
                    ],
                    need: 4,
                },
                {
                    label: "Datapath role",
                    terms: [["datapath"]],
                    near: ["arithmetic", "calculate", "process", "operations", "alu", "registers"],
                },
                {
                    label: "Control role",
                    terms: [["control"]],
                    near: ["direct", "coordinate", "command", "signals", "manage"],
                },
            ],
            explanation:
                "The five classic components are input, output, memory, datapath, and control. The datapath performs the arithmetic and processes the data. The control directs and coordinates the datapath, memory, and I/O according to the instructions.",
            draft: true,
        },
        {
            id: "s1-oe-02",
            prompt:
                "What does ALU stand for, and what two kinds of operations does it perform?",
            fullAt: 3,
            halfAt: 2,
            consumeFirstGroup: true,
            groups: [
                {
                    label: "Full name",
                    terms: [["arithmetic logic unit", "arithmetic-logic unit"]],
                },
                {
                    label: "Arithmetic function",
                    terms: [
                        [
                            "arithmetic",
                            "math",
                            "addition",
                            "subtraction",
                            "calculation",
                        ],
                    ],
                },
                {
                    label: "Logic function",
                    terms: [
                        [
                            "logic",
                            "logical",
                            "boolean",
                            "compare",
                            "comparison",
                            "comparing",
                            "and gate",
                            "or gate",
                            "not gate",
                            "and operation",
                            "or operation",
                            "and/or",
                        ],
                    ],
                },
            ],
            explanation:
                "ALU stands for Arithmetic Logic Unit. It performs arithmetic operations such as addition and subtraction, and logical operations such as AND, OR, and comparisons.",
            draft: true,
        },
        {
            id: "s1-oe-03",
            prompt: "Explain the role of the Control Unit (CU) in the CPU.",
            fullAt: 3,
            halfAt: 2,
            groups: [
                {
                    label: "Directs instruction fetch and decoding",
                    terms: [
                        [
                            "fetch",
                            "fetches",
                            "fetching",
                            "decode",
                            "decodes",
                            "decoding",
                        ],
                    ],
                },
                {
                    label: "Sends control signals and coordinates the other parts",
                    terms: [
                        [
                            "control signal",
                            "control signals",
                            "signal",
                            "signals",
                            "direct",
                            "directs",
                            "coordinate",
                            "coordinates",
                            "manage",
                            "manages",
                            "orchestrate",
                            "orchestrates",
                            "command",
                            "commands",
                        ],
                    ],
                },
                {
                    label: "Controls the timing of data movement",
                    terms: [
                        [
                            "data flow",
                            "timing",
                            "clock",
                            "sequence",
                            "flow",
                        ],
                    ],
                },
            ],
            explanation:
                "The Control Unit directs instruction fetch and decoding, sends control signals to the ALU, registers, and bus, and works with the clock so that data moves between the parts in the right order and at the right time.",
            draft: true,
        },
        {
            id: "s1-oe-04",
            prompt:
                "People often say the CPU is the “brain” of a computer. Based on what you read, which part inside the CPU acts like the brain’s “calculating” part, which part acts like its “short-term memory”, and which part acts like the “manager” that coordinates everything?",
            fullAt: 3,
            halfAt: 2,
            groups: [
                {
                    label: "Calculating part: ALU",
                    terms: [["alu", "arithmetic logic unit"]],
                },
                {
                    label: "Short-term memory: Registers or Cache",
                    terms: [["register", "registers", "cache"]],
                },
                {
                    label: "Manager: Control Unit",
                    terms: [["control unit", "cu"]],
                },
            ],
            explanation:
                "The ALU is the calculating part, the registers (and cache) act like short-term memory for data in use, and the Control Unit is the manager that directs the other parts.",
            draft: true,
        },
    ],
};
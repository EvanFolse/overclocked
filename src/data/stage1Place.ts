export interface CpuSlot {
    id: string;
    name: string;
    description: string;
    correctIndex: number; 
}

export const STAGE_1_SLOTS: CpuSlot[] = [
    {
        id: "clock",
        name: "Clock",
        description: "Sends regular timing pulses to every step.",
        correctIndex: 0,
    },
    {
        id: "cu",
        name: "Control Unit",
        description: "Directs the other parts.",
        correctIndex: 1,
    },
    {
        id: "decoder",
        name: "Instruction Decoder",
        description: "Decodes binary instructions into control signals.",
        correctIndex: 2,
    },
    {
        id: "pc",
        name: "Program Counter",
        description: "Holds the address of the next instruction.",
        correctIndex: 3,
    },
    {
        id: "regs",
        name: "Registers",
        description: "Tiny, ultra-fast storage inside the CPU.",
        correctIndex: 4,
    },
    {
        id: "alu",
        name: "ALU",
        description: "Performs arithmetic and logic operations.",
        correctIndex: 5,
    },
    {
        id: "cache",
        name: "Cache",
        description: "Keeps recently used data close to the CPU.",
        correctIndex: 6,
    },
    {
        id: "biu",
        name: "Bus Interface Unit",
        description: "Connects the CPU to main memory and I/O.",
        correctIndex: 7,
    },
];

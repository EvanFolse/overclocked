export interface CpuPart {
    id: string;
    name: string;
    description: string;
    correctIndex: number; // 0 to 7 mapping to the 2x4 grid slots
}

export const STAGE_1_PARTS: CpuPart[] = [
    { id: "clock", name: "Clock", description: "Provides synchronous clock ticks to coordinate hardware components.", correctIndex: 0 },
    { id: "cu", name: "Control Unit", description: "Directs datapath, memory, and I/O devices to work collaboratively.", correctIndex: 1 },
    { id: "decoder", name: "Instruction Decoder", description: "Decodes binary instructions into control signals.", correctIndex: 2 },
    { id: "pc", name: "Program Counter", description: "Holds the memory address of the instruction currently being executed.", correctIndex: 3 },
    { id: "registers", name: "Registers", description: "Ultra-fast storage inside processor for temporary operands and results.", correctIndex: 4 },
    { id: "alu", name: "ALU", description: "Performs arithmetic addition, subtraction, and logic operations.", correctIndex: 5 },
    { id: "cache", name: "Cache", description: "High-speed small memory close to cores for fast data access.", correctIndex: 6 },
    { id: "biu", name: "Bus Interface Unit", description: "Manages data transmission between CPU core and external bus/memory.", correctIndex: 7 },
];

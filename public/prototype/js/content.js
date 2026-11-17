// =====================================================
// DATA: the parts of the CPU
// slot = [column, row, width, depth] on an 8 x 8 grid
// =====================================================
var PARTS = [
  { key: "cu", name: "Control Unit (CU)", short: "CU", color: "#7c5cff", stage: 1, cost: 120, cps: 2, slot: [2, 0, 3, 1],
    desc: "The director of the processor.",
    levels: ["Hardwired control", "Microcoded control", "Pipelined control paths", "Out-of-order control", "Speculative control"],
    what: "Reads each instruction and sends signals telling the other parts what to do and when.",
    analogy: "Like a conductor in an orchestra. It plays no instrument, but nothing happens in the right order without it." },
  { key: "alu", name: "Arithmetic Logic Unit (ALU)", short: "ALU", color: "#ff6b6b", stage: 1, cost: 180, cps: 3, slot: [2, 1, 3, 2],
    desc: "Performs arithmetic and logical operations.",
    levels: ["4-bit ALU", "8-bit ALU", "16-bit ALU + flags", "32-bit ALU", "64-bit ALU + SIMD"],
    what: "Does the math (add, subtract) and the logic (AND, OR, compare) on binary numbers.",
    analogy: "Like the calculator on your desk. You give it two numbers and an operation, and it hands back the answer." },
  { key: "regs", name: "Registers", short: "REG", color: "#3aa0ff", stage: 1, cost: 260, cps: 4, slot: [0, 1, 2, 2],
    desc: "Tiny, ultra-fast storage inside the CPU.",
    levels: ["4 registers", "8 registers", "Small general-purpose register file", "x86-like register file", "Register renaming"],
    what: "A handful of named storage slots that hold the numbers the CPU is using right now.",
    analogy: "Like sticky notes on your monitor. There are only a few, but they are instantly in view, unlike the filing cabinet (RAM) across the room." },
  { key: "clock", name: "Clock", short: "CLK", color: "#ffb020", stage: 2, cost: 150, cps: 3, slot: [0, 0, 2, 1],
    desc: "Sets the beat that keeps every part in step.",
    levels: ["5 MHz clock", "33 MHz clock", "200 MHz clock", "1.5 GHz clock", "4.5 GHz boost clock"],
    what: "Sends a steady pulse. On each tick every part of the CPU takes one step, so a faster clock means more steps per second.",
    analogy: "Like the drummer in a rowing boat. Everyone pulls their oar on the beat." },
  { key: "pipe", name: "Pipeline", short: "PIPE", color: "#ff8a3d", stage: 2, cost: 600, cps: 8, slot: [0, 3, 8, 1],
    desc: "Overlaps instructions so no part sits idle.",
    levels: ["2-stage pipeline", "5-stage pipeline", "Superscalar (2 per tick)", "Deep pipeline (14 stages)", "Wide superscalar (4+ per tick)"],
    what: "Splits each instruction into stages so several instructions are in progress at the same time.",
    analogy: "Like doing laundry. While load 1 is in the dryer, load 2 is already in the washer." },
  { key: "decoder", name: "Instruction Decoder", short: "DEC", color: "#14b8a6", stage: 3, cost: 900, cps: 10, slot: [5, 0, 3, 1],
    desc: "Turns instruction bits into control signals.",
    levels: ["Fixed instruction set", "Richer instruction set", "Variable-length decode", "Micro-op translation", "Wide decode (4+ per tick)"],
    what: "Takes the binary instruction and works out which operation and which registers it means.",
    analogy: "Like a translator who turns a sentence in machine language into steps the other parts can follow." },
  { key: "l1", name: "L1 Cache", short: "L1", color: "#22c55e", stage: 4, cost: 1500, cps: 16, slot: [0, 4, 4, 2],
    desc: "Smallest, fastest memory next to the core.",
    levels: ["1 KB cache", "4 KB cache", "16 KB split cache", "32 KB, 8-way cache", "64 KB, low-latency cache"],
    what: "Keeps recently used data right beside the CPU so it does not wait for slow RAM.",
    analogy: "Like keeping your textbook open on your desk instead of walking to the library every time." },
  { key: "l2", name: "L2 Cache", short: "L2", color: "#84cc16", stage: 4, cost: 2800, cps: 26, slot: [0, 6, 8, 2],
    desc: "Bigger, slightly slower backup cache.",
    levels: ["16 KB L2", "64 KB L2", "256 KB L2", "1 MB L2", "4 MB L2"],
    what: "A larger cache that catches what L1 misses, so there are fewer trips all the way to RAM.",
    analogy: "Like the bookshelf in your room. Bigger than your desk, but still much closer than the library." },
  { key: "fpu", name: "Floating-Point Unit (FPU)", short: "FPU", color: "#ec4899", stage: 5, cost: 5000, cps: 40, slot: [5, 1, 3, 2],
    desc: "Fast math on decimal numbers.",
    levels: ["Software floating point", "Basic FPU", "Pipelined FPU", "SIMD vector FPU", "Wide vector FPU"],
    what: "Handles numbers with decimal points (like 3.14159) that whole-number hardware is slow at. FLOPS counts how many of these a CPU does per second.",
    analogy: "Like a calculator that has a decimal key. The plain ALU is the one that only knows whole numbers." },
  { key: "cores", name: "Multi-core", short: "CORES", color: "#06b6d4", stage: 5, cost: 9000, cps: 70, slot: [4, 4, 4, 2],
    desc: "More cores means more work at once.",
    levels: ["Single core", "Dual core", "Quad core", "8 cores", "16 cores"],
    what: "Several complete CPU cores on one chip, each running its own instructions at the same time.",
    analogy: "Like opening more checkout lanes at a store. More customers get served at once, as long as there are enough customers." }
];

var PART = {};
for (var pi = 0; pi < PARTS.length; pi++) {
  PART[PARTS[pi].key] = PARTS[pi];
}

var TAGS = ["STAGE 1 · BASIC CPU", "STAGE 2 · THE CPU IN MOTION", "STAGE 3 · SPEAKING CPU", "STAGE 4 · MEMORY HIERARCHY", "STAGE 5 · BEYOND THE CPU"];

// =====================================================
// DATA: the 5 stages (each stage = parts you build by beating minigames)
// =====================================================
var STAGES = [
  { name: "KNOW CPU", blurb: "Meet the three core parts. Beat each minigame to build them.", parts: ["cu", "alu", "regs"] },
  { name: "The CPU in Motion", blurb: "Make the chip tick and keep instructions flowing.", parts: ["clock", "pipe"] },
  { name: "Speaking CPU", blurb: "Instructions are just bits. Learn to read and write them.", parts: ["decoder"] },
  { name: "The Memory Hierarchy", blurb: "Keep the right data in the right place.", parts: ["l1", "l2"] },
  { name: "Beyond the CPU", blurb: "Decimals and teamwork: FPUs and multiple cores.", parts: ["fpu", "cores"] }
];


// content.js: DATA: PARTS, STAGES, FAULTS, CONFUSIONS, BOT_DARES
// ---------------------------------------------------------
var PARTS = [
    { key: "cu", name: "Control Unit (CU)", short: "CU", color: "#7c5cff", stage: 1, cost: 120, cps: 2, slot: [2, 0, 3, 1], desc: "Directs signals & sequence.", levels: ["Hardwired", "Microcoded", "Pipelined Ctrl", "Out-of-Order", "Speculative"], demoText: "📡 CU fires signals to DEC → REG → ALU!", demoSteps: ["cu", "decoder", "regs", "alu"], what: "Sends control signals telling every part what to do and when.", analogy: "Orchestra conductor." },
    { key: "alu", name: "Arithmetic Logic Unit (ALU)", short: "ALU", color: "#ff6b6b", stage: 1, cost: 180, cps: 3, slot: [2, 1, 3, 2], desc: "Math (+, -) & logic (AND, OR).", levels: ["4-bit ALU", "8-bit ALU", "16-bit + flags", "32-bit RV32I", "64-bit RV64I"], demoText: "🧮 ALU computes: 0101 + 0011 = 1000 (8)", demoSteps: ["regs", "alu", "regs"], what: "Computes binary arithmetic & logic.", analogy: "Desk calculator." },
    { key: "regs", name: "Registers", short: "REG", color: "#3aa0ff", stage: 1, cost: 260, cps: 4, slot: [0, 1, 2, 2], desc: "Ultra-fast slots inside the core.", levels: ["4 regs", "8 regs", "16 regs", "32 RISC regs", "Reg Renaming"], demoText: "🗂️ REG holds active a, b, c right next to ALU!", demoSteps: ["regs", "alu"], what: "Holds active working numbers inside the CPU.", analogy: "Sticky notes on your monitor." },
    { key: "clock", name: "Clock", short: "CLK", color: "#ffb020", stage: 2, cost: 150, cps: 3, slot: [0, 0, 2, 1], desc: "Heartbeat that syncs all parts.", levels: ["5 MHz", "33 MHz", "200 MHz", "1.5 GHz", "4.5 GHz Boost"], demoText: "⏱️ CLK ticks: all units step in sync!", demoSteps: ["clock", "cu", "alu", "regs"], what: "Steady timing pulse keeping every unit in step.", analogy: "Rowing boat drummer." },
    { key: "pipe", name: "Pipeline", short: "PIPE", color: "#ff8a3d", stage: 2, cost: 600, cps: 8, slot: [0, 3, 8, 1], desc: "Overlaps IF-ID-EX-MEM-WB.", levels: ["2-stage", "5-stage RISC", "2-way Superscalar", "3-way Superscalar", "4-way Wide"], demoText: "🏭 PIPE overlaps 5 instructions at once!", demoSteps: ["cu", "regs", "alu", "pipe"], what: "Splits work into stages so instructions overlap.", analogy: "Washer + dryer assembly line." },
    { key: "decoder", name: "Instruction Decoder", short: "DEC", color: "#14b8a6", stage: 3, cost: 900, cps: 10, slot: [5, 0, 3, 1], desc: "Reads binary opcodes & regs.", levels: ["6-bit fixed", "Rich opcodes", "32-bit fixed", "Micro-op dec", "4-wide decode"], demoText: "🔐 DEC translates: [01 10 01] → SUB R2, R1!", demoSteps: ["decoder", "cu"], what: "Turns binary instruction bits into control signals.", analogy: "Bit-to-action translator." },
    { key: "l1", name: "L1 Cache", short: "L1", color: "#22c55e", stage: 4, cost: 1500, cps: 16, slot: [0, 4, 4, 2], desc: "Fastest SRAM beside the core.", levels: ["1 KB L1", "4 KB L1", "16 KB Split I/D", "32 KB 8-way", "64 KB Fast L1"], demoText: "⚡ L1 HIT = 1ns! (vs 🐢 RAM = 60ns)", demoSteps: ["l1", "regs"], what: "Keeps hot data 1 ns away from the core.", analogy: "Open textbook on your desk." },
    { key: "l2", name: "L2 Cache", short: "L2", color: "#84cc16", stage: 4, cost: 2800, cps: 26, slot: [0, 6, 8, 2], desc: "Larger backup cache before RAM.", levels: ["16 KB L2", "64 KB L2", "256 KB L2", "1 MB L2", "4 MB L2"], demoText: "🗄️ L2 catches L1 misses in ~4ns!", demoSteps: ["l2", "l1", "regs"], what: "Bigger backup cache that cuts slow RAM trips.", analogy: "Bookshelf beside your desk." },
    { key: "fpu", name: "Floating-Point Unit (FPU)", short: "FPU", color: "#ec4899", stage: 5, cost: 5000, cps: 40, slot: [5, 1, 3, 2], desc: "Fast decimal & vector math.", levels: ["32b Float", "64b Double", "Pipelined FPU", "FMA Unit", "SIMD Vector"], demoText: "🎯 FPU crunches: 3.14159 × 10²!", demoSteps: ["regs", "fpu", "regs"], what: "Computes decimal floating-point math quickly.", analogy: "Scientific calculator." },
    { key: "cores", name: "Multi-core", short: "CORES", color: "#06b6d4", stage: 5, cost: 9000, cps: 70, slot: [4, 4, 4, 2], desc: "Parallel cores on one chip.", levels: ["1 Core", "2 Cores", "4 Cores", "8 Cores", "16-Core SoC"], demoText: "🧩 CORES run 4 independent tasks simultaneously!", demoSteps: ["pipe", "cores", "l2"], what: "Multiple complete CPU cores working in parallel.", analogy: "Opening 4 checkout lanes." }
];
var PART = {}; for (var pi = 0; pi < PARTS.length; pi++) PART[PARTS[pi].key] = PARTS[pi];
var TAGS = ["STAGE 1 · BASIC CPU", "STAGE 2 · THE CPU IN MOTION", "STAGE 3 · SPEAKING CPU", "STAGE 4 · MEMORY HIERARCHY", "STAGE 5 · BEYOND THE CPU"];

var STAGES = [
    {
        name: "KNOW CPU", objTitle: "Obj 1 · Core Parts & Binary", model: "Model 1 · Core Tri-Unit", spec: "CU + ALU + REG", blurb: "Build the 3 core units: Control Unit, ALU & Registers.", parts: ["cu", "alu", "regs"],
        speech: "Let's snap the 3 core brain parts onto bare silicon!",
        beforeVis: "<div class='mono' style='font-size:18px'>🟫 Bare Die</div><small class='muted'>No math, no memory</small>",
        afterVis: "<div class='mono' style='font-size:15px'>🎛️CU + 🧮ALU + 🗂️REG</div><small style='color:#065f46'>Computes &amp; routes binary!</small>"
    },
    {
        name: "The CPU in Motion", objTitle: "Obj 2 · Clock & Pipeline", model: "Model 2 · Pipelined Core", spec: "+ Clock + 5-Stage Pipe", blurb: "Sync the clock beat and resolve real pipeline hazards.", parts: ["clock", "pipe"],
        speech: "Add a Clock & Pipeline so instructions overlap!",
        beforeVis: "<div class='mono' style='font-size:13px'>[Inst 1] ──▶ [Inst 2] 🐢</div><small class='muted'>1 instruction at a time</small>",
        afterVis: "<div class='mono' style='font-size:13px;color:#065f46'>IF|ID|EX|MEM|WB 🚀</div><small style='color:#065f46'>Up to 5 overlapped!</small>"
    },
    {
        name: "Speaking CPU", objTitle: "Obj 3 · Binary ISA & RISC/CISC", model: "Model 3 · Decoded ISA", spec: "+ Binary Decoder", blurb: "Decode instruction bits & pick RISC vs CISC silicon.", parts: ["decoder"],
        speech: "Turn raw 0s & 1s into CPU actions—and choose your ISA!",
        beforeVis: "<div class='mono' style='font-size:16px'>01 10 01 ❓</div><small class='muted'>Raw unreadable bits</small>",
        afterVis: "<div class='mono' style='font-size:15px;color:#065f46'>🔐 SUB R2, R1</div><small style='color:#065f46'>Decoded in 1 cycle!</small>"
    },
    {
        name: "The Memory Hierarchy", objTitle: "Obj 4 · Cache LRU & Tiers", model: "Model 4 · Cached Core", spec: "+ L1 & L2 SRAM", blurb: "Keep hot data 1ns away and beat the Memory Wall.", parts: ["l1", "l2"],
        speech: "RAM is 60× slower than the CPU—let's build L1 & L2 Caches!",
        beforeVis: "<div class='mono' style='font-size:13px'>CPU ── 60ns ──▶ RAM 🐢</div><small class='muted'>Stalls waiting on RAM</small>",
        afterVis: "<div class='mono' style='font-size:13px;color:#065f46'>CPU ─ 1ns ─▶ ⚡L1 ─▶ L2</div><small style='color:#065f46'>Hot data right beside core!</small>"
    },
    {
        name: "Beyond the CPU", objTitle: "Obj 5 · FPU, Cores & GPU/NPU", model: "Model 5 · Full Multi-Core SoC", spec: "+ FPU + Multi-Core", blurb: "Unlock decimals, parallel cores, and vector lanes.", parts: ["fpu", "cores"],
        speech: "Scale up with Floating-Point math & Multi-Core parallelism!",
        beforeVis: "<div class='mono' style='font-size:14px'>1 Core · Int only 🧱</div><small class='muted'>Draws 1 row at a time</small>",
        afterVis: "<div class='mono' style='font-size:14px;color:#065f46'>4 Cores + 🎯 FPU 🧩</div><small style='color:#065f46'>Draws 4 rows at once!</small>"
    }
];

var FAULTS = [
    { ans: "alu", need: "alu", cKey: "cu_vs_alu", symptom: "ADD R1, R2 runs, but no sum is produced!", why: "ALU performs math (+, -) and logic.", wrong: { cu: "CU only sends signals; it doesn't do math.", regs: "REG stores values; it can't add." } },
    { ans: "cu", need: "cu", cKey: "cu_vs_alu", symptom: "Parts have power, but nothing runs in sequence!", why: "CU directs control signals & order.", wrong: { alu: "ALU computes math, not order.", clock: "Clock sets the beat; CU sets the plan." } },
    { ans: "regs", need: "regs", cKey: "regs_vs_l1", symptom: "Operands vanish between steps without slow RAM!", why: "Registers hold active operands inside the core.", wrong: { l1: "L1 caches RAM blocks; active operands sit in REG.", alu: "ALU computes; it doesn't store operands." } },
    { ans: "clock", need: "clock", cKey: "cu_vs_clk", symptom: "Units fire out of step with each other!", why: "Clock provides the shared timing pulse.", wrong: { cu: "CU picks ops; Clock provides the beat." } },
    { ans: "decoder", need: "decoder", cKey: "dec_vs_cu", symptom: "Bits arrive, but CPU can't tell ADD from LOAD!", why: "Decoder translates opcode bits.", wrong: { cu: "Decoder parses opcode bits first." } },
    { ans: "l1", need: "l1", cKey: "regs_vs_l1", symptom: "Loop data keeps crawling slowly to RAM!", why: "L1 Cache keeps recent memory blocks beside the core.", wrong: { regs: "REG holds single operands; memory blocks live in L1." } }
];

var GOLDEN_RESCUES = [
    { key: "cu", badge: "🚦 UNITS OUT OF ORDER!", clue: "Click the TRAFFIC DIRECTOR", cKey: "cu_vs_alu" },
    { key: "alu", badge: "🧮 12 + 7 = ??? (OVERFLOW!)", clue: "Click the MATH & LOGIC UNIT", cKey: "alu_overflow" },
    { key: "regs", badge: "📝 OPERANDS LOST IN RAM!", clue: "Click the FAST SCRATCHPAD SLOTS", cKey: "regs_stall" },
    { key: "clock", badge: "⏱️ SIGNALS DRIFTING OUT OF SYNC!", clue: "Click the HEARTBEAT / CLOCK", cKey: "cu_vs_clk" },
    { key: "pipe", badge: "🏭 ONLY 1 INST AT A TIME!", clue: "Click the ASSEMBLY LINE", cKey: "pipe_fwd" },
    { key: "decoder", badge: "🔐 01 10 01 = ???", clue: "Click the BIT TRANSLATOR", cKey: "decoder_bits" },
    { key: "l1", badge: "🐢 RAM TOO SLOW (60ns)!", clue: "Click the 1ns FASTEST CACHE", cKey: "l1_lru" },
    { key: "l2", badge: "🗄️ L1 MISSED! NEED BACKUP!", clue: "Click the L2 BACKUP CACHE", cKey: "l2_tier" },
    { key: "fpu", badge: "🎯 3.14159 × 10² = ???", clue: "Click the DECIMAL MATH UNIT", cKey: "fpu_float" },
    { key: "cores", badge: "🧩 4 PARALLEL TASKS WAITING!", clue: "Click the MULTI-LANE ENGINE", cKey: "cores_serial" }
];

var CONFUSIONS = {
    cu_dispatch: { stage: 0, title: "ALU vs REG vs MEM", a: ["⚙️ ALU", "ADD / SUB / AND / CMP"], b: ["🗂️ REG / 📦 MEM", "MOV → REG · LOAD/STORE → MEM"], hint1: "Math → ALU · MOV → REG · LOAD/STORE → MEM", hint2: "Only LOAD/STORE touch Memory!" },
    alu_logic: { stage: 0, title: "AND / OR / XOR / ADD", a: ["AND / OR / XOR", "Bit-by-bit (no carry)"], b: ["ADD", "8-4-2-1 sum with carry"], hint1: "Check each 8-4-2-1 column!", hint2: "1+1 = 0 carry 1 in ADD!" },
    alu_overflow: { stage: 0, title: "4-Bit Overflow (OVF=16)", a: ["0..15", "OVF stays 0"], b: ["Sum ≥ 16", "Flip red OVF(16) ON!"], hint1: "4 bits max = 15! Light red OVF(16) if ≥ 16!", hint2: "Example: 19 = OVF(16) + 2 + 1." },
    regs_stall: { stage: 0, title: "Pre-load Registers", a: ["REG (R1-R4)", "Fast · holds active vars"], b: ["RAM (a-g)", "Slow · must load first"], hint1: "Put BOTH NOW vars into R1-R4!", hint2: "Pre-load the missing variable before timer ends." },
    clock_edge: { stage: 1, title: "Setup Window", a: ["Too Early", "Signals still settling"], b: ["Green Ring", "Safe latch window!"], hint1: "Wait for yellow dot inside green ring!", hint2: "Tap SPACE right inside the circle." },
    pipe_none: { stage: 1, title: "No Hazard vs RAW", a: ["Different Regs", "Run Normal (0 stalls)"], b: ["Same Reg Read", "RAW dependency"], hint1: "Check if next inst reads that output reg!", hint2: "No reg overlap → Run Normally!" },
    pipe_fwd: { stage: 1, title: "EX→EX Forward vs Stall", a: ["ADD/SUB → next", "Forward (0 stalls)"], b: ["LW → next", "Needs 1 Stall"], hint1: "ALU result is ready at EX → Forward!", hint2: "Use Forward (0 stalls) for ADD→SUB!" },
    pipe_loaduse: { stage: 1, title: "Load-Use (LW)", a: ["LW (Memory)", "Ready at END of MEM"], b: ["1-Cycle Stall", "Wait 1, then MEM→EX Fwd"], hint1: "LW finishes in MEM (C4) → Stall 1 cycle!", hint2: "Adjacent LW→ADD always stalls 1 cycle!" },
    pipe_sched: { stage: 1, title: "Compiler Scheduling", a: ["Adjacent LW→ADD", "Must stall 1"], b: ["Unrelated I2 in between", "0 extra stalls!"], hint1: "Unrelated I2 already filled the 1-cycle gap!", hint2: "I2 waited for LW → MEM→EX Forward!" },
    pipe_struct: { stage: 1, title: "Structural Hazard", a: ["1 Mem Port", "MEM & IF collide"], b: ["Fix", "Stall IF 1 cycle"], hint1: "Two stages want the 1 memory port!", hint2: "Structural collision → Stall 1 cycle." },
    pipe_branch: { stage: 1, title: "Control Hazard", a: ["Branch Taken", "Wrong PC+4 fetched"], b: ["Fix", "FLUSH wrong inst!"], hint1: "Taken branch fetched wrong path → Flush!", hint2: "Flush discards wrong-path PC+4." },
    decoder_bits: { stage: 2, title: "6-Bit Layout", a: ["[Purple 2b]", "OP (ADD/SUB/AND/OR)"], b: ["[Blue 2b][Green 2b]", "Reg 1 & Reg 2"], hint1: "Read 2-bit pairs left to right!", hint2: "00=0 · 01=1 · 10=2 · 11=3" },
    l1_lru: { stage: 3, title: "LRU Eviction", a: ["Green Bar (age 0)", "Just used · KEEP"], b: ["Red Bar (max age)", "Oldest · EVICT!"], hint1: "Kick out the REDDEST bar (highest age)!", hint2: "LRU = highest age number." },
    l2_tier: { stage: 3, title: "Memory Tiers", a: ["Tiny & Frequent", "REG / L1 / L2"], b: ["Huge & Rare", "RAM / SSD"], hint1: "Check Bytes/cycle vs GB/year!", hint2: "KB hot → L1/L2 · GB apps → RAM · Cold → SSD." },
    fpu_float: { stage: 4, title: "Exponent Shift", a: ["+ Exponent", "Float RIGHT (bigger)"], b: ["- Exponent", "Float LEFT (0.0xx)"], hint1: "+ moves right · − moves left!", hint2: "Negative exponent starts 0.0..." },
    cores_serial: { stage: 4, title: "Amdahl's Serial Lock", a: ["IMG/MAT/VEC", "Run in parallel"], b: ["🔒 SERIAL", "Needs ALL 4 cores idle"], hint1: "Wait for ALL 4 cores idle before SERIAL!", hint2: "Serial tasks block the whole chip." },
    cu_vs_alu: { stage: 0, title: "CU vs ALU", a: ["🎛️ CU", "Control & sequence"], b: ["🧮 ALU", "Math & logic"], hint1: "Math = ALU · Sequence = CU!", hint2: "CU directs; ALU calculates." },
    regs_vs_l1: { stage: 3, title: "REG vs L1 Cache", a: ["🗂️ REG", "Active operands"], b: ["⚡ L1 Cache", "Recent RAM blocks"], hint1: "Operands = REG · Slow RAM = L1!", hint2: "REG = registers · L1 = RAM cache." },
    cu_vs_clk: { stage: 1, title: "CU vs Clock", a: ["🎛️ CU", "WHAT to do"], b: ["⏱️ Clock", "WHEN to step"], hint1: "Out of sync timing = Clock!", hint2: "Clock gives the shared beat." },
    dec_vs_cu: { stage: 2, title: "Decoder vs CU", a: ["🔐 Decoder", "Reads opcode bits"], b: ["🎛️ CU", "Drives control wires"], hint1: "Can't tell ADD from LOAD = Decoder!", hint2: "Decoder parses instruction bits." }
};

var BOT_DARES = [
    { id: "combo5", text: "Hit a 5-Combo in any game", reward: 160, check: function (c) { return c.combo >= 5; } },
    { id: "fault1", text: "Fix a 3D Fault on 1st click", reward: 200, check: function (c) { return c.faultFirstTry; } },
    { id: "pipe3", text: "Score 80+ in Hazard Lab", reward: 260, check: function (c) { return c.game === "pipe" && c.score >= 80; } },
    { id: "l1_75", text: "Finish Cache Keeper ≥ 75% hits", reward: 300, check: function (c) { return c.game === "l1" && c.hitRate >= 75; } },
    { id: "stars3", text: "Earn 3 Stars on any part", reward: 350, check: function (c) { return c.stars === 3; } }
];

// 16x16 Pixel Art Rocket/Chip pattern for the Live Visual Render Test!
var PIXEL_ART = [
    ".......YY.......",
    "......YYYY......",
    ".....YYWWYY.....",
    ".....YWWWWY.....",
    "....BBWWWWBB....",
    "....BBCCCCBB....",
    "...BBBCCCCBBB...",
    "...BBBBBBBBBB...",
    "..RBBBBBBBBBBQ..",
    "..RBBGGGGGGBBQ..",
    ".RRBBGGGGGGGBBQ.",
    ".RRBBBBBBBBBBQQ.",
    "....BB.BB.BB....",
    "....YY....YY....",
    "...YYR....RYY...",
    "...R........R..."
];
var PX_COLORS = { ".": "#0f172a", "B": "#38bdf8", "C": "#7dd3fc", "W": "#f8fafc", "Y": "#fbbf24", "G": "#10b981", "R": "#f87171", "Q": "#fb7185" };

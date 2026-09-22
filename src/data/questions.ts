import type { Challenge } from "@/types/game";

/**
 * CSC 3501-grounded challenges (CPU, Memory, Boolean Logic, GPU).
 * Scenarios preferred over definition trivia. Original wording — not slide text.
 */
export const CHALLENGES: Challenge[] = [
  // ─── CPU (~24) ───────────────────────────────────────────────
  {
    id: "cpu-01",
    topic: "cpu-basics",
    courseUnit: "CPU",
    difficulty: 1,
    scenario:
      "Which component is the system's main processing and control center that executes program instructions?",
    choices: [
      "Hard disk drive",
      "Central Processing Unit (CPU)",
      "Monitor",
      "Power supply only",
    ],
    correctIndex: 1,
    explanation:
      "The CPU fetches, decodes, and executes instructions and coordinates work with memory, storage, and I/O.",
    highlightCycle: "execute",
  },
  {
    id: "cpu-02",
    topic: "cpu-basics",
    courseUnit: "CPU",
    difficulty: 2,
    scenario:
      "Instructions and data must move among internal CPU parts and out to memory and I/O. Which unit directs that internal traffic?",
    choices: [
      "Graphics card fan",
      "Control Unit",
      "Optical drive",
      "Case RGB controller",
    ],
    correctIndex: 1,
    explanation:
      "The Control Unit orchestrates movement of instructions and data and signals other CPU components what to do.",
    unlockTags: [],
    highlightCycle: "decode",
  },
  {
    id: "cpu-03",
    topic: "alu",
    courseUnit: "CPU",
    difficulty: 1,
    scenario:
      "Which CPU component performs arithmetic and logical operations on data?",
    choices: [
      "ALU (Arithmetic Logic Unit)",
      "HDD platter",
      "Network jack",
      "Display backlight",
    ],
    correctIndex: 0,
    explanation:
      "The ALU is the computational engine for add/sub/compare and boolean logic on operands.",
    highlightCycle: "execute",
  },
  {
    id: "cpu-04",
    topic: "registers",
    courseUnit: "CPU",
    difficulty: 1,
    scenario:
      "Where does the CPU keep the tiny set of values it is working on right now for the fastest access?",
    choices: ["Registers", "Optical disc", "Cloud backup only", "Keyboard buffer only"],
    correctIndex: 0,
    explanation:
      "Registers are small, ultra-fast storage locations inside the CPU for active data and addresses.",
    highlightMemory: "registers",
  },
  {
    id: "cpu-05",
    topic: "fetch-decode-execute",
    courseUnit: "CPU",
    difficulty: 2,
    scenario:
      "The processor reads the next binary instruction from memory into the CPU. Which basic cycle stage is this?",
    choices: ["Fetch", "Decode", "Execute", "Shutdown"],
    correctIndex: 0,
    explanation:
      "In the Fetch–Decode–Execute cycle, Fetch brings the next instruction from memory into the CPU.",
    highlightCycle: "fetch",
  },
  {
    id: "cpu-06",
    topic: "fetch-decode-execute",
    courseUnit: "CPU",
    difficulty: 2,
    scenario:
      "The CPU has a binary instruction but has not yet decided which internal operation to run. Which stage / component acts next?",
    choices: [
      "Decode via the Instruction Decoder",
      "Always skip to storage write",
      "Turn off the clock",
      "Format the SSD",
    ],
    correctIndex: 0,
    explanation:
      "Decode interprets the instruction bits so the Control Unit and datapath know what to execute.",
    highlightCycle: "decode",
  },
  {
    id: "cpu-07",
    topic: "fetch-decode-execute",
    courseUnit: "CPU",
    difficulty: 2,
    scenario:
      "After decode, the ALU (or other units) carry out the requested operation. Which stage is this?",
    choices: ["Execute", "Fetch", "Idle sleep", "BIOS flash"],
    correctIndex: 0,
    explanation:
      "Execute is when the CPU performs the operation the instruction specified.",
    highlightCycle: "execute",
  },
  {
    id: "cpu-08",
    topic: "clock",
    courseUnit: "CPU",
    difficulty: 1,
    scenario:
      "What generates the timing pulses that synchronize CPU operations?",
    choices: [
      "The system clock / internal clock",
      "The mouse DPI setting",
      "The wallpaper slideshow",
      "The CD tray motor",
    ],
    correctIndex: 0,
    explanation:
      "Clock pulses pace Fetch–Decode–Execute and other synchronous CPU activity. Higher clock → more cycles per second.",
    unlockTags: ["overclocking"],
    affectedStat: "clockSpeed",
    highlightCycle: "fetch",
  },
  {
    id: "cpu-09",
    topic: "clock",
    courseUnit: "CPU",
    difficulty: 3,
    scenario:
      "CPI and cache behavior are already solid, but cycles/sec are still very low. What most directly raises raw cycle rate?",
    choices: [
      "Improve the internal clock (and thermal/OC headroom)",
      "Add more browser bookmarks",
      "Delete unused fonts",
      "Lower RAM voltage randomly",
    ],
    correctIndex: 0,
    explanation:
      "Clock speed is cycles per second. Throughput still depends on CPI: IPS ≈ clock / CPI × cores × efficiency.",
    unlockTags: ["overclocking", "cooling"],
    affectedStat: "clockSpeed",
    bottleneckType: "low-throughput",
  },
  {
    id: "cpu-10",
    topic: "von-neumann",
    courseUnit: "CPU",
    difficulty: 2,
    scenario:
      "A classic design stores instructions and data in the same shared memory space. What is this model called?",
    choices: [
      "Von Neumann architecture",
      "Harvard architecture",
      "Optical-only architecture",
      "Passive storage architecture",
    ],
    correctIndex: 0,
    explanation:
      "Von Neumann systems share one memory for instructions and data (often with a shared bus).",
  },
  {
    id: "cpu-11",
    topic: "harvard",
    courseUnit: "CPU",
    difficulty: 4,
    scenario:
      "A design needs to fetch an instruction and access data at the same time using separate instruction and data memories. Which architecture enables that?",
    choices: [
      "Harvard architecture",
      "Von Neumann only",
      "Tape-library architecture",
      "Single-bus von Neumann without separation",
    ],
    correctIndex: 0,
    explanation:
      "Harvard architecture uses separate instruction and data memories/paths, allowing concurrent instruction and data access.",
  },
  {
    id: "cpu-12",
    topic: "multicore",
    courseUnit: "CPU",
    difficulty: 1,
    scenario:
      "What does it mean for a CPU package to be multicore?",
    choices: [
      "It contains multiple processing cores that can run work in parallel",
      "It has multiple power cords only",
      "It can only run one thread ever",
      "It has no ALU",
    ],
    correctIndex: 0,
    explanation:
      "Multicore CPUs include several cores so independent threads or tasks can execute concurrently.",
    unlockTags: ["cores"],
    affectedStat: "coreCount",
  },
  {
    id: "cpu-13",
    topic: "multicore",
    courseUnit: "CPU",
    difficulty: 3,
    scenario:
      "A parallel compile saturates one core while others idle. How do you raise total instruction throughput for that workload?",
    choices: [
      "Add/use more processing cores for concurrent threads",
      "Remove the cache",
      "Disable the Control Unit",
      "Force every load to miss",
    ],
    correctIndex: 0,
    explanation:
      "Parallel software needs parallel hardware. Extra cores multiply throughput when the work scales.",
    unlockTags: ["cores"],
    affectedStat: "coreCount",
    bottleneckType: "parallel-workload",
  },
  {
    id: "cpu-14",
    topic: "cpu-basics",
    courseUnit: "CPU",
    difficulty: 2,
    scenario:
      "A microprocessor is typically a general-purpose CPU chip, while a microcontroller usually also integrates what on the same chip?",
    choices: [
      "Memory and I/O peripherals for embedded control",
      "Only a giant discrete GPU",
      "Only a mechanical hard drive",
      "Nothing — the terms are identical",
    ],
    correctIndex: 0,
    explanation:
      "Microcontrollers commonly combine CPU, memory, and I/O for embedded systems; microprocessors focus on the CPU itself.",
  },
  {
    id: "cpu-15",
    topic: "isa",
    courseUnit: "CPU",
    difficulty: 2,
    scenario:
      "The set of instructions a CPU can execute, plus how they are encoded, is called its:",
    choices: [
      "Instruction Set Architecture (ISA)",
      "Case color scheme",
      "Fan curve profile",
      "Display EDID only",
    ],
    correctIndex: 0,
    explanation:
      "The ISA defines the programmer-visible instructions and encodings the hardware must implement.",
  },
  {
    id: "cpu-16",
    topic: "isa",
    courseUnit: "CPU",
    difficulty: 3,
    scenario:
      "RISC designs emphasize simpler, more regular instructions; CISC designs historically packed more work into complex instructions. Which statement fits course-level comparison?",
    choices: [
      "RISC tends toward simpler ops; CISC toward richer individual instructions",
      "RISC forbids registers",
      "CISC never uses memory",
      "ISA choice never affects software",
    ],
    correctIndex: 0,
    explanation:
      "RISC vs CISC is about instruction complexity and design philosophy — both still need CU, ALU, registers, and memory systems.",
  },
  {
    id: "cpu-17",
    topic: "pipeline",
    courseUnit: "CPU",
    difficulty: 3,
    scenario:
      "Your CPU finishes one entire instruction before starting the next, so throughput stays low. What architectural change overlaps Fetch, Decode, and Execute work?",
    choices: [
      "Introduce pipelining (e.g., IF → ID → EX → MEM → WB)",
      "Delete registers",
      "Use only HDD storage",
      "Turn off the clock",
    ],
    correctIndex: 0,
    explanation:
      "Pipelining overlaps stages so multiple instructions are in flight, improving throughput toward lower CPI.",
    unlockTags: ["pipeline"],
    affectedStat: "pipelineEfficiency",
    bottleneckType: "low-throughput",
    highlightCycle: "fetch",
  },
  {
    id: "cpu-18",
    topic: "hazards",
    courseUnit: "CPU",
    difficulty: 3,
    scenario:
      "After pipelining, instruction B needs a register that A has not finished writing. The pipe stalls. What is this?",
    choices: [
      "A RAW data hazard",
      "A successful cache hit only",
      "A GPU warp scheduler",
      "An optical-drive error",
    ],
    correctIndex: 0,
    explanation:
      "Read-after-write hazards force stalls unless results can be forwarded earlier in the pipeline.",
    unlockTags: ["forwarding"],
    affectedStat: "cpi",
    bottleneckType: "data-hazard",
  },
  {
    id: "cpu-19",
    topic: "forwarding",
    courseUnit: "CPU",
    difficulty: 3,
    scenario:
      "Dependent ALU ops keep waiting for Write-Back. Which design reduces those stalls?",
    choices: [
      "Data forwarding / bypass from later stages back to EX",
      "Removing the ALU",
      "Larger HDD only",
      "Disabling decode",
    ],
    correctIndex: 0,
    explanation:
      "Forwarding sends results to needing stages early, cutting RAW stalls and lowering effective CPI.",
    unlockTags: ["forwarding"],
    affectedStat: "cpi",
    bottleneckType: "data-hazard",
  },
  {
    id: "cpu-20",
    topic: "branch",
    courseUnit: "CPU",
    difficulty: 3,
    scenario:
      "Branches keep flushing the pipeline and discarding useful work. Which unit / capability addresses this?",
    choices: [
      "Branch Prediction Unit / better branch prediction",
      "Turning off cache",
      "Fewer registers",
      "Slower buses on purpose",
    ],
    correctIndex: 0,
    explanation:
      "Predictors guess branch outcomes so the CPU can keep fetching useful instructions when accuracy is high.",
    unlockTags: ["branch"],
    affectedStat: "branchAccuracy",
    bottleneckType: "branch-flush",
  },
  {
    id: "cpu-21",
    topic: "cpi",
    courseUnit: "CPU",
    difficulty: 4,
    scenario:
      "Clock is 2 GHz, CPI is 4.0, one core, efficiency ≈ 1. Rough instructions/sec?",
    choices: [
      "About 0.5 billion IPS (clock / CPI)",
      "8 billion IPS",
      "CPI does not matter",
      "Exactly zero always",
    ],
    correctIndex: 0,
    explanation:
      "A teaching formula: IPS ≈ clockHz / CPI (× cores × efficiency). Here 2e9 / 4 = 0.5e9.",
    affectedStat: "ips",
    bottleneckType: "low-throughput",
  },
  {
    id: "cpu-22",
    topic: "cpu-basics",
    courseUnit: "CPU",
    difficulty: 2,
    scenario:
      "Besides the CU and ALU, many CPUs include a Bus Interface Unit. What is its job at a course level?",
    choices: [
      "Manage transfers between the CPU and the external bus / memory system",
      "Cool the GPU only",
      "Render fonts",
      "Charge the battery chemically",
    ],
    correctIndex: 0,
    explanation:
      "The BIU handles communication over the system bus so the core can fetch instructions and move data.",
    unlockTags: ["buses"],
    affectedStat: "cpi",
  },
  {
    id: "cpu-23",
    topic: "cpu-basics",
    courseUnit: "CPU",
    difficulty: 3,
    scenario:
      "A floating-point-heavy scientific kernel is slow on integer-only paths. Which specialized unit helps?",
    choices: [
      "Floating Point Unit (FPU)",
      "Optical disc laser",
      "Mechanical HDD head",
      "Case intake dust filter",
    ],
    correctIndex: 0,
    explanation:
      "An FPU accelerates floating-point arithmetic beyond what a basic integer ALU provides.",
    highlightCycle: "execute",
  },
  {
    id: "cpu-24",
    topic: "cpu-basics",
    courseUnit: "CPU",
    difficulty: 3,
    scenario:
      "Virtual addresses must be translated and protected for processes. Which unit commonly assists?",
    choices: [
      "Memory Management Unit (MMU)",
      "Display scaler only",
      "Audio DAC only",
      "PSU fan controller",
    ],
    correctIndex: 0,
    explanation:
      "The MMU supports address translation and memory protection between programs and physical memory.",
  },

  // ─── Memory (~16) ────────────────────────────────────────────
  {
    id: "mem-01",
    topic: "cache",
    courseUnit: "Memory",
    difficulty: 1,
    scenario:
      "Which memory is generally the smallest and fastest level of on-chip CPU cache?",
    choices: ["L1 cache", "L3 cache", "HDD", "Optical disc"],
    correctIndex: 0,
    explanation:
      "L1 sits closest to the core — tiny but extremely fast. L2/L3 are larger and slower.",
    unlockTags: ["cache"],
    affectedStat: "cacheHitRate",
    highlightMemory: "l1",
  },
  {
    id: "mem-02",
    topic: "cache",
    courseUnit: "Memory",
    difficulty: 3,
    scenario:
      "Your processor repeatedly uses the same instructions, but pulling them from RAM creates long delays. What improvement fits best?",
    choices: [
      "Add/improve cache so hot instructions stay near the CPU",
      "Add more USB hubs",
      "Lower screen brightness",
      "Remove registers",
    ],
    correctIndex: 0,
    explanation:
      "Cache keeps frequently accessed instructions and data close to the CPU, reducing slower main-memory accesses.",
    unlockTags: ["cache"],
    affectedStat: "cacheHitRate",
    bottleneckType: "memory-latency",
    highlightMemory: "l1",
  },
  {
    id: "mem-03",
    topic: "memory",
    courseUnit: "Memory",
    difficulty: 2,
    scenario:
      "In the memory hierarchy, what is the general relationship from registers/cache down to disk?",
    choices: [
      "Top levels are faster and smaller; bottom levels are slower and larger",
      "Disk is always fastest",
      "Registers are the largest store",
      "Speed and size never trade off",
    ],
    correctIndex: 0,
    explanation:
      "Hierarchy principle: closer to the CPU → faster/smaller; farther → slower/larger capacity.",
    highlightMemory: "registers",
  },
  {
    id: "mem-04",
    topic: "registers",
    courseUnit: "Memory",
    difficulty: 2,
    scenario:
      "Why are registers better than RAM for values the CPU is using immediately?",
    choices: [
      "They are tiny high-speed locations inside the CPU",
      "They store entire movies permanently",
      "They are slower than HDDs",
      "They only hold Wi-Fi passwords",
    ],
    correctIndex: 0,
    explanation:
      "Registers minimize latency for active operands — far faster than going out to main memory.",
    highlightMemory: "registers",
  },
  {
    id: "mem-05",
    topic: "memory",
    courseUnit: "Memory",
    difficulty: 1,
    scenario:
      "What is the system's main volatile working memory that holds running programs and data?",
    choices: ["RAM (main memory)", "DVD-ROM only", "Printed paper", "Case plastic"],
    correctIndex: 0,
    explanation:
      "RAM is main memory: large compared with cache, but slower. Contents are typically lost without power (volatile).",
    highlightMemory: "ram",
  },
  {
    id: "mem-06",
    topic: "cache",
    courseUnit: "Memory",
    difficulty: 2,
    scenario:
      "L2 cache compared with L1 is typically:",
    choices: [
      "Larger and a bit slower than L1",
      "Smaller and always faster than L1",
      "The same as an HDD",
      "Only used by printers",
    ],
    correctIndex: 0,
    explanation:
      "L2 is a middle hierarchy level: bigger than L1, slower than L1, still much faster than RAM.",
    unlockTags: ["cache"],
    highlightMemory: "l2",
  },
  {
    id: "mem-07",
    topic: "cache",
    courseUnit: "Memory",
    difficulty: 2,
    scenario:
      "Shared last-level cache on many modern chips is often which level?",
    choices: ["L3 cache", "Only registers", "Only optical media", "Only tape"],
    correctIndex: 0,
    explanation:
      "L3 is commonly a larger shared cache before falling back to DRAM.",
    unlockTags: ["cache"],
    highlightMemory: "l3",
  },
  {
    id: "mem-08",
    topic: "cache",
    courseUnit: "Memory",
    difficulty: 3,
    scenario:
      "A needed value is not in cache, so the CPU must wait on a slower level. What occurred?",
    choices: [
      "A cache miss",
      "A perfect hit",
      "An ALU overflow always",
      "A successful decode-only path",
    ],
    correctIndex: 0,
    explanation:
      "On a miss, the next level (L2/L3/RAM) is checked. Miss rate and miss penalty drive memory stalls.",
    unlockTags: ["cache"],
    affectedStat: "cpi",
    bottleneckType: "memory-latency",
    highlightMemory: "ram",
  },
  {
    id: "mem-09",
    topic: "buses",
    courseUnit: "Memory",
    difficulty: 3,
    scenario:
      "Cache helps, but miss penalties are still huge because the path to DRAM is narrow/slow. What should improve?",
    choices: [
      "System buses / memory interconnect bandwidth and latency",
      "Wallpaper resolution",
      "Number of unused fonts",
      "Case LED count",
    ],
    correctIndex: 0,
    explanation:
      "Buses move data on misses. Faster interconnects reduce miss penalty cycles.",
    unlockTags: ["buses"],
    affectedStat: "cpi",
    bottleneckType: "memory-latency",
    highlightMemory: "ram",
  },
  {
    id: "mem-10",
    topic: "memory",
    courseUnit: "Memory",
    difficulty: 2,
    scenario:
      "SRAM is typically used for cache; DRAM for main memory. At a course level, why?",
    choices: [
      "SRAM is faster (good for cache); DRAM is denser/cheaper for large main memory",
      "DRAM is always faster than SRAM",
      "SRAM only stores movies",
      "Neither is volatile",
    ],
    correctIndex: 0,
    explanation:
      "Cache needs speed (SRAM); main memory needs capacity (DRAM), accepting higher latency.",
    highlightMemory: "l1",
  },
  {
    id: "mem-11",
    topic: "memory",
    courseUnit: "Memory",
    difficulty: 2,
    scenario:
      "DDR memory transfers data on both edges of the clock. What does DDR stand for?",
    choices: [
      "Double Data Rate",
      "Dual Disk RAID",
      "Delayed Decode Register",
      "Dynamic Desktop Resize",
    ],
    correctIndex: 0,
    explanation:
      "Double Data Rate DRAM moves data twice per clock cycle compared with single-data-rate designs.",
    highlightMemory: "ram",
  },
  {
    id: "mem-12",
    topic: "memory",
    courseUnit: "Memory",
    difficulty: 3,
    scenario:
      "Memory timings describe latency characteristics of DRAM. Higher latency generally means:",
    choices: [
      "Longer waits before data is ready — hurts performance if bandwidth cannot hide it",
      "Instantly infinite bandwidth",
      "Cache becomes unnecessary forever",
      "Registers disappear",
    ],
    correctIndex: 0,
    explanation:
      "Latency timings (among other factors) affect how soon DRAM can return data after a request.",
    unlockTags: ["buses"],
    affectedStat: "cpi",
    highlightMemory: "ram",
  },
  {
    id: "mem-13",
    topic: "storage",
    courseUnit: "Memory",
    difficulty: 1,
    scenario:
      "Which storage is typically non-volatile flash memory with no spinning platters?",
    choices: ["SSD (solid-state drive)", "Only DRAM", "Only registers", "Only L1"],
    correctIndex: 0,
    explanation:
      "SSDs use flash; they keep data without power and are much faster than traditional HDDs for many workloads.",
    highlightMemory: "storage",
  },
  {
    id: "mem-14",
    topic: "storage",
    courseUnit: "Memory",
    difficulty: 1,
    scenario:
      "An HDD stores data how, at a course level?",
    choices: [
      "Magnetically on spinning platters",
      "Only in CPU registers",
      "Only as optical pits on L1",
      "Only in the ALU",
    ],
    correctIndex: 0,
    explanation:
      "Hard disk drives use magnetic storage on rotating platters — high capacity, higher latency than SSD/RAM.",
    highlightMemory: "storage",
  },
  {
    id: "mem-15",
    topic: "storage",
    courseUnit: "Memory",
    difficulty: 2,
    scenario:
      "Volatile vs non-volatile: which pair matches typical course examples?",
    choices: [
      "RAM is volatile; flash/SSD/HDD keep data without power (non-volatile)",
      "HDD is volatile; registers are non-volatile forever",
      "Cache never loses data on power-off in all designs",
      "Optical discs are the CPU's L1",
    ],
    correctIndex: 0,
    explanation:
      "Main memory (DRAM) generally loses contents without power; secondary storage is built to retain data.",
    highlightMemory: "storage",
  },
  {
    id: "mem-16",
    topic: "memory",
    courseUnit: "Memory",
    difficulty: 4,
    scenario:
      "Working set fits poorly in cache; the CPU often waits on DRAM. Hit rate is low. Best first lever?",
    choices: [
      "Improve cache hierarchy / capacity / locality so more accesses hit",
      "Delete the Control Unit",
      "Halve the clock permanently without other changes",
      "Force Harvard→Von Neumann conversion only",
    ],
    correctIndex: 0,
    explanation:
      "Raising hit rate cuts expensive DRAM trips, lowering effective CPI and raising IPS.",
    unlockTags: ["cache"],
    affectedStat: "cacheHitRate",
    bottleneckType: "memory-latency",
    highlightMemory: "l2",
  },

  // ─── Boolean Logic (~8) ──────────────────────────────────────
  {
    id: "log-01",
    topic: "boolean",
    courseUnit: "Boolean Logic",
    difficulty: 1,
    scenario:
      "In digital logic as used in class, Boolean values are typically represented as:",
    choices: ["0 and 1 (false/true)", "Only floating colors", "Only audio samples", "Negative infinity only"],
    correctIndex: 0,
    explanation:
      "Boolean logic works with two values — conventionally 0 and 1 — which map to gate inputs/outputs.",
    bottleneckType: "logic-circuit",
  },
  {
    id: "log-02",
    topic: "boolean",
    courseUnit: "Boolean Logic",
    difficulty: 2,
    scenario:
      "A circuit should output 1 only when both inputs A and B are 1. Which operation implements this?",
    choices: ["AND", "OR", "NOT", "XOR only forever"],
    correctIndex: 0,
    explanation:
      "AND is 1 only if every input is 1 — a fundamental building block inside ALU datapaths.",
    unlockTags: ["alu"],
    affectedStat: "cpi",
    bottleneckType: "logic-circuit",
    highlightCycle: "execute",
  },
  {
    id: "log-03",
    topic: "boolean",
    courseUnit: "Boolean Logic",
    difficulty: 2,
    scenario:
      "Truth table: A B | Out → 0 0|0, 0 1|1, 1 0|1, 1 1|1. Which gate matches?",
    choices: ["OR", "AND", "NOT", "Buffer that ignores B"],
    correctIndex: 0,
    explanation:
      "OR outputs 1 if any input is 1. Matching a truth table is part of the course design process.",
    bottleneckType: "logic-circuit",
  },
  {
    id: "log-04",
    topic: "boolean",
    courseUnit: "Boolean Logic",
    difficulty: 3,
    scenario:
      "Course design flow for a combinational problem is best summarized as:",
    choices: [
      "Problem → truth table → Boolean expression → simplify → logic diagram",
      "Draw RGB first → skip truth tables → ship",
      "Only write poetry → burn the circuit",
      "Start with HDD partitions → ignore gates",
    ],
    correctIndex: 0,
    explanation:
      "CSC 3501 logic work follows: capture behavior in a table, derive expressions, simplify (e.g. K-maps), then implement gates.",
    bottleneckType: "logic-circuit",
  },
  {
    id: "log-05",
    topic: "adder",
    courseUnit: "Boolean Logic",
    difficulty: 2,
    scenario:
      "You need to add two one-bit values and produce Sum and Carry (no carry-in). Which circuit?",
    choices: ["Half adder", "Only a NOT gate", "Only an OR of clocks", "A hard disk controller"],
    correctIndex: 0,
    explanation:
      "A half adder adds two bits into sum and carry — a classic Logisim/ALU building block.",
    unlockTags: ["alu"],
    affectedStat: "cpi",
    bottleneckType: "logic-circuit",
    highlightCycle: "execute",
  },
  {
    id: "log-06",
    topic: "adder",
    courseUnit: "Boolean Logic",
    difficulty: 3,
    scenario:
      "You must also accept a carry-in from the previous bit position. Which circuit?",
    choices: ["Full adder", "Half adder only", "Single NOT", "Optical splitter"],
    correctIndex: 0,
    explanation:
      "A full adder adds A, B, and carry-in — the chainable unit for multi-bit addition in an ALU.",
    unlockTags: ["alu"],
    affectedStat: "cpi",
    bottleneckType: "logic-circuit",
    highlightCycle: "execute",
  },
  {
    id: "log-07",
    topic: "boolean",
    courseUnit: "Boolean Logic",
    difficulty: 3,
    scenario:
      "A one-bit comparator is used to:",
    choices: [
      "Compare two bits (e.g., equality / magnitude relationships)",
      "Spin an HDD faster",
      "Decode HDMI audio only",
      "Replace the entire OS",
    ],
    correctIndex: 0,
    explanation:
      "Comparators implement relational checks — useful in ALUs and control decisions.",
    unlockTags: ["alu"],
    bottleneckType: "logic-circuit",
  },
  {
    id: "log-08",
    topic: "registers",
    courseUnit: "Boolean Logic",
    difficulty: 3,
    scenario:
      "Registers that hold bits across clock edges are commonly built from what sequential elements?",
    choices: [
      "Flip-flops",
      "Only resistors with no state",
      "Only passive heat sinks",
      "Only optical lenses",
    ],
    correctIndex: 0,
    explanation:
      "Flip-flops store state; groups of them form registers that update with the clock.",
    highlightMemory: "registers",
    highlightCycle: "execute",
    bottleneckType: "logic-circuit",
  },

  // ─── GPU (~7) ────────────────────────────────────────────────
  {
    id: "gpu-01",
    topic: "gpu",
    courseUnit: "GPU",
    difficulty: 1,
    scenario:
      "What is a GPU specialized for at a high level?",
    choices: [
      "Highly parallel graphics and data-parallel computation",
      "Only spinning hard disks",
      "Only decoding keyboard scancodes",
      "Replacing the power cord",
    ],
    correctIndex: 0,
    explanation:
      "GPUs provide many simpler cores aimed at parallel work across large data sets (e.g., pixels).",
    bottleneckType: "gpu-workload",
  },
  {
    id: "gpu-02",
    topic: "gpu",
    courseUnit: "GPU",
    difficulty: 3,
    scenario:
      "You must apply the same math independently to one million pixels. Which architecture fits better?",
    choices: [
      "GPU with many simpler parallel cores",
      "A single complex CPU core only, by design preference",
      "An optical CD writer",
      "A mechanical keyboard switch",
    ],
    correctIndex: 0,
    explanation:
      "GPUs excel when the same operation runs across huge amounts of data with limited divergent control flow.",
    bottleneckType: "gpu-workload",
  },
  {
    id: "gpu-03",
    topic: "gpu",
    courseUnit: "GPU",
    difficulty: 3,
    scenario:
      "A workload is full of complex branching, OS calls, and sequential decisions. Better fit?",
    choices: [
      "CPU with fewer, more complex cores",
      "Only a GPU warp with zero control flow",
      "Only an HDD",
      "Only L3 with no processor",
    ],
    correctIndex: 0,
    explanation:
      "CPUs handle irregular control flow and system tasks; GPUs prefer wide data-parallel patterns.",
    bottleneckType: "gpu-workload",
  },
  {
    id: "gpu-04",
    topic: "gpu",
    courseUnit: "GPU",
    difficulty: 2,
    scenario:
      "Compared with a CPU, a GPU typically has:",
    choices: [
      "Many simpler cores vs the CPU's fewer complex cores",
      "Zero memory hierarchy",
      "No parallel capability",
      "Only one register total",
    ],
    correctIndex: 0,
    explanation:
      "Course contrast: CPUs optimize latency/complexity per core; GPUs optimize throughput with massive parallelism.",
  },
  {
    id: "gpu-05",
    topic: "gpu",
    courseUnit: "GPU",
    difficulty: 2,
    scenario:
      "In GPU programming models discussed in class, threads are often grouped into blocks that form a:",
    choices: ["Grid", "Single flip-flop", "Only one HDD partition", "BIOS password"],
    correctIndex: 0,
    explanation:
      "Threads → blocks → grids organize parallel work; warps/SIMT describe how hardware schedules similar threads.",
  },
  {
    id: "gpu-06",
    topic: "gpu",
    courseUnit: "GPU",
    difficulty: 2,
    scenario:
      "SIMT scheduling on GPUs roughly means:",
    choices: [
      "Many threads execute the same instruction stream in lockstep-style groups (warps)",
      "Only one thread exists in the whole system",
      "Memory hierarchy is deleted",
      "Boolean AND is banned",
    ],
    correctIndex: 0,
    explanation:
      "Single-Instruction Multiple-Thread groups keep hardware efficient on data-parallel kernels.",
  },
  {
    id: "gpu-07",
    topic: "gpu",
    courseUnit: "GPU",
    difficulty: 4,
    scenario:
      "GPU memory hierarchy includes registers, shared memory, L1, and global memory. Which is typically closest/fastest for a thread?",
    choices: [
      "Registers (then shared/L1 before global)",
      "Only global memory is fastest",
      "HDD inside the SM",
      "Optical storage inside each CUDA core",
    ],
    correctIndex: 0,
    explanation:
      "Like CPUs, GPUs keep a hierarchy: registers and on-chip shared/L1 are faster than large global memory.",
    highlightMemory: "registers",
    bottleneckType: "gpu-workload",
  },
];

export const QUESTIONS = CHALLENGES;

/** Topic label for UI chips */
export const TOPIC_LABELS: Partial<Record<Challenge["topic"], string>> = {
  cache: "Cache",
  memory: "Memory Hierarchy",
  registers: "Registers",
  storage: "Storage",
  buses: "Buses",
  alu: "ALU",
  clock: "Clock",
  pipeline: "Pipelining",
  hazards: "Hazards",
  forwarding: "Forwarding",
  branch: "Branch Prediction",
  multicore: "Multicore",
  cpi: "CPI / Throughput",
  "cpu-basics": "CPU Basics",
  "von-neumann": "Von Neumann",
  harvard: "Harvard",
  isa: "ISA",
  "fetch-decode-execute": "Fetch–Decode–Execute",
  boolean: "Boolean Logic",
  adder: "Adders",
  gpu: "GPU / Parallel",
};

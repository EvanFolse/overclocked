import type {
  AffectedStat,
  CourseUnit,
  CycleStage,
  MemoryLevel,
  UpgradeId,
} from "@/types/game";

export type CheckpointId =
  | "cpu-basics"
  | "fetch-decode-execute"
  | "memory-bottleneck"
  | "cache-hierarchy"
  | "boolean-alu"
  | "pipeline"
  | "data-hazards"
  | "branch-prediction"
  | "multicore"
  | "cpu-vs-gpu";

export interface CheckpointQuestion {
  scenario: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  hint: string;
  /** Unlocked when this step is answered correctly (intro / multi-step) */
  unlockUpgrade?: UpgradeId;
}

export interface CheckpointSource {
  label: string;
  url: string;
}

export interface LearningCheckpoint {
  id: CheckpointId;
  title: string;
  stallHeadline: string;
  stallSubtitle: string;
  stallBody: string;
  /** Short reading shown before questions (~60–120 words) */
  reading: string;
  courseUnit: CourseUnit;
  highlightCycle?: CycleStage;
  highlightMemory?: MemoryLevel;
  questions: CheckpointQuestion[];
  /** Upgrades granted when the whole checkpoint finishes */
  unlockUpgrades: UpgradeId[];
  /** Stat to emphasize in the resolve toast */
  relevantStat?: AffectedStat;
  sources: CheckpointSource[];
  /**
   * When this checkpoint may activate (checked in order).
   * Requires previous checkpoint(s) completed except for cpu-basics.
   */
  requires: CheckpointId[];
  /** Minimum total Compute earned */
  minTotalEarned?: number;
  /** Minimum build level */
  minCpuLevel?: number;
}

export const CHECKPOINTS: LearningCheckpoint[] = [
  {
    id: "cpu-basics",
    title: "CPU Basics",
    stallHeadline: "CPU OFFLINE",
    stallSubtitle: "MISSING COMPONENTS",
    stallBody:
      "Your processor exists, but it cannot execute instructions yet. Install the core pieces of a working CPU.",
    reading:
      "A CPU is the computer’s processing and control center. It needs an Arithmetic Logic Unit to compute, registers to hold active values, a Control Unit to direct the flow of instructions and data, and a clock to synchronize each step. Without these, there is no Fetch–Decode–Execute cycle and no useful work.",
    courseUnit: "CPU",
    highlightCycle: "execute",
    questions: [
      {
        scenario:
          "Your processor needs to add two values. Which component should perform this operation?",
        choices: ["Cache", "ALU", "SSD", "Bus"],
        correctIndex: 1,
        explanation:
          "The Arithmetic Logic Unit performs arithmetic and logical operations on data.",
        hint: "Think about which unit does math and comparisons.",
        unlockUpgrade: "alu",
      },
      {
        scenario:
          "The CPU needs tiny, ultra-fast storage for the values it is using right now. What should you install?",
        choices: ["Hard disk", "Registers", "Optical drive", "Case fan"],
        correctIndex: 1,
        explanation:
          "Registers are small high-speed locations inside the CPU for active data and addresses.",
        hint: "Faster than RAM, but much smaller — inside the chip.",
        unlockUpgrade: "registers",
      },
      {
        scenario:
          "Instructions and data must be directed between internal CPU parts. Which unit handles that coordination?",
        choices: ["Control Unit", "GPU only", "Power supply", "Monitor"],
        correctIndex: 0,
        explanation:
          "The Control Unit directs the movement of instructions and data and signals other components.",
        hint: "It is the ‘director’ of the processor.",
        unlockUpgrade: "controlUnit",
      },
      {
        scenario:
          "What generates the timing pulses that synchronize CPU operations?",
        choices: ["The internal clock", "The wallpaper", "The keyboard", "The SSD"],
        correctIndex: 0,
        explanation:
          "The clock paces CPU activity. More cycles per second can mean more work — if the rest of the design keeps up.",
        hint: "Measured in hertz / GHz.",
        unlockUpgrade: "clock",
      },
    ],
    unlockUpgrades: ["alu", "registers", "controlUnit", "clock"],
    relevantStat: "ips",
    requires: [],
    sources: [
      {
        label: "IBM — Central Processing Unit",
        url: "https://www.ibm.com/think/topics/central-processing-unit",
      },
    ],
  },
  {
    id: "fetch-decode-execute",
    title: "Fetch–Decode–Execute",
    stallHeadline: "CPU STALLED",
    stallSubtitle: "NO CLEAR EXECUTION CYCLE",
    stallBody:
      "Your chip is online, but throughput is weak. You need a clear instruction cycle before deeper architecture pays off.",
    reading:
      "Every instruction follows a basic cycle: Fetch brings the next instruction from memory, Decode interprets the binary bits (often via an instruction decoder), and Execute performs the operation — for example in the ALU. Later designs pipeline these stages, but the teaching foundation is still Fetch → Decode → Execute.",
    courseUnit: "CPU",
    highlightCycle: "fetch",
    questions: [
      {
        scenario:
          "The processor reads the next binary instruction from memory into the CPU. Which stage is this?",
        choices: ["Fetch", "Decode", "Execute", "Shutdown"],
        correctIndex: 0,
        explanation: "Fetch retrieves the next instruction from memory.",
        hint: "It happens before the CPU knows what the instruction means.",
      },
      {
        scenario:
          "The CPU has the instruction bits but has not yet decided which operation to run. What comes next?",
        choices: [
          "Decode (interpret the instruction)",
          "Always skip to disk write",
          "Turn off the clock",
          "Delete registers",
        ],
        correctIndex: 0,
        explanation:
          "Decode interprets the instruction so the Control Unit and datapath know what to execute.",
        hint: "Binary bits become a meaningful operation.",
      },
    ],
    unlockUpgrades: [],
    relevantStat: "cpi",
    requires: ["cpu-basics"],
    minTotalEarned: 40,
    sources: [
      {
        label: "IBM — Central Processing Unit",
        url: "https://www.ibm.com/think/topics/central-processing-unit",
      },
    ],
  },
  {
    id: "memory-bottleneck",
    title: "Memory Bottleneck",
    stallHeadline: "CPU STALLED",
    stallSubtitle: "MEMORY LATENCY",
    stallBody:
      "Your processor is spending too much time waiting on main memory for data it uses again and again.",
    reading:
      "Memory is organized as a hierarchy: registers (fastest/smallest), then cache, then RAM (main memory), then storage (SSD/HDD). The farther from the CPU, the slower and larger. If hot data lives only in RAM, the CPU waits. Cache keeps frequently used instructions and data closer to the core.",
    courseUnit: "Memory",
    highlightMemory: "ram",
    questions: [
      {
        scenario:
          "The CPU repeatedly needs the same instructions, but pulling them from RAM creates long delays. What should you add?",
        choices: [
          "More USB ports",
          "Cache memory near the CPU",
          "A slower clock",
          "Larger case fans only",
        ],
        correctIndex: 1,
        explanation:
          "Cache keeps frequently accessed data close to the CPU, cutting slow main-memory trips.",
        hint: "Think hierarchy: what sits between registers and RAM?",
        unlockUpgrade: "cache",
      },
    ],
    unlockUpgrades: ["cache"],
    relevantStat: "cacheHitRate",
    requires: ["fetch-decode-execute"],
    minTotalEarned: 350,
    sources: [
      {
        label: "IBM — What is cache memory?",
        url: "https://www.ibm.com/think/topics/cache-memory",
      },
    ],
  },
  {
    id: "cache-hierarchy",
    title: "Cache Hierarchy",
    stallHeadline: "CPU STALLED",
    stallSubtitle: "CACHE TOO SHALLOW",
    stallBody:
      "A tiny cache helps, but misses still hurt. You need to understand L1 / L2 / L3 tradeoffs.",
    reading:
      "L1 is usually the smallest and fastest cache, closest to the core. L2 is larger and a bit slower. L3 is often a larger shared last-level cache before DRAM. The rule of thumb: closer levels are faster and smaller; farther levels are slower and larger.",
    courseUnit: "Memory",
    highlightMemory: "l1",
    questions: [
      {
        scenario: "Which cache level is generally the smallest and fastest?",
        choices: ["L3", "L1", "HDD", "Optical disc"],
        correctIndex: 1,
        explanation: "L1 sits closest to the core — tiny but extremely fast.",
        hint: "Closest to the execution units.",
      },
      {
        scenario:
          "Misses still pay a large DRAM penalty because the path to memory is narrow. What also helps?",
        choices: [
          "Faster/wider buses and interconnects",
          "Deleting the ALU",
          "Turning off registers",
          "Lowering screen brightness",
        ],
        correctIndex: 0,
        explanation:
          "Buses move data on a miss. Better interconnects reduce miss penalty.",
        hint: "Think about how data travels after a cache miss.",
        unlockUpgrade: "buses",
      },
    ],
    unlockUpgrades: ["buses"],
    relevantStat: "cacheHitRate",
    requires: ["memory-bottleneck"],
    minCpuLevel: 6,
    sources: [
      {
        label: "IBM — What is cache memory?",
        url: "https://www.ibm.com/think/topics/cache-memory",
      },
    ],
  },
  {
    id: "boolean-alu",
    title: "Boolean Logic & the ALU",
    stallHeadline: "CPU STALLED",
    stallSubtitle: "WEAK DATAPATH LOGIC",
    stallBody:
      "Your ALU needs stronger digital-logic foundations before more complex execution pays off.",
    reading:
      "Digital systems use Boolean values 0 and 1. Gates such as AND, OR, and NOT implement expressions derived from truth tables. A half adder adds two bits into Sum and Carry; a full adder also takes a carry-in so multi-bit addition can chain. These circuits live inside ALU datapaths.",
    courseUnit: "Boolean Logic",
    highlightCycle: "execute",
    questions: [
      {
        scenario:
          "A circuit should output 1 only when both inputs A and B are 1. Which operation is this?",
        choices: ["OR", "AND", "NOT", "Always 0"],
        correctIndex: 1,
        explanation: "AND is 1 only if every input is 1.",
        hint: "Both inputs must be true.",
      },
      {
        scenario:
          "You need to add two one-bit values and produce Sum and Carry (no carry-in). Which circuit?",
        choices: ["Half adder", "Only a NOT gate", "An SSD controller", "A fan curve"],
        correctIndex: 0,
        explanation: "A half adder produces sum and carry from two bits.",
        hint: "Classic Logisim building block for addition.",
      },
    ],
    unlockUpgrades: [],
    relevantStat: "cpi",
    requires: ["cache-hierarchy"],
    minTotalEarned: 2_000,
    sources: [
      {
        label: "IBM — What is a logic gate?",
        url: "https://www.ibm.com/think/topics/logic-gate",
      },
    ],
  },
  {
    id: "pipeline",
    title: "Pipelining",
    stallHeadline: "CPU STALLED",
    stallSubtitle: "LOW THROUGHPUT",
    stallBody:
      "Finishing one whole instruction before starting the next keeps performance low. Overlap the work.",
    reading:
      "Pipelining overlaps stages so multiple instructions are in flight — often taught as IF → ID → EX → MEM → WB. Ideally this drives CPI toward ~1, raising throughput. Hazards can still force stalls; those come next.",
    courseUnit: "CPU",
    highlightCycle: "fetch",
    questions: [
      {
        scenario:
          "Your CPU finishes one instruction completely before starting the next. What architectural change overlaps stages?",
        choices: [
          "Instruction pipelining",
          "Deleting cache",
          "Using only HDD storage",
          "Removing the clock",
        ],
        correctIndex: 0,
        explanation:
          "Pipelining overlaps Fetch/Decode/Execute (and related stages) across instructions.",
        hint: "Assembly line for instructions.",
        unlockUpgrade: "pipeline",
      },
    ],
    unlockUpgrades: ["pipeline"],
    relevantStat: "pipelineEfficiency",
    requires: ["boolean-alu"],
    minTotalEarned: 5_000,
    sources: [
      {
        label: "IBM — Central Processing Unit",
        url: "https://www.ibm.com/think/topics/central-processing-unit",
      },
    ],
  },
  {
    id: "data-hazards",
    title: "Data Hazards & Forwarding",
    stallHeadline: "CPU STALLED",
    stallSubtitle: "PIPELINE DATA HAZARD",
    stallBody:
      "After pipelining, dependent instructions keep stalling. The pipe cannot see results soon enough.",
    reading:
      "Consider: ADD R1, R2, R3 then SUB R4, R1, R5. The subtract needs R1 before the add finishes writing it back — a read-after-write (RAW) data hazard. Stalling waits; forwarding (bypassing) sends the result to a later stage earlier so fewer cycles are wasted.",
    courseUnit: "CPU",
    highlightCycle: "execute",
    questions: [
      {
        scenario:
          "ADD writes R1; the next SUB reads R1 before write-back finishes. What is this?",
        choices: [
          "A RAW data hazard",
          "A perfect cache hit",
          "A GPU warp",
          "An optical error",
        ],
        correctIndex: 0,
        explanation:
          "The later instruction depends on a value not yet written — a classic RAW hazard.",
        hint: "Read after write of the same register.",
      },
      {
        scenario: "What design reduces stalls by bypassing results to earlier stages?",
        choices: [
          "Data forwarding",
          "Removing the ALU",
          "Deleting the pipeline",
          "Only adding more HDDs",
        ],
        correctIndex: 0,
        explanation:
          "Forwarding routes results to needing stages early, cutting RAW stalls.",
        hint: "Also called a bypass network.",
        unlockUpgrade: "forwarding",
      },
    ],
    unlockUpgrades: ["forwarding"],
    relevantStat: "cpi",
    requires: ["pipeline"],
    minCpuLevel: 14,
    sources: [
      {
        label: "IBM — Central Processing Unit",
        url: "https://www.ibm.com/think/topics/central-processing-unit",
      },
    ],
  },
  {
    id: "branch-prediction",
    title: "Branch Prediction",
    stallHeadline: "CPU STALLED",
    stallSubtitle: "PIPELINE FLUSHES",
    stallBody:
      "Branches keep throwing away in-flight work. Speculation needs better guesses.",
    reading:
      "Branches change which instruction comes next. If the pipeline guesses wrong, it flushes useful work and wastes cycles. A Branch Prediction Unit improves accuracy so Fetch can keep supplying useful instructions.",
    courseUnit: "CPU",
    highlightCycle: "fetch",
    questions: [
      {
        scenario:
          "Wrong branch guesses flush the pipeline. What capability addresses this?",
        choices: [
          "Branch prediction",
          "Turning off cache",
          "Fewer registers",
          "Slower buses on purpose",
        ],
        correctIndex: 0,
        explanation:
          "Predictors guess outcomes so the CPU can continue fetching with fewer flushes.",
        hint: "Guess the next path after if/loop decisions.",
        unlockUpgrade: "branchPrediction",
      },
    ],
    unlockUpgrades: ["branchPrediction"],
    relevantStat: "branchAccuracy",
    requires: ["data-hazards"],
    minTotalEarned: 25_000,
    sources: [
      {
        label: "Intel — Architecture overview resources",
        url: "https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html",
      },
    ],
  },
  {
    id: "multicore",
    title: "Multicore Processing",
    stallHeadline: "CPU STALLED",
    stallSubtitle: "PARALLEL WORKLOAD STARVATION",
    stallBody:
      "One core is saturated while parallel work waits. You need more execution engines.",
    reading:
      "A single-core CPU runs one main execution path at a time (plus limited concurrency tricks). Multicore packages include multiple cores so independent threads can run together. Parallel software benefits; purely serial work does not scale the same way.",
    courseUnit: "CPU",
    questions: [
      {
        scenario:
          "A parallel compile saturates one core while others could help. What unlocks more throughput?",
        choices: [
          "Additional processing cores",
          "Removing cache",
          "Disabling the Control Unit",
          "Forcing every load to miss",
        ],
        correctIndex: 0,
        explanation:
          "More cores multiply throughput when the workload can run in parallel.",
        hint: "Think hardware parallelism for threads.",
        unlockUpgrade: "cores",
      },
    ],
    unlockUpgrades: ["cores"],
    relevantStat: "coreCount",
    requires: ["branch-prediction"],
    minTotalEarned: 80_000,
    sources: [
      {
        label: "IBM — Central Processing Unit",
        url: "https://www.ibm.com/think/topics/central-processing-unit",
      },
    ],
  },
  {
    id: "cpu-vs-gpu",
    title: "CPU vs GPU",
    stallHeadline: "CPU STALLED",
    stallSubtitle: "WRONG PARALLEL TOOL",
    stallBody:
      "A huge data-parallel job is bottlenecking on complex CPU cores. Time to compare architectures.",
    reading:
      "CPUs typically have fewer, more complex cores that handle branching and system tasks well. GPUs provide many simpler processing units designed to apply similar operations across large data sets (for example pixels). Choose the tool that matches the workload.",
    courseUnit: "GPU",
    questions: [
      {
        scenario:
          "You must apply the same math independently to one million pixels. Which architecture fits better?",
        choices: [
          "GPU with many simpler parallel cores",
          "One complex CPU core by preference alone",
          "An optical CD writer",
          "A mechanical keyboard",
        ],
        correctIndex: 0,
        explanation:
          "GPUs excel at wide data-parallel work with limited divergent control flow.",
        hint: "Many simple units vs few complex ones.",
      },
      {
        scenario:
          "A workload is full of complex branching and sequential decisions. Better fit?",
        choices: [
          "CPU with fewer, more complex cores",
          "Only a GPU with zero control flow",
          "Only an HDD",
          "Only L3 with no processor",
        ],
        correctIndex: 0,
        explanation:
          "CPUs handle irregular control flow and system-style work more naturally.",
        hint: "Complexity and branching favor CPU cores.",
      },
    ],
    unlockUpgrades: ["overclocking", "cooling"],
    relevantStat: "ips",
    requires: ["multicore"],
    minCpuLevel: 35,
    sources: [
      {
        label: "NVIDIA — CUDA Zone / parallel computing",
        url: "https://developer.nvidia.com/cuda-zone",
      },
    ],
  },
];

export const CHECKPOINT_MAP: Record<CheckpointId, LearningCheckpoint> =
  CHECKPOINTS.reduce(
    (acc, cp) => {
      acc[cp.id] = cp;
      return acc;
    },
    {} as Record<CheckpointId, LearningCheckpoint>
  );

export function getCheckpoint(id: string | null | undefined): LearningCheckpoint | null {
  if (!id) return null;
  return CHECKPOINT_MAP[id as CheckpointId] ?? null;
}

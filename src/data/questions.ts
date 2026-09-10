import type { Question } from "@/types/game";

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    topic: "cu",
    question: "What is the main job of the Control Unit (CU)?",
    choices: [
      "Store the operating system permanently",
      "Fetch, decode, and direct instruction execution",
      "Cool the processor die",
      "Render 3D graphics only",
    ],
    correctIndex: 1,
    explanation:
      "The CU acts as the director of the processor: it fetches instructions, decodes them, and coordinates the rest of the CPU.",
  },
  {
    id: "q2",
    topic: "alu",
    question: "What does the Arithmetic Logic Unit (ALU) primarily do?",
    choices: [
      "Manage Wi-Fi connections",
      "Perform math and logical operations",
      "Schedule hard-drive spin-up",
      "Generate the motherboard BIOS",
    ],
    correctIndex: 1,
    explanation:
      "The ALU is the computational engine — addition, subtraction, multiplication, division, and logic like AND/OR/NOT and comparisons.",
  },
  {
    id: "q3",
    topic: "registers",
    question: "Registers inside a CPU are best described as:",
    choices: [
      "Huge slow hard drives",
      "Tiny ultra-fast on-chip storage for active data",
      "External USB sticks",
      "Only used by GPUs",
    ],
    correctIndex: 1,
    explanation:
      "Registers hold the specific data, instructions, or addresses the processor is working on right now — extremely fast and very small.",
  },
  {
    id: "q4",
    topic: "cache",
    question: "Why do CPUs include cache memory?",
    choices: [
      "To replace the need for any RAM forever",
      "To keep frequently used data closer and faster than main RAM",
      "To power the cooling fans",
      "To store photos permanently",
    ],
    correctIndex: 1,
    explanation:
      "Cache is a small layer of extremely fast memory on or near the CPU so it waits less on slower system RAM.",
    unlockTags: ["cache"],
  },
  {
    id: "q5",
    topic: "cache",
    question: "Which cache level is typically smallest and fastest?",
    choices: ["L3", "L2", "L1", "Disk cache only"],
    correctIndex: 2,
    explanation: "L1 sits closest to the core — tiny but extremely fast. L2/L3 are larger and slower.",
    unlockTags: ["cache"],
  },
  {
    id: "q6",
    topic: "clock",
    question: "What does the CPU’s internal clock do?",
    choices: [
      "Displays the time on the desktop wallpaper",
      "Generates timing pulses that synchronize CPU operations",
      "Charges the battery",
      "Encrypts every file automatically",
    ],
    correctIndex: 1,
    explanation:
      "The internal clock produces steady pulses (hertz) so each step inside the processor stays synchronized.",
  },
  {
    id: "q7",
    topic: "buses",
    question: "In a computer, buses are:",
    choices: [
      "Public transportation for employees",
      "Electrical pathways that move data and control signals",
      "Only the USB ports on the case",
      "Cooling fans shaped like rectangles",
    ],
    correctIndex: 1,
    explanation:
      "Buses are wiring networks that carry data, instructions, and control signals between the CPU and other components.",
    unlockTags: ["buses"],
  },
  {
    id: "q8",
    topic: "buses",
    question: "Which is NOT a typical role of CPU-related buses?",
    choices: [
      "Carrying data",
      "Carrying addresses",
      "Carrying control signals",
      "Replacing the need for an ALU",
    ],
    correctIndex: 3,
    explanation:
      "Buses move information around; they do not replace the ALU’s job of computing.",
    unlockTags: ["buses"],
  },
  {
    id: "q9",
    topic: "cpu",
    question: "What does CPU stand for?",
    choices: [
      "Central Processing Unit",
      "Computer Power Utility",
      "Core Program Unit",
      "Central Peripheral Utility",
    ],
    correctIndex: 0,
    explanation: "The Central Processing Unit executes instructions — often called the brain of the computer.",
    unlockTags: ["cores"],
  },
  {
    id: "q10",
    topic: "cpu",
    question: "A CPU core is best described as:",
    choices: [
      "A cooling fan",
      "An independent processing engine that can run instructions",
      "A type of SSD",
      "A network cable standard",
    ],
    correctIndex: 1,
    explanation:
      "Each core can fetch/decode/execute work, enabling parallel processing on multi-core CPUs.",
    unlockTags: ["cores"],
  },
  {
    id: "q11",
    topic: "isa",
    question: "What is an Instruction Set Architecture (ISA)?",
    choices: [
      "A cooling paste formula",
      "The set of instructions a CPU can execute (e.g., x86, ARM, RISC-V)",
      "A brand of RAM",
      "A Wi-Fi encryption key",
    ],
    correctIndex: 1,
    explanation:
      "The ISA is the machine-language interface between software and the processor.",
    unlockTags: ["isa"],
  },
  {
    id: "q12",
    topic: "isa",
    question: "Which ISA family is classically CISC and common in Windows PCs?",
    choices: ["AVR", "ARM", "x86", "RISC-V only"],
    correctIndex: 2,
    explanation:
      "x86 (Intel/AMD) is a CISC family with variable-length instructions and strong backward compatibility for PCs and servers.",
    unlockTags: ["isa"],
  },
  {
    id: "q13",
    topic: "isa",
    question: "ARM ISAs are especially known for:",
    choices: [
      "Only running on vacuum tubes",
      "Power-efficient RISC designs used in phones and many laptops",
      "Being closed-source exclusive to one toaster brand",
      "Replacing all motherboards with wood",
    ],
    correctIndex: 1,
    explanation:
      "ARM is a RISC approach widely used in smartphones, tablets, IoT, laptops, and cloud servers for efficiency and scalability.",
    unlockTags: ["isa"],
  },
  {
    id: "q14",
    topic: "isa",
    question: "What makes RISC-V notable?",
    choices: [
      "It only works underwater",
      "It is an open-source, modular ISA",
      "It cannot run any software",
      "It is identical to VGA",
    ],
    correctIndex: 1,
    explanation:
      "RISC-V is open and modular — popular for embedded, IoT, AI, and custom datacenter designs.",
    unlockTags: ["isa"],
  },
  {
    id: "q15",
    topic: "isa",
    question: "AVR is commonly associated with:",
    choices: [
      "8-bit microcontrollers that are simple and low-power",
      "Only 256-core server CPUs",
      "Graphics card ray tracing cores",
      "Satellite TV remotes exclusively",
    ],
    correctIndex: 0,
    explanation:
      "AVR (Microchip/Atmel) is a simple 8-bit RISC architecture popular in microcontrollers and education.",
    unlockTags: ["isa"],
  },
  {
    id: "q16",
    topic: "generation",
    question: "What does a CPU “generation” generally indicate?",
    choices: [
      "Only the color of the box",
      "An architectural era affecting performance, efficiency, and features",
      "The number of USB ports on a keyboard",
      "The Wi-Fi password length",
    ],
    correctIndex: 1,
    explanation:
      "Newer generations typically improve speed, power efficiency, and support for modern technologies.",
    unlockTags: ["generation"],
  },
  {
    id: "q17",
    topic: "generation",
    question: "Which chip is widely cited as the first commercial microprocessor?",
    choices: ["Intel 4004 (1971)", "AMD EPYC Venice", "Apple M4 Ultra", "NVIDIA RTX only"],
    correctIndex: 0,
    explanation:
      "The Intel 4004 (1971) is generally recognized as the first commercial microprocessor — a 4-bit beginning.",
    unlockTags: ["generation"],
  },
  {
    id: "q18",
    topic: "overclocking",
    question: "Overclocking a CPU means:",
    choices: [
      "Running it underwater only",
      "Raising clock speed beyond factory settings for more performance",
      "Deleting the cache permanently",
      "Disabling the ALU",
    ],
    correctIndex: 1,
    explanation:
      "Overclocking increases frequency past stock settings — often needing better cooling and an unlocked platform.",
    unlockTags: ["overclocking"],
  },
  {
    id: "q19",
    topic: "overclocking",
    question: "Why does overclocking often require better cooling?",
    choices: [
      "Higher clocks usually increase power and heat",
      "Coolers make instructions longer",
      "Gold pins melt at room temperature",
      "Buses stop working when cold",
    ],
    correctIndex: 0,
    explanation:
      "Faster switching draws more power and produces more heat; inadequate cooling causes thermal throttling or instability.",
    unlockTags: ["overclocking", "cooling"],
  },
  {
    id: "q20",
    topic: "socket",
    question: "A CPU socket is:",
    choices: [
      "A software antivirus",
      "The physical interface connecting the CPU to the motherboard",
      "A type of Ethernet cable",
      "Only used on GPUs",
    ],
    correctIndex: 1,
    explanation:
      "The socket (or package interface) defines how the CPU mechanically and electrically mounts to the board — e.g., AM5, LGA, SP7-class.",
    unlockTags: ["socket"],
  },
  {
    id: "q21",
    topic: "socket",
    question: "Why can’t you drop any CPU into any motherboard?",
    choices: [
      "Sockets, pinouts, chipsets, and power delivery must be compatible",
      "All CPUs are glued permanently at the factory to one brand of case",
      "ISAs change every minute",
      "Motherboards reject gold pins on principle",
    ],
    correctIndex: 0,
    explanation:
      "Socket type, chipset support, BIOS, and VRM capability all have to match the CPU generation.",
    unlockTags: ["socket"],
  },
  {
    id: "q22",
    topic: "cooling",
    question: "Thermal throttling happens when a CPU:",
    choices: [
      "Runs out of RAM names",
      "Slows clocks to stay within safe temperatures",
      "Deletes its ISA",
      "Switches to Morse code",
    ],
    correctIndex: 1,
    explanation:
      "If temperatures rise too high, the CPU reduces frequency to protect the silicon.",
    unlockTags: ["cooling"],
  },
  {
    id: "q23",
    topic: "cpu",
    question: "As of 2026, which class of CPUs pushes toward ~256 cores in servers?",
    choices: [
      "Only 1970s calculators",
      "Flagship EPYC Venice / Diamond Rapids-class designs",
      "Single-core AVR toys exclusively",
      "Floppy-disk controllers",
    ],
    correctIndex: 1,
    explanation:
      "2026 server flagships such as AMD EPYC Venice and Intel’s Diamond Rapids class target huge core counts (around 256) and enormous caches.",
    unlockTags: ["cores", "generation"],
  },
  {
    id: "q24",
    topic: "alu",
    question: "Which operation would the ALU typically handle?",
    choices: [
      "Comparing whether A > B",
      "Spraying thermal paste",
      "Designing a case LED color",
      "Formatting a slide deck theme",
    ],
    correctIndex: 0,
    explanation: "Comparisons and arithmetic/logic are classic ALU work.",
  },
  {
    id: "q25",
    topic: "cu",
    question: "After the CU decodes an instruction, it generally:",
    choices: [
      "Ignores the rest of the chip",
      "Sends control signals so units like the ALU/registers perform the right steps",
      "Unplugs the power supply",
      "Converts the PC into a toaster",
    ],
    correctIndex: 1,
    explanation:
      "Decode produces control signals that orchestrate execution across CPU datapaths.",
  },
  {
    id: "q26",
    topic: "registers",
    question: "Compared with RAM, CPU registers are:",
    choices: [
      "Slower and much larger",
      "Faster and much smaller",
      "Identical in every way",
      "Only available on GPUs",
    ],
    correctIndex: 1,
    explanation:
      "Registers are the tip of the memory hierarchy — tiny capacity, maximum speed.",
  },
  {
    id: "q27",
    topic: "isa",
    question: "MIPS is best characterized as:",
    choices: [
      "A RISC ISA known for a clean, simple design (often used in education/embedded)",
      "A mechanical hard-drive brand",
      "A type of liquid metal TIM only",
      "An HDMI version number",
    ],
    correctIndex: 0,
    explanation:
      "MIPS is a classic RISC ISA — simple to implement and historically common in embedded/networking and teaching.",
    unlockTags: ["isa"],
  },
  {
    id: "q28",
    topic: "programming",
    question: "An algorithm is:",
    choices: [
      "A step-by-step procedure to solve a problem",
      "A brand of CPU paste",
      "A socket pin count",
      "A type of DDR stick",
    ],
    correctIndex: 0,
    explanation: "Algorithms are precise sequences of steps — independent of any one language.",
  },
  {
    id: "q29",
    topic: "os",
    question: "The OS kernel’s role includes:",
    choices: [
      "Managing hardware resources and scheduling processes",
      "Only drawing desktop wallpapers",
      "Replacing the CU entirely",
      "Melting gold pins safely",
    ],
    correctIndex: 0,
    explanation:
      "The kernel mediates CPU, memory, and devices, and schedules work onto cores.",
  },
  {
    id: "q30",
    topic: "networking",
    question: "TCP is generally:",
    choices: [
      "Connection-oriented and reliable",
      "A CPU socket name",
      "A type of cache miss",
      "An ALU opcode for square roots only",
    ],
    correctIndex: 0,
    explanation: "TCP provides ordered, reliable delivery; UDP is lighter and connectionless.",
  },
  {
    id: "q31",
    topic: "cybersecurity",
    question: "Encryption primarily protects:",
    choices: [
      "Confidentiality of data",
      "Fan RPM stickers",
      "Socket latch color",
      "Monitor refresh only",
    ],
    correctIndex: 0,
    explanation: "Encryption keeps data unreadable without the proper keys.",
  },
  {
    id: "q32",
    topic: "data-structures",
    question: "A queue typically follows:",
    choices: ["LIFO", "FIFO", "Random only", "Never inserts"],
    correctIndex: 1,
    explanation: "Queues are first-in, first-out — like a line. Stacks are LIFO.",
  },
  {
    id: "q33",
    topic: "cloud",
    question: "A key cloud computing benefit is:",
    choices: [
      "On-demand scalable resources over the network",
      "Deleting the need for any ISA",
      "Making CPUs run without electricity",
      "Guaranteeing zero heat forever",
    ],
    correctIndex: 0,
    explanation: "Cloud providers rent compute/storage that can scale with demand.",
  },
  {
    id: "q34",
    topic: "data-science",
    question: "Overfitting means a model:",
    choices: [
      "Does well on training data but poorly on new data",
      "Has zero parameters",
      "Only runs on AVR",
      "Cannot use registers",
    ],
    correctIndex: 0,
    explanation:
      "An overfit model memorizes training quirks instead of learning general patterns.",
  },
  {
    id: "q35",
    topic: "cpu",
    question: "The Intel 4004 is historically important because it was:",
    choices: [
      "The first commercial microprocessor",
      "The first 256-core EPYC chip",
      "A type of DDR5 DIMM",
      "A liquid cooler brand",
    ],
    correctIndex: 0,
    explanation:
      "Released in 1971, the 4004 kicked off the microprocessor era your Overclocked journey starts from.",
    unlockTags: ["generation"],
  },
];

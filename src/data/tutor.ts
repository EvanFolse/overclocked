/**
 * Tutor question tree (design doc 6.2). Hard-coded, no live AI.
 * Flow: pick a topic -> pick a common question -> read a fixed answer.
 * DRAFT TEXT: every answer must be checked against the textbook by a teammate
 * (design doc 3.1), including the exact names used for the parts.
 */

export interface TutorQA {
  question: string;
  answer: string;
}

export interface TutorTopic {
  id: string;
  /** Button text shown in the topic list */
  title: string;
  /** The topic is visible once this stage is unlocked or being read */
  minStage: number;
  items: TutorQA[];
}

export const TUTOR_TOPICS: TutorTopic[] = [
  {
    id: "registers",
    title: "I am confused about registers",
    minStage: 1,
    items: [
      {
        question: "What is a register?",
        answer:
          "A register is extremely fast storage inside the processor. It temporarily holds operands and intermediate results while the CPU works.",
      },
      {
        question: "How is a register different from main memory?",
        answer:
          "Registers sit inside the CPU and are much faster, but there are only a few of them. Main memory is much larger but slower, and it is outside the processor.",
      },
      {
        question: "Is the Program Counter a register?",
        answer:
          "Yes. The Program Counter (PC) is a register that holds the memory address of the next instruction to be executed.",
      },
    ],
  },
  {
    id: "clock",
    title: "What does the Clock do?",
    minStage: 1,
    items: [
      {
        question: "What does the Clock do?",
        answer:
          "The Clock provides synchronizing timing signals that coordinate the hardware components, like a metronome that every part follows.",
      },
      {
        question: "What does MHz mean?",
        answer:
          "Hz counts clock ticks per second. 1 MHz is one million ticks per second, so a 25 MHz clock ticks 25 million times every second.",
      },
      {
        question: "Does a faster clock always mean a faster CPU?",
        answer:
          "Not always. Speed also depends on how much work gets done in each tick and on how long the CPU waits for memory. A higher clock rate helps most when those stay the same.",
      },
    ],
  },
  {
    id: "alu-vs-control",
    title: "ALU vs Control Unit?",
    minStage: 1,
    items: [
      {
        question: "What is the difference between the ALU and the Control Unit?",
        answer:
          "The ALU does the computing: arithmetic such as addition and subtraction, and logic such as AND and OR. The Control Unit directs the datapath, memory and I/O so they work together.",
      },
      {
        question: "Which part decides what happens next?",
        answer:
          "Sequencing is the Control Unit's job, using the Program Counter and the signals the Instruction Decoder produces. The ALU only computes what it is told to compute.",
      },
      {
        question: "What does the Instruction Decoder do?",
        answer:
          "It interprets the binary encoding of an instruction and produces the corresponding control signals.",
      },
    ],
  },
  {
    id: "cache",
    title: "Why do we need a cache?",
    minStage: 1,
    items: [
      {
        question: "What is a cache?",
        answer:
          "A small, fast memory between the CPU and main memory that keeps recently used data close to the processor. You will study it in detail in Stage 4.",
      },
      {
        question: "Why not make all memory that fast?",
        answer:
          "Faster memory costs more per byte, so a large amount of it would be far too expensive. A small fast memory in front of a large slow one gives most of the speed at a reasonable cost.",
      },
      {
        question: "What happens if the CPU has no cache?",
        answer:
          "Everything still works correctly, but every memory access is slow, so the CPU spends much of its time waiting.",
      },
    ],
  },
  {
    id: "bus",
    title: "What is a bus?",
    minStage: 1,
    items: [
      {
        question: "What is a bus?",
        answer:
          "A bus is a shared set of wires that carries addresses, data and control signals between the CPU, memory and input/output devices.",
      },
      {
        question: "What does the Bus Interface Unit do?",
        answer:
          "It manages data transfer between the CPU core and the external bus and memory.",
      },
      {
        question: "What goes wrong without it?",
        answer:
          "The CPU could not fetch instructions or data from main memory, so it could not run a program.",
      },
    ],
  },
];

/** Topics visible for the highest stage the player has unlocked or is reading. */
export function getTutorTopics(stage: number): TutorTopic[] {
  return TUTOR_TOPICS.filter((t) => t.minStage <= stage);
}

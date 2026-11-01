import type { Contrast, GlossaryTerm } from "@/stages/glossary";

/**
 * Stage 1 glossary and contrasts for the Tutor (design doc 6.1).
 * DRAFT TEXT: every line must be checked against the textbook by a teammate.
 */
export const STAGE_1_GLOSSARY: GlossaryTerm[] = [
  {
    id: "alu",
    name: "ALU",
    aliases: ["arithmetic logic unit", "arithmetic-logic unit"],
    text: "The ALU performs arithmetic (addition, subtraction) and logical (AND, OR, comparison) operations. It computes, but it does not decide what runs next.",
  },
  {
    id: "control",
    name: "Control Unit",
    aliases: ["CU"],
    text: "The Control Unit directs the datapath, memory and I/O so that they work together. It does not process the data itself.",
  },
  {
    id: "pc",
    name: "Program Counter",
    aliases: ["PC"],
    text: "The Program Counter holds the memory address of the next instruction to be executed. It points to the next instruction; it does not decode or run it.",
  },
  {
    id: "decoder",
    name: "Instruction Decoder",
    aliases: ["decoder"],
    text: "The Instruction Decoder interprets the binary encoding of an instruction and produces the matching control signals. It works out what to do; it does not do the computing.",
  },
  {
    id: "registers",
    name: "Registers",
    aliases: ["register"],
    text: "Registers are tiny, very fast storage inside the processor that hold the values being used right now. They store data; they do not compute.",
  },
  {
    id: "cache",
    name: "Cache",
    text: "The Cache is a small, fast memory between the CPU and main memory that keeps copies of frequently used data, so repeated accesses avoid slow trips to main memory.",
  },
  {
    id: "clock",
    name: "Clock",
    text: "The Clock provides synchronizing timing signals that coordinate the hardware components. It sets the pace; it does not carry data or compute.",
  },
  {
    id: "biu",
    name: "Bus Interface Unit",
    aliases: ["BIU", "bus interface"],
    text: "The Bus Interface Unit manages data transfer between the CPU core and the external bus and memory.",
  },
];

export const STAGE_1_CONTRASTS: Contrast[] = [
  {
    between: ["alu", "control"],
    text: "The ALU computes: it does the arithmetic and logic on the data. The Control Unit decides what happens and when, by sending control signals. Think of the ALU as the calculator and the Control Unit as the manager who tells it what to do.",
  },
  {
    between: ["alu", "registers"],
    text: "The ALU works on values; registers hold them. The ALU takes its operands from registers and puts the result back into one.",
  },
  {
    between: ["registers", "cache"],
    text: "Registers are inside the CPU, there are very few of them, and they are the fastest storage. A cache is larger and a little slower, and it keeps copies of frequently used data from main memory close to the CPU.",
  },
  {
    between: ["control", "decoder"],
    text: "The Instruction Decoder works out what an instruction means. The Control Unit uses that to send control signals to the other parts. The decoder translates; the Control Unit directs.",
  },
  {
    between: ["pc", "decoder"],
    text: "The Program Counter says WHICH instruction comes next (an address). The Instruction Decoder says WHAT an instruction that was already fetched means.",
  },
  {
    between: ["clock", "pc"],
    text: "The Clock sets WHEN each step happens. The Program Counter says WHERE the next instruction is.",
  },
  {
    between: ["cache", "biu"],
    text: "The Cache keeps copies of data close to the CPU so it waits less. The Bus Interface Unit is the connection that actually moves data between the CPU and memory.",
  },
];

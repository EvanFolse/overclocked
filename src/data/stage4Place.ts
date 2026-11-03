import type { CpuPart } from "@/data/stage1Place";
import type { MemoryLevel } from "@/types/game";

/**
 * Stage 4 · Memory Hierarchy placement parts.
 * Same CpuPart shape as Stage 1 so PlaceStep can reuse its flip-card engine.
 * correctIndex maps to hierarchy slots top→bottom (fastest→slowest).
 */
export const STAGE_4_PARTS: CpuPart[] = [
  {
    id: "registers",
    name: "Registers",
    description:
      "Tiny storage inside the CPU core. Fastest access, smallest capacity, highest cost per bit. Holds values the processor is using right now.",
    correctIndex: 0,
  },
  {
    id: "l1",
    name: "L1 Cache",
    description:
      "Smallest and fastest on-chip cache, closest to the core. Usually split into instruction and data caches. Measured in tens of KB.",
    correctIndex: 1,
  },
  {
    id: "l2",
    name: "L2 Cache",
    description:
      "Larger and a bit slower than L1. Often private to a core. Bridges the gap between tiny L1 and shared last-level cache.",
    correctIndex: 2,
  },
  {
    id: "l3",
    name: "L3 Cache",
    description:
      "Large shared last-level cache on many CPUs. Slower than L1/L2 but still far faster than main memory. Often megabytes to tens of MB.",
    correctIndex: 3,
  },
  {
    id: "ram",
    name: "RAM",
    description:
      "Main memory (typically DRAM). Holds running programs and working data. Volatile: contents are lost without power. Much larger and slower than cache.",
    correctIndex: 4,
  },
  {
    id: "storage",
    name: "Storage",
    description:
      "SSD, HDD, optical discs, and tape. Nonvolatile permanent storage. Greatest capacity and lowest cost per bit, but highest latency.",
    correctIndex: 5,
  },
];

/** One Learn-step card. Covers all 11 Stage 4 topics (hierarchy levels + memory technologies + storage media). */
export interface Stage4LearnTopic {
  id: string;
  name: string;
  description: string;
  keyIdea: string;
  /** Which pyramid band to highlight in MemoryHierarchyVisual */
  highlight: MemoryLevel | null;
}

export const STAGE_4_LEARN_TOPICS: Stage4LearnTopic[] = [
  {
    id: "registers",
    name: "Registers",
    description:
      "Registers are the smallest and fastest storage in the system. They sit inside the CPU core and hold operands and results for the instructions executing right now. Capacity is measured in bytes to a few hundred bytes across the register file. Latency is on the order of a single clock cycle. Cost per bit is extremely high because they use the same fast transistor technology as the core.",
    keyIdea:
      "Registers win on speed, not size. The compiler keeps only the hottest values there.",
    highlight: "registers",
  },
  {
    id: "l1",
    name: "L1 Cache",
    description:
      "L1 is the first cache level the core checks after registers. It is usually private to a core and often split into instruction (L1i) and data (L1d) caches. Typical size is tens of kilobytes. Access takes a few cycles. Built from SRAM, it is fast but expensive and area-hungry, so it stays small.",
    keyIdea:
      "L1 is the first place the core looks after registers. Hits are cheap; misses climb the hierarchy.",
    highlight: "l1",
  },
  {
    id: "l2",
    name: "L2 Cache",
    description:
      "L2 is larger and slightly slower than L1—often hundreds of KB to a few MB, still typically private per core. It absorbs working sets that spill out of L1 without paying the full cost of going to L3 or DRAM. Latency is higher than L1 but still far below main memory.",
    keyIdea:
      "L2 buys capacity without the full cost of another L1. Still much faster than DRAM.",
    highlight: "l2",
  },
  {
    id: "l3",
    name: "L3 Cache",
    description:
      "L3 (often the last-level cache, LLC) is shared across cores on many CPUs. Capacity reaches megabytes to tens of MB. It is slower than L1/L2 but still orders of magnitude faster than RAM. Sharing lets cores reuse data another core already cached.",
    keyIdea:
      "L3 catches working sets that no longer fit in L1/L2 and is often shared across cores.",
    highlight: "l3",
  },
  {
    id: "ram",
    name: "RAM",
    description:
      "RAM (main memory) holds running programs and their working data. Modern systems use DRAM: large capacity (gigabytes) at much lower cost per bit than SRAM caches, but with latency of tens to hundreds of nanoseconds. RAM is volatile—contents disappear when power is removed.",
    keyIdea:
      "RAM is the system's working set: large and affordable, but much slower than cache, and volatile.",
    highlight: "ram",
  },
  {
    id: "sram",
    name: "SRAM",
    description:
      "SRAM (Static RAM) is a memory technology, not an extra level in the hierarchy. Each bit is held by a flip-flop-like cell of several transistors, so it needs no refresh and is very fast. That makes it ideal for caches and registers—but density is low and cost per bit is high. SRAM builds the upper levels; it is not a separate pyramid band below L3.",
    keyIdea:
      "SRAM is how fast on-chip memory is built. It is a technology used by registers and caches, not another hierarchy level.",
    highlight: "l1",
  },
  {
    id: "dram",
    name: "DRAM",
    description:
      "DRAM (Dynamic RAM) stores each bit as charge on a tiny capacitor. Cells are dense and cheap, so DRAM dominates main memory. Charge leaks, so DRAM must be refreshed periodically. Access is slower than SRAM. Like SRAM, DRAM is a technology: main memory (RAM) is typically implemented with DRAM chips.",
    keyIdea:
      "DRAM is the technology behind most RAM: denser and cheaper than SRAM, but slower and refresh-hungry.",
    highlight: "ram",
  },
  {
    id: "ssd",
    name: "SSD",
    description:
      "Solid-state drives use flash memory with no moving parts. They are nonvolatile—data survives power loss. Capacity is large (hundreds of GB to TB) and cost per bit is far below DRAM, but latency is still much higher than RAM (microseconds vs nanoseconds). SSDs sit in the storage tier of the hierarchy.",
    keyIdea:
      "SSDs are fast nonvolatile storage relative to disks, but still far slower than RAM.",
    highlight: "storage",
  },
  {
    id: "hdd",
    name: "HDD",
    description:
      "Hard disk drives store data magnetically on spinning platters with a moving head. They offer very large capacity at low cost per bit, but mechanical seek and rotational latency make them much slower than SSDs (milliseconds). HDDs are nonvolatile secondary storage.",
    keyIdea:
      "HDDs trade speed for capacity and cost: mechanical motion means high latency.",
    highlight: "storage",
  },
  {
    id: "optical",
    name: "Optical Disc",
    description:
      "Optical discs (CD, DVD, Blu-ray) store data as pits and lands read by a laser. They are removable and nonvolatile, useful for distribution and archival copies, but capacity and speed are modest compared with modern SSDs. Access latency is high relative to solid-state storage.",
    keyIdea:
      "Optical media are removable and durable for distribution, not for high-speed working storage.",
    highlight: "storage",
  },
  {
    id: "tape",
    name: "Magnetic Tape",
    description:
      "Magnetic tape offers enormous capacity at the lowest cost per bit for long-term archival storage. Access is sequential and slow—seeking to a file can take seconds to minutes. Tape is nonvolatile and sits at the bottom of the hierarchy: cold storage, not interactive working memory.",
    keyIdea:
      "Tape wins on cost and capacity for archives; it loses on random-access latency.",
    highlight: "storage",
  },
];
